import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listUsers } from "@/lib/services";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await listUsers();
    const matched = allUsers.find(u => u.id === session.userId);

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        roleId: session.roleId,
        roleName: matched?.roleName || "BDA",
        avatar: matched?.avatar,
        workLocation: session.workLocation || "Office"
      }
    });
  } catch (error) {
    console.error("api/auth/me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
