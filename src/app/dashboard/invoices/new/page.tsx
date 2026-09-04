"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Plus, Trash2, Search, ArrowLeft, 
  Settings, Send, Check, ShieldAlert,
  Building2, CreditCard, ChevronDown
} from "lucide-react";
import { useDashboard } from "../../layout";
import AiLoader from "@/components/AiLoader";

const INDIAN_STATES = [
  "Haryana (06)",
  "Delhi (07)",
  "Punjab (03)",
  "Himachal Pradesh (02)",
  "Chandigarh (04)",
  "Uttar Pradesh (09)",
  "Rajasthan (08)",
  "Maharashtra (27)",
  "Karnataka (29)",
  "Tamil Nadu (33)",
  "Telangana (36)",
  "Gujarat (24)",
  "West Bengal (19)",
  "Uttarakhand (05)",
  "Bihar (10)",
  "Madhya Pradesh (23)",
  "Kerala (32)",
  "Andhra Pradesh (37)",
  "Odisha (21)",
  "Overseas / Non-Resident (96)"
];

const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "INR (₹) - Indian Rupee" },
  { code: "USD", symbol: "$", label: "USD ($) - US Dollar" },
  { code: "EUR", symbol: "€", label: "EUR (€) - Euro" },
  { code: "GBP", symbol: "£", label: "GBP (£) - British Pound" },
  { code: "AED", symbol: "AED", label: "AED (د.إ) - UAE Dirham" },
  { code: "CAD", symbol: "CA$", label: "CAD ($) - Canadian Dollar" },
  { code: "AUD", symbol: "AU$", label: "AUD ($) - Australian Dollar" }
];

const TAX_RATES = [
  { label: "IGST18 [18%]", rate: 18, name: "IGST18 [18%]" },
  { label: "CGST9 + SGST9 [18%]", rate: 18, name: "CGST9 + SGST9 [18%]" },
  { label: "IGST12 [12%]", rate: 12, name: "IGST12 [12%]" },
  { label: "CGST6 + SGST6 [12%]", rate: 12, name: "CGST6 + SGST6 [12%]" },
  { label: "IGST5 [5%]", rate: 5, name: "IGST5 [5%]" },
  { label: "CGST2.5 + SGST2.5 [5%]", rate: 5, name: "CGST2.5 + SGST2.5 [5%]" },
  { label: "Non-Taxable [0%]", rate: 0, name: "Non-Taxable [0%]" }
];

