"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ReceiptText, Plus, Search, Filter, ArrowUpRight, 
  CheckCircle2, Clock, AlertCircle, FileText, Download, 
  Trash2, Edit, Eye, Building2, Calendar, DollarSign, ShieldAlert
} from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

export default function InvoicesListPage() {
  const router = useRouter();
  const { currentUser, triggerRefresh, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalCount: 0,
    totalInvoiced: 0,
    paidAmount: 0,
    pendingAmount: 0,
    overdueAmount: 0
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    async function loadInvoices() {
      if (!currentUser) return;
      if (currentUser.roleName !== "Super Admin") {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/invoices");
        if (res.ok) {
          const data = await res.json();
          setInvoices(data.invoices || []);
          setStats(data.stats || {
            totalCount: 0,
            totalInvoiced: 0,
            paidAmount: 0,
            pendingAmount: 0,
            overdueAmount: 0
          });
        }
      } catch (err) {
        console.error("Failed to load invoices:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, [currentUser, triggerRefresh]);

  // Access check
  if (!loading && currentUser?.roleName !== "Super Admin") {
    return (
      <div className="crm-container animate-fade-in" style={{ padding: "4rem 2rem", textAlign: "center" }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          color: "var(--danger-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.5rem"
        }}>
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Access Restricted
        </h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "400px", margin: "0.5rem auto 1.5rem" }}>
          The Invoicing System and financial billing documents are strictly restricted to Super Admin.
        </p>
        <button onClick={() => router.push("/dashboard")} className="crm-btn crm-btn-primary">
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <AiLoader label="Loading Financial Invoices..." sublabel="Calculating GST tax ledgers, customer billing records and items" />
      </div>
    );
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.placeOfSupply?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice "${invoiceNumber}"?`)) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTriggerRefresh(prev => prev + 1);
      } else {
        alert("Failed to delete invoice");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting invoice");
    }
  };

  const formatCurrency = (amt: number, curr = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 0
    }).format(amt);
  };

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              Invoices & Billing Hub
            </h1>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", padding: "2px 8px", borderRadius: "6px" }}>
              Super Admin Only
            </span>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Create, manage, and dispatch GST-compliant invoices and customer billings.
          </p>
        </div>

        <button 
          onClick={() => router.push("/dashboard/invoices/new")} 
          className="crm-btn crm-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem" }}
        >
          <Plus size={16} />
          Create New Invoice
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ReceiptText size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Total Invoiced</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>
              {formatCurrency(stats.totalInvoiced)}
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Paid Amount</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>
              {formatCurrency(stats.paidAmount)}
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Pending / Draft</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f59e0b", marginTop: "2px" }}>
              {formatCurrency(stats.pendingAmount)}
            </div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "var(--danger-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Overdue</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--danger-color)", marginTop: "2px" }}>
              {formatCurrency(stats.overdueAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flexGrow: 1, minWidth: "250px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)" }} />
            <input 
              type="text"
              placeholder="Search invoice number, customer name, place of supply..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            {["ALL", "Draft", "Sent", "Paid", "Overdue"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  border: statusFilter === status ? "1px solid var(--primary-color)" : "1px solid var(--border-primary)",
                  backgroundColor: statusFilter === status ? "var(--primary-color)" : "var(--bg-primary)",
                  color: statusFilter === status ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="crm-card" style={{ padding: 0, overflow: "hidden" }}>
        {filteredInvoices.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-tertiary)" }}>
            <ReceiptText size={48} style={{ opacity: 0.3, margin: "0 auto 1rem" }} />
            <h3 style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No invoices found</h3>
            <p style={{ fontSize: "0.8125rem", marginTop: "4px" }}>Click "Create New Invoice" to issue your first invoice.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-primary)", backgroundColor: "var(--bg-secondary)", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "0.85rem 1rem" }}>Invoice#</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Customer / Client</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Invoice Date</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Due Date</th>
                  <th style={{ padding: "0.85rem 1rem" }}>Place of Supply</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Amount (₹)</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-primary)", transition: "background 0.15s" }}>
                    <td style={{ padding: "1rem", fontWeight: 700, fontFamily: "monospace", color: "var(--primary-color)" }}>
                      <span 
                        onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                        style={{ cursor: "pointer", textDecoration: "underline" }}
                      >
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td style={{ padding: "1rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{inv.client?.name || "Client"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {inv.client?.company ? `${inv.client.company} • ` : ""}{inv.gstin || "No GSTIN"}
                      </div>
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                      {new Date(inv.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={{ padding: "1rem", color: new Date(inv.dueDate).getTime() < Date.now() && inv.status !== "Paid" ? "var(--danger-color)" : "var(--text-secondary)", fontWeight: new Date(inv.dueDate).getTime() < Date.now() && inv.status !== "Paid" ? 700 : 400 }}>
                      {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </td>
                    <td style={{ padding: "1rem", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      {inv.placeOfSupply}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "0.95rem" }}>
                      {formatCurrency(inv.totalAmount, inv.currency)}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "center" }}>
                      <span className={`badge ${
                        inv.status === "Paid" ? "badge-success" : 
                        inv.status === "Overdue" ? "badge-danger" : 
                        inv.status === "Sent" ? "badge-info" : "badge-primary"
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          onClick={() => router.push(`/dashboard/invoices/${inv.id}`)}
                          style={{ border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "0.35rem 0.5rem", borderRadius: "6px", cursor: "pointer" }}
                          title="View / Print Invoice"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => router.push(`/dashboard/invoices/${inv.id}/edit`)}
                          style={{ border: "1px solid var(--border-primary)", background: "var(--bg-primary)", color: "var(--text-primary)", padding: "0.35rem 0.5rem", borderRadius: "6px", cursor: "pointer" }}
                          title="Edit Invoice"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                          style={{ border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.08)", color: "var(--danger-color)", padding: "0.35rem 0.5rem", borderRadius: "6px", cursor: "pointer" }}
                          title="Delete Invoice"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
