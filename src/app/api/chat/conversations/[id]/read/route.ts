import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessConversation } from "@/lib/chat";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await canAccessConversation(conversationId, session.userId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Find all messages in this conversation not sent by current user and not read by them yet
    const unreadMessages = await prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: session.userId },
        reads: {
          none: {
            userId: session.userId
          }
        }
      },
      select: { id: true }
    });

    if (unreadMessages.length > 0) {
      // Mark them as read
      await prisma.$transaction(
        unreadMessages.map((m) =>
          prisma.messageRead.upsert({
            where: {
              messageId_userId: {
                messageId: m.id,
                userId: session.userId
              }
            },
            create: {
              messageId: m.id,
              userId: session.userId
            },
            update: {}
          })
        )
      );
    }

    // Mark corresponding notifications as read
    await prisma.notification.updateMany({
      where: {
        userId: session.userId,
        type: "NewChatMessage",
        linkUrl: `/dashboard/chat?id=${conversationId}`,
        isRead: false
      },
      data: { isRead: true }
    });

    const readData = {
      conversationId,
      userId: session.userId,
      readAt: new Date()
    };

    // Broadcast read event to SSE clients
    chatEmitter.emit("read", readData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST read error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