function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return "Zero Rupees Only";

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(num: number): string {
    const numStr = num.toString();
    if (numStr.length > 9) return numStr;
    const n = ('000000000' + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    const c1 = parseInt(n[1], 10);
    const c2 = parseInt(n[2], 10);
    const c3 = parseInt(n[3], 10);
    const c4 = parseInt(n[4], 10);
    const c5 = parseInt(n[5], 10);

    str += (c1 !== 0) ? (a[c1] || b[parseInt(n[1][0], 10)] + ' ' + a[parseInt(n[1][1], 10)]) + ' Crore ' : '';
    str += (c2 !== 0) ? (a[c2] || b[parseInt(n[2][0], 10)] + ' ' + a[parseInt(n[2][1], 10)]) + ' Lakh ' : '';
    str += (c3 !== 0) ? (a[c3] || b[parseInt(n[3][0], 10)] + ' ' + a[parseInt(n[3][1], 10)]) + ' Thousand ' : '';
    str += (c4 !== 0) ? (a[c4] || b[parseInt(n[4][0], 10)] + ' ' + a[parseInt(n[4][1], 10)]) + ' Hundred ' : '';
    str += (c5 !== 0) ? ((str !== '') ? 'and ' : '') + (a[c5] || b[parseInt(n[5][0], 10)] + ' ' + a[parseInt(n[5][1], 10)]) : '';
    return str.trim();
  }

  return `Indian Rupee ${inWords(rounded)} Only`;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const { currentUser, clientsList, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Invoice Type: GST vs Non-GST (Without GST)
  const [invoiceType, setInvoiceType] = useState<"GST" | "NON_GST">("GST");

  // Company / Issuer Info (Defaults matching Zoho screenshot)
  const [companyName, setCompanyName] = useState("Pixxelu Digital Technology");
  const [companyAddress, setCompanyAddress] = useState("Building no 256, Dharamshala\nkangra Himachal Pradesh 176215\nIndia");
  const [companyPhone, setCompanyPhone] = useState("9218000707");
  const [companyEmail, setCompanyEmail] = useState("rakeshrinku16@gmail.com");
  const [companyWebsite, setCompanyWebsite] = useState("www.pixxelu.com");
  const [companyGstin, setCompanyGstin] = useState("02ABBFP9262H1ZA");
  const [companyPan, setCompanyPan] = useState("ABBFP9262H");

  // Customer / Recipient State
  const [customerMode, setCustomerMode] = useState<"existing" | "custom">("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("TECHPHOSIS PRIVATE LIMITED");
  const [customCustomerEmail, setCustomCustomerEmail] = useState("");
  const [customCustomerCompany, setCustomCustomerCompany] = useState("TECHPHOSIS PRIVATE LIMITED");
  const [customerAddress, setCustomerAddress] = useState("Ansal Palam Corporate Plaza\nBlock C-2, S-336 Palam Vihar,\nGurugram\nHaryana\nIndia");
  const [placeOfSupply, setPlaceOfSupply] = useState("Haryana (06)");
  const [gstTreatment, setGstTreatment] = useState("Registered Business - Regular");
  const [gstin, setGstin] = useState("06AAKCT4257D1ZC");

  // Invoice Dates & Identifiers
  const [invoiceNumber, setInvoiceNumber] = useState("PI-000088");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState("INR");

  // Bank Info
  const [bankName, setBankName] = useState("Bank of Baroda");
  const [accountNumber, setAccountNumber] = useState("10520200000277");
  const [ifscCode, setIfscCode] = useState("BARB0DHAKAN");

  // Notes & Breakdown
  const [invoiceIncludes, setInvoiceIncludes] = useState("• Remaining payment for the original approved project.\n• Additional charges for the expanded scope of work requested during project execution.");
  const [customerNotes, setCustomerNotes] = useState("Thank you for your business.");
  const [termsAndConditions, setTermsAndConditions] = useState("1. All disputes subject to local jurisdiction.\n2. Interest @ 18% p.a. charged on overdue payments.");

  // Line items
  const [items, setItems] = useState<any[]>([
    {
      id: "1",
      itemDetails: "Additional Website Development Charges",
      description: "(Including additional pages, scope expansion,\nUI/UX revisions, redesign iterations,\nresponsive implementation and testing.)",
      sacCode: "998314",
      quantity: 1,
      rate: 15000,
      taxName: "IGST18 [18%]",
      taxRate: 18,
      amount: 15000
    }
  ]);

  const handleInvoiceTypeChange = (type: "GST" | "NON_GST") => {
    setInvoiceType(type);
    if (type === "NON_GST") {
      setGstTreatment("Without GST (Non-Taxable / Exempted)");
      setItems(prev => prev.map(item => ({
        ...item,
        taxName: "Non-Taxable [0%]",
        taxRate: 0
      })));
    } else {
      setGstTreatment("Registered Business - Regular");
      setItems(prev => prev.map(item => ({
        ...item,
        taxName: "IGST18 [18%]",
        taxRate: 18
      })));
    }
  };

  useEffect(() => {
    async function init() {
      if (!currentUser) return;
      if (currentUser.roleName !== "Super Admin") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/invoices");
        if (res.ok) {
          const data = await res.json();
          if (data.nextInvoiceNumber) {
            setInvoiceNumber(data.nextInvoiceNumber);
          } else {
            const count = (data.invoices?.length || 0) + 88;
            setInvoiceNumber(`PI-${String(count).padStart(6, "0")}`);
          }
        }
        if (clientsList && clientsList.length > 0) {
          setSelectedClientId(clientsList[0].id);
        }
      } catch (err) {
        console.error("Init invoice form error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [currentUser, clientsList]);

  const handleTermsChange = (term: string) => {
    setPaymentTerms(term);
    const start = new Date(invoiceDate);
    if (term === "Due on Receipt") {
      setDueDate(invoiceDate);
    } else if (term === "Net 15") {
      start.setDate(start.getDate() + 15);
      setDueDate(start.toISOString().split("T")[0]);
    } else if (term === "Net 30") {
      start.setDate(start.getDate() + 30);
      setDueDate(start.toISOString().split("T")[0]);
    } else if (term === "Net 60") {
      start.setDate(start.getDate() + 60);
      setDueDate(start.toISOString().split("T")[0]);
    }
  };

  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    updated[index][field] = val;

    if (field === "quantity" || field === "rate") {
      const q = parseFloat(updated[index].quantity) || 0;
      const r = parseFloat(updated[index].rate) || 0;
      updated[index].amount = q * r;
    }

    if (field === "taxName") {
      const match = TAX_RATES.find(t => t.name === val);
      if (match) {
        updated[index].taxRate = match.rate;
      }
    }

    setItems(updated);
  };

  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        itemDetails: "",
        description: "",
        sacCode: "998314",
        quantity: 1,
        rate: 0,
        taxName: invoiceType === "NON_GST" ? "Non-Taxable [0%]" : "IGST18 [18%]",
        taxRate: invoiceType === "NON_GST" ? 0 : 18,
        amount: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const taxTotal = items.reduce((sum, item) => {
    const lineAmt = parseFloat(item.amount) || 0;
    const rate = parseFloat(item.taxRate) || 0;
    return sum + (lineAmt * rate) / 100;
  }, 0);
  const grandTotal = subtotal + taxTotal;
  const totalInWords = numberToWordsINR(grandTotal);

  const selectedClient = clientsList.find(c => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent, sendEmail = false) => {
    e.preventDefault();
    if (customerMode === "existing" && !selectedClientId) {
      alert("Please select an existing client or switch to custom customer");
      return;
    }
    if (customerMode === "custom" && !customCustomerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber,
        clientId: customerMode === "existing" ? selectedClientId : undefined,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyGstin,
        companyPan,
        customerName: customerMode === "custom" ? customCustomerName : (selectedClient?.company || selectedClient?.name),
        customerEmail: customerMode === "custom" ? customCustomerEmail : selectedClient?.email,
        customerCompany: customerMode === "custom" ? customCustomerCompany : selectedClient?.company,
        customerAddress,
        placeOfSupply,
        gstTreatment,
        gstin,
        invoiceDate,
        dueDate,
        paymentTerms,
        currency,
        subtotal,
        taxTotal,
        totalAmount: grandTotal,
        totalInWords,
        bankName,
        accountNumber,
        ifscCode,
        accountHolder: companyName,
        invoiceIncludes,
        customerNotes,
        termsAndConditions,
        status: sendEmail ? "Sent" : "Draft",
        items
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create invoice");

      if (sendEmail) {
        const targetEmail = payload.customerEmail;
        if (targetEmail) {
          await fetch(`/api/invoices/${data.invoice.id}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetEmail,
              targetName: payload.customerName
            })
          }).catch(err => console.error("Email dispatch failed:", err));
        }
      }

      setTriggerRefresh(prev => prev + 1);
      router.push(`/dashboard/invoices/${data.invoice.id}`);
    } catch (err: any) {
      alert(err.message || "Error saving invoice");
    } finally {
      setSubmitting(false);
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

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <AiLoader label="Loading Professional Invoice Creator..." sublabel="Preparing Zoho-style Tax Invoice layouts, currencies & GST registers" />
      </div>
    );
  }

  const currObj = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

  return (
    <div className="crm-container animate-fade-in" style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => router.push("/dashboard/invoices")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "none", color: "var(--primary-color)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="crm-card" style={{ padding: "2.5rem", border: "1px solid var(--border-primary)", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}>
        
        {/* Title, Invoice Type & Currency Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-primary)", paddingBottom: "1.25rem", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={28} color="var(--primary-color)" />
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {invoiceType === "GST" ? "Create Official Tax Invoice" : "Create Invoice (Without GST)"}
              </h1>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {invoiceType === "GST" ? "GST-compliant tax invoice with IGST/CGST breakdown" : "Commercial billing statement without GST / tax additions"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Invoice Type Toggle: With GST vs Without GST */}
            <div style={{ display: "flex", backgroundColor: "var(--bg-primary)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
              <button
                type="button"
                onClick={() => handleInvoiceTypeChange("GST")}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: invoiceType === "GST" ? "var(--primary-color)" : "transparent",
                  color: invoiceType === "GST" ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                📑 With GST (Tax Invoice)
              </button>
              <button
                type="button"
                onClick={() => handleInvoiceTypeChange("NON_GST")}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: invoiceType === "NON_GST" ? "var(--primary-color)" : "transparent",
                  color: invoiceType === "NON_GST" ? "#ffffff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                📄 Without GST (Non-GST)
              </button>
            </div>

            {/* Currency Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Currency:</span>
              <select
                className="crm-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ width: "200px", fontWeight: 700 }}
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 1: Issuer (Your Business / Pixxelu) & Customer Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginBottom: "2rem" }}>
          
          {/* Business Issuer Info */}
          <div style={{ padding: "1.25rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", color: "var(--primary-color)", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase" }}>
              <Building2 size={16} /> Issuer Company Details (From)
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <input 
                type="text" 
                className="crm-input" 
                placeholder="Company / Agency Name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                style={{ fontWeight: 700 }}
              />
              <textarea 
                className="crm-textarea" 
                rows={3} 
                placeholder="Building, Street, City, State, Pincode"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="Phone: 9218000707"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
                <input 
                  type="email" 
                  className="crm-input" 
                  placeholder="Email: rakeshrinku16@gmail.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="Website: www.pixxelu.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="GSTIN: 02ABBFP9262H1ZA"
                  value={companyGstin}
                  onChange={(e) => setCompanyGstin(e.target.value)}
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                />
              </div>
            </div>
          </div>

          {/* Customer (To) Info */}
          <div style={{ padding: "1.25rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase" }}>
                Billed To (Customer Details)
              </span>
              <div style={{ display: "flex", gap: "0.25rem" }}>
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "none",
                    backgroundColor: customerMode === "existing" ? "var(--primary-color)" : "var(--bg-secondary)",
                    color: customerMode === "existing" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  CRM Client
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("custom")}
                  style={{
                    padding: "0.25rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    border: "none",
                    backgroundColor: customerMode === "custom" ? "var(--primary-color)" : "var(--bg-secondary)",
                    color: customerMode === "custom" ? "#ffffff" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  Custom
                </button>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {customerMode === "existing" ? (
                <select 
                  className="crm-select"
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    const cl = clientsList.find(c => c.id === e.target.value);
                    if (cl) {
                      setCustomCustomerName(cl.company || cl.name);
                      setCustomCustomerEmail(cl.email || "");
                    }
                  }}
                  style={{ fontWeight: 600 }}
                >
                  <option value="">Select Existing Client</option>
                  {clientsList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.company} (${c.name})` : c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="Customer Legal Name (e.g. TECHPHOSIS PRIVATE LIMITED)"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  style={{ fontWeight: 700 }}
                  required
                />
              )}

              <input 
                type="email" 
                className="crm-input" 
                placeholder="Recipient Email (client@company.com)"
                value={customCustomerEmail}
                onChange={(e) => setCustomCustomerEmail(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />

              <textarea 
                className="crm-textarea" 
                rows={3} 
                placeholder="Client Address (Ansal Palam Corporate Plaza, Block C-2, Gurugram, Haryana...)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="GSTIN: 06AAKCT4257D1ZC"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                />
                <select 
                  className="crm-select"
                  value={placeOfSupply}
                  onChange={(e) => setPlaceOfSupply(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                >
                  {INDIAN_STATES.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Invoice Metadata Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", padding: "1.25rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)", marginBottom: "2rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoice#</label>
            <input 
              type="text" 
              className="crm-input" 
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              style={{ fontWeight: 400, marginTop: "4px" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoice Date</label>
            <input 
              type="date" 
              className="crm-input" 
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              style={{ marginTop: "4px" }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Terms</label>
            <select 
              className="crm-select"
              value={paymentTerms}
              onChange={(e) => handleTermsChange(e.target.value)}
              style={{ marginTop: "4px" }}
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 60">Net 60</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Due Date</label>
            <input 
              type="date" 
              className="crm-input" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ marginTop: "4px" }}
              required
            />
          </div>
        </div>

        {/* Section 3: Item Table */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              {invoiceType === "GST" ? "Itemized Deliverables & Tax Breakdown" : "Itemized Deliverables & Pricing (Without GST)"}
            </h3>
            {invoiceType === "NON_GST" && (
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-color)", backgroundColor: "var(--bg-primary)", padding: "0.2rem 0.6rem", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                Tax Free / 0% GST Mode
              </span>
            )}
          </div>

          <div style={{ border: "1px solid var(--border-primary)", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", width: "5%" }}>#</th>
                  <th style={{ padding: "0.75rem 1rem", width: invoiceType === "GST" ? "38%" : "50%" }}>DESCRIPTION</th>
                  <th style={{ padding: "0.75rem 0.5rem", width: "10%", textAlign: "center" }}>QTY</th>
                  <th style={{ padding: "0.75rem 0.5rem", width: invoiceType === "GST" ? "15%" : "18%", textAlign: "right" }}>RATE ({currObj.symbol})</th>
                  {invoiceType === "GST" && (
                    <th style={{ padding: "0.75rem 0.5rem", width: "17%", textAlign: "center" }}>TAX (IGST/GST)</th>
                  )}
                  <th style={{ padding: "0.75rem 1rem", width: invoiceType === "GST" ? "15%" : "17%", textAlign: "right" }}>AMOUNT ({currObj.symbol})</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid var(--border-primary)", verticalAlign: "top" }}>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontWeight: 700 }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="Item Title (e.g. Additional Website Development Charges)"
                        value={item.itemDetails}
                        onChange={(e) => handleItemChange(idx, "itemDetails", e.target.value)}
                        required
                        style={{ fontWeight: 700, marginBottom: "0.5rem" }}
                      />
                      <textarea 
                        className="crm-textarea" 
                        rows={2}
                        placeholder="Detailed deliverables description..."
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}
                      />
                    </td>

                    <td style={{ padding: "1rem 0.5rem", textAlign: "center" }}>
                      <input 
                        type="number" 
                        className="crm-input" 
                        min="1"
                        step="any"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        required
                        style={{ textAlign: "center" }}
                      />
                    </td>

                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      <input 
                        type="number" 
                        className="crm-input" 
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        required
                        style={{ textAlign: "right", fontWeight: 700 }}
                      />
                    </td>

                    {invoiceType === "GST" && (
                      <td style={{ padding: "1rem 0.5rem" }}>
                        <select 
                          className="crm-select"
                          value={item.taxName}
                          onChange={(e) => handleItemChange(idx, "taxName", e.target.value)}
                          style={{ fontSize: "0.8125rem" }}
                        >
                          {TAX_RATES.map(tax => (
                            <option key={tax.name} value={tax.name}>{tax.label}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ fontWeight: 400, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {currObj.symbol}{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)}
                      </div>
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeItemRow(idx)}
                          style={{ marginTop: "0.5rem", border: "none", background: "none", color: "var(--danger-color)", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "2px" }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button 
            type="button" 
            onClick={addItemRow}
            className="crm-btn crm-btn-secondary"
            style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem", marginTop: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Plus size={14} color="var(--primary-color)" /> + Add Line Item
          </button>
        </div>

        {/* Section 4: Bank Details, Total in Words, and Financial Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem", borderTop: "2px solid var(--border-primary)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Left Column: Total in Words & Bank Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                Total In Words
              </div>
              <div style={{ fontWeight: 400, fontStyle: "italic", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                {totalInWords}
              </div>
            </div>

            {/* Bank Details Input */}
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                <CreditCard size={14} /> Bank & Remittance Account
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Bank Name</label>
                  <input 
                    type="text" 
                    className="crm-input" 
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    style={{ fontSize: "0.8125rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>Account Number</label>
                  <input 
                    type="text" 
                    className="crm-input" 
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    style={{ fontSize: "0.8125rem", fontWeight: 400 }}
                  />
                </div>
              </div>
              <div style={{ marginTop: "0.5rem" }}>
                <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>IFSC Code</label>
                <input 
                  type="text" 
                  className="crm-input" 
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  style={{ fontSize: "0.8125rem", fontWeight: 400 }}
                />
              </div>
            </div>

            {/* Scope / Includes Notes */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                This Invoice Includes (Bullet Points)
              </label>
              <textarea 
                className="crm-textarea" 
                rows={3} 
                value={invoiceIncludes}
                onChange={(e) => setInvoiceIncludes(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />
            </div>
          </div>

          {/* Right Column: Financial Totals Box */}
          <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)", height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Sub Total</span>
              <span style={{ fontWeight: 400 }}>
                {currObj.symbol}{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal)}
              </span>
            </div>

            {invoiceType === "GST" ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Total Tax (GST)</span>
                <span style={{ fontWeight: 400, color: "#10b981" }}>
                  +{currObj.symbol}{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(taxTotal)}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>
                <span>Tax Rate</span>
                <span>0.00% (Without GST)</span>
              </div>
            )}

            <div style={{ borderTop: "2px solid var(--border-primary)", paddingTop: "1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 400, color: "var(--text-primary)" }}>Total</span>
              <span style={{ fontSize: "1.35rem", fontWeight: 400, color: "var(--primary-color)" }}>
                {currObj.symbol}{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotal)}
              </span>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-primary)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(99, 102, 241, 0.08)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "var(--text-primary)" }}>Balance Due</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 400, color: "var(--text-primary)" }}>
                {currObj.symbol}{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", borderTop: "2px solid var(--border-primary)", paddingTop: "1.5rem" }}>
          <button 
            type="submit" 
            disabled={submitting} 
            className="crm-btn"
            style={{ backgroundColor: "#10b981", color: "#ffffff", fontWeight: 800, padding: "0.65rem 1.75rem" }}
          >
            {submitting ? "Saving..." : "Save Invoice"}
          </button>

          <button 
            type="button" 
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
            className="crm-btn crm-btn-primary"
            style={{ fontWeight: 800, padding: "0.65rem 1.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Send size={16} /> Save and Send
          </button>

          <button 
            type="button" 
            onClick={() => router.push("/dashboard/invoices")}
            className="crm-btn crm-btn-secondary"
            style={{ padding: "0.65rem 1.25rem" }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
