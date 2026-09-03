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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'pending' | 'settled'

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

  // Filter project records
  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryBda?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const curr = (p.currency || "INR").toUpperCase();
    const matchesCurrency = !filterCurrency || curr === filterCurrency;

    const isPending = (p.pendingAmount || 0) > 0;
    const matchesStatus = 
      filterStatus === "all" ? true :
      filterStatus === "pending" ? isPending :
      !isPending;

    return matchesSearch && matchesCurrency && matchesStatus;
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
            Track client project contract values, received payments, outstanding balances in original currency and converted INR equivalent.
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

      {/* Financial KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid var(--primary-color)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "var(--primary-light)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total Contract Value (INR)</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--text-primary)", marginTop: "2px" }}>{formatInr(totalContractInr)}</div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid #10b981" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total Received (INR)</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "#10b981", marginTop: "2px" }}>{formatInr(totalReceivedInr)}</div>
          </div>
        </div>

        <div className="crm-card" style={{ padding: "1.25rem", display: "flex", alignItems: "center", gap: "1rem", borderLeft: "4px solid var(--warning-color)" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "10px", backgroundColor: "var(--warning-light)", color: "var(--warning-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Total Pending Bills (INR)</div>
            <div style={{ fontSize: "1.375rem", fontWeight: 800, color: "var(--warning-color)", marginTop: "2px" }}>{formatInr(totalPendingInr)}</div>
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
                      <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                        {p.client?.name || "Independent Client"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                        {p.client?.company || "Direct Account"}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                        BDA: {p.primaryBda?.name || "Unassigned"} • {p.serviceType}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        backgroundColor: "rgba(99, 102, 241, 0.12)",
                        color: "var(--primary-color)",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.775rem",
                        fontWeight: 800,
                        fontFamily: "monospace"
                      }}>
                        {curr}
                      </span>
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: "var(--text-primary)", fontFamily: "monospace" }}>
                      {formatOriginal(p.finalBudget || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>
                      {formatOriginal(p.totalReceived || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right", fontWeight: 700, color: isPending ? "var(--warning-color)" : "var(--text-tertiary)", fontFamily: "monospace" }}>
                      {formatOriginal(p.pendingAmount || 0, curr)}
                    </td>

                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                      <div style={{ fontWeight: 800, color: isPending ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                        {formatInr(convertedPendingInr)}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                        Total: {formatInr(convertedTotalInr)}
                      </div>
                    </td>

                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: isPending ? "var(--warning-light)" : "rgba(16, 185, 129, 0.12)",
                        color: isPending ? "var(--warning-color)" : "#10b981",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        {isPending ? "⏳ Pending" : "✓ Settled"}
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
          </table>
        </div>
      )}
    </div>
  );
}
