import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { chatEmitter } from "@/lib/events";
import { canAccessConversation } from "@/lib/chat";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.userId;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        // Enqueue connection success event
        controller.enqueue(encoder.encode(":ok\n\n"));

        // Heartbeat interval
        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(":keepalive\n\n"));
        }, 15000);

        // Event listener functions
        const onMessage = async (message: any) => {
          try {
            const hasAccess = await canAccessConversation(message.conversationId, userId);
            if (hasAccess) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "message", data: message })}\n\n`));
            }
          } catch (err) {
            console.error("SSE message callback error:", err);
          }
        };

        const onDelete = async (deleteData: any) => {
          try {
            const hasAccess = await canAccessConversation(deleteData.conversationId, userId);
            if (hasAccess) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "delete", data: deleteData })}\n\n`));
            }
          } catch (err) {
            console.error("SSE delete callback error:", err);
          }
        };

        const onRead = async (readData: any) => {
          try {
            const hasAccess = await canAccessConversation(readData.conversationId, userId);
            if (hasAccess) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "read", data: readData })}\n\n`));
            }
          } catch (err) {
            console.error("SSE read callback error:", err);
          }
        };

        chatEmitter.on("message", onMessage);
        chatEmitter.on("delete", onDelete);
        chatEmitter.on("read", onRead);

        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          chatEmitter.off("message", onMessage);
          chatEmitter.off("delete", onDelete);
          chatEmitter.off("read", onRead);
          try {
            controller.close();
          } catch (e) {
            // Ignore if closed
          }
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("SSE init error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
