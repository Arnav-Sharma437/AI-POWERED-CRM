import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessConversation } from "@/lib/chat";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: attachmentId } = await params;
    const session = await verifySession(request);
    if (!session) return new Response("Unauthorized", { status: 401 });

    // Find attachment and include parent message/conversation details
    const attachment = await prisma.messageAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        message: true
      }
    });

    if (!attachment) {
      return new Response("Attachment not found", { status: 404 });
    }

    // Check user conversation authorization
    const hasAccess = await canAccessConversation(attachment.message.conversationId, session.userId);
    if (!hasAccess) {
      return new Response("Forbidden: You do not have access to this attachment.", { status: 403 });
    }

    // Generate a temporary signed URL from Supabase Storage (valid for 60 seconds)
    const { data, error } = await supabase.storage
      .from("chat-attachments")
      .createSignedUrl(attachment.fileUrl, 60);

    if (error || !data?.signedUrl) {
      console.error("Failed to generate signed url:", error);
      return new Response("Failed to retrieve file from storage", { status: 500 });
    }

    // Redirect user to the secure signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error("GET attachment error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
