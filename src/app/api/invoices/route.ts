import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { listInvoices, createInvoice } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strictly restrict to Super Admin
    if (session.roleName !== "Super Admin") {
      return NextResponse.json({ error: "Access denied. Invoices are strictly restricted to Super Admin." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const clientId = searchParams.get("clientId") || undefined;
    const search = searchParams.get("search") || undefined;

    const invoices = await listInvoices({ status, clientId, search });

    // Calculate invoice stats
    const totalInvoiced = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const paidAmount = invoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const pendingAmount = invoices.filter(i => i.status === "Sent" || i.status === "Draft").reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const overdueAmount = invoices.filter(i => i.status === "Overdue" || (new Date(i.dueDate).getTime() < Date.now() && i.status !== "Paid")).reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    return NextResponse.json({
      success: true,
      invoices,
      stats: {
        totalCount: invoices.length,
        totalInvoiced,
        paidAmount,
        pendingAmount,
        overdueAmount
      }
    });
  } catch (error: any) {
    console.error("Invoices GET API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.roleName !== "Super Admin") {
      return NextResponse.json({ error: "Access denied. Only Super Admin can create invoices." }, { status: 403 });
    }

    const body = await request.json();
    if (!body.clientId) {
      return NextResponse.json({ error: "Customer selection is required." }, { status: 400 });
    }

    const invoice = await createInvoice(body, session.userId);

    return NextResponse.json({
      success: true,
      invoice
    });
  } catch (error: any) {
    console.error("Invoices POST API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
