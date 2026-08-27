import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { addAttachment } from "@/lib/services";

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
    const attachment = await addAttachment({
      ...body,
      leadId: id,
      uploadedById: user.userId
    });

    return NextResponse.json({ success: true, attachment });
  } catch (error) {
    console.error("Lead attachment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
