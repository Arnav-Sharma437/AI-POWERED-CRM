import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listMeetings, createMeeting } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const meetings = await listMeetings();
    return NextResponse.json({ success: true, meetings });
  } catch (error) {
    console.error("Meetings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const meeting = await createMeeting(body, session.userId);
    return NextResponse.json({ success: true, meeting });
  } catch (error: any) {
    console.error("Meetings POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
