"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Briefcase, DollarSign, ArrowUpRight, Phone, Globe, Mail } from "lucide-react";
import { useDashboard } from "../layout";

export default function ClientsPage() {
  const router = useRouter();
  const { triggerRefresh } = useDashboard();
  
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
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
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Client Accounts</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          Monitor client portfolios, active contracts, outstanding balances, and total collections.
        </p>
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

      {/* Grid of Clients */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No client accounts found</h3>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "1.5rem" }}>
          {filteredClients.map((client) => {
            const hasOutstanding = client.totalOutstanding > 0;
            return (
              <div key={client.id} className="crm-card" style={{ display: "flex", flexDirection: "column", justifyContent: "between", position: "relative" }}>
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem" }}>
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
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(client.totalProjectValue)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Collected</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--success-color)", marginTop: "2px" }}>
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(client.totalReceived)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Pending Balance</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)", marginTop: "2px" }}>
                      {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(client.totalOutstanding)}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "var(--text-tertiary)" }}>Projects</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
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
