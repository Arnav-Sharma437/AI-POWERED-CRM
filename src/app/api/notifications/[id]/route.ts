import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/services";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await markNotificationRead(id);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Notification PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
