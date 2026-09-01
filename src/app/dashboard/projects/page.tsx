"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, Plus, Calendar, AlertCircle, CheckCircle2, 
  CircleDollarSign, LayoutGrid, Table, Clock, User, ArrowRight, Trash2
} from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

const KANBAN_STAGES = [
  { id: "Not Started", label: "Not Started", color: "var(--text-tertiary)" },
  { id: "Work in Progress", label: "In Progress", color: "var(--primary-color)" },
  { id: "Review", label: "Review / QA", color: "var(--info-color)" },
  { id: "Issue", label: "Flagged / Issue", color: "var(--danger-color)" },
  { id: "Completed", label: "Completed", color: "var(--success-color)" },
  { id: "On Hold", label: "On Hold", color: "var(--warning-color)" }
];

export default function ProjectsPage() {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh, currentUser } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        const res = await fetch("/api/projects");
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects || []);
        }
      } catch (err) {
        console.error("Error loading projects", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [triggerRefresh]);

  const handleStatusChange = async (projectId: string, newStatus: string) => {
    // Optimistic UI update
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));

    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        // Revert on error
        const data = await res.json();
        alert(data.error || "Failed to update project status");
        const reload = await fetch("/api/projects");
        if (reload.ok) {
          const reloadData = await reload.json();
          setProjects(reloadData.projects || []);
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {isDeveloper ? "Assigned Projects & Tasks" : "Active Contracts & Projects"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            {isDeveloper 
              ? "Track your assigned deliverable board, milestone statuses, and deadlines." 
              : "Track project deliverables, Kanban board, budgets, and flagged project issues."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {/* View Toggle */}
          <div style={{ display: "flex", backgroundColor: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-primary)", padding: "2px" }}>
            <button
              onClick={() => setViewMode("kanban")}
              className="crm-btn"
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8125rem",
                border: "none",
                borderRadius: "6px",
                backgroundColor: viewMode === "kanban" ? "var(--primary-color)" : "transparent",
                color: viewMode === "kanban" ? "#ffffff" : "var(--text-secondary)"
              }}
            >
              <LayoutGrid size={15} /> Kanban
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="crm-btn"
              style={{
                padding: "0.4rem 0.75rem",
                fontSize: "0.8125rem",
                border: "none",
                borderRadius: "6px",
                backgroundColor: viewMode === "table" ? "var(--primary-color)" : "transparent",
                color: viewMode === "table" ? "#ffffff" : "var(--text-secondary)"
              }}
            >
              <Table size={15} /> Table
            </button>
          </div>

          {!isDeveloper && (
            <button onClick={() => openQuickAdd("project")} className="crm-btn crm-btn-primary">
              <Plus size={16} /> Add Project
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search project title or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <select 
            className="crm-select" 
            style={{ width: "200px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="Work in Progress">Work in Progress</option>
            <option value="Review">Review</option>
            <option value="Issue">Issue / Flagged</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Display */}
      {loading ? (
        <AiLoader label="Loading Workspace Projects..." sublabel="Fetching milestones, Kanban stages, and deliverable statuses" />
      ) : filteredProjects.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No projects match your filter query</h3>
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban Board View */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
          overflowX: "auto",
          paddingBottom: "1.5rem"
        }}>
          {KANBAN_STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter(p => p.status === stage.id);
            return (
              <div 
                key={stage.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggedProjectId) {
                    handleStatusChange(draggedProjectId, stage.id);
                    setDraggedProjectId(null);
                  }
                }}
                style={{
                  backgroundColor: "var(--bg-secondary)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-primary)",
                  padding: "1rem",
                  minHeight: "450px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem"
                }}
              >
                {/* Stage Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)", paddingBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: stage.color }} />
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{stage.label}</span>
                  </div>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: "var(--bg-primary)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "12px",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)"
                  }}>
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", flexGrow: 1 }}>
                  {stageProjects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-tertiary)", fontSize: "0.8125rem", border: "1px dashed var(--border-primary)", borderRadius: "8px" }}>
                      Drop project here
                    </div>
                  ) : (
                    stageProjects.map((p) => {
                      const isOverdue = new Date(p.deadline).getTime() < Date.now() && p.status !== "Completed" && p.status !== "Cancelled";
                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={() => setDraggedProjectId(p.id)}
                          onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                          style={{
                            backgroundColor: "var(--bg-primary)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-primary)",
                            padding: "1rem",
                            cursor: "grab",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
                            transition: "transform 0.15s ease, box-shadow 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.625rem"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                            <span className="badge badge-primary" style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem" }}>
                              {p.serviceType}
                            </span>
                            {p.status === "Issue" && (
                              <span style={{ color: "var(--danger-color)", display: "flex", alignItems: "center", gap: "2px", fontSize: "0.7rem", fontWeight: 600 }}>
                                <AlertCircle size={12} /> Issue
                              </span>
                            )}
                          </div>

                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                              Client: {p.client?.name}
                            </div>
                          </div>

                          {/* Redacted for Developer */}
                          {!isDeveloper && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)", backgroundColor: "var(--bg-secondary)", padding: "0.375rem 0.5rem", borderRadius: "6px" }}>
                              <span>Budget:</span>
                              <strong style={{ color: "var(--text-primary)" }}>
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.finalBudget)}
                              </strong>
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", borderTop: "1px solid var(--border-primary)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: isOverdue ? "var(--danger-color)" : "var(--text-tertiary)", fontWeight: isOverdue ? 600 : 400 }}>
                              <Calendar size={12} />
                              {new Date(p.deadline).toLocaleDateString()}
                            </div>
                            <span style={{ fontSize: "0.7rem", color: "var(--primary-color)", display: "flex", alignItems: "center", gap: "2px", fontWeight: 500 }}>
                              Board →
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Client Account</th>
                <th>Milestone Status</th>
                <th>BDA Owner</th>
                {!isDeveloper && <th>Milestone Budget</th>}
                {!isDeveloper && <th>Paid</th>}
                {!isDeveloper && <th>Outstanding</th>}
                <th>Deadline</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => {
                const isOverdue = new Date(p.deadline).getTime() < Date.now() && p.status !== "Completed" && p.status !== "Cancelled";
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{p.serviceType}</div>
                    </td>
                    <td>{p.client?.name}</td>
                    <td>
                      <span className={`badge ${
                        p.status === "Completed" ? "badge-success" : 
                        p.status === "Issue" ? "badge-danger" :
                        p.status === "Work in Progress" ? "badge-info" : "badge-primary"
                      }`}>
                        {p.status}
                      </span>
                      {p.status === "Issue" && (
                        <AlertCircle size={12} style={{ marginLeft: "4px", color: "var(--danger-color)", display: "inline" }} />
                      )}
                    </td>
                    <td>{p.primaryBda?.name}</td>
                    {!isDeveloper && (
                      <td>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.finalBudget)}
                      </td>
                    )}
                    {!isDeveloper && (
                      <td style={{ color: "var(--success-color)", fontWeight: 500 }}>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.totalReceived)}
                      </td>
                    )}
                    {!isDeveloper && (
                      <td style={{ color: p.pendingAmount > 0 ? "var(--warning-color)" : "var(--text-tertiary)", fontWeight: 500 }}>
                        {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p.pendingAmount)}
                      </td>
                    )}
                    <td>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.25rem", 
                        color: isOverdue ? "var(--danger-color)" : "var(--text-primary)",
                        fontWeight: isOverdue ? 600 : 400
                      }}>
                        <Calendar size={12} />
                        {new Date(p.deadline).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", alignItems: "center" }}>
                        <button 
                          onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                        >
                          Project board
                        </button>
                        {currentUser?.roleName === "Super Admin" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`Delete project "${p.name}"?`)) {
                                try {
                                  const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
                                  if (res.ok) {
                                    setProjects(prev => prev.filter(item => item.id !== p.id));
                                  } else {
                                    const data = await res.json();
                                    alert(data.error || "Failed to delete project");
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }
                            }}
                            className="crm-btn"
                            style={{ padding: "0.375rem 0.5rem", fontSize: "0.75rem", color: "var(--danger-color)", backgroundColor: "var(--danger-light)", borderColor: "var(--danger-color)" }}
                            title="Delete Project"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
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
