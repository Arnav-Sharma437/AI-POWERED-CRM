import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessConversation } from "@/lib/chat";
import { chatEmitter } from "@/lib/events";
import { saveAttachment } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await canAccessConversation(conversationId, session.userId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Retrieve recent message history
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: { id: true, name: true, email: true, roleId: true }
        },
        attachments: true,
        reads: {
          select: { userId: true, readAt: true }
        }
      },
      orderBy: { createdAt: "asc" }
    });

    const mapped = messages.map((m) => ({
      id: m.id,
      content: m.deletedAt ? "This message was deleted." : m.content,
      senderId: m.senderId,
      senderName: m.sender.name,
      senderEmail: m.sender.email,
      createdAt: m.createdAt,
      isDeleted: m.deletedAt !== null,
      attachments: m.attachments,
      reads: m.reads
    }));

    return NextResponse.json({ success: true, messages: mapped });
  } catch (error) {
    console.error("GET messages error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { content, attachments } = body;

    const trimmedContent = (content || "").trim();
    const hasAttachments = attachments && attachments.length > 0;

    if (!trimmedContent && !hasAttachments) {
      return NextResponse.json({ error: "Cannot send an empty message." }, { status: 400 });
    }

    // Process attachments first if any exist
    const processedAttachments = [];
    if (hasAttachments) {
      for (const att of attachments) {
        if (!att.fileName || !att.fileType || !att.base64) {
          return NextResponse.json({ error: "Invalid attachment metadata structure." }, { status: 400 });
        }
        const saved = await saveAttachment(att.fileName, att.fileType, att.base64);
        processedAttachments.push(saved);
      }
    }

    // Create the message in database
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.userId,
        content: trimmedContent,
        attachments: {
          create: processedAttachments
        },
        reads: {
          create: {
            userId: session.userId
          }
        }
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true, roleId: true }
        },
        attachments: true,
        reads: {
          select: { userId: true, readAt: true }
        }
      }
    });

    // Touch conversation updated timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    const mappedMessage = {
      id: message.id,
      conversationId: message.conversationId,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderEmail: message.sender.email,
      createdAt: message.createdAt,
      isDeleted: false,
      attachments: message.attachments,
      reads: message.reads
    };

    // Broadcast message via SSE
    chatEmitter.emit("message", mappedMessage);

    // Integrate with BDA CRM In-App Notifications
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          members: true,
          project: true
        }
      });

      if (conversation) {
        const recipients = conversation.type === "PROJECT" && conversation.project
          ? // Project chats notify members + project assigned BDA
            new Set([
              ...conversation.members.map(m => m.userId),
              conversation.project.primaryBdaId
            ])
          : new Set(conversation.members.map(m => m.userId));

        // Delete sender from notifications list
        recipients.delete(session.userId);

        for (const recipientId of recipients) {
          // Check for existing unread chat notifications to avoid excessive duplicate rows
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: recipientId,
              type: "NewChatMessage",
              isRead: false,
              linkUrl: `/dashboard/chat?id=${conversationId}`
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                title: "New Message",
                message: `${session.name} sent you a message: ${trimmedContent.substring(0, 30)}${trimmedContent.length > 30 ? "..." : ""}`,
                type: "NewChatMessage",
                userId: recipientId,
                linkUrl: `/dashboard/chat?id=${conversationId}`
              }
            });
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to generate in-app chat notifications:", notifErr);
    }

    return NextResponse.json({ success: true, message: mappedMessage });
  } catch (error) {
    console.error("POST message error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
