import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    // Check authorization: must be sender or Super Admin
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true }
    });
    
    const isSender = message.senderId === session.userId;
    const isSuperAdmin = user?.role.name === "Super Admin";

    if (!isSender && !isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this message." }, { status: 403 });
    }

    // Perform soft deletion
    await prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() }
    });

    const deleteData = {
      id: message.id,
      conversationId: message.conversationId
    };

    // Broadcast delete event to SSE clients
    chatEmitter.emit("delete", deleteData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
