import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getOrCreateDirectConversation } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { role: true }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isSuperAdmin = user.role.name === "Super Admin";

    // Retrieve conversations
    const conversations = await prisma.conversation.findMany({
      where: isSuperAdmin
        ? {}
        : {
            OR: [
              { members: { some: { userId: user.id } } },
              { project: { primaryBdaId: user.id } }
            ]
          },
      include: {
        project: {
          select: { id: true, name: true, primaryBdaId: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, role: { select: { name: true } } }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            attachments: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    });

    // Map details and calculate unread counts
    const mapped = await Promise.all(
      conversations.map(async (c) => {
        const lastMessage = c.messages[0] || null;
        let unreadCount = 0;

        if (lastMessage) {
          // Count messages after user's last read message or total unread in this conversation
          // Find if user has read the latest message
          const read = await prisma.messageRead.findFirst({
            where: {
              messageId: lastMessage.id,
              userId: user.id
            }
          });
          if (!read && lastMessage.senderId !== user.id) {
            // Count all messages in this conversation where sender is not user and user hasn't read them
            unreadCount = await prisma.message.count({
              where: {
                conversationId: c.id,
                senderId: { not: user.id },
                reads: { none: { userId: user.id } }
              }
            });
          }
        }

        // Identify recipient details for 1-to-1 direct chats
        let name = "Conversation";
        let subtitle = "";
        if (c.type === "DIRECT") {
          const recipientMember = c.members.find((m) => m.userId !== user.id);
          if (recipientMember) {
            name = recipientMember.user.name;
            subtitle = recipientMember.user.role?.name || "Team Member";
          } else {
            name = "Me (Notes)";
            subtitle = "Personal Space";
          }
        } else if (c.type === "PROJECT" && c.project) {
          name = c.project.name;
          subtitle = "Project Chat";
        }

        return {
          id: c.id,
          type: c.type,
          name,
          subtitle,
          projectId: c.projectId,
          project: c.project,
          members: c.members.map(m => m.user),
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.deletedAt ? "This message was deleted." : lastMessage.content,
            senderId: lastMessage.senderId,
            createdAt: lastMessage.createdAt,
            hasAttachment: lastMessage.attachments.length > 0
          } : null,
          unreadCount,
          updatedAt: c.updatedAt
        };
      })
    );

    return NextResponse.json({ success: true, conversations: mapped });
  } catch (error) {
    console.error("GET conversations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { type, recipientId, projectId } = body;

    if (type === "DIRECT") {
      if (!recipientId) {
        return NextResponse.json({ error: "recipientId is required for DIRECT chat" }, { status: 400 });
      }
      const conversation = await getOrCreateDirectConversation(session.userId, recipientId);
      return NextResponse.json({ success: true, conversationId: conversation.id });
    } else if (type === "PROJECT") {
      if (!projectId) {
        return NextResponse.json({ error: "projectId is required for PROJECT chat" }, { status: 400 });
      }
      
      // Ensure one project chat exists
      let conv = await prisma.conversation.findUnique({
        where: { projectId }
      });
      
      if (!conv) {
        const proj = await prisma.project.findUnique({ where: { id: projectId } });
        if (!proj) return NextResponse.json({ error: "Project not found" }, { status: 404 });
        
        conv = await prisma.conversation.create({
          data: {
            type: "PROJECT",
            projectId,
            members: {
              create: {
                userId: proj.primaryBdaId
              }
            }
          }
        });
      }
      return NextResponse.json({ success: true, conversationId: conv.id });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("POST conversation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
