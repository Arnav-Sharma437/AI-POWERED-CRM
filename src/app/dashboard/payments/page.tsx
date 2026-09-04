"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  DollarSign, Search, Briefcase, User, ArrowUpRight, 
  Clock, CheckCircle, AlertCircle, RefreshCw, Filter, ExternalLink 
} from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

const CURRENCY_TO_INR_RATES: Record<string, number> = {
  INR: 1,
  USD: 87.5,
  EUR: 94.0,
  GBP: 110.0,
  AED: 23.8,
  CAD: 63.5,
  AUD: 56.5
};

export default function PaymentsPage() {
  const router = useRouter();
  const { triggerRefresh, currentUser } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";

  const [projects, setProjects] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("crm_projects_cache");
        return cached ? JSON.parse(cached) : [];
      } catch { return []; }
    }
    return [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("crm_projects_cache");
    }
    return true;
  });

  const [paymentCategory, setPaymentCategory] = useState<"all" | "monthly" | "onetime" | "pending" | "settled">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'monthly' | 'onetime' | 'pending' | 'settled'

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          const projList = data.projects || [];
          setProjects(projList);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("crm_projects_cache", JSON.stringify(projList));
          }
        }
      } catch (err) {
        console.error("Error loading payment project records", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [triggerRefresh]);

  // Access check: Developers do not view confidential financials
  if (!loading && isDeveloper) {
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
          <AlertCircle size={32} />
        </div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
          Access Restricted
        </h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "420px", margin: "0.5rem auto 1.5rem" }}>
          Financial ledger, client payments, and billing details are strictly confidential and restricted from developer view.
        </p>
        <button onClick={() => router.push("/dashboard/projects")} className="crm-btn crm-btn-primary">
          Back to Projects & Tasks
        </button>
      </div>
    );
  }

  // Format currency with original code
  const formatOriginal = (amt: number, curr = "INR") => {
    const code = curr.toUpperCase();
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0
    }).format(amt);
  };

  // Convert to INR with standard exchange rate
  const convertToInr = (amt: number, curr = "INR") => {
    const code = curr.toUpperCase();
    const rate = CURRENCY_TO_INR_RATES[code] || 1;
    return amt * rate;
  };

  const formatInr = (amt: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amt);
  };

  const isOngoingMonthly = (p: any) => p.pricingModel === "Monthly" || p.status === "Ongoing";

  const monthlyCount = projects.filter(p => isOngoingMonthly(p) && p.status !== "Completed" && p.status !== "Cancelled").length;
  const onetimeCount = projects.filter(p => !isOngoingMonthly(p) && p.status !== "Completed" && p.status !== "Cancelled").length;
  const pendingCount = projects.filter(p => (p.pendingAmount || 0) > 0).length;
  const settledCount = projects.filter(p => (p.pendingAmount || 0) <= 0).length;

  // Filter project records
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryBda?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const curr = (p.currency || "INR").toUpperCase();
    const matchesCurrency = !filterCurrency || curr === filterCurrency;

    const isPending = (p.pendingAmount || 0) > 0;
    const isMonthly = isOngoingMonthly(p);

    let matchesCategory = true;
    if (paymentCategory === "monthly") {
      matchesCategory = isMonthly && p.status !== "Completed" && p.status !== "Cancelled";
    } else if (paymentCategory === "onetime") {
      matchesCategory = !isMonthly && p.status !== "Completed" && p.status !== "Cancelled";
    } else if (paymentCategory === "pending") {
      matchesCategory = isPending;
    } else if (paymentCategory === "settled") {
      matchesCategory = !isPending;
    }

    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "monthly" ? isMonthly :
      filterStatus === "onetime" ? !isMonthly :
      filterStatus === "pending" ? isPending :
      !isPending;

    return matchesSearch && matchesCurrency && matchesCategory && matchesStatus;
  });

  // Calculate totals in INR
  const totalContractInr = filteredProjects.reduce((sum, p) => sum + convertToInr(p.finalBudget || 0, p.currency), 0);
  const totalReceivedInr = filteredProjects.reduce((sum, p) => sum + convertToInr(p.totalReceived || 0, p.currency), 0);
  const totalPendingInr = filteredProjects.reduce((sum, p) => sum + convertToInr(p.pendingAmount || 0, p.currency), 0);

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
              Client Payments & Outstanding Ledger
            </h1>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {filteredProjects.length} {filteredProjects.length === 1 ? "Record" : "Records"}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Track client project contract values, received payments, monthly retainers, and outstanding balances.
          </p>
        </div>

        <button 
          onClick={() => router.push("/dashboard/projects")} 
          className="crm-btn crm-btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Briefcase size={16} /> View Kanban Board
        </button>
      </div>

      {/* Payment Category Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        <button
          onClick={() => { setPaymentCategory("all"); setFilterStatus("all"); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: paymentCategory === "all" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: paymentCategory === "all" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          All Payments ({projects.length})
        </button>
        <button
          onClick={() => { setPaymentCategory("monthly"); setFilterStatus("all"); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: paymentCategory === "monthly" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: paymentCategory === "monthly" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          🔄 Ongoing / Monthly Retainers ({monthlyCount})
        </button>
        <button
          onClick={() => { setPaymentCategory("onetime"); setFilterStatus("all"); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: paymentCategory === "onetime" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: paymentCategory === "onetime" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          📦 One-Time Project Invoices ({onetimeCount})
        </button>
        <button
          onClick={() => { setPaymentCategory("pending"); setFilterStatus("all"); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: paymentCategory === "pending" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: paymentCategory === "pending" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          ⏳ Pending Balances ({pendingCount})
        </button>
        <button
          onClick={() => { setPaymentCategory("settled"); setFilterStatus("all"); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: paymentCategory === "settled" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: paymentCategory === "settled" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          ✅ Fully Settled ({settledCount})
        </button>
      </div>

      {/* Financial KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Total Contract Value (INR)</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>{formatInr(totalContractInr)}</div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Total Received (INR)</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>{formatInr(totalReceivedInr)}</div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "var(--bg-tertiary)", color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: "0.725rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.5px" }}>Total Pending Bills (INR)</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>{formatInr(totalPendingInr)}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexGrow: 1, minWidth: "220px" }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search by client name, project title, or BDA owner..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <select 
            className="crm-select" 
            style={{ width: "170px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="ongoing">⚡ Ongoing Projects</option>
            <option value="pending">⏳ Pending Only</option>
            <option value="settled">✓ Fully Settled</option>
          </select>

          <select 
            className="crm-select" 
            style={{ width: "150px" }}
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
          >
            <option value="">All Currencies</option>
            <option value="INR">INR (₹)</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="AUD">AUD (A$)</option>
            <option value="CAD">CAD (CA$)</option>
            <option value="AED">AED</option>
          </select>
        </div>
      </div>

      {/* Payments Ledger Table */}
      {loading ? (
        <AiLoader label="Loading Payment & Billing Ledger..." sublabel="Fetching client contracts, received transactions, and live currency conversions" />
      ) : filteredProjects.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No payment records match your filters</h3>
        </div>
      ) : (
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Client Name</th>
                <th>Project Deliverable</th>
                <th>Currency</th>
                <th style={{ textAlign: "right" }}>Total Budget</th>
                <th style={{ textAlign: "right" }}>Received</th>
                <th style={{ textAlign: "right" }}>Pending Outstanding</th>
                <th style={{ textAlign: "right" }}>Converted INR Equivalent</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => {
                const curr = (p.currency || "INR").toUpperCase();
                const isPending = (p.pendingAmount || 0) > 0;
                const convertedPendingInr = convertToInr(p.pendingAmount || 0, curr);
                const convertedTotalInr = convertToInr(p.finalBudget || 0, curr);

                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                        {p.client?.name || "Independent Client"}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        {p.client?.company || "Direct Account"}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        BDA: {p.primaryBda?.name || "Unassigned"} • {p.serviceType}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-secondary)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.725rem",
                        fontWeight: 500
                      }}>
                        {curr}
                      </span>
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                      {formatOriginal(p.finalBudget || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 500, color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                      {formatOriginal(p.totalReceived || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 500, color: isPending ? "#ef4444" : "var(--text-tertiary)", fontSize: "0.8125rem" }}>
                      {formatOriginal(p.pendingAmount || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600, color: isPending ? "#ef4444" : "var(--text-tertiary)", fontSize: "0.8125rem" }}>
                        {formatInr(convertedPendingInr)}
                      </div>
                      <div style={{ fontSize: "0.675rem", color: "var(--text-tertiary)" }}>
                        Total: {formatInr(convertedTotalInr)}
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "0.725rem",
                        fontWeight: 500,
                        backgroundColor: isPending ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.1)",
                        color: isPending ? "#ef4444" : "#10b981",
                        border: isPending ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(16, 185, 129, 0.2)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {isPending ? "Pending" : "✓ Settled"}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <button
                        onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                        className="crm-btn crm-btn-secondary"
                        style={{ padding: "0.35rem 0.65rem", fontSize: "0.775rem", gap: "0.25rem" }}
                        title="View Project & Record Payments"
                      >
                        Details <ExternalLink size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "var(--bg-tertiary)", borderTop: "2px solid var(--border-primary)" }}>
                <td colSpan={3} style={{ padding: "0.85rem 1rem", color: "var(--text-primary)", fontSize: "0.8125rem", fontWeight: 700 }}>
                  Grand Total ({filteredProjects.length} {filteredProjects.length === 1 ? "Record" : "Records"})
                </td>
                <td style={{ textAlign: "right", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "var(--text-primary)" }}>
                  <div style={{ fontWeight: 700 }}>{formatInr(totalContractInr)}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Total Budget (INR)</div>
                </td>
                <td style={{ textAlign: "right", padding: "0.85rem 1rem", fontSize: "0.875rem", color: "#10b981" }}>
                  <div style={{ fontWeight: 700 }}>{formatInr(totalReceivedInr)}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Total Received (INR)</div>
                </td>
                <td style={{ textAlign: "right", padding: "0.85rem 1rem", fontSize: "0.875rem", color: totalPendingInr > 0 ? "#ef4444" : "var(--text-tertiary)" }}>
                  <div style={{ fontWeight: 700 }}>{formatInr(totalPendingInr)}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Total Pending (INR)</div>
                </td>
                <td style={{ textAlign: "right", padding: "0.85rem 1rem", fontSize: "0.875rem", color: totalPendingInr > 0 ? "#ef4444" : "var(--text-tertiary)" }}>
                  <div style={{ fontWeight: 700 }}>{formatInr(totalPendingInr)}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Pending in INR</div>
                </td>
                <td style={{ textAlign: "center", padding: "0.85rem 1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {settledCount} Settled
                </td>
                <td style={{ textAlign: "right", padding: "0.85rem 1rem", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {pendingCount} Pending
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
