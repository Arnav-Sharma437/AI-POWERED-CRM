import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listProjects, createProject } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTrashed = searchParams.get("includeTrashed") === "true";

    const session = await verifySession(request);
    const userContext = session ? { userId: session.userId, roleName: session.roleName } : undefined;
    const projects = await listProjects(includeTrashed, userContext);
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const project = await createProject(body, session.userId);

    // Broadcast instant real-time sync event across all logged-in users & dashboards
    try {
      const { chatEmitter } = await import("@/lib/events");
      chatEmitter.emit("crm_update", { entity: "project", action: "create", projectId: project.id });
    } catch (e) {
      console.error("Failed to emit crm_update for project:", e);
    }

    return NextResponse.json({ success: true, project });
  } catch (error: any) {
    console.error("Projects POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
