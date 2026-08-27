import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listActivities, checkDbConnection, isDemoMode } from "@/lib/services";
import { mockDb } from "@/lib/mockData";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activities = await listActivities();
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error("Activities GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    await checkDbConnection();

    if (isDemoMode()) {
      const activity = {
        id: `act-${Date.now()}`,
        timestamp: new Date(),
        userId: session.userId,
        type: body.type || "Note",
        notes: body.notes,
        leadId: body.leadId,
        projectId: body.projectId,
        clientId: body.clientId
      };
      mockDb.activities.push(activity);
      return NextResponse.json({ success: true, activity });
    } else {
      const activity = await prisma.activity.create({
        data: {
          userId: session.userId,
          type: body.type || "Note",
          notes: body.notes,
          leadId: body.leadId || null,
          projectId: body.projectId || null,
          clientId: body.clientId || null
        }
      });
      return NextResponse.json({ success: true, activity });
    }
  } catch (error: any) {
    console.error("Activities POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
