import { NextResponse } from "next/server";
import { checkDbConnection, isDemoMode } from "@/lib/services";
import { mockDb } from "@/lib/mockData";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const q = query.trim().toLowerCase();

    await checkDbConnection();

    if (isDemoMode()) {
      const leads = mockDb.leads.filter(l => 
        !l.isTrashed && (
          l.name.toLowerCase().includes(q) ||
          l.company?.toLowerCase().includes(q) ||
          l.industry?.toLowerCase().includes(q) ||
          l.notes?.toLowerCase().includes(q)
        )
      );

      const clients = mockDb.clients.filter(c => 
        !c.isTrashed && (
          c.name.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.industry?.toLowerCase().includes(q)
        )
      );

      const projects = mockDb.projects.filter(p => 
        !p.isTrashed && (
          p.name.toLowerCase().includes(q) ||
          p.notes?.toLowerCase().includes(q)
        )
      );

      return NextResponse.json({
        success: true,
        results: { leads, clients, projects }
      });
    } else {
      const leads = await prisma.lead.findMany({
        where: {
          isTrashed: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      });

      const clients = await prisma.client.findMany({
        where: {
          isTrashed: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { industry: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      });

      const projects = await prisma.project.findMany({
        where: {
          isTrashed: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { notes: { contains: query, mode: "insensitive" } }
          ]
        },
        take: 5
      });

      return NextResponse.json({
        success: true,
        results: { leads, clients, projects }
      });
    }
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
