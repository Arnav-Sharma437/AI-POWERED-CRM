import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { createActivity } from "@/lib/services";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

// In-memory last heartbeat timestamp per user
export const userHeartbeatMap: Record<string, { timestamp: number; location: string }> = {};

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let action = "heartbeat";
    let location = session.workLocation || "Office";

    try {
      const body = await request.json();
      if (body.action) action = body.action;
      if (body.location) location = body.location;
    } catch {
      // json parse fallback
    }

    const now = Date.now();

    if (action === "tab_close" || action === "shutdown") {
      // Auto-save checkpoint on browser / system close
      userHeartbeatMap[session.userId] = { timestamp: now, location };
      try {
        await createActivity({
          type: "System",
          notes: `User session checkpoint / paused from ${location} on system disconnect`,
          userId: session.userId
        });
        chatEmitter.emit("crm_update", {
          entity: "attendance",
          action: "heartbeat_stop",
          userId: session.userId,
          timestamp: new Date(now).toISOString()
        });
      } catch (e) {
        console.error("Error creating shutdown activity", e);
      }
    } else {
      // Active heartbeat ping
      userHeartbeatMap[session.userId] = { timestamp: now, location };
    }

    return NextResponse.json({
      success: true,
      timestamp: now
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
