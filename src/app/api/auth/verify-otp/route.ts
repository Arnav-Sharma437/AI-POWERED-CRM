import { NextResponse } from "next/server";
import { getTempSession, signJWT } from "@/lib/auth";
import { verifyOtpCode } from "@/lib/verification";
import { getUserById } from "@/lib/services";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || code.trim().length !== 6) {
      return NextResponse.json(
        { error: "Verification code must be exactly 6 digits." },
        { status: 400 }
      );
    }

    // Retrieve temporary session
    const tempSession = await getTempSession(request);
    if (!tempSession) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    // Verify OTP code
    const result = await verifyOtpCode(tempSession.verificationId, code);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Incorrect verification code." },
        { status: 400 }
      );
    }

    // Load full user details
    const user = await getUserById(tempSession.userId);
    if (!user || user.isTrashed || !user.isActive) {
      return NextResponse.json(
        { error: "User account is suspended or not found." },
        { status: 403 }
      );
    }

    // Create session token
    const token = await signJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId
      }
    });

    // Set token cookie
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 // 24 hours
    });

    // Clear temp_token cookie
    response.cookies.set({
      name: "temp_token",
      value: "",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0 // Expire instantly
    });

    return response;
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
