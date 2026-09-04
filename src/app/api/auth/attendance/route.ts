import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createActivity, listUsers, isDemoMode, checkDbConnection } from "@/lib/services";
import { prisma } from "@/lib/db";
import { mockDb } from "@/lib/mockData";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || undefined;
    const dateStr = searchParams.get("date"); // YYYY-MM-DD or undefined

    await checkDbConnection();

    // Fetch activities that are attendance/work session logs
    let rawActivities: any[] = [];
    if (isDemoMode()) {
      rawActivities = mockDb.activities.filter(a => 
        a.notes && (
          a.notes.includes("workday session") || 
          a.notes.includes("clocked out") || 
          a.notes.includes("finished workday") ||
          a.notes.includes("started workday") ||
          a.notes.includes("logged in from")
        )
      );
      if (targetUserId) {
        rawActivities = rawActivities.filter(a => a.userId === targetUserId);
      }
    } else {
      const whereClause: any = {
        OR: [
          { notes: { contains: "workday session" } },
          { notes: { contains: "clocked out" } },
          { notes: { contains: "finished workday" } },
          { notes: { contains: "started workday" } },
          { notes: { contains: "logged in from" } }
        ]
      };
      if (targetUserId) {
        whereClause.userId = targetUserId;
      }
      rawActivities = await prisma.activity.findMany({
        where: whereClause,
        include: { user: true },
        orderBy: { timestamp: "desc" },
        take: 500
      });
    }

    // Map logs into structured attendance records
    const attendanceLogs = rawActivities.map(act => {
      const isStart = act.notes.includes("started workday") || act.notes.includes("workday session") || act.notes.includes("logged in from");
      const isClockOut = act.notes.includes("clocked out") || act.notes.includes("finished workday");
      let location = "Office";
      if (act.notes.includes("from Home") || act.notes.includes("Home")) location = "Home";
      else if (act.notes.includes("from Office") || act.notes.includes("Office")) location = "Office";

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

    // Compute comprehensive summary per user
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allUsers = await listUsers();
    const userSummaryMap: Record<string, any> = {};

    allUsers.forEach(u => {
      userSummaryMap[u.id] = {
        userId: u.id,
        userName: u.name,
        roleName: u.roleName || "Member",
        avatar: u.avatar || null,
        isCurrentlyWorking: false,
        currentLocation: "Office",
        firstClockIn: null,
        lastClockOut: null,
        totalWorkedMinutes: 0, // today
        totalLifetimeWorkedMinutes: 0,
        totalDaysPresent: 0,
        totalDaysOnLeave: 0,
        history: [] as any[],
        sessions: [] as any[]
      };
    });

    // Helper for reliable local date string (YYYY-MM-DD)
    const getLocalDateKey = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Official Calendar Holidays for 2026/Company
    const officialHolidays2026 = [
      { date: "2026-01-26", name: "Republic Day" },
      { date: "2026-03-04", name: "Holi" },
      { date: "2026-03-21", name: "Eid-ul-Fitr" },
      { date: "2026-04-14", name: "Dr. Ambedkar Jayanti" },
      { date: "2026-05-01", name: "May Day / Labour Day" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-10-02", name: "Gandhi Jayanti" },
      { date: "2026-10-20", name: "Dussehra" },
      { date: "2026-11-08", name: "Diwali" },
      { date: "2026-12-25", name: "Christmas" }
    ];

    const now = Date.now();
    const startOfWeek = new Date();
    const currentDay = startOfWeek.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMonday = startOfWeek.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Calculate business days elapsed this month up to today (excluding weekends and official holidays)
    let elapsedWorkingDaysThisMonth = 0;
    const holidayDateSet = new Set(officialHolidays2026.map(h => h.date));

    for (let d = new Date(startOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = getLocalDateKey(d);
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateStr)) {
        elapsedWorkingDaysThisMonth++;
      }
    }
    if (elapsedWorkingDaysThisMonth === 0) elapsedWorkingDaysThisMonth = 1;

    // Calculate business days elapsed this week up to today
    let elapsedWorkingDaysThisWeek = 0;
    for (let d = new Date(startOfWeek); d <= today; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const dateStr = getLocalDateKey(d);
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDateSet.has(dateStr)) {
        elapsedWorkingDaysThisWeek++;
      }
    }
    if (elapsedWorkingDaysThisWeek === 0) elapsedWorkingDaysThisWeek = 1;

    // Sort all chronological logs ascending
    const chronologicalLogs = [...attendanceLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Process attendance per user cleanly with paired sessions
    const todayKey = getLocalDateKey(new Date());

    allUsers.forEach(u => {
      const uLogs = chronologicalLogs.filter(l => l.userId === u.id);
      const dayMap: Record<string, { date: string; dateStr: string; dayName: string; clockIn: string | null; clockOut: string | null; location: string; minutes: number }> = {};
      
      let currentClockInTime: Date | null = null;
      let currentClockInLocation = "Office";

      uLogs.forEach(log => {
        const logTime = new Date(log.timestamp);
        const dateKey = getLocalDateKey(logTime);

        if (!dayMap[dateKey]) {
          dayMap[dateKey] = {
            date: dateKey,
            dateStr: logTime.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            dayName: logTime.toLocaleDateString("en-IN", { weekday: "short" }),
            clockIn: null,
            clockOut: null,
            location: log.location || "Office",
            minutes: 0
          };
        }

        const dayRec = dayMap[dateKey];

        if (log.action === "CLOCK_IN") {
          currentClockInTime = logTime;
          currentClockInLocation = log.location || "Office";
          if (!dayRec.clockIn) {
            dayRec.clockIn = log.timestamp;
          }
          dayRec.location = currentClockInLocation;
        } else if (log.action === "CLOCK_OUT") {
          dayRec.clockOut = log.timestamp;
          if (currentClockInTime) {
            let sessionMinutes = Math.round((logTime.getTime() - currentClockInTime.getTime()) / 60000);
            if (sessionMinutes > 720) sessionMinutes = 480; // Cap to 8 hours if abnormal
            if (sessionMinutes < 0) sessionMinutes = 0;

            const sessionDateKey = getLocalDateKey(currentClockInTime);
            if (dayMap[sessionDateKey]) {
              dayMap[sessionDateKey].minutes += sessionMinutes;
            } else {
              dayRec.minutes += sessionMinutes;
            }
            currentClockInTime = null;
          }
        }
      });

      // Determine real live status directly from the latest logged action
      const latestLog = uLogs.length > 0 ? uLogs[uLogs.length - 1] : null;
      const isWorkingNow = latestLog?.action === "CLOCK_IN";
      let liveTodayMinutes = 0;

      if (isWorkingNow && latestLog) {
        currentClockInLocation = latestLog.location || "Office";
        const inDate = new Date(latestLog.timestamp);
        const inDateKey = getLocalDateKey(inDate);

        const liveDiff = Math.max(0, Math.round((now - inDate.getTime()) / 60000));
        liveTodayMinutes = Math.min(liveDiff, 720); // Cap live session to 12h max

        if (!dayMap[inDateKey]) {
          dayMap[inDateKey] = {
            date: inDateKey,
            dateStr: inDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
            dayName: inDate.toLocaleDateString("en-IN", { weekday: "short" }),
            clockIn: inDate.toISOString(),
            clockOut: null,
            location: currentClockInLocation,
            minutes: 0
          };
        }
      }

      // Compute total minutes accurately
      const userDaysList = Object.values(dayMap);
      let todayTotalMinutes = (dayMap[todayKey]?.minutes || 0) + (isWorkingNow ? liveTodayMinutes : 0);
      let weeklyTotalMinutes = 0;
      let lifetimeTotalMinutes = 0;
      let thisWeekDaysCount = 0;
      let thisMonthDaysCount = 0;

      userDaysList.forEach(d => {
        const dDate = new Date(d.date);
        dDate.setHours(0, 0, 0, 0);

        let dMins = d.minutes;
        if (d.date === todayKey && isWorkingNow) {
          dMins += liveTodayMinutes;
        }

        lifetimeTotalMinutes += dMins;

        if (dDate >= startOfWeek) {
          weeklyTotalMinutes += dMins;
          thisWeekDaysCount++;
        }
        if (dDate >= startOfMonth) {
          thisMonthDaysCount++;
        }
      });

      const uSummary = userSummaryMap[u.id];
      if (uSummary) {
        uSummary.isCurrentlyWorking = isWorkingNow;
        uSummary.currentLocation = currentClockInLocation;
        uSummary.firstClockIn = dayMap[todayKey]?.clockIn || (isWorkingNow && latestLog ? latestLog.timestamp : null);
        uSummary.lastClockOut = dayMap[todayKey]?.clockOut || null;
        uSummary.totalWorkedMinutes = todayTotalMinutes;
        uSummary.totalWeeklyWorkedMinutes = weeklyTotalMinutes;
        uSummary.totalLifetimeWorkedMinutes = lifetimeTotalMinutes;
        uSummary.totalDaysPresent = userDaysList.length;
        uSummary.thisMonthDaysPresent = thisMonthDaysCount;
        uSummary.thisWeekDaysPresent = thisWeekDaysCount;

        uSummary.totalDaysOnLeave = Math.max(0, elapsedWorkingDaysThisMonth - thisMonthDaysCount);
        uSummary.weeklyDaysOnLeave = Math.max(0, elapsedWorkingDaysThisWeek - thisWeekDaysCount);
        uSummary.history = userDaysList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
    });

    return NextResponse.json({
      success: true,
      logs: attendanceLogs,
      attendance: attendanceLogs,
      summary: userSummaryMap,
      userSummaries: Object.values(userSummaryMap),
      officialHolidays: officialHolidays2026,
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

      // 3. Real-time broadcast to all connected CRM clients
      try {
        chatEmitter.emit("crm_update", {
          entity: "attendance",
          action: "start_work",
          userId: session.userId,
          userName: session.name,
          roleName: userRole,
          workLocation,
          timestamp: actionTime.toISOString()
        });
      } catch (sseErr) {
        console.error("Failed to emit attendance SSE event:", sseErr);
      }

      return NextResponse.json({
        success: true,
        message: `Work session started from ${workLocation}!`,
        isCurrentlyWorking: true,
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

      // 3. Real-time broadcast to all connected CRM clients
      try {
        chatEmitter.emit("crm_update", {
          entity: "attendance",
          action: "clock_out",
          userId: session.userId,
          userName: session.name,
          roleName: userRole,
          workLocation,
          timestamp: actionTime.toISOString()
        });
      } catch (sseErr) {
        console.error("Failed to emit attendance SSE event:", sseErr);
      }

      return NextResponse.json({
        success: true,
        message: `Clocked out successfully at ${actionTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}!`,
        isCurrentlyWorking: false,
        workEndedAt: actionTime.toISOString()
      });
    } else if (action === "send_weekly_reports") {
      if (session.roleName !== "Super Admin") {
        return NextResponse.json({ error: "Only Super Admin can trigger weekly attendance reports dispatch." }, { status: 403 });
      }

      const { sendDeveloperWeeklyAttendanceEmail, sendSuperAdminWeeklyTeamAttendanceEmail } = await import("@/lib/email");

      // Calculate last 7 days window
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const weekStartFormatted = sevenDaysAgo.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const weekEndFormatted = now.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

      // Fetch all attendance activity logs from last 7 days
      let weekActivities: any[] = [];
      if (isDemoMode()) {
        weekActivities = mockDb.activities.filter(a => 
          new Date(a.timestamp) >= sevenDaysAgo &&
          a.notes && (a.notes.includes("workday session") || a.notes.includes("clocked out") || a.notes.includes("finished workday"))
        );
      } else {
        weekActivities = await prisma.activity.findMany({
          where: {
            timestamp: { gte: sevenDaysAgo },
            OR: [
              { notes: { contains: "workday session" } },
              { notes: { contains: "clocked out" } },
              { notes: { contains: "finished workday" } }
            ]
          },
          include: { user: true },
          orderBy: { timestamp: "asc" }
        });
      }

      const allActiveUsers = allUsers.filter(u => !u.isTrashed && u.isActive);
      const superAdminList = allActiveUsers.filter(u => u.roleName === "Super Admin");
      const developersAndStaff = allActiveUsers.filter(u => u.roleName !== "Super Admin");

      const masterTeamSummary: Array<{
        name: string;
        email: string;
        role: string;
        totalHours: string;
        daysPresent: number;
        officeVsHome: string;
      }> = [];

      // Process each user's weekly attendance breakdown
      for (const u of allActiveUsers) {
        const uLogs = weekActivities.filter(a => a.userId === u.id);
        const dayMap: Record<string, { dateStr: string; dayName: string; firstIn: string; lastOut: string; location: string; minutes: number }> = {};

        let currentOpenClockIn: Date | null = null;
        let currentLoc = "Office";

        uLogs.forEach(act => {
          const actDate = new Date(act.timestamp);
          const dateKey = actDate.toISOString().split("T")[0];
          const dayName = actDate.toLocaleDateString("en-IN", { weekday: "short" });
          const dateFormatted = actDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          const timeFormatted = actDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

          if (!dayMap[dateKey]) {
            let loc = "Office";
            if (act.notes?.includes("from Home")) loc = "Home";
            dayMap[dateKey] = {
              dateStr: dateFormatted,
              dayName,
              firstIn: "",
              lastOut: "",
              location: loc,
              minutes: 0
            };
          }

          if (act.notes?.includes("started workday session")) {
            currentOpenClockIn = actDate;
            if (!dayMap[dateKey].firstIn) dayMap[dateKey].firstIn = timeFormatted;
            if (act.notes?.includes("from Home")) {
              dayMap[dateKey].location = "Home";
              currentLoc = "Home";
            } else {
              dayMap[dateKey].location = "Office";
              currentLoc = "Office";
            }
          } else if (act.notes?.includes("clocked out") || act.notes?.includes("finished workday")) {
            dayMap[dateKey].lastOut = timeFormatted;
            if (currentOpenClockIn) {
              const durationMs = actDate.getTime() - currentOpenClockIn.getTime();
              dayMap[dateKey].minutes += Math.max(0, Math.round(durationMs / 60000));
              currentOpenClockIn = null;
            }
          }
        });

        const dailyList = Object.values(dayMap).map(d => {
          const hrs = Math.floor(d.minutes / 60);
          const mins = d.minutes % 60;
          return {
            ...d,
            durationFormatted: hrs > 0 ? `${hrs}h ${mins}m` : `${mins} mins`
          };
        });

        const totalMins = Object.values(dayMap).reduce((sum, d) => sum + d.minutes, 0);
        const totalHrs = Math.floor(totalMins / 60);
        const remMins = totalMins % 60;
        const totalWorkedHours = totalHrs > 0 ? `${totalHrs}h ${remMins}m` : `${remMins} mins`;
        const daysPresent = Object.keys(dayMap).length;

        const officeDays = Object.values(dayMap).filter(d => d.location === "Office").length;
        const homeDays = Object.values(dayMap).filter(d => d.location === "Home").length;
        const officeVsHome = daysPresent === 0 ? "No Logs" : `${officeDays} Office / ${homeDays} Home`;

        masterTeamSummary.push({
          name: u.name,
          email: u.email,
          role: u.roleName || "Member",
          totalHours: totalWorkedHours,
          daysPresent,
          officeVsHome
        });

        // If Developer, send individual detailed breakdown email
        if (u.roleName === "Developer") {
          await sendDeveloperWeeklyAttendanceEmail({
            developerEmail: u.email,
            developerName: u.name,
            weekStartDate: weekStartFormatted,
            weekEndDate: weekEndFormatted,
            totalWorkedHours,
            daysPresent,
            dailyBreakdown: dailyList
          }).catch(e => console.error(`Error sending weekly email to dev ${u.email}:`, e));
        }
      }

      // Send Consolidated Master Report to Super Admins
      for (const admin of superAdminList) {
        await sendSuperAdminWeeklyTeamAttendanceEmail({
          adminEmail: admin.email,
          adminName: admin.name,
          weekStartDate: weekStartFormatted,
          weekEndDate: weekEndFormatted,
          teamMembers: masterTeamSummary
        }).catch(e => console.error(`Error sending weekly master email to admin ${admin.email}:`, e));
      }

      return NextResponse.json({
        success: true,
        message: `Weekly attendance reports dispatched successfully to ${developersAndStaff.length} team members and ${superAdminList.length} Super Admin(s)!`
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Attendance API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
