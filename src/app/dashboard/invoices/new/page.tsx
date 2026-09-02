"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Plus, Trash2, Search, ArrowLeft, 
  HelpCircle, Settings, Send, Check, ShieldAlert,
  Paperclip, ChevronDown, CheckCircle2, DollarSign
} from "lucide-react";
import { useDashboard } from "../../layout";
import AiLoader from "@/components/AiLoader";

const INDIAN_STATES = [
  "[HR] - Haryana",
  "[DL] - Delhi",
  "[PB] - Punjab",
  "[UP] - Uttar Pradesh",
  "[RJ] - Rajasthan",
  "[MH] - Maharashtra",
  "[KA] - Karnataka",
  "[TN] - Tamil Nadu",
  "[TS] - Telangana",
  "[GJ] - Gujarat",
  "[WB] - West Bengal",
  "[CH] - Chandigarh",
  "[HP] - Himachal Pradesh",
  "[UK] - Uttarakhand",
  "[BR] - Bihar",
  "[MP] - Madhya Pradesh",
  "[KL] - Kerala",
  "[AP] - Andhra Pradesh",
  "[OD] - Odisha",
  "[OTHER] - Overseas / Non-Resident"
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

export default function CreateInvoicePage() {
  const router = useRouter();
  const { currentUser, clientsList, triggerRefresh, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [simplifiedView, setSimplifiedView] = useState(false);

  // Form State
  const [customerMode, setCustomerMode] = useState<"existing" | "custom">("existing");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customCustomerEmail, setCustomCustomerEmail] = useState("");
  const [customCustomerCompany, setCustomCustomerCompany] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("[HR] - Haryana");
  const [gstTreatment, setGstTreatment] = useState("Registered Business - Regular");
  const [gstin, setGstin] = useState("06AAKCT4257D1ZC");
  const [invoiceNumber, setInvoiceNumber] = useState("PI-000088");
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [currency, setCurrency] = useState("INR");
  const [customerNotes, setCustomerNotes] = useState("Thanks for your business. Please remit payment as per agreed terms.");
  const [termsAndConditions, setTermsAndConditions] = useState("1. All disputes subject to local jurisdiction.\n2. Interest @ 18% p.a. charged on overdue payments.");

  // Line items state
  const [items, setItems] = useState<any[]>([
    {
      id: "1",
      itemDetails: "Additional Website Development Charges",
      description: "(Including additional pages, scope expansion, UI/UX revisions, redesign iterations, responsive implementation and testing.)",
      sacCode: "998314",
      quantity: 1,
      rate: 15000,
      taxName: "IGST18 [18%]",
      taxRate: 18,
      amount: 15000
    }
  ]);

  useEffect(() => {
    async function init() {
      if (!currentUser) return;
      if (currentUser.roleName !== "Super Admin") {
        setLoading(false);
        return;
      }

      try {
        // Auto fetch next invoice number
        const res = await fetch("/api/invoices");
        if (res.ok) {
          const data = await res.json();
          const count = (data.invoices?.length || 0) + 88;
          setInvoiceNumber(`PI-${String(count).padStart(6, "0")}`);
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

  // Adjust due date based on payment terms
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

  // Line item manipulation
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
        taxName: "IGST18 [18%]",
        taxRate: 18,
        amount: 0
      }
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  const taxTotal = items.reduce((sum, item) => {
    const lineAmt = parseFloat(item.amount) || 0;
    const rate = parseFloat(item.taxRate) || 0;
    return sum + (lineAmt * rate) / 100;
  }, 0);
  const grandTotal = subtotal + taxTotal;

  // Selected client details
  const selectedClient = clientsList.find(c => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent, sendEmail = false) => {
    e.preventDefault();
    if (customerMode === "existing" && !selectedClientId) {
      alert("Please select a customer or switch to 'Enter New / Custom Customer'");
      return;
    }
    if (customerMode === "custom" && !customCustomerName.trim()) {
      alert("Please enter Customer / Company Name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invoiceNumber,
        clientId: customerMode === "existing" ? selectedClientId : undefined,
        customerName: customerMode === "custom" ? customCustomerName : (selectedClient?.company || selectedClient?.name),
        customerEmail: customerMode === "custom" ? customCustomerEmail : selectedClient?.email,
        customerCompany: customerMode === "custom" ? customCustomerCompany : selectedClient?.company,
        placeOfSupply,
        gstTreatment,
        gstin,
        invoiceDate,
        dueDate,
        paymentTerms,
        currency,
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
        <AiLoader label="Loading Invoice Builder..." sublabel="Preparing GST SAC registries, ledger calculations and layout" />
      </div>
    );
  }

  return (
    <div className="crm-container animate-fade-in" style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "5rem" }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => router.push("/dashboard/invoices")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "none", color: "var(--primary-color)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>

      {/* Main Invoice Form Card */}
      <form onSubmit={(e) => handleSubmit(e, false)} className="crm-card" style={{ padding: "2rem", border: "1px solid var(--border-primary)", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}>
        
        {/* Header inside Card matching reference image */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)", paddingBottom: "1.25rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={24} color="var(--primary-color)" />
            <h1 style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              New Invoice
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <label style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer" }}>
              <span>Use Simplified View</span>
              <input 
                type="checkbox" 
                checked={simplifiedView} 
                onChange={(e) => setSimplifiedView(e.target.checked)}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--primary-color)" }}
              />
            </label>
          </div>
        </div>

        {/* Top Info Rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginBottom: "2.5rem" }}>
          
          {/* Customer Name Row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "start", gap: "1rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--danger-color)", paddingTop: "0.5rem" }}>
              Customer Name*
            </label>
            <div>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setCustomerMode("existing")}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    border: customerMode === "existing" ? "1px solid var(--primary-color)" : "1px solid var(--border-primary)",
                    backgroundColor: customerMode === "existing" ? "var(--primary-light)" : "var(--bg-primary)",
                    color: customerMode === "existing" ? "var(--primary-color)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  Select Existing Client
                </button>
                <button
                  type="button"
                  onClick={() => setCustomerMode("custom")}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    border: customerMode === "custom" ? "1px solid var(--primary-color)" : "1px solid var(--border-primary)",
                    backgroundColor: customerMode === "custom" ? "var(--primary-light)" : "var(--bg-primary)",
                    color: customerMode === "custom" ? "var(--primary-color)" : "var(--text-secondary)",
                    cursor: "pointer"
                  }}
                >
                  + Enter New / Custom Customer
                </button>
              </div>

              {customerMode === "existing" ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "500px" }}>
                  <select 
                    className="crm-select"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    style={{ flexGrow: 1, fontWeight: 600 }}
                  >
                    <option value="">Select Customer / Client</option>
                    {clientsList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.company} (${c.name})` : c.name}
                      </option>
                    ))}
                  </select>

                  <div style={{ 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "0.25rem", 
                    padding: "0.45rem 0.65rem", 
                    backgroundColor: "rgba(16, 185, 129, 0.12)", 
                    color: "#10b981", 
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                    INR
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "500px" }}>
                  <input 
                    type="text" 
                    className="crm-input" 
                    placeholder="Customer / Company Name (e.g. Techphosis Pvt Ltd)"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    required
                    style={{ fontWeight: 600 }}
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <input 
                      type="email" 
                      className="crm-input" 
                      placeholder="Recipient Email (client@company.com)"
                      value={customCustomerEmail}
                      onChange={(e) => setCustomCustomerEmail(e.target.value)}
                      style={{ fontSize: "0.8125rem" }}
                    />
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder="Legal Entity / Brand Name"
                      value={customCustomerCompany}
                      onChange={(e) => setCustomCustomerCompany(e.target.value)}
                      style={{ fontSize: "0.8125rem" }}
                    />
                  </div>
                </div>
              )}

              {/* Billing / Shipping GST Details Preview (from Reference Image) */}
              {(selectedClient || customerMode === "custom") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.75rem", maxWidth: "600px", padding: "0.75rem 1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)", fontSize: "0.75rem" }}>
                  <div>
                    <div style={{ color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                      Billing Recipient GST Details
                    </div>
                    <div>GST Treatment: <strong>{gstTreatment}</strong></div>
                    <div style={{ marginTop: "2px" }}>
                      GSTIN: <input 
                        type="text" 
                        value={gstin} 
                        onChange={(e) => setGstin(e.target.value)}
                        placeholder="e.g. 06AAKCT4257D1ZC"
                        style={{ border: "none", borderBottom: "1px dashed var(--primary-color)", background: "transparent", color: "var(--primary-color)", fontWeight: 700, padding: "0 2px", fontSize: "0.75rem", outline: "none", width: "160px" }}
                      />
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                      Shipping Recipient GST Details
                    </div>
                    <div>GSTIN: <span style={{ color: "var(--text-secondary)" }}>{gstin || "Same as Billing"}</span></div>
                    <div>Business Legal Name: <strong style={{ color: "var(--text-primary)" }}>{customerMode === "custom" ? (customCustomerCompany || customCustomerName || "Direct Billing") : (selectedClient?.company || selectedClient?.name)}</strong></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Place of Supply Row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: "1rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--danger-color)" }}>
              Place of Supply*
            </label>
            <div style={{ maxWidth: "350px" }}>
              <select 
                className="crm-select"
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                required
              >
                {INDIAN_STATES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Invoice# Row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: "1rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--danger-color)" }}>
              Invoice#*
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "350px" }}>
              <input 
                type="text" 
                className="crm-input" 
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                required
                style={{ fontWeight: 700, fontFamily: "monospace", letterSpacing: "0.05em" }}
              />
              <button 
                type="button" 
                onClick={() => setInvoiceNumber(`PI-${String(Math.floor(100000 + Math.random() * 900000))}`)}
                style={{ border: "1px solid var(--border-primary)", background: "var(--bg-primary)", padding: "0.55rem 0.75rem", borderRadius: "8px", cursor: "pointer", color: "var(--text-secondary)" }}
                title="Regenerate Invoice Number"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>

          {/* Invoice Date & Terms & Due Date Row */}
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: "1rem" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--danger-color)" }}>
              Invoice Date*
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
              <input 
                type="date" 
                className="crm-input" 
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                style={{ width: "160px" }}
              />

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Terms</span>
                <select 
                  className="crm-select"
                  value={paymentTerms}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  style={{ width: "150px" }}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Due Date</span>
                <input 
                  type="date" 
                  className="crm-input" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  style={{ width: "160px" }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Item Table (Pixel-perfect matching screenshot) */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              Item Table
            </h3>
          </div>

          <div style={{ border: "1px solid var(--border-primary)", borderRadius: "8px", overflow: "hidden", backgroundColor: "var(--bg-primary)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", width: "45%" }}>ITEM DETAILS</th>
                  <th style={{ padding: "0.75rem 0.5rem", width: "10%", textAlign: "center" }}>QUANTITY</th>
                  <th style={{ padding: "0.75rem 0.5rem", width: "15%", textAlign: "right" }}>RATE (₹)</th>
                  <th style={{ padding: "0.75rem 0.5rem", width: "15%" }}>TAX</th>
                  <th style={{ padding: "0.75rem 1rem", width: "15%", textAlign: "right" }}>AMOUNT (₹)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id || idx} style={{ borderBottom: "1px solid var(--border-primary)", verticalAlign: "top" }}>
                    {/* Item Details */}
                    <td style={{ padding: "1rem" }}>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="e.g. Additional Website Development Charges"
                        value={item.itemDetails}
                        onChange={(e) => handleItemChange(idx, "itemDetails", e.target.value)}
                        required
                        style={{ fontWeight: 600, marginBottom: "0.5rem" }}
                      />
                      <textarea 
                        className="crm-textarea" 
                        rows={2}
                        placeholder="(Including additional pages, scope expansion, UI/UX revisions, redesign iterations...)"
                        value={item.description}
                        onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                        style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "0.5rem" }}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ 
                          fontSize: "0.65rem", 
                          fontWeight: 800, 
                          backgroundColor: "#10b981", 
                          color: "#ffffff", 
                          padding: "1px 5px", 
                          borderRadius: "3px", 
                          letterSpacing: "0.05em" 
                        }}>
                          SERVICE
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: 600 }}>
                          SAC:
                        </span>
                        <input 
                          type="text" 
                          value={item.sacCode} 
                          onChange={(e) => handleItemChange(idx, "sacCode", e.target.value)}
                          placeholder="998314"
                          style={{ border: "none", borderBottom: "1px dashed var(--primary-color)", background: "transparent", color: "var(--primary-color)", fontWeight: 700, fontSize: "0.75rem", outline: "none", width: "70px" }}
                        />
                      </div>
                    </td>

                    {/* Quantity */}
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

                    {/* Rate */}
                    <td style={{ padding: "1rem 0.5rem", textAlign: "right" }}>
                      <input 
                        type="number" 
                        className="crm-input" 
                        min="0"
                        step="any"
                        placeholder="15000"
                        value={item.rate}
                        onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                        required
                        style={{ textAlign: "right", fontWeight: 600 }}
                      />
                    </td>

                    {/* Tax Dropdown */}
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

                    {/* Amount */}
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--text-primary)", fontFamily: "monospace" }}>
                        {new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)}
                      </div>
                      {items.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeItemRow(idx)}
                          style={{ marginTop: "0.75rem", border: "none", background: "none", color: "var(--danger-color)", fontSize: "0.75rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "2px" }}
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

          {/* Add Row Buttons */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.75rem" }}>
            <button 
              type="button" 
              onClick={addItemRow}
              className="crm-btn crm-btn-secondary"
              style={{ fontSize: "0.8125rem", padding: "0.4rem 0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <Plus size={14} color="var(--primary-color)" /> + Add New Row
            </button>
          </div>
        </div>

        {/* Customer Notes and Summary Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", borderTop: "1px solid var(--border-primary)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Notes & Terms */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Customer Notes
              </label>
              <textarea 
                className="crm-textarea" 
                rows={3} 
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Thanks for your business..."
              />
            </div>

            <div>
              <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                Terms & Conditions
              </label>
              <textarea 
                className="crm-textarea" 
                rows={3} 
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                placeholder="Payment terms and jurisdiction..."
              />
            </div>
          </div>

          {/* Summary Box */}
          <div style={{ padding: "1.25rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Sub Total</span>
              <span style={{ fontWeight: 600, fontFamily: "monospace" }}>
                ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal)}
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.875rem" }}>
              <span style={{ color: "var(--text-secondary)" }}>Total Tax (GST)</span>
              <span style={{ fontWeight: 600, color: "#10b981", fontFamily: "monospace" }}>
                +₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(taxTotal)}
              </span>
            </div>

            <div style={{ borderTop: "2px dashed var(--border-primary)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>Total ( ₹ )</span>
              <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--primary-color)", fontFamily: "monospace" }}>
                ₹{new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions matching Reference Image */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", borderTop: "1px solid var(--border-primary)", paddingTop: "1.5rem" }}>
          <button 
            type="submit" 
            disabled={submitting} 
            className="crm-btn"
            style={{ backgroundColor: "#10b981", color: "#ffffff", fontWeight: 700, padding: "0.6rem 1.5rem" }}
          >
            {submitting ? "Saving..." : "Save"}
          </button>

          <button 
            type="button" 
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
            className="crm-btn crm-btn-primary"
            style={{ fontWeight: 700, padding: "0.6rem 1.5rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Send size={16} /> Save and Send
          </button>

          <button 
            type="button" 
            onClick={() => router.push("/dashboard/invoices")}
            className="crm-btn crm-btn-secondary"
            style={{ padding: "0.6rem 1.25rem" }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
