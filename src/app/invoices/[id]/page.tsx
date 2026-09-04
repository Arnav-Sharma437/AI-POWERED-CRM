"use client";

import React, { useEffect, useState, use } from "react";
import { 
  Printer, Download, ReceiptText, CheckCircle2, 
  Clock, Building2, Loader2, FileCheck
} from "lucide-react";
import AiLoader from "@/components/AiLoader";
import { INVOICE_CURRENCIES } from "@/lib/invoiceUtils";

export default function PublicInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await fetch(`/api/invoices/public/${id}`);
        if (res.ok) {
          const data = await res.json();
          setInvoice(data.invoice);
        } else {
          setErrorMessage("Invoice not found or link has expired.");
        }
      } catch (err: any) {
        console.error("Failed to load invoice:", err);
        setErrorMessage("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id]);

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const element = document.getElementById("printable-invoice");
      if (!element) return;

      const html2pdf = (await import("html2pdf.js")).default;
      const opt: any = {
        margin: [5, 5, 5, 5],
        filename: `${invoice.invoiceNumber || "Tax_Invoice"}.pdf`,
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <AiLoader label="Loading Tax Invoice..." sublabel="Formatting tax itemization and verification" />
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", backgroundColor: "#f8fafc", fontFamily: "sans-serif" }}>
        <ReceiptText size={56} color="#94a3b8" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.5rem" }}>Invoice Not Available</h2>
        <p style={{ color: "#64748b", margin: 0 }}>{errorMessage || "The requested invoice could not be found."}</p>
      </div>
    );
  }

  const currObj = INVOICE_CURRENCIES.find(c => c.code === invoice.currency) || INVOICE_CURRENCIES[0];
  const currSymbol = currObj.symbol;

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat(currObj.locale || "en-US", {
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
    <div style={{ minHeight: "100vh", backgroundColor: "#f1f5f9", padding: "2rem 1rem", fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* Top Floating Action Bar */}
        <div className="no-print" style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "1.5rem", 
          backgroundColor: "#ffffff", 
          padding: "0.85rem 1.25rem", 
          borderRadius: "10px", 
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
          flexWrap: "wrap",
          gap: "1rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ 
              width: "36px", 
              height: "36px", 
              borderRadius: "8px", 
              backgroundColor: "#eff6ff", 
              color: "#2563eb", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              fontWeight: 800
            }}>
              <FileCheck size={20} />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                {isWithoutGst ? "Official Commercial Invoice" : "Official Tax Invoice"} #{invoice.invoiceNumber}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Issued by {invoice.companyName || "Pixxelu Digital Technology"}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button 
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              {downloadingPdf ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Downloading PDF...
                </>
              ) : (
                <>
                  <Download size={15} /> Download PDF
                </>
              )}
            </button>

            <button 
              onClick={() => window.print()}
              style={{
                backgroundColor: "#f8fafc",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                padding: "0.5rem 1rem",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem"
              }}
            >
              <Printer size={15} /> Print
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
            borderRadius: "4px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
            fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif",
            fontSize: "13px",
            lineHeight: 1.4,
            position: "relative"
          }}
        >
          
          {/* Header: Logo & Company Address on Left, Invoice Title on Right */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem" }}>
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
              {/* Pixxelu Logo / Brand Name */}
              <div>
                <img 
                  src="/pixxelu-logo.png" 
                  alt="Pixxelu" 
                  style={{ height: "36px", objectFit: "contain", display: "block" }} 
                />
                <div style={{ fontSize: "8.5px", letterSpacing: "1.5px", color: "#6b7280", textTransform: "uppercase", marginTop: "3px", fontWeight: 600 }}>
                  DIGITAL TECHNOLOGY
                </div>
              </div>

              {/* Company Info */}
              <div style={{ fontSize: "11px", color: "#111827", lineHeight: 1.35 }}>
                <div style={{ fontWeight: 700, fontSize: "13px", color: "#000000", marginBottom: "2px" }}>
                  {invoice.companyName || "Pixxelu Digital Technology"}
                </div>
                <div style={{ whiteSpace: "pre-line", color: "#374151" }}>
                  {invoice.companyAddress || "Building no 256, Dharamshala\nkangra Himachal Pradesh 176215\nIndia"}
                </div>
                <div style={{ marginTop: "2px", color: "#374151" }}>
                  {invoice.companyPhone || "9218000707"}
                </div>
                <div style={{ color: "#374151" }}>
                  {invoice.companyEmail || "rakeshrinku16@gmail.com"}
                </div>
                <div style={{ color: "#374151" }}>
                  {invoice.companyWebsite || "www.pixxelu.com"}
                </div>
                <div style={{ fontWeight: 600, marginTop: "2px", color: "#000000" }}>
                  GSTIN: {invoice.companyGstin || "02ABBFP9262H1ZA"}
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#1f2937", letterSpacing: "0.02em", textTransform: "uppercase" }}>
                {isWithoutGst ? "INVOICE" : "TAX INVOICE"}
              </div>
              {isWithoutGst && (
                <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "1px" }}>
                  COMMERCIAL BILL
                </div>
              )}
            </div>
          </div>

          {/* Invoice Metadata Box (2-column bordered table matching Zoho) */}
          <div style={{ border: "1px solid #9ca3af", marginBottom: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr" }}>
              
              {/* Left Col: Invoice#, Dates & Terms */}
              <div style={{ padding: "0.5rem 0.75rem", borderRight: "1px solid #9ca3af", fontSize: "11px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "100px", color: "#4b5563", padding: "1.5px 0", fontWeight: 400 }}>#</td>
                      <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.invoiceNumber}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#4b5563", padding: "1.5px 0", fontWeight: 400 }}>Invoice Date</td>
                      <td style={{ fontWeight: 400, color: "#000000" }}>: {new Date(invoice.invoiceDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#4b5563", padding: "1.5px 0", fontWeight: 400 }}>Terms</td>
                      <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.paymentTerms}</td>
                    </tr>
                    <tr>
                      <td style={{ color: "#4b5563", padding: "1.5px 0", fontWeight: 400 }}>Due Date</td>
                      <td style={{ fontWeight: 400, color: "#000000" }}>: {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Right Col: Place of Supply */}
              <div style={{ padding: "0.5rem 0.75rem", fontSize: "11px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "110px", color: "#4b5563", padding: "1.5px 0", fontWeight: 400 }}>Place Of Supply</td>
                      <td style={{ fontWeight: 400, color: "#000000" }}>: {invoice.placeOfSupply || "Haryana (06)"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>

          {/* Customer Address Details (TECHPHOSIS PRIVATE LIMITED) */}
          <div style={{ marginBottom: "1.5rem", fontSize: "11px", lineHeight: 1.35 }}>
            <div style={{ fontWeight: 600, fontSize: "12px", color: "#000000", textTransform: "uppercase", marginBottom: "2px" }}>
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
              <div style={{ fontWeight: 400, color: "#000000", marginTop: "3px" }}>
                {isWithoutGst || (invoice.currency && invoice.currency !== "INR") ? `Tax ID / Reg No: ${invoice.gstin}` : `GSTIN: ${invoice.gstin}`}
              </div>
            )}
          </div>

          {/* Items Table (Bordered, exact Zoho structure with BOLD Headers) */}
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #9ca3af", marginBottom: "0", fontSize: "11px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #9ca3af", textAlign: "left" }}>
                <th style={{ padding: "7px 10px", width: "5%", borderRight: "1px solid #9ca3af", textAlign: "center", fontWeight: 700, color: "#000000" }}>#</th>
                <th style={{ padding: "7px 12px", width: isWithoutGst ? "55%" : "45%", borderRight: "1px solid #9ca3af", fontWeight: 700, color: "#000000" }}>Description</th>
                <th style={{ padding: "7px 10px", width: "10%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 700, color: "#000000" }}>Qty</th>
                <th style={{ padding: "7px 10px", width: isWithoutGst ? "15%" : "15%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 700, color: "#000000" }}>Rate ({currSymbol})</th>
                {!isWithoutGst && (
                  <th style={{ padding: "7px 10px", width: "12%", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 700, color: "#000000" }}>IGST</th>
                )}
                <th style={{ padding: "7px 12px", width: isWithoutGst ? "15%" : "13%", textAlign: "right", fontWeight: 700, color: "#000000" }}>Amount ({currSymbol})</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item: any, idx: number) => {
                const lineTax = ((parseFloat(item.amount) || 0) * (parseFloat(item.taxRate) || 18)) / 100;
                return (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid #9ca3af", verticalAlign: "top" }}>
                    <td style={{ padding: "8px 10px", borderRight: "1px solid #9ca3af", textAlign: "center", fontWeight: 400 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "8px 12px", borderRight: "1px solid #9ca3af" }}>
                      <div style={{ fontWeight: 400, color: "#000000" }}>{item.itemDetails}</div>
                      {item.description && (
                        <div style={{ fontSize: "10.5px", color: "#4b5563", marginTop: "3px", whiteSpace: "pre-line", lineHeight: 1.35 }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "8px 10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                      {formatNumber(item.quantity)}
                    </td>
                    <td style={{ padding: "8px 10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                      {formatNumber(item.rate)}
                    </td>
                    {!isWithoutGst && (
                      <td style={{ padding: "8px 10px", borderRight: "1px solid #9ca3af", textAlign: "right", fontWeight: 400 }}>
                        {formatNumber(lineTax)}
                      </td>
                    )}
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 400 }}>
                      {formatNumber(item.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Lower Grid: Notes & Bank on Left, Totals & Signatory on Right */}
          <div style={{ border: "1px solid #9ca3af", borderTop: "none", display: "grid", gridTemplateColumns: "1.4fr 1fr", fontSize: "11px" }}>
            
            {/* Left Column */}
            <div style={{ padding: "0.85rem", borderRight: "1px solid #9ca3af" }}>
              
              {/* Total In Words */}
              <div style={{ marginBottom: "0.85rem" }}>
                <div style={{ fontSize: "10.5px", color: "#6b7280", fontWeight: 400 }}>Total In Words</div>
                <div style={{ fontWeight: 400, fontStyle: "italic", color: "#000000", marginTop: "1px" }}>
                  {invoice.totalInWords || "Indian Rupee Seventeen Thousand Seven Hundred Only"}
                </div>
              </div>

              {/* This invoice includes bullet points */}
              <div style={{ marginBottom: "0.85rem", fontSize: "10.5px", color: "#374151" }}>
                <div style={{ fontWeight: 400, color: "#000000", marginBottom: "3px" }}>This invoice includes:</div>
                <div style={{ whiteSpace: "pre-line", lineHeight: 1.35 }}>
                  {invoice.invoiceIncludes || "• Remaining payment for the original approved project.\n• Additional charges for the expanded scope of work requested during project execution."}
                </div>
              </div>

              {/* Thank you note */}
              <div style={{ marginBottom: "0.85rem", fontWeight: 400, color: "#111827" }}>
                {invoice.customerNotes || "Thank you for your business."}
              </div>

              {/* Bank details */}
              <div style={{ fontSize: "11px", lineHeight: 1.4, borderTop: "1px dashed #d1d5db", paddingTop: "0.65rem" }}>
                <div><strong>Bank Name :</strong> {invoice.bankName || "Bank of Baroda"}</div>
                <div><strong>Account Number :</strong> <span style={{ fontWeight: 400 }}>{invoice.accountNumber || "10520200000277"}</span></div>
                {invoice.ifscCode && <div><strong>IFSC Code :</strong> <span style={{ fontWeight: 400 }}>{invoice.ifscCode}</span></div>}
                {invoice.swiftCode && <div><strong>SWIFT / BIC Code :</strong> <span style={{ fontWeight: 400 }}>{invoice.swiftCode}</span></div>}
                {invoice.companyPan && <div><strong>PAN :</strong> <span style={{ fontWeight: 400 }}>{invoice.companyPan}</span></div>}
              </div>

            </div>

            {/* Right Column: Totals & Signature */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              
              {/* Totals Table */}
              <div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "7px 12px", color: "#4b5563", fontWeight: 400, textAlign: "right" }}>Sub Total</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 400 }}>
                        {formatNumber(invoice.subtotal)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #9ca3af" }}>
                      <td style={{ padding: "7px 12px", color: "#4b5563", fontWeight: 400, textAlign: "right" }}>Total</td>
                      <td style={{ padding: "7px 12px", textAlign: "right", fontWeight: 400, color: "#000000" }}>
                        {currSymbol}{formatNumber(invoice.totalAmount)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid #9ca3af", backgroundColor: "#f9fafb" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, textAlign: "right", color: "#000000" }}>Balance Due</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: "#000000", fontSize: "12px" }}>
                        {currSymbol}{formatNumber(invoice.totalAmount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Area (Clean Stamp without duplicate text) */}
              <div style={{ padding: "0.75rem 1rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100px" }}>
                <img 
                  src="/signature.png" 
                  alt="Authorized Signature & Stamp" 
                  style={{ maxHeight: "85px", maxWidth: "210px", objectFit: "contain", display: "block" }} 
                />
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

      </div>
    </div>
  );
}