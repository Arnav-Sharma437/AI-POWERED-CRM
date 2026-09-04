"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Printer, Edit, Send, Download, 
  ReceiptText, CheckCircle2, AlertCircle, Clock, 
  Building2, ShieldAlert, Sparkles, Check, Mail, Loader2
} from "lucide-react";
import { useDashboard } from "../../layout";
import AiLoader from "@/components/AiLoader";

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  CAD: "CA$",
  AUD: "AU$"
};

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { currentUser, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Email dispatch modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [nameTo, setNameTo] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessMessage, setEmailSuccessMessage] = useState("");

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
          setEmailTo(data.invoice?.customerEmail || data.invoice?.client?.email || "");
          setNameTo(data.invoice?.customerName || data.invoice?.client?.name || data.invoice?.client?.company || "");
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

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const element = document.getElementById("printable-invoice");
      if (!element) return;

      const html2pdf = (await import("html2pdf.js")).default;
      const opt: any = {
        margin: [5, 5, 5, 5],
        filename: `${invoice.invoiceNumber || "Invoice"}.pdf`,
        image: { type: "jpeg", quality: 0.99 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      window.print();
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) {
      alert("Please enter a valid recipient email address.");
      return;
    }

    setSendingEmail(true);
    setEmailSuccessMessage("");
    try {
      const res = await fetch(`/api/invoices/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEmail: emailTo,
          targetName: nameTo
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to dispatch email");

      setEmailSuccessMessage(`Invoice successfully dispatched to ${emailTo}!`);
      setTimeout(() => {
        setShowEmailModal(false);
        setEmailSuccessMessage("");
      }, 2500);

      if (invoice.status === "Draft") {
        handleStatusChange("Sent");
      }
    } catch (err: any) {
      alert(err.message || "Failed to send invoice email");
    } finally {
      setSendingEmail(false);
    }
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

  const currSymbol = CURRENCY_SYMBOLS[invoice.currency || "INR"] || "₹";

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const clientDisplayName = invoice.customerName || invoice.client?.company || invoice.client?.name || "TECHPHOSIS PRIVATE LIMITED";

  const isWithoutGst = (invoice.taxTotal === 0 && (parseFloat(invoice.subtotal) || 0) > 0) ||
    invoice.gstTreatment?.toLowerCase().includes("without gst") ||
    invoice.gstTreatment?.toLowerCase().includes("non-gst") ||
    (invoice.items && invoice.items.length > 0 && invoice.items.every((it: any) => !it.taxRate || it.taxRate === 0));

  return (
    <div className="crm-container animate-fade-in" style={{ maxWidth: "1050px", margin: "0 auto", paddingBottom: "5rem" }}>
      
      {/* Top Action Bar */}
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <button 
          onClick={() => router.push("/dashboard/invoices")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "none", color: "var(--primary-color)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          {isWithoutGst && (
            <span style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border-primary)", padding: "0.35rem 0.65rem", borderRadius: "6px" }}>
              📄 Without GST Invoice
            </span>
          )}

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
            onClick={() => setShowEmailModal(true)}
            className="crm-btn"
            style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", border: "1px solid var(--primary-color)", fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Mail size={14} /> Send Email
          </button>

          <button 
            onClick={() => router.push(`/dashboard/invoices/${id}/edit`)}
            className="crm-btn crm-btn-secondary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Edit size={14} /> Edit
          </button>

          <button 
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="crm-btn crm-btn-primary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            {downloadingPdf ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Generating PDF...
              </>
            ) : (
              <>
                <Download size={14} /> Download PDF
              </>
            )}
          </button>

          <button 
            onClick={() => window.print()}
            className="crm-btn crm-btn-secondary"
            style={{ fontSize: "0.8125rem", padding: "0.45rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Printer size={14} /> Print
          </button>
        </div>
      </div>

      {/* Clean Zoho Architecture Tax / Commercial Invoice Paper */}
      <div 
        id="printable-invoice"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          padding: "3.5rem 3.5rem 2.5rem",
          border: "1px solid #d1d5db",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
          fontSize: "13px",
          lineHeight: 1.4,
          position: "relative"
        }}
      >
        
        {/* Header: Logo & Company Address on Left, Invoice Title on Right */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
            {/* Pixxelu Logo / Brand Name */}
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, letterSpacing: "2px", color: "#000000", textTransform: "uppercase", lineHeight: 1 }}>
                PIXXELU
              </div>
              <div style={{ fontSize: "0.6rem", letterSpacing: "3px", color: "#6b7280", textTransform: "uppercase", marginTop: "2px" }}>
                DIGITAL TECHNOLOGY
              </div>
            </div>

            {/* Company Info */}
            <div style={{ fontSize: "12px", color: "#111827", lineHeight: 1.35 }}>
              <div style={{ fontWeight: 800, fontSize: "14px", color: "#000000", marginBottom: "3px" }}>
                {invoice.companyName || "Pixxelu Digital Technology"}
              </div>
              <div style={{ whiteSpace: "pre-line", color: "#374151" }}>
                {invoice.companyAddress || "Building no 256, Dharamshala\nkangra Himachal Pradesh 176215\nIndia"}
              </div>
              <div style={{ marginTop: "3px", color: "#374151" }}>
                {invoice.companyPhone || "9218000707"}
              </div>
              <div style={{ color: "#374151" }}>
                {invoice.companyEmail || "rakeshrinku16@gmail.com"}
              </div>
              <div style={{ color: "#374151" }}>
                {invoice.companyWebsite || "www.pixxelu.com"}
              </div>
              <div style={{ fontWeight: 700, marginTop: "2px", color: "#000000" }}>
                GSTIN: {invoice.companyGstin || "02ABBFP9262H1ZA"}
              </div>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1f2937", letterSpacing: "0.02em", textTransform: "uppercase" }}>
              {isWithoutGst ? "INVOICE" : "TAX INVOICE"}
            </div>
            {isWithoutGst && (
              <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                COMMERCIAL BILL
              </div>
            )}
          </div>
        </div>

        {/* Invoice Metadata Box (2-column bordered table matching Zoho) */}
        <div style={{ border: "1px solid #9ca3af", marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
            
            {/* Left Col: Invoice#, Dates & Terms */}
            <div style={{ padding: "0.6rem 0.85rem", borderRight: "1px solid #9ca3af", fontSize: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "110px", color: "#374151", padding: "2px 0", fontWeight: 400 }}>#</td>
                    <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#374151", padding: "2px 0", fontWeight: 400 }}>Invoice Date</td>
                    <td style={{ fontWeight: 400, color: "#000000" }}>: {new Date(invoice.invoiceDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#374151", padding: "2px 0", fontWeight: 400 }}>Terms</td>
                    <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.paymentTerms}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#374151", padding: "2px 0", fontWeight: 400 }}>Due Date</td>
                    <td style={{ fontWeight: 400, color: "#000000" }}>: {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Right Col: Place of Supply */}
            <div style={{ padding: "0.6rem 0.85rem", fontSize: "12px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "120px", color: "#374151", padding: "2px 0", fontWeight: 400 }}>Place Of Supply</td>
                    <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.placeOfSupply || "Haryana (06)"}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>

        {/* Customer Address Details (TECHPHOSIS PRIVATE LIMITED) */}
        <div style={{ marginBottom: "1.75rem", fontSize: "12px", lineHeight: 1.4 }}>
          <div style={{ fontWeight: 400, fontSize: "13px", color: "#000000", textTransform: "uppercase", marginBottom: "3px" }}>
            {clientDisplayName}
          </div>
          {invoice.customerAddress ? (
            <div style={{ whiteSpace: "pre-line", color: "#374151" }}>
              {invoice.customerAddress}
            </div>
          ) : (
            <div style={{ color: "#374151" }}>
              {invoice.client?.company ? `${invoice.client.company}\n` : ""}
              {invoice.customerEmail || invoice.client?.email || ""}
            </div>
          )}
          {invoice.gstin && (
            <div style={{ fontWeight: 400, color: "#000000", marginTop: "4px" }}>
              GSTIN {invoice.gstin}
            </div>
          )}
        </div>

        {/* Items Table (Bordered, exact Zoho structure) */}
        <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #9ca3af", marginBottom: "0", fontSize: "12px" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #9ca3af", textAlign: "left" }}>
              <th style={{ padding: "8px 10px", width: "5%", borderRight: "1px solid #9ca3af", textAlign: "center", fontWeight: 400, color: "#000000" }}>#</th>
              <th style={{ padding: "8px 12px", width: isWithoutGst ? "55%" : "45%", borderRight: "1px solid #9ca3af", fontWeight: 400, color: "#000000" }}>Description</th>
              <th style={{ padding: "8px 10px", width: "10%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400, color: "#000000" }}>Qty</th>
              <th style={{ padding: "8px 10px", width: isWithoutGst ? "15%" : "15%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400, color: "#000000" }}>Rate</th>
              {!isWithoutGst && (
                <th style={{ padding: "8px 10px", width: "12%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400, color: "#000000" }}>IGST</th>
              )}
              <th style={{ padding: "8px 12px", width: isWithoutGst ? "15%" : "13%", textAlign: "right", fontWeight: 400, color: "#000000" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item: any, idx: number) => {
              const lineTax = ((parseFloat(item.amount) || 0) * (parseFloat(item.taxRate) || 18)) / 100;
              return (
                <tr key={item.id || idx} style={{ borderBottom: "1px solid #9ca3af", verticalAlign: "top" }}>
                  <td style={{ padding: "10px", borderRight: "1px solid #9ca3af", textAlign: "center", fontWeight: 400 }}>
                    {idx + 1}
                  </td>
                  <td style={{ padding: "10px 12px", borderRight: "1px solid #9ca3af" }}>
                    <div style={{ fontWeight: 400, color: "#000000" }}>{item.itemDetails}</div>
                    {item.description && (
                      <div style={{ fontSize: "11px", color: "#4b5563", marginTop: "4px", whiteSpace: "pre-line", lineHeight: 1.35 }}>
                        {item.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                    {formatNumber(item.quantity)}
                  </td>
                  <td style={{ padding: "10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                    {formatNumber(item.rate)}
                  </td>
                  {!isWithoutGst && (
                    <td style={{ padding: "10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                      {formatNumber(lineTax)}
                    </td>
                  )}
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 400 }}>
                    {formatNumber(item.amount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Lower Grid: Notes & Bank on Left, Totals & Signatory on Right */}
        <div style={{ border: "1px solid #9ca3af", borderTop: "none", display: "grid", gridTemplateColumns: "1.4fr 1fr", fontSize: "12px" }}>
          
          {/* Left Column */}
          <div style={{ padding: "1rem", borderRight: "1px solid #9ca3af" }}>
            
            {/* Total In Words */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 400 }}>Total In Words</div>
              <div style={{ fontWeight: 400, fontStyle: "italic", color: "#000000", marginTop: "2px" }}>
                {invoice.totalInWords || "Indian Rupee Seventeen Thousand Seven Hundred Only"}
              </div>
            </div>

            {/* This invoice includes bullet points */}
            <div style={{ marginBottom: "1rem", fontSize: "11px", color: "#374151" }}>
              <div style={{ fontWeight: 400, color: "#000000", marginBottom: "4px" }}>This invoice includes:</div>
              <div style={{ whiteSpace: "pre-line", lineHeight: 1.4 }}>
                {invoice.invoiceIncludes || "• Remaining payment for the original approved project.\n• Additional charges for the expanded scope of work requested during project execution."}
              </div>
            </div>

            {/* Thank you note */}
            <div style={{ marginBottom: "1rem", fontWeight: 400, color: "#111827" }}>
              {invoice.customerNotes || "Thank you for your business."}
            </div>

            {/* Bank details */}
            <div style={{ fontSize: "11.5px", lineHeight: 1.4, borderTop: "1px dashed #d1d5db", paddingTop: "0.75rem" }}>
              <div><strong>Bank Name :</strong> {invoice.bankName || "Bank of Baroda"}</div>
              <div><strong>Account Number :</strong> <span style={{ fontWeight: 400 }}>{invoice.accountNumber || "10520200000277"}</span></div>
              <div><strong>IFSC Code :</strong> <span style={{ fontWeight: 400 }}>{invoice.ifscCode || "BARB0DHAKAN"}</span></div>
              <div><strong>Pan Card :</strong> <span style={{ fontWeight: 400 }}>{invoice.companyPan || "ABBFP9262H"}</span></div>
            </div>

          </div>

          {/* Right Column: Totals & Signature */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            
            {/* Totals Table */}
            <div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 12px", color: "#374151", fontWeight: 400, textAlign: "right" }}>Sub Total</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 400 }}>
                      {formatNumber(invoice.subtotal)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #9ca3af" }}>
                    <td style={{ padding: "8px 12px", color: "#374151", fontWeight: 400, textAlign: "right" }}>Total</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 400, color: "#000000" }}>
                      {currSymbol}{formatNumber(invoice.totalAmount)}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #9ca3af", backgroundColor: "#f9fafb" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 400, textAlign: "right", color: "#000000" }}>Balance Due</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 400, color: "#000000", fontSize: "13px" }}>
                      {currSymbol}{formatNumber(invoice.totalAmount)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Signature Area */}
            <div style={{ padding: "1rem 1.25rem 0.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "11px", color: "#374151", fontStyle: "italic", marginBottom: "4px" }}>
                For {invoice.companyName || "Pixxelu Digital Technology"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "4px 0" }}>
                <img 
                  src="/signature.png" 
                  alt="Authorized Signature" 
                  style={{ maxHeight: "65px", maxWidth: "180px", objectFit: "contain", display: "block" }} 
                />
              </div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#000000", marginTop: "2px" }}>
                Partner
              </div>
            </div>

          </div>

        </div>

        {/* Footer Credit & Page Number */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1rem", fontSize: "11px", color: "#6b7280" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 auto" }}>
            <span>Crafted with ease using</span>
            <strong style={{ color: "#2563eb" }}>Pixxelu Invoice</strong>
            <span>• Visit www.pixxelu.com to create professional invoices</span>
          </div>
          <div style={{ position: "absolute", right: "3.5rem", bottom: "1.5rem", fontSize: "10px" }}>
            1
          </div>
        </div>

      </div>

      {/* Dispatch Email Modal */}
      {showEmailModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1rem"
        }}>
          <div className="crm-card animate-scale-up" style={{ maxWidth: "500px", width: "100%", padding: "1.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={20} color="var(--primary-color)" />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                  Send Invoice via Email
                </h3>
              </div>
              <button 
                onClick={() => setShowEmailModal(false)}
                style={{ border: "none", background: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-tertiary)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendEmail} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Recipient Email Address*
                </label>
                <input 
                  type="email" 
                  className="crm-input" 
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="e.g. client@company.com"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                  Recipient / Company Name
                </label>
                <input 
                  type="text" 
                  className="crm-input" 
                  value={nameTo}
                  onChange={(e) => setNameTo(e.target.value)}
                  placeholder="e.g. TECHPHOSIS PRIVATE LIMITED"
                />
              </div>

              <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                This will dispatch a branded HTML Tax Invoice email with deliverable breakdown, totals, and direct online view link to the specified email address.
              </div>

              {emailSuccessMessage && (
                <div style={{ padding: "0.75rem", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", borderRadius: "8px", fontSize: "0.8125rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <CheckCircle2 size={16} /> {emailSuccessMessage}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => setShowEmailModal(false)}
                  className="crm-btn crm-btn-secondary"
                  disabled={sendingEmail}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="crm-btn crm-btn-primary"
                  disabled={sendingEmail}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                >
                  {sendingEmail ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  {sendingEmail ? "Dispatching..." : "Send Invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
