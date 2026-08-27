import { NextResponse } from "next/server";
import { getClientById } from "@/lib/services";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const client = await getClientById(id);
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });
    return NextResponse.json({ success: true, client });
  } catch (error) {
    console.error("Client GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
