import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { addPayment } from "@/lib/services";

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

    const { amount, note } = await request.json();
    if (!amount) return NextResponse.json({ error: "amount is required" }, { status: 400 });

    const payment = await addPayment(id, parseFloat(amount), note, user.userId);
    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Project payment POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
