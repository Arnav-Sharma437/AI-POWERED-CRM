"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Plus, Trash2, ArrowLeft, 
  Settings, Send, ShieldAlert,
  Building2, CreditCard
} from "lucide-react";
import { useDashboard } from "../../../layout";
import AiLoader from "@/components/AiLoader";

import { 
  COUNTRIES_AND_REGIONS, 
  ALL_COUNTRY_OPTIONS, 
  INVOICE_CURRENCIES, 
  INVOICE_TAX_RATES, 
  formatTotalInWords 
} from "@/lib/invoiceUtils";

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { currentUser, clientsList, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Invoice Type: GST vs Non-GST (Without GST)
  const [invoiceType, setInvoiceType] = useState<"GST" | "NON_GST">("GST");

  // Company / Issuer Info
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
  const [customCustomerName, setCustomCustomerName] = useState("");
  const [customCustomerEmail, setCustomCustomerEmail] = useState("");
  const [customCustomerCompany, setCustomCustomerCompany] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [placeOfSupply, setPlaceOfSupply] = useState("Haryana (06)");
  const [gstTreatment, setGstTreatment] = useState("Registered Business - Regular");
  const [gstin, setGstin] = useState("");

  // Invoice Dates & Identifiers
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [status, setStatus] = useState("Draft");

  // Bank Info
  const [bankName, setBankName] = useState("Bank of Baroda");
  const [accountNumber, setAccountNumber] = useState("10520200000277");
  const [ifscCode, setIfscCode] = useState("BARB0DHAKAN");
  const [swiftCode, setSwiftCode] = useState("BARBINBBXXX");

  // Notes & Breakdown
  const [invoiceIncludes, setInvoiceIncludes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [items, setItems] = useState<any[]>([]);

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
          const inv = data.invoice;
          
          if (inv.companyName) setCompanyName(inv.companyName);
          if (inv.companyAddress) setCompanyAddress(inv.companyAddress);
          if (inv.companyPhone) setCompanyPhone(inv.companyPhone);
          if (inv.companyEmail) setCompanyEmail(inv.companyEmail);
          if (inv.companyWebsite) setCompanyWebsite(inv.companyWebsite);
          if (inv.companyGstin) setCompanyGstin(inv.companyGstin);
          if (inv.companyPan) setCompanyPan(inv.companyPan);

          if (inv.clientId) {
            setCustomerMode("existing");
            setSelectedClientId(inv.clientId);
          } else {
            setCustomerMode("custom");
            setCustomCustomerName(inv.customerName || "");
            setCustomCustomerEmail(inv.customerEmail || "");
            setCustomCustomerCompany(inv.customerCompany || "");
          }
          
          setCustomerAddress(inv.customerAddress || "");
          setPlaceOfSupply(inv.placeOfSupply || "Haryana (06)");
          setGstTreatment(inv.gstTreatment || "Registered Business - Regular");
          setGstin(inv.gstin || "");
          setInvoiceNumber(inv.invoiceNumber || "");
          setInvoiceDate(inv.invoiceDate ? new Date(inv.invoiceDate).toISOString().split("T")[0] : "");
          setDueDate(inv.dueDate ? new Date(inv.dueDate).toISOString().split("T")[0] : "");
          setPaymentTerms(inv.paymentTerms || "Due on Receipt");
          setCurrency(inv.currency || "INR");
          setStatus(inv.status || "Draft");

          const isNonGst = (inv.taxTotal === 0 && (parseFloat(inv.subtotal) || 0) > 0) ||
            inv.gstTreatment?.toLowerCase().includes("without gst") ||
            inv.gstTreatment?.toLowerCase().includes("non-gst") ||
            (inv.items && inv.items.length > 0 && inv.items.every((it: any) => !it.taxRate || it.taxRate === 0));
          
          setInvoiceType(isNonGst ? "NON_GST" : "GST");

          if (inv.bankName) setBankName(inv.bankName);
          if (inv.accountNumber) setAccountNumber(inv.accountNumber);
          if (inv.ifscCode) setIfscCode(inv.ifscCode);
          if (inv.swiftCode) setSwiftCode(inv.swiftCode);
          if (inv.invoiceIncludes) setInvoiceIncludes(inv.invoiceIncludes);

          setCustomerNotes(inv.customerNotes || "");
          setTermsAndConditions(inv.termsAndConditions || "");
          setItems(inv.items && inv.items.length > 0 ? inv.items : []);
        }
      } catch (err) {
        console.error("Failed to load invoice for editing:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoice();
  }, [id, currentUser]);

  const handlePlaceOfSupplyChange = (val: string) => {
    setPlaceOfSupply(val);
    const matched = ALL_COUNTRY_OPTIONS.find(o => o.label === val || val.includes(o.name) || val.includes(o.code));
    if (matched) {
      if (matched.isInternational) {
        if (currency === "INR" && matched.defaultCurrency) {
          setCurrency(matched.defaultCurrency);
        }
        setInvoiceType("NON_GST");
        setGstTreatment("Export of Services (Zero-Rated / Without GST)");
        setItems(prev => prev.map(item => ({
          ...item,
          taxName: "Non-Taxable [0%]",
          taxRate: 0
        })));
      } else {
        setGstTreatment("Registered Business - Regular");
      }
    }
  };

  const handleTermsChange = (term: string) => {
    setPaymentTerms(term);
    const start = new Date(invoiceDate || new Date());
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
      const match = INVOICE_TAX_RATES.find(t => t.name === val);
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
  const totalInWords = formatTotalInWords(grandTotal, currency);

  const selectedClient = clientsList.find(c => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent, newStatus?: string) => {
    e.preventDefault();
    if (customerMode === "existing" && !selectedClientId) {
      alert("Please select a customer");
      return;
    }
    if (customerMode === "custom" && !customCustomerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyWebsite,
        companyGstin,
        companyPan,
        clientId: customerMode === "existing" ? selectedClientId : null,
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
        swiftCode,
        accountHolder: companyName,
        invoiceIncludes,
        customerNotes,
        termsAndConditions,
        status: newStatus || status,
        items
      };

      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to update invoice");

      if (newStatus === "Sent") {
        const targetEmail = payload.customerEmail;
        if (targetEmail) {
          await fetch(`/api/invoices/${id}/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              targetEmail,
              targetName: payload.customerName
            })
          }).catch(err => console.error("Email send failed:", err));
        }
      }

      setTriggerRefresh(prev => prev + 1);
      router.push(`/dashboard/invoices/${id}`);
    } catch (err: any) {
      alert(err.message || "Error updating invoice");
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
        <AiLoader label="Loading Invoice Editor..." sublabel="Fetching ledger details, line items and GST parameters" />
      </div>
    );
  }

  const currObj = INVOICE_CURRENCIES.find(c => c.code === currency) || INVOICE_CURRENCIES[0];
  const matchedCountry = ALL_COUNTRY_OPTIONS.find(o => o.label === placeOfSupply || o.name === placeOfSupply || placeOfSupply.includes(o.name) || placeOfSupply.includes(o.code));

  return (
    <div className="crm-container animate-fade-in" style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => router.push(`/dashboard/invoices/${id}`)}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", border: "none", background: "none", color: "var(--primary-color)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}
        >
          <ArrowLeft size={16} /> Back to Invoice
        </button>
      </div>

      <form onSubmit={(e) => handleSubmit(e)} className="crm-card" style={{ padding: "2.5rem", border: "1px solid var(--border-primary)", backgroundColor: "var(--bg-secondary)", borderRadius: "12px", boxShadow: "var(--shadow-md)" }}>
        
        {/* Header & Currency */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid var(--border-primary)", paddingBottom: "1.25rem", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={28} color="var(--primary-color)" />
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                Edit Invoice <span style={{ color: "var(--primary-color)" }}>{invoiceNumber}</span>
              </h1>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                {invoiceType === "GST" ? "Tax Invoice (With GST calculation)" : "Commercial Invoice (Without GST / International)"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            {/* Invoice Type Toggle */}
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
                📑 With GST
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
                📄 Without GST / Export
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Currency:</span>
              <select
                className="crm-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{ width: "230px", fontWeight: 700 }}
              >
                {INVOICE_CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>{curr.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 1: Issuer & Customer Details */}
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
                placeholder="Company Name"
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
                  placeholder="Phone"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
                <input 
                  type="email" 
                  className="crm-input" 
                  placeholder="Email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="Website"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  style={{ fontSize: "0.8125rem" }}
                />
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder="GSTIN"
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
                  placeholder="Customer Legal Name"
                  value={customCustomerName}
                  onChange={(e) => setCustomCustomerName(e.target.value)}
                  style={{ fontWeight: 700 }}
                  required
                />
              )}

              <input 
                type="email" 
                className="crm-input" 
                placeholder="Recipient Email"
                value={customCustomerEmail}
                onChange={(e) => setCustomCustomerEmail(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />

              <textarea 
                className="crm-textarea" 
                rows={3} 
                placeholder="Client Address..."
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                style={{ fontSize: "0.8125rem" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <input 
                  type="text" 
                  className="crm-input" 
                  placeholder={matchedCountry ? `${matchedCountry.taxIdLabel}` : "GSTIN / Tax ID"}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  style={{ fontSize: "0.8125rem", fontWeight: 700 }}
                />
                <select 
                  className="crm-select"
                  value={placeOfSupply}
                  onChange={(e) => handlePlaceOfSupplyChange(e.target.value)}
                  style={{ fontSize: "0.8125rem", fontWeight: 600 }}
                >
                  {COUNTRIES_AND_REGIONS.map(group => (
                    <optgroup key={group.group} label={group.group}>
                      {group.options.map(opt => (
                        <option key={opt.code + opt.name} value={opt.label}>{opt.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Invoice Metadata */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", padding: "1.25rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)", marginBottom: "2rem" }}>
          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Invoice#</label>
            <input 
              type="text" 
              className="crm-input" 
              value={invoiceNumber}
              disabled
              style={{ fontWeight: 400, marginTop: "4px", opacity: 0.8 }}
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

          <div>
            <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Status</label>
            <select 
              className="crm-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ marginTop: "4px", fontWeight: 700 }}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Section 3: Item Table */}
        <div style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
              {invoiceType === "GST" ? "Itemized Deliverables & Tax Breakdown" : "Itemized Deliverables & Pricing (Without GST / Export)"}
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
                        value={item.itemDetails}
                        onChange={(e) => handleItemChange(idx, "itemDetails", e.target.value)}
                        required
                        style={{ fontWeight: 700, marginBottom: "0.5rem" }}
                      />
                      <textarea 
                        className="crm-textarea" 
                        rows={2} 
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
                          {INVOICE_TAX_RATES.map(tax => (
                            <option key={tax.name} value={tax.name}>{tax.label}</option>
                          ))}
                        </select>
                      </td>
                    )}

                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ fontWeight: 400, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                        {currObj.symbol}{new Intl.NumberFormat(currObj.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(item.amount)}
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

        {/* Section 4: Bank, Words & Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem", borderTop: "2px solid var(--border-primary)", paddingTop: "1.5rem", marginBottom: "2rem" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
              <div style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                Total In Words
              </div>
              <div style={{ fontWeight: 400, fontStyle: "italic", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                {totalInWords}
              </div>
            </div>

            <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "8px" }}>
                <CreditCard size={14} /> Bank & Remittance Account (Domestic & International)
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
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>IFSC Code (Domestic)</label>
                  <input 
                    type="text" 
                    className="crm-input" 
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    style={{ fontSize: "0.8125rem", fontWeight: 400 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>SWIFT / BIC Code (International Wire)</label>
                  <input 
                    type="text" 
                    className="crm-input" 
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="e.g. BARBINBBXXX"
                    style={{ fontSize: "0.8125rem", fontWeight: 400 }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-secondary)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                This Invoice Includes
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

          <div style={{ padding: "1.5rem", backgroundColor: "var(--bg-primary)", borderRadius: "10px", border: "1px solid var(--border-primary)", height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Sub Total</span>
              <span style={{ fontWeight: 400 }}>
                {currObj.symbol}{new Intl.NumberFormat(currObj.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(subtotal)}
              </span>
            </div>

            {invoiceType === "GST" ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", fontSize: "0.9rem" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>Total Tax (GST)</span>
                <span style={{ fontWeight: 400, color: "#10b981" }}>
                  +{currObj.symbol}{new Intl.NumberFormat(currObj.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(taxTotal)}
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
                {currObj.symbol}{new Intl.NumberFormat(currObj.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotal)}
              </span>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-primary)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(99, 102, 241, 0.08)", padding: "0.75rem", borderRadius: "6px" }}>
              <span style={{ fontSize: "0.95rem", fontWeight: 400, color: "var(--text-primary)" }}>Balance Due</span>
              <span style={{ fontSize: "1.2rem", fontWeight: 400, color: "var(--text-primary)" }}>
                {currObj.symbol}{new Intl.NumberFormat(currObj.locale || "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(grandTotal)}
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
            {submitting ? "Saving..." : "Save Changes"}
          </button>

          <button 
            type="button" 
            disabled={submitting}
            onClick={(e) => handleSubmit(e, "Sent")}
            className="crm-btn crm-btn-primary"
            style={{ fontWeight: 800, padding: "0.65rem 1.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <Send size={16} /> Save and Send
          </button>

          <button 
            type="button" 
            onClick={() => router.push(`/dashboard/invoices/${id}`)}
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
