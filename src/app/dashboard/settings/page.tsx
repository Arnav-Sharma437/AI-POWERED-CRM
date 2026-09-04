"use client";

import React, { useEffect, useState } from "react";
import { Shield, User, Info, CheckCircle2, Clock, MapPin, Building2, Home } from "lucide-react";
import { useDashboard } from "../layout";

export default function SettingsPage() {
  const { currentUser, setTriggerRefresh } = useDashboard();
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState("");

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser?.id) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const dataUrl = evt.target?.result as string;
      setAvatarPreview(dataUrl);
      setUploadingAvatar(true);
      try {
        const res = await fetch(`/api/users/${currentUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: dataUrl })
        });
        if (res.ok) {
          setSaveSuccess("Profile photo updated successfully!");
          setTimeout(() => setSaveSuccess(""), 4000);
          setTriggerRefresh((prev: number) => prev + 1);
        } else {
          alert("Failed to update profile photo");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentAvatar = avatarPreview || currentUser?.avatar;

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
              <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ 
                    width: "68px", 
                    height: "68px", 
                    borderRadius: "50%", 
                    backgroundColor: "var(--primary-color)", 
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.6rem",
                    fontWeight: "bold",
                    overflow: "hidden",
                    border: "2px solid var(--border-primary)",
                    flexShrink: 0
                  }}>
                    {currentAvatar ? (
                      <img src={currentAvatar} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      currentUser.name.charAt(0)
                    )}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{currentUser.name}</h4>
                  <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{currentUser.email}</div>
                  <div style={{ marginTop: "0.5rem" }}>
                    <label style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--primary-color)",
                      backgroundColor: "var(--primary-light)",
                      padding: "0.3rem 0.65rem",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-block"
                    }}>
                      {uploadingAvatar ? "Updating Photo..." : "📷 Change Profile Photo"}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleAvatarChange} 
                        style={{ display: "none" }} 
                      />
                    </label>
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div style={{ padding: "0.5rem 0.75rem", backgroundColor: "var(--success-light)", color: "var(--success-text)", borderRadius: "6px", fontSize: "0.8125rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={15} /> {saveSuccess}
                </div>
              )}

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

                {/* 4 Attendance KPI Metrics */}
                <div style={{ marginTop: "0.5rem" }}>
                  <span style={{ color: "var(--text-tertiary)", fontWeight: 600, fontSize: "0.75rem", textTransform: "uppercase" }}>My Attendance & Hours Summary</span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", fontWeight: 600 }}>TODAY HOURS</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {attendanceSummary ? `${Math.floor((attendanceSummary.totalWorkedMinutes || 0) / 60)}h ${(attendanceSummary.totalWorkedMinutes || 0) % 60}m` : "0h 0m"}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: attendanceSummary?.isCurrentlyWorking ? "var(--success-color)" : "var(--text-secondary)", marginTop: "1px" }}>
                        {attendanceSummary?.isCurrentlyWorking ? "🟢 Working" : "⚪ Off-duty"}
                      </div>
                    </div>

                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", fontWeight: 600 }}>LIFETIME HOURS</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {attendanceSummary ? `${Math.floor((attendanceSummary.totalLifetimeWorkedMinutes || attendanceSummary.totalWorkedMinutes || 0) / 60)}h ${((attendanceSummary.totalLifetimeWorkedMinutes || attendanceSummary.totalWorkedMinutes || 0) % 60)}m` : "0h 0m"}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        Total Logged
                      </div>
                    </div>

                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", fontWeight: 600 }}>DAYS PRESENT</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#10b981", marginTop: "2px" }}>
                        {attendanceSummary?.totalDaysPresent || 0} Days
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        Attended Work
                      </div>
                    </div>

                    <div style={{ padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", fontWeight: 600 }}>LEAVES (CHUTTI)</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--danger-color)", marginTop: "2px" }}>
                        {attendanceSummary?.totalDaysOnLeave || 0} Days
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "var(--text-tertiary)", marginTop: "1px" }}>
                        Past 30 Days
                      </div>
                    </div>
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
