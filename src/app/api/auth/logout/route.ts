import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (session) {
      const { createActivity, listUsers } = await import("@/lib/services");
      const { sendUserLogoutAlertEmail } = await import("@/lib/email");

      // 1. Record activity log
      await createActivity({
        type: "System",
        notes: `User logged out / clocked out (Work session ended from ${session.workLocation || "Office"})`,
        userId: session.userId
      }).catch((e: any) => console.error("Error logging logout activity:", e));

      // 2. Dispatch email to Super Admins
      try {
        const allUsers = await listUsers();
        const superAdmins = allUsers.filter(u => u.roleName === "Super Admin" && u.id !== session.userId && !u.isTrashed);

        const logoutTime = new Date();
        const userRole = session.roleName || "Team Member";

        if (superAdmins.length > 0) {
          for (const admin of superAdmins) {
            await sendUserLogoutAlertEmail({
              adminEmail: admin.email,
              adminName: admin.name,
              userName: session.name,
              userEmail: session.email,
              userRole,
              workLocation: session.workLocation || "Office",
              logoutTime
            }).catch(e => console.error("Error sending admin logout alert email:", e));
          }
        } else {
          await sendUserLogoutAlertEmail({
            adminEmail: process.env.SUPER_ADMIN_EMAIL || "varun@bda.com",
            adminName: "Super Admin",
            userName: session.name,
            userEmail: session.email,
            userRole,
            workLocation: session.workLocation || "Office",
            logoutTime
          }).catch(e => console.error("Error sending admin logout alert email:", e));
        }
      } catch (mailErr) {
        console.error("Error sending logout alert emails to super admins:", mailErr);
      }
    }
  } catch (err: any) {
    console.error("Logout activity log error:", err);
  }

  const response = NextResponse.json({ success: true });
  
  // Clear the token cookie by setting maxAge to 0
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  // Clear temp_token cookie
  response.cookies.set({
    name: "temp_token",
    value: "",
    httpOnly: true,
    path: "/",
    expires: new Date(0),
    maxAge: 0
  });

  return response;
}
