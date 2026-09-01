import { NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { getProjectById, updateProject, isDemoMode } from "@/lib/services";
import { mockDb } from "@/lib/mockData";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { verifySession } = await import("@/lib/auth");
    const session = await verifySession(request);
    const userContext = session ? { userId: session.userId, roleName: session.roleName } : undefined;
    const project = await getProjectById(id, userContext);
    if (!project) return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 404 });

    const conversations = (project as any).conversations || [];
    let conversationId = conversations[0]?.id;

    if (!conversationId) {
      const { prisma } = await import("@/lib/db");
      let conv = await prisma.conversation.findUnique({
        where: { projectId: id }
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            type: "PROJECT",
            projectId: id,
            members: {
              create: {
                userId: project.primaryBdaId
              }
            }
          }
        });
      }
      conversationId = conv.id;
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        conversationId
      }
    });
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
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
    const project = await updateProject(id, body, user.userId);
    return NextResponse.json({ success: true, project });
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesHeader = request.headers.get("cookie") || "";
    const token = cookiesHeader.split(";").find(c => c.trim().startsWith("token="))?.split("=")[1];
    const user = token ? await verifyJWT(token) : null;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (isDemoMode()) {
      const project = mockDb.projects.find(p => p.id === id);
      if (project) {
        project.isTrashed = true;
        mockDb.activities.push({
          id: `act-${Date.now()}`,
          timestamp: new Date(),
          userId: user.userId,
          type: "System",
          notes: `Moved project ${project.name} to Trash.`,
          projectId: id
        });
      }
    } else {
      const { prisma } = await import("@/lib/db");
      await prisma.project.update({
        where: { id },
        data: {
          isTrashed: true,
          activities: {
            create: {
              userId: user.userId,
              type: "System",
              notes: "Moved project to Trash."
            }
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
