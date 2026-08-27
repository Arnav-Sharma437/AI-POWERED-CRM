import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listLeads, createLead } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await listLeads();
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
    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Leads POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
