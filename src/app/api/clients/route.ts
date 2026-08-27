import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { isDemoMode, listClients } from "@/lib/services";
import { mockDb } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const clients = await listClients();
    return NextResponse.json({ success: true, clients });
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    
    // Quick Add Client creates client from scratch (no lead)
    if (isDemoMode()) {
      const client = {
        id: `c-${Date.now()}`,
        name: body.name,
        email: body.email,
        company: body.company,
        phone: body.phone,
        website: body.website,
        isTrashed: false,
        createdAt: new Date()
      };
      mockDb.clients.push(client);
      
      mockDb.activities.push({
        id: `act-${Date.now()}`,
        timestamp: new Date(),
        userId: session.userId,
        type: "System",
        notes: `Created client: ${body.name} (${body.company})`,
        clientId: client.id
      });
      
      return NextResponse.json({ success: true, client });
    } else {
      // Connect database client creation (represented as lead-less client)
      const { prisma } = await import("@/lib/db");
      const client = await prisma.client.create({
        data: {
          name: body.name,
          email: body.email,
          company: body.company,
          phone: body.phone,
          website: body.website,
          activities: {
            create: {
              userId: session.userId,
              type: "System",
              notes: `Created client account manually.`
            }
          }
        }
      });
      return NextResponse.json({ success: true, client });
    }
  } catch (error: any) {
    console.error("Clients POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
