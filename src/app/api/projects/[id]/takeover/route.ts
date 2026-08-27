import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { takeOverProject } from "@/lib/services";

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

    const { newBdaId, note } = await request.json();
    if (!newBdaId) return NextResponse.json({ error: "newBdaId is required" }, { status: 400 });

    const success = await takeOverProject(id, newBdaId, note, user.userId);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Project takeover error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
