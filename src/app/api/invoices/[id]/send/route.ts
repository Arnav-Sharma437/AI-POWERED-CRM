import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getInvoiceById } from "@/lib/services";
import { sendInvoiceEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(
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
    const { targetEmail, targetName } = body;

    const invoice = await getInvoiceById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const emailToSend = targetEmail || invoice.customerEmail || invoice.client?.email;
    const nameToSend = targetName || invoice.customerName || invoice.client?.name || invoice.client?.company || "Valued Client";

    if (!emailToSend) {
      return NextResponse.json({ error: "No recipient email provided for this invoice." }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const invoiceUrl = `${appUrl}/dashboard/invoices/${invoice.id}`;

    await sendInvoiceEmail({
      recipientEmail: emailToSend,
      recipientName: nameToSend,
      invoiceNumber: invoice.invoiceNumber,
      totalAmount: invoice.totalAmount,
      currency: invoice.currency,
      dueDate: invoice.dueDate,
      items: invoice.items || [],
      invoiceUrl,
      companyName: invoice.companyName || "Pixxelu Digital Technology",
      companyEmail: invoice.companyEmail || "rakeshrinku16@gmail.com",
      notes: invoice.customerNotes
    });

    return NextResponse.json({
      success: true,
      message: `Invoice email successfully dispatched to ${emailToSend}!`
    });
  } catch (error: any) {
    console.error("Send Invoice API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
