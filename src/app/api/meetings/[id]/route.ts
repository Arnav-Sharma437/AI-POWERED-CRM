import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { updateMeeting, deleteMeeting } from "@/lib/services";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const meeting = await updateMeeting(id, body, session.userId);

    // Broadcast realtime update
    chatEmitter.emit("crm_update", { entity: "meeting", action: "update", meeting });

    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error("Meeting PUT error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await deleteMeeting(id, session.userId);

    // Broadcast realtime update
    chatEmitter.emit("crm_update", { entity: "meeting", action: "delete", meetingId: id });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Meeting DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
