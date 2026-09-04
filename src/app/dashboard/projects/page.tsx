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
  const [projectCategory, setProjectCategory] = useState<"all" | "ongoing" | "completed" | "on_hold">("all");
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
          const projList = data.projects || [];
          setProjects(projList);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("crm_projects_cache", JSON.stringify(projList));
          }
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

  const ONGOING_STATUSES = ["Not Started", "Work in Progress", "Review", "Issue"];

  const ongoingCount = projects.filter(p => ONGOING_STATUSES.includes(p.status)).length;
  const completedCount = projects.filter(p => p.status === "Completed").length;
  const onHoldCount = projects.filter(p => ["On Hold", "Cancelled"].includes(p.status)).length;

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.client?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCategory = true;
    if (projectCategory === "ongoing") {
      matchesCategory = ONGOING_STATUSES.includes(p.status);
    } else if (projectCategory === "completed") {
      matchesCategory = p.status === "Completed";
    } else if (projectCategory === "on_hold") {
      matchesCategory = ["On Hold", "Cancelled"].includes(p.status);
    }

    const matchesStatus = !filterStatus || p.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
              {isDeveloper ? "Assigned Projects & Tasks" : "Active Contracts & Projects"}
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
              Total: {filteredProjects.length} {filteredProjects.length === 1 ? "Project" : "Projects"}
            </span>
          </div>
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

      {/* Project Category Filter Tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
        <button
          onClick={() => { setProjectCategory("all"); setFilterStatus(""); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: projectCategory === "all" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: projectCategory === "all" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          All Projects ({projects.length})
        </button>
        <button
          onClick={() => { setProjectCategory("ongoing"); setFilterStatus(""); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: projectCategory === "ongoing" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: projectCategory === "ongoing" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          ⚡ Ongoing Projects ({ongoingCount})
        </button>
        <button
          onClick={() => { setProjectCategory("completed"); setFilterStatus(""); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: projectCategory === "completed" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: projectCategory === "completed" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          ✅ Completed ({completedCount})
        </button>
        <button
          onClick={() => { setProjectCategory("on_hold"); setFilterStatus(""); }}
          className="crm-btn"
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            fontWeight: 600,
            borderRadius: "8px",
            backgroundColor: projectCategory === "on_hold" ? "var(--primary-color)" : "var(--bg-secondary)",
            color: projectCategory === "on_hold" ? "#ffffff" : "var(--text-secondary)",
            border: "1px solid var(--border-primary)"
          }}
        >
          ⏸️ On Hold / Flagged ({onHoldCount})
        </button>
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

        {/* Top Quick Stage Jumps & Horizontal Scroll Bar */}
        {viewMode === "kanban" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.25rem", borderTop: "1px solid var(--border-primary)", paddingTop: "0.85rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginRight: "0.25rem", flexShrink: 0 }}>
              Board Columns:
            </span>
            {KANBAN_STAGES.map((s) => {
              const count = filteredProjects.filter(p => p.status === s.id).length;
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    const el = document.getElementById(`kanban-stage-${s.id}`);
                    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                  }}
                  className="crm-btn crm-btn-secondary"
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "8px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    flexShrink: 0
                  }}
                >
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: s.color }} />
                  <span>{s.label}</span>
                  <span style={{ opacity: 0.65, fontSize: "0.7rem", fontWeight: 700 }}>({count})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Projects Display */}
      {loading ? (
        <AiLoader label="Loading Workspace Projects..." sublabel="Fetching milestones, Kanban stages, and deliverable statuses" />
      ) : filteredProjects.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No projects match your filter query</h3>
        </div>
      ) : viewMode === "kanban" ? (
        /* Kanban Board View - Clean Single Line with Top & Bottom Scroll Support */
        <div 
          id="kanban-scroll-wrapper"
          style={{
            display: "flex",
            gap: "1.25rem",
            alignItems: "stretch",
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: "1.25rem",
            paddingTop: "0.25rem",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {KANBAN_STAGES.map((stage) => {
            const stageProjects = filteredProjects.filter(p => p.status === stage.id);
            return (
              <div 
                id={`kanban-stage-${stage.id}`}
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
                  borderRadius: "12px",
                  border: "1px solid var(--border-primary)",
                  padding: "1rem",
                  width: "320px",
                  minWidth: "320px",
                  maxHeight: "720px",
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.875rem",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                {/* Stage Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-primary)", paddingBottom: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: stage.color }} />
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)" }}>{stage.label}</span>
                  </div>
                  <span style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    backgroundColor: "var(--bg-primary)",
                    padding: "0.2rem 0.55rem",
                    borderRadius: "10px",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-primary)"
                  }}>
                    {stageProjects.length}
                  </span>
                </div>

                {/* Cards Container with Internal Vertical Scrolling for heavy columns */}
                <div style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "0.75rem", 
                  flexGrow: 1, 
                  overflowY: "auto",
                  paddingRight: "4px",
                  maxHeight: "620px"
                }}>
                  {stageProjects.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-tertiary)", fontSize: "0.8125rem", border: "1px dashed var(--border-primary)", borderRadius: "10px" }}>
                      Drop project here
                    </div>
                  ) : (
                    stageProjects.map((p) => {
                      const isOverdue = new Date(p.deadline).getTime() < Date.now() && p.status !== "Completed" && p.status !== "Cancelled";
                      const assignedDevs = p.assignedDevs || [];
                      const primaryDev = assignedDevs[0];
                      const devInitial = primaryDev?.name ? primaryDev.name.charAt(0).toUpperCase() : "";

                      return (
                        <div
                          key={p.id}
                          draggable
                          onDragStart={() => setDraggedProjectId(p.id)}
                          onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                          style={{
                            backgroundColor: "var(--bg-secondary)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-primary)",
                            padding: "0.75rem 0.85rem",
                            cursor: "grab",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                            transition: "all 0.15s ease",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.45rem"
                          }}
                        >
                          {/* Top Row: Service Badge, Platform & Status */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.35rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap" }}>
                              <span style={{ 
                                fontSize: "0.675rem", 
                                fontWeight: 500, 
                                padding: "0.1rem 0.4rem", 
                                borderRadius: "4px", 
                                backgroundColor: "var(--bg-tertiary)", 
                                color: "var(--text-secondary)" 
                              }}>
                                {p.serviceType}
                              </span>

                              {p.source && (
                                <span style={{ 
                                  fontSize: "0.65rem", 
                                  fontWeight: 500, 
                                  padding: "0.1rem 0.35rem", 
                                  borderRadius: "4px", 
                                  backgroundColor: p.source.includes("Upwork") ? "rgba(16, 185, 129, 0.12)" : p.source.includes("Freelancer") ? "rgba(59, 130, 246, 0.12)" : "var(--bg-tertiary)", 
                                  color: p.source.includes("Upwork") ? "#10b981" : p.source.includes("Freelancer") ? "#3b82f6" : "var(--text-secondary)"
                                }}>
                                  {p.source}
                                </span>
                              )}
                            </div>

                            {p.status === "Issue" && (
                              <span style={{ color: "var(--danger-color)", display: "flex", alignItems: "center", gap: "2px", fontSize: "0.675rem", fontWeight: 500 }}>
                                <AlertCircle size={11} /> Issue
                              </span>
                            )}
                            {p.closeOutcome && (
                              <span style={{ 
                                color: p.closeOutcome === "Good" ? "var(--success-color)" : p.closeOutcome === "Bad" ? "var(--danger-color)" : "var(--text-secondary)", 
                                fontSize: "0.675rem", 
                                fontWeight: 500 
                              }}>
                                {p.closeOutcome === "Good" ? "★ Good" : p.closeOutcome === "Bad" ? "✕ Bad" : "• Closed"}
                              </span>
                            )}
                          </div>

                          {/* Title & Client */}
                          <div>
                            <div style={{ fontWeight: 500, fontSize: "0.8125rem", color: "var(--text-primary)", lineHeight: 1.3 }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                              {p.client?.name || "Direct Client"}
                            </div>
                          </div>

                          {/* Bottom Row: Deadline & Developer Initial Avatar */}
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            fontSize: "0.725rem", 
                            borderTop: "1px solid var(--border-primary)", 
                            paddingTop: "0.4rem", 
                            marginTop: "0.15rem" 
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: isOverdue ? "var(--danger-color)" : "var(--text-tertiary)", fontWeight: isOverdue ? 500 : 400 }}>
                              <Calendar size={11} />
                              {new Date(p.deadline).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                              {assignedDevs.length > 0 ? (
                                assignedDevs.map((dev: any) => (
                                  <div 
                                    key={dev.id}
                                    className="dev-avatar-pill"
                                  >
                                    <div className="dev-avatar-circle">
                                      {dev.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="dev-avatar-name">
                                      {dev.name}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <span style={{ fontSize: "0.675rem", color: "var(--text-tertiary)" }}>
                                  Unassigned
                                </span>
                              )}
                            </div>
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
                        <div style={{ fontWeight: 600 }}>
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "INR", maximumFractionDigits: 0 }).format(p.finalBudget)}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                          {p.pricingModel === "Hourly" ? `Hourly (${p.hourlyRate ? `${p.currency || "INR"} ${p.hourlyRate}/hr` : ""})` : "Fixed Price"}
                        </div>
                      </td>
                    )}
                    {!isDeveloper && (
                      <td style={{ color: "var(--success-color)", fontWeight: 500 }}>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "INR", maximumFractionDigits: 0 }).format(p.totalReceived)}
                      </td>
                    )}
                    {!isDeveloper && (
                      <td style={{ color: p.pendingAmount > 0 ? "var(--warning-color)" : "var(--text-tertiary)", fontWeight: 500 }}>
                        {new Intl.NumberFormat("en-US", { style: "currency", currency: p.currency || "INR", maximumFractionDigits: 0 }).format(p.pendingAmount)}
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
