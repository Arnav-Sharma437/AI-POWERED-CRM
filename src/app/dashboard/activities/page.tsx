"use client";

import React, { useEffect, useState } from "react";
import { Activity, Search, Calendar, User, Layers } from "lucide-react";
import { useDashboard } from "../layout";

export default function ActivitiesPage() {
  const { triggerRefresh } = useDashboard();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/activities");
        if (res.ok) {
          const data = await res.json();
          setActivities(data.activities || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadActivities();
  }, [triggerRefresh]);

  const filteredActivities = activities.filter(act => {
    const matchesSearch = 
      act.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      act.user?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || act.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="crm-container animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Timeline & Activity Audit</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          Chronological record of CRM interactions, client updates, BDA handovers, and system reminders.
        </p>
      </div>

      {/* Filters Card */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search notes or team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <select 
            className="crm-select" 
            style={{ width: "200px" }}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Action Types</option>
            <option value="Meeting">Meeting</option>
            <option value="Call">Call</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Email">Email</option>
            <option value="Note">Note / Update</option>
            <option value="System">System Audit</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No activity matches your filters</h3>
        </div>
      ) : (
        <div className="crm-card" style={{ padding: "2rem" }}>
          <div style={styles.timeline}>
            {filteredActivities.map((act) => (
              <div key={act.id} style={styles.timelineItem}>
                <div style={{
                  ...styles.timelineDot,
                  backgroundColor: 
                    act.type === "Meeting" ? "var(--primary-color)" : 
                    act.type === "Call" ? "var(--info-color)" :
                    act.type === "System" ? "var(--border-secondary)" : "var(--warning-color)"
                }} />
                <div style={styles.timelineContent}>
                  <div style={{ fontSize: "0.9375rem", color: "var(--text-primary)" }}>
                    <strong>{act.user?.name || "System"}</strong>: {act.notes}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "4px", display: "flex", gap: "0.5rem" }}>
                    <span>{new Date(act.timestamp).toLocaleString()}</span>
                    <span>•</span>
                    <span style={{ textTransform: "uppercase", fontWeight: 600 }}>{act.type}</span>
                    {act.lead && (
                      <>
                        <span>•</span>
                        <span style={{ color: "var(--primary-color)" }}>Lead: {act.lead.name}</span>
                      </>
                    )}
                    {act.project && (
                      <>
                        <span>•</span>
                        <span style={{ color: "var(--success-color)" }}>Project: {act.project.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  timeline: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    paddingLeft: "1.5rem",
    borderLeft: "2px solid var(--border-primary)",
    gap: "1.5rem",
  },
  timelineItem: {
    position: "relative",
  },
  timelineDot: {
    position: "absolute",
    left: "calc(-1.5rem - 6px)",
    top: "6px",
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    border: "2px solid var(--bg-secondary)",
  },
  timelineContent: {
    paddingBottom: "0.5rem",
    borderBottom: "1px solid var(--border-primary)",
  },
};
