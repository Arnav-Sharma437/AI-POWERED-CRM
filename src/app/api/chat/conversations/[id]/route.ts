import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessConversation } from "@/lib/chat";
import { chatEmitter } from "@/lib/events";

export const dynamic = "force-dynamic";

// DELETE /api/chat/conversations/[id] - Clear or delete conversation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await canAccessConversation(conversationId, session.userId);
    if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const conv = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true }
    });

    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

    // Check if query param clearOnly=true (to clear chat history for all) or delete conversation
    const { searchParams } = new URL(request.url);
    const clearOnly = searchParams.get("clearOnly") === "true";

    if (clearOnly || conv.type === "PROJECT") {
      // Clear all messages in the conversation
      await prisma.messageAttachment.deleteMany({
        where: { message: { conversationId } }
      });
      await prisma.messageRead.deleteMany({
        where: { message: { conversationId } }
      });
      await prisma.message.deleteMany({
        where: { conversationId }
      });
    } else {
      // Direct conversation: Delete messages and the conversation
      await prisma.messageAttachment.deleteMany({
        where: { message: { conversationId } }
      });
      await prisma.messageRead.deleteMany({
        where: { message: { conversationId } }
      });
      await prisma.message.deleteMany({
        where: { conversationId }
      });
      await prisma.conversationMember.deleteMany({
        where: { conversationId }
      });
      await prisma.conversation.delete({
        where: { id: conversationId }
      });
    }

    // Broadcast realtime event
    chatEmitter.emit("crm_update", { entity: "chat", action: "delete_conversation", conversationId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete conversation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
