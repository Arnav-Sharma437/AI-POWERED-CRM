"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, User, Shield, CheckCircle2, AlertCircle, Edit, Trash2, ShieldAlert, Clock, Calendar, MapPin, Building2, Home, Activity } from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

export default function TeamPage() {
  const router = useRouter();
  const { currentUser, triggerRefresh, setTriggerRefresh } = useDashboard();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Modals state
  const [activeModal, setActiveModal] = useState<"add" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // Attendance Modal state
  const [attendanceUser, setAttendanceUser] = useState<any | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [userAttendanceSummary, setUserAttendanceSummary] = useState<any | null>(null);
  
  // Forms state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleName: "Other",
    isActive: true
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpenAttendance = async (user: any) => {
    setAttendanceUser(user);
    setAttendanceLoading(true);
    try {
      const res = await fetch(`/api/auth/attendance?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceLogs(data.attendance || []);
        if (data.summary && data.summary[user.id]) {
          setUserAttendanceSummary(data.summary[user.id]);
        } else {
          setUserAttendanceSummary(null);
        }
      }
    } catch (err) {
      console.error("Error loading user attendance:", err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [triggerRefresh]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4000);
  };

  const handleOpenAdd = () => {
    setForm({
      name: "",
      email: "",
      password: "",
      roleName: "Other",
      isActive: true
    });
    setErrorMessage("");
    setActiveModal("add");
  };

  const handleOpenEdit = (user: any) => {
    setSelectedUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "", // blank password leaves it unchanged
      roleName: user.roleName,
      isActive: user.isActive
    });
    setErrorMessage("");
    setActiveModal("edit");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage("");

    let url = "/api/users";
    let method = "POST";

    if (activeModal === "edit" && selectedUser) {
      url = `/api/users/${selectedUser.id}`;
      method = "PUT";
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      showToast(activeModal === "edit" ? "User updated successfully!" : "User added successfully & onboarding email sent!");
      setActiveModal(null);
      setTriggerRefresh(prev => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (res.ok) {
        showToast(`User status updated to ${!user.isActive ? "Active" : "Inactive"}`);
        setTriggerRefresh(prev => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (user: any) => {
    if (!confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        showToast("User deleted successfully!");
        setTriggerRefresh(prev => prev + 1);
      } else {
        const data = await res.json();
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.roleName === filterRole;
    return matchesSearch && matchesRole;
  });

  const currentUserRole = users.find(u => u.id === currentUser?.id)?.roleName;

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Team Management</h1>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {users.length} {users.length === 1 ? "Member" : "Members"}
            </span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Add, update, activate, and manage user roles and permissions.
          </p>
        </div>
        {currentUserRole === "Super Admin" && (
          <button onClick={handleOpenAdd} className="crm-btn crm-btn-primary">
            <Plus size={16} /> Add Team Member
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="crm-card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center", flexGrow: 1 }}>
            <Search size={18} style={{ position: "absolute", left: "1rem", color: "var(--text-tertiary)" }} />
            <input
              type="text"
              placeholder="Search team members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <select 
            className="crm-select" 
            style={{ width: "200px" }}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="BDA">BDA Manager</option>
            <option value="Developer">Developer</option>
            <option value="Other">Other / Read Basic</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <AiLoader label="Synchronizing Team Directory..." sublabel="Fetching member roles, status, and permissions" />
      ) : filteredUsers.length === 0 ? (
        <div className="crm-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <h3>No team members found</h3>
        </div>
      ) : (
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          backgroundColor: u.roleName === "Super Admin" ? "var(--danger-light)" : "var(--primary-light)",
                          color: u.roleName === "Super Admin" ? "var(--danger-color)" : "var(--primary-color)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.875rem"
                        }}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                            {u.name} {isSelf && <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 400 }}>(You)</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${
                        u.roleName === "Super Admin" ? "badge-danger" : 
                        u.roleName === "BDA" ? "badge-primary" : 
                        u.roleName === "Developer" ? "badge-info" : "badge-secondary"
                      }`}>
                        {u.roleName}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => currentUserRole === "Super Admin" && !isSelf && handleToggleStatus(u)}
                        disabled={currentUserRole !== "Super Admin" || isSelf}
                        className={`badge ${u.isActive ? "badge-success" : "badge-secondary"}`}
                        style={{ border: "none", cursor: currentUserRole === "Super Admin" && !isSelf ? "pointer" : "default" }}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button 
                          onClick={() => handleOpenAttendance(u)}
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: "0.375rem 0.625rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                          title="View Attendance & Working Hours"
                        >
                          <Clock size={14} />
                          <span style={{ fontSize: "0.75rem" }}>Attendance</span>
                        </button>
                        {(currentUserRole === "Super Admin" || isSelf) && (
                          <button 
                            onClick={() => handleOpenEdit(u)}
                            className="crm-btn crm-btn-secondary"
                            style={{ padding: "0.375rem 0.5rem" }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {currentUserRole === "Super Admin" && (
                          <button 
                            onClick={() => !isSelf && handleDelete(u)}
                            disabled={isSelf}
                            className="crm-btn crm-btn-danger"
                            style={{ padding: "0.375rem 0.5rem", opacity: isSelf ? 0.3 : 1 }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        {currentUserRole !== "Super Admin" && !isSelf && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Read-only</span>
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

      {/* Toast Alert */}
      {toastMessage && (
        <div style={toastStyles.container}>
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Attendance & Working Hours Modal */}
      {attendanceUser && (
        <div style={modalStyles.overlay}>
          <div style={{ ...modalStyles.container, maxWidth: "560px" }} className="animate-fade-in">
            <div style={modalStyles.header}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "var(--primary-color)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "1rem"
                }}>
                  {attendanceUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ ...modalStyles.title, margin: 0 }}>
                    {attendanceUser.name} &bull; Attendance Profile
                  </h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {attendanceUser.email} &bull; <span className="badge badge-info" style={{ fontSize: "0.7rem", padding: "1px 6px" }}>{attendanceUser.roleName || attendanceUser.role?.name || "Member"}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setAttendanceUser(null)} style={modalStyles.closeBtn}>&times;</button>
            </div>

            <div style={{ ...modalStyles.body, padding: "1.25rem 1.5rem" }}>
              {attendanceLoading ? (
                <div style={{ padding: "2.5rem 0", textAlign: "center" }}>
                  <AiLoader label="Loading Attendance & Hours History..." sublabel="Fetching check-ins, office logs, and active session hours" />
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {/* Hours & Status Summary Cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-tertiary)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
                        <Clock size={14} style={{ color: "var(--primary-color)" }} />
                        <span>Today's Work Hours</span>
                      </div>
                      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
                        {userAttendanceSummary 
                          ? `${Math.floor((userAttendanceSummary.totalWorkedMinutes || 0) / 60)}h ${(userAttendanceSummary.totalWorkedMinutes || 0) % 60}m`
                          : "0h 0m"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {userAttendanceSummary?.isCurrentlyWorking ? "🟢 Session in Progress" : "⚪ Currently Off-duty"}
                      </div>
                    </div>

                    <div style={{ padding: "1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-tertiary)", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase" }}>
                        <MapPin size={14} style={{ color: "#10b981" }} />
                        <span>Work Location</span>
                      </div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        {userAttendanceSummary?.currentLocation === "Home" ? (
                          <>
                            <Home size={16} style={{ color: "#6366f1" }} /> Work from Home
                          </>
                        ) : (
                          <>
                            <Building2 size={16} style={{ color: "#10b981" }} /> In-Office
                          </>
                        )}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {userAttendanceSummary?.firstClockIn 
                          ? `Clock-in: ${new Date(userAttendanceSummary.firstClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : "No clock-in recorded today"}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Log History */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        Recent Attendance Activity & Logs
                      </h4>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {attendanceLogs.length} total events
                      </span>
                    </div>

                    {attendanceLogs.length === 0 ? (
                      <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px dashed var(--border-primary)", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                        No attendance check-ins or work session logs found for this member yet.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                        {attendanceLogs.map((log: any) => (
                          <div
                            key={log.id}
                            style={{
                              padding: "0.75rem 1rem",
                              backgroundColor: "var(--bg-primary)",
                              borderRadius: "8px",
                              border: "1px solid var(--border-primary)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                              <div style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "6px",
                                backgroundColor: log.action === "CLOCK_IN" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: log.action === "CLOCK_IN" ? "#10b981" : "var(--danger-color)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}>
                                <Activity size={14} />
                              </div>
                              <div>
                                <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-primary)" }}>
                                  {log.notes || (log.action === "CLOCK_IN" ? "Clocked In to Work" : "Clocked Out of Work")}
                                </div>
                                <div style={{ fontSize: "0.725rem", color: "var(--text-secondary)", marginTop: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span>{new Date(log.timestamp).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
                                  <span>&bull;</span>
                                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                                </div>
                              </div>
                            </div>

                            <span className={`badge ${log.location === "Home" ? "badge-info" : "badge-success"}`} style={{ fontSize: "0.725rem" }}>
                              {log.location === "Home" ? "🏠 Home" : "🏢 Office"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div style={modalStyles.actions}>
                <button type="button" onClick={() => setAttendanceUser(null)} className="crm-btn crm-btn-secondary">
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {activeModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.container} className="animate-fade-in">
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>
                {activeModal === "add" ? "Add Team Member" : "Edit Team Member"}
              </h3>
              <button onClick={() => setActiveModal(null)} style={modalStyles.closeBtn}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={modalStyles.body}>
              {errorMessage && (
                <div style={modalStyles.errorBox}>
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label style={modalStyles.label}>Full Name</label>
                <input 
                  type="text" 
                  className="crm-input" 
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={modalStyles.label}>Email Address</label>
                <input 
                  type="email" 
                  className="crm-input" 
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label style={modalStyles.label}>
                  {activeModal === "edit" ? "Change Password (leave blank to keep unchanged)" : "Password"}
                </label>
                <input 
                  type="password" 
                  className="crm-input" 
                  placeholder={activeModal === "edit" ? "••••••••" : "Min 6 characters"}
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  required={activeModal === "add"}
                />
              </div>

              <div>
                <label style={modalStyles.label}>Role</label>
                <select 
                  className="crm-select"
                  value={form.roleName}
                  onChange={(e) => setForm(prev => ({ ...prev, roleName: e.target.value }))}
                >
                  <option value="BDA">BDA Manager</option>
                  <option value="Developer">Developer</option>
                  <option value="Other">Other / Read Basic</option>
                  {currentUserRole === "Super Admin" && (
                    <option value="Super Admin">Super Admin</option>
                  )}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Account Active
                </label>
              </div>

              <div style={modalStyles.actions}>
                <button type="button" onClick={() => setActiveModal(null)} className="crm-btn crm-btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="crm-btn crm-btn-primary">
                  {actionLoading ? "Processing..." : "Save Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const toastStyles: Record<string, React.CSSProperties> = {
  container: {
    position: "fixed", 
    bottom: "24px", 
    right: "24px", 
    zIndex: 100, 
    backgroundColor: "var(--success-light)", 
    color: "var(--success-text)", 
    border: "1px solid currentColor", 
    padding: "0.875rem 1.5rem", 
    borderRadius: "8px", 
    boxShadow: "var(--shadow-lg)", 
    display: "flex", 
    alignItems: "center", 
    gap: "0.5rem", 
    fontWeight: 500, 
    fontSize: "0.875rem"
  }
};

const modalStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "1rem",
    overflowY: "auto",
  },
  container: {
    width: "100%",
    maxWidth: "500px",
    maxHeight: "min(88vh, 740px)",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    margin: "auto",
  },
  header: {
    padding: "1.15rem 1.5rem",
    borderBottom: "1px solid var(--border-primary)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
  },
  title: {
    fontSize: "1.0625rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: "1.5rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  body: {
    padding: "1.25rem 1.5rem",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1.15rem",
    maxHeight: "calc(88vh - 130px)",
  },
  label: {
    fontSize: "0.8125rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "0.375rem",
    display: "block",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "0.75rem",
    marginTop: "0.5rem",
    paddingTop: "0.75rem",
    borderTop: "1px solid var(--border-primary)",
    flexShrink: 0,
  },
  errorBox: {
    padding: "0.75rem 1rem",
    backgroundColor: "var(--danger-light)",
    color: "var(--danger-text)",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    borderRadius: "8px",
    fontSize: "0.8125rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  }
};

