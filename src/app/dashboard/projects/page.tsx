"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Calendar, AlertCircle, CheckCircle2, CircleDollarSign } from "lucide-react";
import { useDashboard } from "../layout";

export default function ProjectsPage() {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh, currentUser } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {isDeveloper ? "Assigned Projects & Tasks" : "Active Contracts & Projects"}
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            {isDeveloper 
              ? "View tasks, milestone requirements, deliverable deadlines, and team communications." 
              : "Track project deliverables, budgets, milestone completions, and flagged project issues."}
          </p>
        </div>
        {!isDeveloper && (
          <button onClick={() => openQuickAdd("project")} className="crm-btn crm-btn-primary">
            <Plus size={16} /> Add Project
          </button>
        )}
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
            <option value="On Hold">On Hold</option>
            <option value="Review">Review</option>
            <option value="Issue">Issue / Flagged</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects list */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No projects match your filter query</h3>
        </div>
      ) : (
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
                      <button 
                        onClick={() => router.push(`/dashboard/projects/${p.id}`)}
                        className="crm-btn crm-btn-secondary"
                        style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        Project board
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
