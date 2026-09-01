"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, AlertTriangle, Users, Briefcase, UserSquare2 } from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

export default function TrashPage() {
  const router = useRouter();
  const { triggerRefresh, setTriggerRefresh } = useDashboard();
  
  const [loading, setLoading] = useState(true);
  const [trashedLeads, setTrashedLeads] = useState<any[]>([]);
  const [trashedProjects, setTrashedProjects] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrashData() {
      try {
        const leadRes = await fetch("/api/leads?includeTrashed=true");
        if (leadRes.ok) {
          const leadData = await leadRes.json();
          // Filter trashed leads
          setTrashedLeads(leadData.leads?.filter((l: any) => l.isTrashed) || []);
        }

        const projectRes = await fetch("/api/projects?includeTrashed=true");
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          // Filter trashed projects
          setTrashedProjects(projectData.projects?.filter((p: any) => p.isTrashed) || []);
        }
      } catch (err) {
        console.error("Error loading trash data", err);
      } finally {
        setLoading(false);
      }
    }
    loadTrashData();
  }, [triggerRefresh]);

  const handleRestore = async (id: string, type: "lead" | "project") => {
    try {
      let url = "";
      if (type === "lead") {
        url = `/api/leads/${id}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTrashed: false })
        });
        if (!res.ok) throw new Error("Restore failed");
      } else {
        url = `/api/projects/${id}`;
        const res = await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTrashed: false })
        });
        if (!res.ok) throw new Error("Restore failed");
      }

      setTriggerRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id: string, type: "lead" | "project") => {
    if (!confirm("Are you sure you want to permanently delete this record? This action cannot be undone!")) return;
    try {
      const url = type === "lead" 
        ? `/api/leads/${id}?permanent=true`
        : `/api/projects/${id}?permanent=true`;
      
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setTriggerRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const hasTrash = trashedLeads.length > 0 || trashedProjects.length > 0;

  return (
    <div className="crm-container animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Trash Bin</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          Restore accidentally deleted leads or projects, or purge them permanently from the system.
        </p>
      </div>

      {loading ? (
        <AiLoader label="Retrieving System Archives..." sublabel="Loading recoverable leads and deleted project records" />
      ) : !hasTrash ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <Trash2 size={48} style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }} />
          <h3>Trash is empty</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Deleted files will remain here until permanently cleared.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Trashed Leads */}
          {trashedLeads.length > 0 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>Trashed Leads ({trashedLeads.length})</h3>
              <div className="crm-table-container">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Lead Name</th>
                      <th>Company</th>
                      <th>Assigned BDA</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashedLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <Users size={16} style={{ color: "var(--text-tertiary)" }} />
                            <strong>{lead.name}</strong>
                          </div>
                        </td>
                        <td>{lead.company || "No Company"}</td>
                        <td>{lead.primaryBda?.name || "Unassigned"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => handleRestore(lead.id, "lead")} className="crm-btn crm-btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem", marginRight: "0.5rem" }}>
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(lead.id, "lead")} className="crm-btn crm-btn-danger" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
                            <Trash2 size={12} /> Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trashed Projects */}
          {trashedProjects.length > 0 && (
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1rem" }}>Trashed Projects ({trashedProjects.length})</h3>
              <div className="crm-table-container">
                <table className="crm-table">
                  <thead>
                    <tr>
                      <th>Project Title</th>
                      <th>Client Name</th>
                      <th>BDA Owner</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trashedProjects.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <Briefcase size={16} style={{ color: "var(--text-tertiary)" }} />
                            <strong>{p.name}</strong>
                          </div>
                        </td>
                        <td>{p.client?.name}</td>
                        <td>{p.primaryBda?.name}</td>
                        <td style={{ textAlign: "right" }}>
                          <button onClick={() => handleRestore(p.id, "project")} className="crm-btn crm-btn-secondary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem", marginRight: "0.5rem" }}>
                            <RotateCcw size={12} /> Restore
                          </button>
                          <button onClick={() => handlePermanentDelete(p.id, "project")} className="crm-btn crm-btn-danger" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
                            <Trash2 size={12} /> Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
