import { NextResponse } from "next/server";
import { listNotifications, addNotification } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId parameter is required" }, { status: 400 });
    }

    const notifications = await listNotifications(userId);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notif = await addNotification(body.userId, body.title, body.message, body.type, body.linkUrl);
    return NextResponse.json({ success: true, notification: notif });
  } catch (error: any) {
    console.error("Notifications POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    const { markAllNotificationsRead } = await import("@/lib/services");
    await markAllNotificationsRead(userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Notifications PUT error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
