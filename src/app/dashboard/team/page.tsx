"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, User, Shield, CheckCircle2, AlertCircle, Edit, Trash2, ShieldAlert } from "lucide-react";
import { useDashboard } from "../layout";

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

      showToast(`User ${activeModal === "edit" ? "updated" : "added"} successfully!`);
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--text-primary)" }}>Team Management</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px" }}>
            Add, update, activate, and manage user roles and permissions.
          </p>
        </div>
        <button onClick={handleOpenAdd} className="crm-btn crm-btn-primary">
          <Plus size={16} /> Add Team Member
        </button>
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
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
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
                        onClick={() => !isSelf && handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`badge ${u.isActive ? "badge-success" : "badge-secondary"}`}
                        style={{ border: "none", cursor: isSelf ? "default" : "pointer" }}
                      >
                        {u.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button 
                          onClick={() => handleOpenEdit(u)}
                          className="crm-btn crm-btn-secondary"
                          style={{ padding: "0.375rem 0.5rem" }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => !isSelf && handleDelete(u)}
                          disabled={isSelf}
                          className="crm-btn crm-btn-danger"
                          style={{ padding: "0.375rem 0.5rem", opacity: isSelf ? 0.3 : 1 }}
                        >
                          <Trash2 size={14} />
                        </button>
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
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
    padding: "1rem",
  },
  container: {
    width: "100%",
    maxWidth: "460px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
  },
  header: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--border-primary)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
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
    marginTop: "1rem",
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
