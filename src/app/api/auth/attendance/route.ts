import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createActivity, listUsers } from "@/lib/services";
import { sendUserLoginAlertEmail, sendUserLogoutAlertEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, location, note } = await request.json(); // action: "start_work" | "clock_out"
    const workLocation = location || session.workLocation || "Office";
    const userRole = session.roleName || "Team Member";
    const actionTime = new Date();

    const allUsers = await listUsers();
    const superAdmins = allUsers.filter(u => u.roleName === "Super Admin" && u.id !== session.userId && !u.isTrashed);

    if (action === "start_work") {
      // 1. Record activity log
      await createActivity({
        type: "System",
        notes: `User started workday session from ${workLocation} ${note ? `(${note})` : ""}`,
        userId: session.userId
      });

      // 2. Email Super Admins
      if (superAdmins.length > 0) {
        for (const admin of superAdmins) {
          await sendUserLoginAlertEmail({
            adminEmail: admin.email,
            adminName: admin.name,
            userName: session.name,
            userEmail: session.email,
            userRole,
            workLocation,
            loginTime: actionTime
          }).catch(e => console.error("Error sending start work alert email:", e));
        }
      } else {
        await sendUserLoginAlertEmail({
          adminEmail: process.env.SUPER_ADMIN_EMAIL || "varun@bda.com",
          adminName: "Super Admin",
          userName: session.name,
          userEmail: session.email,
          userRole,
          workLocation,
          loginTime: actionTime
        }).catch(e => console.error("Error sending start work alert email:", e));
      }

      return NextResponse.json({
        success: true,
        message: `Work session started from ${workLocation}!`,
        workLocation,
        workStartedAt: actionTime.toISOString()
      });
    } else if (action === "clock_out") {
      // 1. Record activity log
      await createActivity({
        type: "System",
        notes: `User clocked out / finished workday from ${workLocation} ${note ? `(${note})` : ""}`,
        userId: session.userId
      });

      // 2. Email Super Admins
      if (superAdmins.length > 0) {
        for (const admin of superAdmins) {
          await sendUserLogoutAlertEmail({
            adminEmail: admin.email,
            adminName: admin.name,
            userName: session.name,
            userEmail: session.email,
            userRole,
            workLocation,
            logoutTime: actionTime
          }).catch(e => console.error("Error sending clock out alert email:", e));
        }
      } else {
        await sendUserLogoutAlertEmail({
          adminEmail: process.env.SUPER_ADMIN_EMAIL || "varun@bda.com",
          adminName: "Super Admin",
          userName: session.name,
          userEmail: session.email,
          userRole,
          workLocation,
          logoutTime: actionTime
        }).catch(e => console.error("Error sending clock out alert email:", e));
      }

      return NextResponse.json({
        success: true,
        message: `Clocked out successfully at ${actionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}!`,
        workEndedAt: actionTime.toISOString()
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
