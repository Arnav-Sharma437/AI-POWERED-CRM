import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { sendDevAssignmentEmail } from "@/lib/services";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { devId, devIds, workDetails } = body;
    
    // Support single devId or multiple devIds array
    const targetDevIds: string[] = devIds && Array.isArray(devIds) && devIds.length > 0
      ? devIds
      : devId
        ? [devId]
        : [];

    if (targetDevIds.length === 0) {
      return NextResponse.json({ error: "At least one developer is required" }, { status: 400 });
    }

    // Assign all selected developers
    for (const dId of targetDevIds) {
      await sendDevAssignmentEmail(id, dId, workDetails);
    }

    return NextResponse.json({ success: true, count: targetDevIds.length });
  } catch (error) {
    console.error("Project assign dev error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
