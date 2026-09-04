"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Briefcase, DollarSign, ArrowUpRight, 
  Phone, Globe, Mail, LayoutGrid, List, ChevronRight 
} from "lucide-react";
import { useDashboard } from "../layout";
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

function formatClientCurrency(amount: number, currency = "INR"): string {
  const code = (currency || "INR").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || "₹";
  const formattedNumber = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(amount || 0);

  return `${symbol}${formattedNumber}`;
}

export default function ClientsPage() {
  const router = useRouter();
  const { triggerRefresh } = useDashboard();
  
  const [clients, setClients] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("crm_clients_cache");
        return cached ? JSON.parse(cached) : [];
      } catch { return []; }
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("crm_clients_cache");
    }
    return true;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          const clientsList = data.clients || [];
          setClients(clientsList);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("crm_clients_cache", JSON.stringify(clientsList));
          }
        }
      } catch (err) {
        console.error("Error loading clients", err);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, [triggerRefresh]);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="crm-container animate-fade-in">
      {/* Header with View Toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Client Accounts</h1>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {clients.length} {clients.length === 1 ? "Account" : "Accounts"}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Monitor client portfolios in their assigned project currencies (USD, INR, EUR, etc.), outstanding balances, and active contracts.
          </p>
        </div>

        {/* View Mode Toggle Switch */}
        <div style={{ display: "flex", alignItems: "center", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: "8px", padding: "3px" }}>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              backgroundColor: viewMode === "list" ? "var(--primary-color)" : "transparent",
              color: viewMode === "list" ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <List size={16} /> List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.8125rem",
              fontWeight: 600,
              backgroundColor: viewMode === "grid" ? "var(--primary-color)" : "transparent",
              color: viewMode === "grid" ? "#ffffff" : "var(--text-secondary)",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <LayoutGrid size={16} /> Grid Cards
          </button>
        </div>
      </div>

      {/* Search Row */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--text-tertiary)" }} />
          <input
            type="text"
            placeholder="Search by client name, company, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="crm-input"
            style={{ paddingLeft: "2.5rem" }}
          />
        </div>
      </div>

      {/* Clients Display */}
      {loading ? (
        <AiLoader label="Querying Client Portfolios..." sublabel="Calculating actual assigned currencies, collections, and contracts" />
      ) : filteredClients.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No client accounts found</h3>
        </div>
      ) : viewMode === "list" ? (
        /* Professional Table / List View */
        <div className="crm-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", textAlign: "left" }}>
                  <th style={{ padding: "1rem 1.25rem" }}>Client & Company</th>
                  <th style={{ padding: "1rem 1rem" }}>Contact Details</th>
                  <th style={{ padding: "1rem 1rem", textAlign: "center" }}>Currency</th>
                  <th style={{ padding: "1rem 1rem", textAlign: "center" }}>Projects</th>
                  <th style={{ padding: "1rem 1rem", textAlign: "right" }}>Portfolio Value</th>
                  <th style={{ padding: "1rem 1rem", textAlign: "right" }}>Collected</th>
                  <th style={{ padding: "1rem 1rem", textAlign: "right" }}>Pending Balance</th>
                  <th style={{ padding: "1rem 1.25rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const hasOutstanding = client.totalOutstanding > 0;
                  const clientCurr = client.primaryCurrency || client.projects?.[0]?.currency || "INR";
                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                      style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer", transition: "background 0.15s ease" }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <td style={{ padding: "1rem 1.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          <div style={{ 
                            width: "36px", 
                            height: "36px", 
                            borderRadius: "8px", 
                            backgroundColor: "var(--primary-light)", 
                            color: "var(--primary-color)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1rem",
                            fontWeight: "bold",
                            flexShrink: 0
                          }}>
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{client.name}</div>
                            <div style={{ fontSize: "0.775rem", color: "var(--text-secondary)" }}>{client.company || "Individual Account"}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "1rem 1rem", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>
                        {client.email && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: "2px" }}>
                            <Mail size={12} /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <Phone size={12} /> {client.phone}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        <span style={{ 
                          backgroundColor: "rgba(99, 102, 241, 0.12)", 
                          color: "var(--primary-color)", 
                          padding: "2px 8px", 
                          borderRadius: "6px", 
                          fontSize: "0.75rem", 
                          fontWeight: 400
                        }}>
                          {clientCurr}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 1rem", textAlign: "center" }}>
                        <span style={{ 
                          backgroundColor: client.activeProjects > 0 ? "rgba(16, 185, 129, 0.12)" : "var(--bg-secondary)", 
                          color: client.activeProjects > 0 ? "#10b981" : "var(--text-tertiary)",
                          padding: "3px 8px", 
                          borderRadius: "12px", 
                          fontSize: "0.775rem", 
                          fontWeight: 400 
                        }}>
                          {client.activeProjects} Active / {client.totalProjects}
                        </span>
                      </td>

                      <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 400, color: "var(--text-primary)" }}>
                        {formatClientCurrency(client.totalProjectValue, clientCurr)}
                      </td>

                      <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 400, color: "var(--success-color)" }}>
                        {formatClientCurrency(client.totalReceived, clientCurr)}
                      </td>

                      <td style={{ padding: "1rem 1rem", textAlign: "right", fontWeight: 400, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)" }}>
                        {formatClientCurrency(client.totalOutstanding, clientCurr)}
                      </td>

                      <td style={{ padding: "1rem 1.25rem", textAlign: "right" }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/clients/${client.id}`);
                          }}
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          View <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Cards View */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {filteredClients.map((client) => {
            const hasOutstanding = client.totalOutstanding > 0;
            const clientCurr = client.primaryCurrency || client.projects?.[0]?.currency || "INR";
            return (
              <div key={client.id} className="crm-card" style={{ display: "flex", flexDirection: "column", justifyContent: "between", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <div style={{ 
                      width: "48px", 
                      height: "48px", 
                      borderRadius: "8px", 
                      backgroundColor: "var(--primary-light)", 
                      color: "var(--primary-color)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.25rem",
                      fontWeight: "bold"
                    }}>
                      {client.name.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.0625rem", fontWeight: 600 }}>{client.name}</h3>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>{client.company || "No Company"}</div>
                    </div>
                  </div>
                  <span style={{ 
                    backgroundColor: "rgba(99, 102, 241, 0.12)", 
                    color: "var(--primary-color)", 
                    padding: "2px 8px", 
                    borderRadius: "6px", 
                    fontSize: "0.75rem", 
                    fontWeight: 400
                  }}>
                    {clientCurr}
                  </span>
                </div>

                {/* Info List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-primary)", paddingBottom: "1rem" }}>
                  {client.email && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Mail size={12} /> {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Phone size={12} /> {client.phone}
                    </div>
                  )}
                  {client.website && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Globe size={12} /> 
                      <a href={client.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "none" }}>{client.website}</a>
                    </div>
                  )}
                </div>

                {/* Financial Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.8125rem", marginBottom: "1.25rem" }}>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Total Portfolio</div>
                    <div style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-primary)", marginTop: "2px" }}>
                      {formatClientCurrency(client.totalProjectValue, clientCurr)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Collected</div>
                    <div style={{ fontSize: "1rem", fontWeight: 400, color: "var(--success-color)", marginTop: "2px" }}>
                      {formatClientCurrency(client.totalReceived, clientCurr)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Pending Balance</div>
                    <div style={{ fontSize: "1rem", fontWeight: 400, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)", marginTop: "2px" }}>
                      {formatClientCurrency(client.totalOutstanding, clientCurr)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Projects</div>
                    <div style={{ fontSize: "1rem", fontWeight: 400, color: "var(--text-primary)", marginTop: "2px" }}>
                      {client.activeProjects} Active / {client.totalProjects}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    onClick={() => router.push(`/dashboard/clients/${client.id}`)}
                    className="crm-btn crm-btn-secondary"
                    style={{ flexGrow: 1, fontSize: "0.8125rem" }}
                  >
                    Client Dashboard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
