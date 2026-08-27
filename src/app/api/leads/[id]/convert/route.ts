import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { convertLeadToClient } from "@/lib/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    const user = token ? await verifyJWT(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const client = await convertLeadToClient(id, body, user.userId);
    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Lead conversion API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
