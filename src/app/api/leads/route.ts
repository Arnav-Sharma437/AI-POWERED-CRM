import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listLeads, createLead } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTrashed = searchParams.get("includeTrashed") === "true";

    const leads = await listLeads(includeTrashed);
    return NextResponse.json({ success: true, leads });
  } catch (error) {
    console.error("Leads GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const lead = await createLead(body, session.userId);

    // Broadcast instant real-time sync event across all logged-in users & dashboards
    try {
      const { chatEmitter } = await import("@/lib/events");
      chatEmitter.emit("crm_update", { entity: "lead", action: "create", leadId: lead.id });
    } catch (e) {
      console.error("Failed to emit crm_update for lead:", e);
    }

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Leads POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
