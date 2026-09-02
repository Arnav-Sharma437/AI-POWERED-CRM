"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Printer, Edit, Send, Download, 
  ReceiptText, CheckCircle2, AlertCircle, Clock, 
  Building2, ShieldAlert, Sparkles, Check
} from "lucide-react";
import { useDashboard } from "../../layout";
import AiLoader from "@/components/AiLoader";

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { currentUser, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [markingPaid, setMarkingPaid] = useState(false);

  useEffect(() => {
    async function loadInvoice() {
      if (!currentUser) return;
      if (currentUser.roleName !== "Super Admin") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/invoices/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data.invoice);
        }
      } catch (err) {
        console.error("Failed to load invoice:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id, currentUser]);

  const handleStatusChange = async (newStatus: string) => {
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoice,
          status: newStatus
        })
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data.invoice);
        setTriggerRefresh(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingPaid(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!loading && currentUser?.roleName !== "Super Admin") {
    return (
      <div className="crm-container animate-fade-in" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <ShieldAlert size={48} color="var(--danger-color)" style={{ margin: "0 auto 1rem" }} />
        <h2>Access Restricted</h2>
        <p>Invoices are exclusively accessible by Super Admin.</p>
        <button onClick={() => router.push("/dashboard")} className="crm-btn crm-btn-primary" style={{ marginTop: "1rem" }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading || !invoice) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <AiLoader label="Loading Tax Invoice..." sublabel="Formatting tax itemization and print layout" />
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: invoice.currency || "INR",
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  return (
    <div className="crm-container animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "5rem" }}>
      
      {/* Top Action Bar (Hidden during Print) */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <button 
          onClick={() => router.push("/dashboard/invoices")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "none", color: "var(--primary-color)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {invoice.status !== "Paid" && (
            <button 
              onClick={() => handleStatusChange("Paid")}
              disabled={markingPaid}
              className="crm-btn"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid #10b981", fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <Check size={14} /> Mark as Paid
            </button>
          )}

          <button 
            onClick={() => router.push(`/dashboard/invoices/${id}/edit`)}
            className="crm-btn crm-btn-secondary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Edit size={14} /> Edit
          </button>

          <button 
            onClick={handlePrint}
            className="crm-btn crm-btn-primary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Invoice Document Paper */}
      <div 
        id="printable-invoice"
        style={{
          backgroundColor: "#ffffff",
          color: "#111827",
          padding: "3rem",
          borderRadius: "12px",
          border: "1px solid var(--border-primary)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08)",
          fontFamily: "'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Document Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "2px solid #e5e7eb", paddingBottom: "2rem", marginBottom: "2rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff"
              }}>
                <Sparkles size={20} />
              </div>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.5px", color: "#1f2937" }}>
                NEXUS AI DIGITAL
              </span>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "0.5rem", lineHeight: 1.5 }}>
              Plot 45, Cyber Hub, Phase II<br />
              Gurugram, Haryana - 122002<br />
              GSTIN: <strong>06AAKCT4257D1ZC</strong> | info@nexusai.agency
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#4f46e5", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              TAX INVOICE
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "monospace", color: "#111827", marginTop: "4px" }}>
              {invoice.invoiceNumber}
            </div>
            <div style={{ marginTop: "6px" }}>
              <span style={{
                display: "inline-block",
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: 700,
                textTransform: "uppercase",
                backgroundColor: invoice.status === "Paid" ? "#d1fae5" : invoice.status === "Overdue" ? "#fee2e2" : "#e0e7ff",
                color: invoice.status === "Paid" ? "#065f46" : invoice.status === "Overdue" ? "#991b1b" : "#3730a3"
              }}>
                {invoice.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client Billing & Dates Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", marginBottom: "2.5rem" }}>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#6b7280", marginBottom: "6px", letterSpacing: "0.05em" }}>
              BILLED TO:
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#111827" }}>
              {invoice.client?.company || invoice.client?.name}
            </div>
            {invoice.client?.company && (
              <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>Attn: {invoice.client.name}</div>
            )}
            {invoice.client?.email && (
              <div style={{ fontSize: "0.8125rem", color: "#4b5563" }}>Email: {invoice.client.email}</div>
            )}
            <div style={{ fontSize: "0.8125rem", color: "#4b5563", marginTop: "4px" }}>
              GSTIN: <strong>{invoice.gstin || "N/A"}</strong>
            </div>
            <div style={{ fontSize: "0.8125rem", color: "#4b5563" }}>
              Place of Supply: <strong>{invoice.placeOfSupply}</strong>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.875rem", backgroundColor: "#f9fafb", padding: "1.25rem", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Invoice Date:</span>
              <strong style={{ color: "#111827" }}>
                {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Payment Terms:</span>
              <strong style={{ color: "#111827" }}>{invoice.paymentTerms}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#6b7280" }}>Due Date:</span>
              <strong style={{ color: "#111827" }}>
                {new Date(invoice.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
              </strong>
            </div>
          </div>
        </div>

        {/* Itemized Deliverables Table */}
        <div style={{ marginBottom: "2rem" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb", color: "#374151", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", width: "45%" }}>ITEM & SERVICE DESCRIPTION</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "10%", textAlign: "center" }}>QTY</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "15%", textAlign: "right" }}>RATE</th>
                <th style={{ padding: "0.75rem 0.5rem", width: "15%", textAlign: "center" }}>TAX</th>
                <th style={{ padding: "0.75rem 1rem", width: "15%", textAlign: "right" }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any, idx: number) => (
                <tr key={item.id || idx} style={{ borderBottom: "1px solid #e5e7eb" }}>
                  <td style={{ padding: "1rem" }}>
                    <div style={{ fontWeight: 700, color: "#111827" }}>{item.itemDetails}</div>
                    {item.description && (
                      <div style={{ fontSize: "0.8125rem", color: "#6b7280", marginTop: "3px", lineHeight: 1.4 }}>
                        {item.description}
                      </div>
                    )}
                    {item.sacCode && (
                      <div style={{ fontSize: "0.7rem", color: "#4f46e5", fontWeight: 700, marginTop: "4px" }}>
                        SAC: {item.sacCode}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem 0.5rem", textAlign: "center", color: "#374151" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "1rem 0.5rem", textAlign: "right", color: "#374151", fontFamily: "monospace" }}>
                    {formatCurrency(item.rate)}
                  </td>
                  <td style={{ padding: "1rem 0.5rem", textAlign: "center", color: "#374151", fontSize: "0.8125rem" }}>
                    {item.taxName || `${item.taxRate}%`}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right", fontWeight: 700, color: "#111827", fontFamily: "monospace" }}>
                    {formatCurrency(item.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "2.5rem" }}>
          <div style={{ width: "320px", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563" }}>
              <span>Subtotal:</span>
              <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#111827" }}>
                {formatCurrency(invoice.subtotal)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#4b5563" }}>
              <span>GST Total:</span>
              <span style={{ fontWeight: 600, fontFamily: "monospace", color: "#059669" }}>
                +{formatCurrency(invoice.taxTotal)}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #e5e7eb", paddingTop: "0.75rem", fontSize: "1.15rem", fontWeight: 800, color: "#4f46e5" }}>
              <span>Total Amount:</span>
              <span style={{ fontFamily: "monospace" }}>
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes & Terms Footer */}
        <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", fontSize: "0.75rem", color: "#6b7280" }}>
          <div>
            <strong style={{ color: "#374151", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Customer Notes
            </strong>
            <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {invoice.customerNotes || "Thanks for your business!"}
            </p>
          </div>
          <div>
            <strong style={{ color: "#374151", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
              Terms & Conditions
            </strong>
            <p style={{ margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {invoice.termsAndConditions || "Payment due as per invoice terms."}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
