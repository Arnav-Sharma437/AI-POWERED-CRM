"use client";

import React, { useEffect, useState } from "react";
import { Shield, User, Info, CheckCircle2, Clock, MapPin, Building2, Home } from "lucide-react";
import { useDashboard } from "../layout";

export default function SettingsPage() {
  const { currentUser } = useDashboard();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);

  useEffect(() => {
    async function loadAttendance() {
      if (!currentUser?.id) return;
      try {
        const res = await fetch(`/api/auth/attendance?userId=${currentUser.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.summary && data.summary[currentUser.id]) {
            setAttendanceSummary(data.summary[currentUser.id]);
          }
        }
      } catch (err) {
        console.error("Error loading attendance in settings:", err);
      }
    }
    loadAttendance();
  }, [currentUser?.id]);

  return (
    <div className="crm-container animate-fade-in">
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>System Settings</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
          Manage user profiles, check system roles, and configure team permissions.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        {/* Profile Card */}
        {currentUser && (
          <div className="crm-card">
            <h3 style={styles.cardTitle}>My Profile & Attendance</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                <div style={{ 
                  width: "56px", 
                  height: "56px", 
                  borderRadius: "50%", 
                  backgroundColor: "var(--primary-color)", 
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.5rem",
                  fontWeight: "bold"
                }}>
                  {currentUser.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{currentUser.name}</h4>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{currentUser.email}</div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Authorized Role</span>
                  <div style={{ fontWeight: 600, color: "var(--primary-color)", marginTop: "2px" }}>{currentUser.roleName}</div>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Assigned Division</span>
                  <div style={{ fontWeight: 500, color: "var(--text-primary)", marginTop: "2px" }}>
                    {currentUser.roleName === "Developer" ? "Engineering & Development" : "Business Development Association (BDA)"}
                  </div>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Today's Attendance & Working Hours</span>
                  <div style={{ 
                    marginTop: "6px", 
                    padding: "0.75rem", 
                    backgroundColor: "var(--bg-primary)", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border-primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Clock size={16} style={{ color: "var(--primary-color)" }} />
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {attendanceSummary 
                          ? `${Math.floor((attendanceSummary.totalWorkedMinutes || 0) / 60)}h ${(attendanceSummary.totalWorkedMinutes || 0) % 60}m logged` 
                          : "0h 0m logged"}
                      </span>
                    </div>
                    <span className={`badge ${attendanceSummary?.isCurrentlyWorking ? "badge-success" : "badge-secondary"}`}>
                      {attendanceSummary?.isCurrentlyWorking ? "🟢 Working" : "⚪ Off-duty"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Roles foundation details */}
        <div className="crm-card">
          <h3 style={styles.cardTitle}>Role-Based Access Control (RBAC)</h3>
          <div style={styles.infoBanner}>
            <Info size={16} />
            <span>Permissions are in MVP mode. Roles can be configured dynamically below.</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.25rem" }}>
            <div style={styles.roleItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Super Admin</strong>
                <span className="badge badge-danger">All System Permissions</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Full audit capabilities, billing override, permanent trash deletion, and user role overrides. (e.g. Varun)
              </p>
            </div>

            <div style={styles.roleItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>BDA Manager</strong>
                <span className="badge badge-primary">Pipeline & Client management</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Create/edit leads, paste LinkedIn URLs, assign secondary BDAs, schedule client calls, convert accounts, and record payment milestones. (e.g. Arnav, Ankit)
              </p>
            </div>

            <div style={styles.roleItem}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>Developer</strong>
                <span className="badge badge-info">Task & Calendar only</span>
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Read assigned project cards, view target milestone calendar, and receive requirements emails. No financial information is visible. (e.g. Atul, Rajesh)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  cardTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid var(--border-primary)",
    paddingBottom: "0.5rem",
    marginBottom: "1rem",
  },
  infoBanner: {
    backgroundColor: "var(--primary-light)",
    color: "var(--primary-color)",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  roleItem: {
    padding: "0.875rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
  },
};
