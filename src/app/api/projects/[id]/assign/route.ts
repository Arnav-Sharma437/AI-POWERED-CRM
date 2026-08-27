import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { sendDevAssignmentEmail } from "@/lib/services";

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

    const { devId, workDetails } = await request.json();
    if (!devId) return NextResponse.json({ error: "devId is required" }, { status: 400 });

    const success = await sendDevAssignmentEmail(id, devId, workDetails);
    return NextResponse.json({ success });
  } catch (error) {
    console.error("Project assign dev error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
