import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { checkDbConnection, isDemoMode } from "@/lib/services";
import { mockDb } from "@/lib/mockData";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await checkDbConnection();

    if (isDemoMode()) {
      const idx = mockDb.activities.findIndex(a => a.id === id);
      if (idx !== -1) {
        mockDb.activities.splice(idx, 1);
      }
      return NextResponse.json({ success: true, message: "Activity deleted" });
    } else {
      const activity = await prisma.activity.findUnique({ where: { id } });
      if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

      // Only author or Super Admin can delete
      if (activity.userId !== session.userId && session.roleName !== "Super Admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await prisma.activity.delete({ where: { id } });
      return NextResponse.json({ success: true, message: "Activity deleted" });
    }
  } catch (error: any) {
    console.error("Activity DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
