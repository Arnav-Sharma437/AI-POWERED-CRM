import { NextResponse } from "next/server";
import { getTempSession, signTempJWT } from "@/lib/auth";
import { createVerificationSession } from "@/lib/verification";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Retrieve temporary session
    const tempSession = await getTempSession(request);
    if (!tempSession) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }

    // Rate Limit Check: Enforce 60 seconds cooldown between resends
    const lastVerification = await prisma.emailVerification.findFirst({
      where: { userId: tempSession.userId },
      orderBy: { createdAt: "desc" }
    });

    if (lastVerification) {
      const secondsSince = Math.floor((Date.now() - lastVerification.createdAt.getTime()) / 1000);
      if (secondsSince < 60) {
        const remaining = 60 - secondsSince;
        return NextResponse.json(
          { error: `Please wait ${remaining} seconds before requesting another code.` },
          { status: 429 }
        );
      }
    }

    // Generate new OTP Verification Session
    const verification = await createVerificationSession(tempSession.userId);
    if (verification.error) {
      return NextResponse.json(
        { error: verification.error },
        { status: 500 }
      );
    }

    // Update the temporary session with the new verificationId
    const tempToken = await signTempJWT({
      userId: tempSession.userId,
      verificationId: verification.verificationId
    }, 900); // 15 minutes temp token expiry

    const response = NextResponse.json({
      success: true,
      message: "A new verification code has been sent to your email."
    });

    // Set updated temp_token cookie
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
    console.error("resend-otp error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
