import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getInvoiceById, updateInvoice, deleteInvoice } from "@/lib/services";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.roleName !== "Super Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id } = await params;
    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      invoice
    });
  } catch (error: any) {
    console.error("Invoice GET by ID error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.roleName !== "Super Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const updated = await updateInvoice(id, body);

    return NextResponse.json({
      success: true,
      invoice: updated
    });
  } catch (error: any) {
    console.error("Invoice PUT error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.roleName !== "Super Admin") {
      return NextResponse.json({ error: "Access denied." }, { status: 403 });
    }

    const { id } = await params;
    await deleteInvoice(id);

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully"
    });
  } catch (error: any) {
    console.error("Invoice DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
