import { prisma } from "./db";
import { getUserById } from "./services";

export async function canAccessConversation(conversationId: string, userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });
    if (!user || user.isTrashed || !user.isActive) return false;

    // Super Admin has full access to all conversations
    if (user.role.name === "Super Admin") return true;

    // Find conversation
    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { project: true }
    });
    if (!conv) return false;

    // Check conversation member membership
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });
    if (member) return true;

    // Check if PROJECT BDA
    if (conv.type === "PROJECT" && conv.project && conv.project.primaryBdaId === userId) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("canAccessConversation error:", error);
    return false;
  }
}

export async function getOrCreateDirectConversation(userAId: string, userBId: string): Promise<any> {
  // Ensure we reuse existing direct conversation between User A and User B
  const conversations = await prisma.conversation.findMany({
    where: {
      type: "DIRECT",
      AND: [
        { members: { some: { userId: userAId } } },
        { members: { some: { userId: userBId } } }
      ]
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, roleId: true }
          }
        }
      }
    }
  });

  // Find exact 2-member conversation
  const matched = conversations.find(c => c.members.length === 2);
  if (matched) return matched;

  // Create new conversation
  const conv = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      members: {
        create: [
          { userId: userAId },
          { userId: userBId }
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, roleId: true }
          }
        }
      }
    }
  });

  return conv;
}
