import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createActivity, listUsers, isDemoMode, checkDbConnection } from "@/lib/services";
import { prisma } from "@/lib/db";
import { mockDb } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || (session.roleName !== "Super Admin" ? session.userId : undefined);
    const dateStr = searchParams.get("date"); // YYYY-MM-DD or undefined

    await checkDbConnection();

    // Fetch activities that are attendance/work session logs
    let rawActivities: any[] = [];
    if (isDemoMode()) {
      rawActivities = mockDb.activities.filter(a => 
        a.notes && (a.notes.includes("workday session") || a.notes.includes("clocked out") || a.notes.includes("finished workday"))
      );
      if (targetUserId) {
        rawActivities = rawActivities.filter(a => a.userId === targetUserId);
      }
    } else {
      const whereClause: any = {
        OR: [
          { notes: { contains: "workday session" } },
          { notes: { contains: "clocked out" } },
          { notes: { contains: "finished workday" } }
        ]
      };
      if (targetUserId) {
        whereClause.userId = targetUserId;
      }
      rawActivities = await prisma.activity.findMany({
        where: whereClause,
        include: { user: true },
        orderBy: { timestamp: "desc" },
        take: 200
      });
    }

    // Map logs into structured attendance records
    const attendanceLogs = rawActivities.map(act => {
      const isStart = act.notes.includes("started workday session");
      const isClockOut = act.notes.includes("clocked out") || act.notes.includes("finished workday");
      let location = "Office";
      if (act.notes.includes("from Home")) location = "Home";
      else if (act.notes.includes("from Office")) location = "Office";

      return {
        id: act.id,
        timestamp: act.timestamp,
        userId: act.userId,
        userName: act.user?.name || "Team Member",
        userEmail: act.user?.email || "",
        action: isStart ? "CLOCK_IN" : isClockOut ? "CLOCK_OUT" : "OTHER",
        location,
        notes: act.notes
      };
    });

    // Group logs by user and day to calculate today's total active hours
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userSummaryMap: Record<string, {
      userId: string;
      userName: string;
      roleName: string;
      isCurrentlyWorking: boolean;
      currentLocation: string;
      firstClockIn: string | null;
      lastClockOut: string | null;
      totalWorkedMinutes: number;
      sessions: any[];
    }> = {};

    const allUsers = await listUsers();
    allUsers.forEach(u => {
      userSummaryMap[u.id] = {
        userId: u.id,
        userName: u.name,
        roleName: u.roleName || "Member",
        isCurrentlyWorking: false,
        currentLocation: "Office",
        firstClockIn: null,
        lastClockOut: null,
        totalWorkedMinutes: 0,
        sessions: []
      };
    });

    // Process logs in chronological order for accurate session pairing
    const chronologicalLogs = [...attendanceLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    chronologicalLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      // Filter for today
      if (logDate >= today) {
        const uSummary = userSummaryMap[log.userId];
        if (uSummary) {
          if (log.action === "CLOCK_IN") {
            uSummary.isCurrentlyWorking = true;
            uSummary.currentLocation = log.location;
            if (!uSummary.firstClockIn) uSummary.firstClockIn = log.timestamp;
            uSummary.sessions.push({ clockIn: log.timestamp, clockOut: null, location: log.location });
          } else if (log.action === "CLOCK_OUT") {
            uSummary.isCurrentlyWorking = false;
            uSummary.lastClockOut = log.timestamp;
            const openSession = uSummary.sessions[uSummary.sessions.length - 1];
            if (openSession && !openSession.clockOut) {
              openSession.clockOut = log.timestamp;
              const durationMs = new Date(log.timestamp).getTime() - new Date(openSession.clockIn).getTime();
              uSummary.totalWorkedMinutes += Math.max(0, Math.round(durationMs / 60000));
            }
          }
        }
      }
    });

    // For any open ongoing session right now, compute elapsed live minutes
    const now = Date.now();
    Object.values(userSummaryMap).forEach(u => {
      if (u.isCurrentlyWorking) {
        const openSession = u.sessions[u.sessions.length - 1];
        if (openSession && !openSession.clockOut) {
          const liveMs = now - new Date(openSession.clockIn).getTime();
          u.totalWorkedMinutes += Math.max(0, Math.round(liveMs / 60000));
        }
      }
    });

    return NextResponse.json({
      success: true,
      logs: attendanceLogs,
      userSummaries: Object.values(userSummaryMap),
      currentUserId: session.userId,
      isSuperAdmin: session.roleName === "Super Admin"
    });
  } catch (error: any) {
    console.error("Attendance GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

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

      // 2. In-App Notifications for Super Admins
      await checkDbConnection();
      for (const admin of superAdmins) {
        try {
          if (!isDemoMode()) {
            await prisma.notification.create({
              data: {
                title: "Team Member Clocked In",
                message: `${session.name} (${userRole}) started work from ${workLocation} at ${actionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                type: "Attendance",
                userId: admin.id,
                linkUrl: `/dashboard`
              }
            });
          }
        } catch (notifErr) {
          console.error("Failed to create in-app notification:", notifErr);
        }
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

      // 2. In-App Notifications for Super Admins
      await checkDbConnection();
      for (const admin of superAdmins) {
        try {
          if (!isDemoMode()) {
            await prisma.notification.create({
              data: {
                title: "Team Member Clocked Out",
                message: `${session.name} (${userRole}) clocked out from ${workLocation} at ${actionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                type: "Attendance",
                userId: admin.id,
                linkUrl: `/dashboard`
              }
            });
          }
        } catch (notifErr) {
          console.error("Failed to create in-app notification:", notifErr);
        }
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
