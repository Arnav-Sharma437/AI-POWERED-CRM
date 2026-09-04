import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listActivities, checkDbConnection, isDemoMode } from "@/lib/services";
import { mockDb } from "@/lib/mockData";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    const userContext = session ? { userId: session.userId, roleName: session.roleName } : undefined;
    const activities = await listActivities(userContext);
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
      const user = mockDb.users.find(u => u.id === session.userId);
      const activity = {
        id: `act-${Date.now()}`,
        timestamp: new Date(),
        userId: session.userId,
        user: {
          id: session.userId,
          name: session.name,
          email: session.email,
          avatar: user?.avatar || null,
          roleName: session.roleName,
          role: { name: session.roleName }
        },
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
        },
        include: {
          user: {
            include: { role: true }
          }
        }
      });

      // Notify project team if this is a project daily update
      if (body.projectId) {
        try {
          const project = await prisma.project.findUnique({
            where: { id: body.projectId },
            include: {
              conversations: {
                include: {
                  members: true
                }
              }
            }
          });

          if (project) {
            const memberIds = new Set<string>();
            if (project.primaryBdaId && project.primaryBdaId !== session.userId) {
              memberIds.add(project.primaryBdaId);
            }
            project.conversations.forEach(c => {
              c.members.forEach(m => {
                if (m.userId !== session.userId) {
                  memberIds.add(m.userId);
                }
              });
            });

            for (const recipientId of Array.from(memberIds)) {
              await prisma.notification.create({
                data: {
                  title: `New Project Update: ${project.name}`,
                  message: `${session.name} (${session.roleName}) posted a new work update on "${project.name}": "${body.notes.slice(0, 75)}${body.notes.length > 75 ? '...' : ''}"`,
                  type: "Project",
                  userId: recipientId,
                  linkUrl: `/dashboard/projects/${project.id}`
                }
              });
            }
          }
        } catch (notifErr) {
          console.error("Failed to dispatch project update notifications:", notifErr);
        }
      }

      return NextResponse.json({ success: true, activity });
    }
  } catch (error: any) {
    console.error("Activities POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
