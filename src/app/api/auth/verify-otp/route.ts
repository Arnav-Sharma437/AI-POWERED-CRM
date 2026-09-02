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

    const workLocation = tempSession.workLocation || "Office";
    const userRole = user.roleName || (user.role as any)?.name || "Team Member";
    const loginTime = new Date();

    // 1. Record Activity Log for login attendance
    try {
      const { createActivity, listUsers } = await import("@/lib/services");
      await createActivity({
        type: "System",
        notes: `User logged in from ${workLocation} (Role: ${userRole})`,
        userId: user.id
      });

      // 2. Dispatch Super Admin Login Notification Email
      const { sendUserLoginAlertEmail } = await import("@/lib/email");
      const allUsers = await listUsers();
      const superAdmins = allUsers.filter(u => u.roleName === "Super Admin" && u.id !== user.id && !u.isTrashed);

      // Extract client IP address if available
      const forwarded = request.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || undefined;

      // Send to all super admins (and fallback to default admin email if none)
      if (superAdmins.length > 0) {
        for (const admin of superAdmins) {
          await sendUserLoginAlertEmail({
            adminEmail: admin.email,
            adminName: admin.name,
            userName: user.name,
            userEmail: user.email,
            userRole,
            workLocation,
            loginTime,
            ipAddress: ip
          }).catch(e => console.error("Error sending admin login alert email:", e));
        }
      } else {
        // Fallback send
        await sendUserLoginAlertEmail({
          adminEmail: process.env.SUPER_ADMIN_EMAIL || "varun@bda.com",
          adminName: "Super Admin",
          userName: user.name,
          userEmail: user.email,
          userRole,
          workLocation,
          loginTime,
          ipAddress: ip
        }).catch(e => console.error("Error sending admin login alert email:", e));
      }
    } catch (logErr) {
      console.error("Error in login attendance logging / notification:", logErr);
    }

    // Create session token with location
    const token = await signJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      roleId: user.roleId,
      workLocation
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleId: user.roleId,
        roleName: userRole,
        workLocation
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
