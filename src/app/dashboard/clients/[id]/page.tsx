"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Mail, Phone, Globe, DollarSign, Calendar, Plus, User } from "lucide-react";
import { useDashboard } from "../../layout";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh } = useDashboard();
  
  // Resolve params
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    async function loadClientDetails() {
      try {
        const res = await fetch(`/api/clients/${id}`);
        if (res.ok) {
          const data = await res.json();
          setClient(data.client);
        }
      } catch (err) {
        console.error("Error loading client", err);
      } finally {
        setLoading(false);
      }
    }
    loadClientDetails();
  }, [id, triggerRefresh]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "6rem" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="crm-container">
        <h2>Client not found</h2>
        <button onClick={() => router.push("/dashboard/clients")} className="crm-btn crm-btn-secondary">Back to Clients</button>
      </div>
    );
  }

  return (
    <div className="crm-container animate-fade-in">
      {/* Back Button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard/clients")} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          <ArrowLeft size={16} /> Back to Clients List
        </button>
      </div>

      {/* Main Info Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Left Side Client Info */}
        <div className="crm-card" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
            <div style={{ 
              width: "56px", 
              height: "56px", 
              borderRadius: "10px", 
              backgroundColor: "var(--primary-light)", 
              color: "var(--primary-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold"
            }}>
              {client.name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{client.name}</h2>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>{client.company || "Self Employed"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem", color: "var(--text-secondary)", borderTop: "1px solid var(--border-primary)", paddingTop: "1rem" }}>
            {client.email && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Mail size={14} /> {client.email}
              </div>
            )}
            {client.phone && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Phone size={14} /> {client.phone}
              </div>
            )}
            {client.website && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Globe size={14} /> 
                <a href={client.website} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)", textDecoration: "none" }}>{client.website}</a>
              </div>
            )}
            {client.industry && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Briefcase size={14} /> {client.industry}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Projects and Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Projects Card */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase" }}>Projects Portfolio</h3>
              <button onClick={() => openQuickAdd("project")} className="crm-btn crm-btn-primary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
                <Plus size={14} /> Add Project
              </button>
            </div>

            {client.projects?.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No active contracts on this account yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {client.projects.map((p: any) => (
                  <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)", cursor: "pointer", transition: "background 0.2s" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        Type: {p.serviceType} • Start: {new Date(p.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600, fontSize: "0.875rem", fontFamily: "monospace" }}>
                        {(p.currency === "USD" ? "$" : p.currency === "EUR" ? "€" : p.currency === "GBP" ? "£" : p.currency === "AED" ? "AED " : "₹") + (p.finalBudget || 0).toLocaleString()}
                      </div>
                      <span className="badge badge-primary" style={{ marginTop: "4px" }}>{p.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Timeline Card */}
          <div className="crm-card">
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.25rem" }}>Account Timeline History</h3>
            {client.activities?.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)" }}>No history recorded.</div>
            ) : (
              <div style={timelineStyles.timeline}>
                {client.activities.map((act: any) => (
                  <div key={act.id} style={timelineStyles.timelineItem}>
                    <div style={timelineStyles.timelineDot} />
                    <div style={timelineStyles.timelineContent}>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                        <strong>{act.user?.name || "System"}</strong>: {act.notes}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                        {new Date(act.timestamp).toLocaleString()} • {act.type}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

const timelineStyles: Record<string, React.CSSProperties> = {
  timeline: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    paddingLeft: "1rem",
    borderLeft: "2px solid var(--border-primary)",
    gap: "1.25rem",
  },
  timelineItem: {
    position: "relative",
  },
  timelineDot: {
    position: "absolute",
    left: "calc(-1rem - 6px)",
    top: "6px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    border: "2px solid var(--bg-secondary)",
  },
  timelineContent: {
    fontSize: "0.875rem",
  },
};
