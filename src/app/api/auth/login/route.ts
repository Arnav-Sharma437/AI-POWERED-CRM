import { NextResponse } from "next/server";
import { loginUser } from "@/lib/services";
import { signTempJWT } from "@/lib/auth";
import { createVerificationSession } from "@/lib/verification";

export async function POST(request: Request) {
  try {
    const { email, password, workLocation } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const user = await loginUser(email, password);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate Verification Session (OTP)
    const verification = await createVerificationSession(user.id);
    if (verification.error) {
      return NextResponse.json(
        { error: verification.error },
        { status: 500 }
      );
    }

    // Create a temporary JWT token mapping the verification process and selected work location
    const tempToken = await signTempJWT({
      userId: user.id,
      verificationId: verification.verificationId,
      workLocation: workLocation || "Office"
    }, 900); // 15 minutes temp token expiry

    const response = NextResponse.json({
      success: true,
      requiresVerification: true
    });

    // Set temp_token cookie
    response.cookies.set({
      name: "temp_token",
      value: tempToken,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 900 // 15 minutes
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
