"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Flame, Calendar, BellRing, Briefcase, 
  AlertTriangle, DollarSign, ArrowUpRight, Plus, 
  MapPin, ClipboardList, CheckCircle, Clock, Building2, Home, Activity,
  Filter, CalendarRange, ChevronDown
} from "lucide-react";
import { useDashboard } from "./layout";
import AiLoader from "@/components/AiLoader";

export default function DashboardPage() {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh, currentUser } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  const isSuperAdmin = currentUser?.roleName === "Super Admin";
  
  // Memory Cache for 0ms Instant Page Transitions
  const [data, setData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("crm_dashboard_stats_cache");
        return cached ? JSON.parse(cached) : null;
      } catch { return null; }
    }
    return null;
  });
  const [devProjects, setDevProjects] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("crm_projects_cache");
        return cached ? JSON.parse(cached) : [];
      } catch { return []; }
    }
    return [];
  });

  // Date Range Filter States (Super Admin & BDA)
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "month" | "year" | "custom">("all");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  // Attendance Tracker States
  const [attendanceData, setAttendanceData] = useState<{
    logs: any[];
    userSummaries: any[];
  }>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = sessionStorage.getItem("crm_attendance_cache");
        return cached ? JSON.parse(cached) : { logs: [], userSummaries: [] };
      } catch { return { logs: [], userSummaries: [] }; }
    }
    return { logs: [], userSummaries: [] };
  });

  const [attendanceLoading, setAttendanceLoading] = useState(
    typeof window !== "undefined" ? !sessionStorage.getItem("crm_attendance_cache") : true
  );

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !sessionStorage.getItem("crm_dashboard_stats_cache");
    }
    return true;
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        let statsUrl = `/api/dashboard/stats?range=${dateRange}`;
        if (dateRange === "custom" && customFrom) {
          statsUrl += `&from=${customFrom}&to=${customTo || customFrom}`;
        }

        const [statsRes, projRes, attRes] = await Promise.all([
          fetch(statsUrl),
          fetch("/api/projects"),
          fetch(`/api/auth/attendance?_t=${Date.now()}`, { cache: "no-store" })
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setData(statsData.stats);
          if (typeof window !== "undefined" && dateRange === "all") {
            sessionStorage.setItem("crm_dashboard_stats_cache", JSON.stringify(statsData.stats));
          }
        }
        if (projRes.ok) {
          const projData = await projRes.json();
          setDevProjects(projData.projects || []);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("crm_projects_cache", JSON.stringify(projData.projects || []));
          }
        }
        if (attRes.ok) {
          const attJson = await attRes.json();
          const attData = {
            logs: attJson.logs || [],
            userSummaries: attJson.userSummaries || []
          };
          setAttendanceData(attData);
          if (typeof window !== "undefined") {
            sessionStorage.setItem("crm_attendance_cache", JSON.stringify(attData));
          }
        }
      } catch (err) {
        console.error("Error loading dashboard data", err);
      } finally {
        setLoading(false);
        setAttendanceLoading(false);
      }
    }
    fetchDashboardData();
  }, [triggerRefresh, dateRange, customFrom, customTo]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <AiLoader label="Initializing Nexus AI Operations..." sublabel="Aggregating pipeline metrics, milestone KPIs, and real-time feeds" />
      </div>
    );
  }

  if (!data) return <div style={{ padding: "2rem" }}>Error loading dashboard data.</div>;

  // Format minutes into clean "Xh Ym" string
  const formatMinutes = (mins: number) => {
    if (!mins || mins <= 0) return "0 mins";
    const hrs = Math.floor(mins / 60);
    const remainder = mins % 60;
    if (hrs === 0) return `${remainder} mins`;
    if (remainder === 0) return `${hrs} hrs`;
    return `${hrs}h ${remainder}m`;
  };

  // Current logged in user's attendance summary
  const myAttendanceSummary = attendanceData.userSummaries.find(u => u.userId === currentUser?.id);

  // Developer Specific KPIs
  const devKpiList = [
    { name: "Assigned Projects", val: devProjects.length, icon: Briefcase, color: "var(--primary-color)", bg: "var(--primary-light)", link: "/dashboard/projects" },
    { name: "In Progress", val: devProjects.filter(p => p.status === "Work in Progress").length, icon: Clock, color: "var(--info-color)", bg: "var(--info-light)", link: "/dashboard/projects" },
    { name: "In Review / QA", val: devProjects.filter(p => p.status === "Review").length, icon: CheckCircle, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/projects" },
    { name: "Today's Work Time", val: formatMinutes(myAttendanceSummary?.totalWorkedMinutes || 0), icon: Clock, color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", link: "/dashboard" },
    { name: "Deadlines This Week", val: devProjects.filter(p => {
      const d = new Date(p.deadline).getTime();
      return d >= Date.now() && d <= Date.now() + 7 * 24 * 60 * 60 * 1000;
    }).length, icon: Calendar, color: "var(--warning-color)", bg: "var(--warning-light)", link: "/dashboard/calendar" },
  ];

  // Admin / BDA KPIs
  const kpiList = [
    { name: "Total Leads", val: data.kpis.totalLeads, icon: Users, color: "var(--primary-color)", bg: "var(--primary-light)", link: "/dashboard/leads" },
    { name: "Hot Leads", val: data.kpis.hotLeads, icon: Flame, color: "var(--danger-color)", bg: "var(--danger-light)", link: "/dashboard/leads?priority=Hot" },
    { name: "Meetings Today", val: data.kpis.meetingsToday, icon: Calendar, color: "var(--info-color)", bg: "var(--info-light)", link: "/dashboard/calendar" },
    { name: "Active Projects", val: data.kpis.activeProjects, icon: Briefcase, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/projects" },
    { name: "Today's Work Time", val: formatMinutes(myAttendanceSummary?.totalWorkedMinutes || 0), icon: Clock, color: "#6366f1", bg: "rgba(99, 102, 241, 0.12)", link: "/dashboard" },
    { name: "Deadlines (7d)", val: data.kpis.upcomingDeadlines, icon: AlertTriangle, color: "var(--danger-color)", bg: "var(--danger-light)", link: "/dashboard/projects" },
    { name: "Pending Bills", val: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.kpis.pendingPaymentsSum), icon: DollarSign, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/payments" },
  ];

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {isDeveloper ? "Developer Workspace" : "CRM Operations Dashboard"}
          </h1>
          <p style={styles.subtitle}>
            {isDeveloper 
              ? "Your active development tasks, milestone deliverables, work time tracking, and schedule."
              : "Real-time pipeline metrics, team attendance, office work duration, and live schedules."}
          </p>
        </div>
      </div>

      {/* Super Admin & BDA Date-Wise Analytics & Range Banner */}
      {!isDeveloper && (
        <div className="crm-card" style={{
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          backgroundColor: "var(--bg-secondary)",
          border: "1px solid var(--border-primary)",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <CalendarRange size={18} />
            </div>
            <div>
              <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span>Date-Wise Analytics & Metrics</span>
                {dateRange !== "all" && (
                  <span style={{
                    fontSize: "0.7rem",
                    backgroundColor: "var(--primary-color)",
                    color: "#ffffff",
                    padding: "1px 7px",
                    borderRadius: "10px",
                    fontWeight: 700
                  }}>
                    Filtered
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {dateRange === "all" ? "Showing all-time CRM pipeline metrics" :
                 dateRange === "7d" ? "Showing past 7 days operations & conversions" :
                 dateRange === "30d" ? "Showing past 30 days operations" :
                 dateRange === "month" ? "Showing current month records" :
                 dateRange === "year" ? "Showing current year records" :
                 `Custom: ${customFrom || "Start"} to ${customTo || customFrom || "End"}`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            {/* Quick Range Presets */}
            <div style={{
              display: "flex",
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "8px",
              padding: "2px",
              gap: "2px"
            }}>
              {[
                { id: "all", label: "All Time" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "month", label: "This Month" },
                { id: "year", label: "This Year" },
              ].map(preset => {
                const isActive = dateRange === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setDateRange(preset.id as any)}
                    style={{
                      padding: "0.35rem 0.65rem",
                      fontSize: "0.775rem",
                      fontWeight: isActive ? 600 : 400,
                      borderRadius: "6px",
                      border: isActive ? "1px solid var(--border-secondary)" : "1px solid transparent",
                      cursor: "pointer",
                      backgroundColor: isActive ? "var(--bg-secondary)" : "transparent",
                      color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                      boxShadow: isActive ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDateRange("custom")}
                style={{
                  padding: "0.35rem 0.65rem",
                  fontSize: "0.775rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: dateRange === "custom" ? "var(--primary-color)" : "transparent",
                  color: dateRange === "custom" ? "#ffffff" : "var(--text-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                Custom Range 📅
              </button>
            </div>

            {/* Custom Date Pickers */}
            {dateRange === "custom" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="crm-input"
                  style={{ padding: "0.35rem 0.5rem", fontSize: "0.775rem", width: "135px" }}
                  title="From Date"
                />
                <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem" }}>to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="crm-input"
                  style={{ padding: "0.35rem 0.5rem", fontSize: "0.775rem", width: "135px" }}
                  title="To Date"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attendance & Shift Status Overview Card for the Logged-in User */}
      <div className="crm-card" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem", background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              backgroundColor: myAttendanceSummary?.isCurrentlyWorking ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: myAttendanceSummary?.isCurrentlyWorking ? "#10b981" : "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}>
              <Clock size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  My Shift & Attendance Status
                </h3>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  backgroundColor: myAttendanceSummary?.isCurrentlyWorking ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.12)",
                  color: myAttendanceSummary?.isCurrentlyWorking ? "#10b981" : "var(--danger-color)",
                  border: `1px solid ${myAttendanceSummary?.isCurrentlyWorking ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"}`
                }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: myAttendanceSummary?.isCurrentlyWorking ? "#10b981" : "#ef4444" }} />
                  {myAttendanceSummary?.isCurrentlyWorking ? `Clocked In (${myAttendanceSummary?.currentLocation || "Office"})` : "Clocked Out"}
                </span>
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {myAttendanceSummary?.firstClockIn ? (
                  <>First login today at <strong>{new Date(myAttendanceSummary.firstClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</strong> from {myAttendanceSummary.currentLocation || "Office"}</>
                ) : (
                  <>You haven't clocked in today yet. Click the clock button on topbar to start your session.</>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                Total Office / Work Time Today
              </div>
              <div style={{ fontSize: "1.35rem", fontWeight: 400, color: "var(--primary-color)", marginTop: "2px" }}>
                {formatMinutes(myAttendanceSummary?.totalWorkedMinutes || 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={styles.kpiGrid}>
        {(isDeveloper ? devKpiList : kpiList).map((kpi, idx) => (
          <div key={idx} onClick={() => router.push(kpi.link)} className="crm-card" style={styles.kpiCard}>
            <div style={{ ...styles.kpiIconBox, backgroundColor: kpi.bg, color: kpi.color }}>
              <kpi.icon size={20} />
            </div>
            <div style={styles.kpiContent}>
              <div style={styles.kpiName}>{kpi.name}</div>
              <div style={styles.kpiValue}>{kpi.val}</div>
            </div>
            <ArrowUpRight size={14} style={styles.kpiArrow} />
          </div>
        ))}
      </div>

      {/* Super Admin & BDA Team Attendance Monitoring Card */}
      {isSuperAdmin && (
        <div className="crm-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ ...styles.sectionTitle, borderBottom: "none", marginBottom: "2px" }}>
                Team Workday & Attendance Tracker (Super Admin Hub)
              </h3>
              <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Live visibility into when Developers & BDAs arrive, where they work from (Office vs Home), and total active work hours.
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm("Send weekly attendance summary reports via email to all Developers (individual breakdown) and Super Admin (master team summary)?")) return;
                  try {
                    const res = await fetch("/api/auth/attendance", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "send_weekly_reports" })
                    });
                    const resData = await res.json();
                    if (!res.ok) throw new Error(resData.error || "Failed to dispatch weekly reports");
                    alert(resData.message || "Weekly attendance reports emailed successfully!");
                  } catch (e: any) {
                    alert(e.message || "Failed to send weekly reports");
                  }
                }}
                className="crm-btn crm-btn-secondary"
                style={{
                  fontSize: "0.775rem",
                  padding: "0.35rem 0.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontWeight: 500
                }}
              >
                📧 Mail Weekly Reports to Team & Admin
              </button>
              <div style={{ fontSize: "0.775rem", fontWeight: 500, color: "var(--text-primary)", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-primary)", padding: "0.35rem 0.65rem", borderRadius: "8px" }}>
                {attendanceData.userSummaries.filter(u => u.isCurrentlyWorking).length} / {attendanceData.userSummaries.length} Active Now
              </div>
            </div>
          </div>

          {attendanceLoading && attendanceData.userSummaries.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
              Syncing live attendance records...
            </div>
          ) : attendanceData.userSummaries.length === 0 ? (
            <div style={styles.emptyState}>No team members found</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", textAlign: "left", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    <th style={{ padding: "0.75rem 0.6rem" }}>Team Member</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>Role</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>Live Shift Status</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>Work Location</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>First In (Aaya)</th>
                    <th style={{ padding: "0.75rem 0.6rem" }}>Last Out (Gya)</th>
                    <th style={{ padding: "0.75rem 0.6rem", textAlign: "right" }}>Total Office Time</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.userSummaries.map((u) => (
                    <tr key={u.userId} style={{ borderBottom: "1px solid var(--border-primary)", transition: "background 0.15s" }}>
                      <td style={{ padding: "0.75rem 0.6rem", fontWeight: 500, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                        {u.userName}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <span className={`badge ${u.roleName === "Super Admin" ? "badge-primary" : u.roleName === "Developer" ? "badge-info" : "badge-success"}`} style={{ fontSize: "0.725rem", padding: "0.2rem 0.5rem", fontWeight: 500 }}>
                          {u.roleName}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "6px",
                          fontSize: "0.725rem",
                          fontWeight: 500,
                          backgroundColor: u.isCurrentlyWorking ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.08)",
                          color: u.isCurrentlyWorking ? "#10b981" : "var(--text-tertiary)"
                        }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: u.isCurrentlyWorking ? "#10b981" : "#ef4444" }} />
                          {u.isCurrentlyWorking ? "Working Now" : "Clocked Out"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                          {u.currentLocation === "Home" ? <Home size={12} color="#10b981" /> : <Building2 size={12} color="var(--primary-color)" />}
                          <span>{u.currentLocation || "Office"}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {u.firstClockIn ? new Date(u.firstClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem", color: "var(--text-secondary)", fontSize: "0.75rem" }}>
                        {u.isCurrentlyWorking ? <span style={{ color: "#10b981", fontWeight: 500 }}>Active Now</span> : u.lastClockOut ? new Date(u.lastClockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}
                      </td>
                      <td style={{ padding: "0.75rem 0.6rem", textAlign: "right", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.8125rem" }}>
                        {formatMinutes(u.totalWorkedMinutes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Developer View: Project Milestones & Calendar Schedule */}
      {isDeveloper ? (
        <div style={styles.listsGrid}>
          {/* Assigned Projects */}
          <div className="crm-card">
            <h3 style={styles.sectionTitle}>My Assigned Projects & Tasks</h3>
            <div style={styles.listContainer}>
              {devProjects.length === 0 ? (
                <div style={styles.emptyState}>No projects assigned yet</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {devProjects.map((p) => {
                    const isOverdue = new Date(p.deadline).getTime() < Date.now() && p.status !== "Completed" && p.status !== "Cancelled";
                    return (
                      <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} style={styles.listItemClickable}>
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Client: {p.client?.name} • {p.serviceType}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className={`badge ${
                            p.status === "Completed" ? "badge-success" : 
                            p.status === "Issue" ? "badge-danger" :
                            p.status === "Work in Progress" ? "badge-info" : "badge-primary"
                          }`} style={{ marginBottom: "4px" }}>
                            {p.status}
                          </span>
                          <div style={{ fontSize: "0.75rem", color: isOverdue ? "var(--danger-color)" : "var(--text-tertiary)", fontWeight: isOverdue ? 600 : 400 }}>
                            Due: {new Date(p.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule & Deadlines */}
          <div className="crm-card">
            <h3 style={styles.sectionTitle}>Upcoming Milestones & Deadlines</h3>
            <div style={styles.listContainer}>
              {devProjects.length === 0 ? (
                <div style={styles.emptyState}>No deadlines scheduled</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {devProjects.map((p) => {
                    const deadline = new Date(p.deadline);
                    const isClose = (deadline.getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;
                    return (
                      <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} style={styles.listItemClickable}>
                        <div>
                          <div style={{ fontWeight: 600 }}>🏁 {p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Manager: {p.primaryBda?.name || "BDA Team"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: isClose ? "var(--danger-color)" : "var(--text-primary)" }}>
                            {deadline.toLocaleDateString()}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--primary-color)" }}>Open board →</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* BDA & Super Admin View */
        <>
          {/* Pipeline Funnel & Distributions Row */}
          <div style={styles.distributionRow}>
            {/* Lead Funnel */}
            <div className="crm-card" style={{ flexGrow: 2, flexBasis: "400px" }}>
              <h3 style={styles.sectionTitle}>Lead conversion Funnel</h3>
              <div style={styles.funnelList}>
                {data.distributions.leadFunnel.map((item: any, idx: number) => {
                  const maxCount = Math.max(...data.distributions.leadFunnel.map((f: any) => f.count), 1);
                  const percent = (item.count / maxCount) * 100;
                  return (
                    <div key={idx} style={styles.funnelItem}>
                      <div style={styles.funnelLabel}>
                        <span>{item.status}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div style={styles.progressBarBg}>
                        <div style={{ ...styles.progressBar, width: `${percent}%`, backgroundColor: item.status === "Won" ? "#10b981" : "var(--primary-color)" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Distributions */}
            <div className="crm-card" style={{ flexGrow: 1, flexBasis: "300px" }}>
              <h3 style={styles.sectionTitle}>Leads by Requirement</h3>
              <div style={styles.distributionList}>
                {data.distributions.leadsByService.length === 0 ? (
                  <div style={styles.emptyState}>No service records yet</div>
                ) : (
                  data.distributions.leadsByService.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} style={styles.distItem}>
                      <span style={styles.distLabel}>{item.name}</span>
                      <span className="badge badge-primary">{item.value} leads</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="crm-card" style={{ flexGrow: 1, flexBasis: "300px" }}>
              <h3 style={styles.sectionTitle}>Leads by BDA</h3>
              <div style={styles.distributionList}>
                {data.distributions.leadsByBda.length === 0 ? (
                  <div style={styles.emptyState}>No BDA records yet</div>
                ) : (
                  data.distributions.leadsByBda.map((item: any, idx: number) => (
                    <div key={idx} style={styles.distItem}>
                      <span style={styles.distLabel}>{item.name}</span>
                      <span className="badge badge-success">{item.value} leads</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Grid of lists */}
          <div style={styles.listsGrid}>
            {/* Today's Schedule */}
            <div className="crm-card">
              <h3 style={styles.sectionTitle}>Today's Schedule & Meetings</h3>
              <div style={styles.listContainer}>
                {data.lists.todayMeetingsList.length === 0 && data.lists.todayFollowupsList.length === 0 ? (
                  <div style={styles.emptyState}>No calls or meetings scheduled for today</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {data.lists.todayMeetingsList.map((m: any) => (
                      <div key={m.id} style={styles.scheduleItem}>
                        <div style={styles.scheduleTime}>
                          {new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontWeight: 600 }}>{m.title}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Type: {m.type} • {m.lead?.name || "No linked lead"}
                          </div>
                        </div>
                        <span className="badge badge-info">{m.status}</span>
                      </div>
                    ))}
                    {data.lists.todayFollowupsList.map((l: any) => (
                      <div key={l.id} style={{ ...styles.scheduleItem, borderLeftColor: "var(--warning-color)" }}>
                        <div style={styles.scheduleTime}>Follow-up</div>
                        <div style={{ flexGrow: 1 }}>
                          <div style={{ fontWeight: 600 }}>Call {l.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            {l.company} • {l.followupNotes || "No notes"}
                          </div>
                        </div>
                        <span className="badge badge-warning">Next Follow-up</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hot Leads */}
            <div className="crm-card">
              <h3 style={styles.sectionTitle}>Active Hot Pipelines</h3>
              <div style={styles.listContainer}>
                {data.lists.hotLeadsList.length === 0 ? (
                  <div style={styles.emptyState}>No hot pipelines right now</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {data.lists.hotLeadsList.map((l: any) => (
                      <div key={l.id} onClick={() => router.push(`/dashboard/leads/${l.id}`)} style={styles.listItemClickable}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          <div style={styles.initialsBox}>{l.name.charAt(0)}</div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{l.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{l.company} • {l.jobTitle}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span className="badge badge-danger" style={{ marginBottom: "4px" }}>Hot</span>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{l.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Project Deadlines */}
            <div className="crm-card">
              <h3 style={styles.sectionTitle}>Project Target Milestones</h3>
              <div style={styles.listContainer}>
                {data.lists.deadlinesList.length === 0 ? (
                  <div style={styles.emptyState}>No upcoming project deadlines</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {data.lists.deadlinesList.map((p: any) => {
                      const deadline = new Date(p.deadline);
                      const isClose = (deadline.getTime() - Date.now()) < 3 * 24 * 60 * 60 * 1000;
                      return (
                        <div key={p.id} onClick={() => router.push(`/dashboard/projects/${p.id}`)} style={styles.listItemClickable}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{p.client?.name}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: isClose ? "var(--danger-color)" : "var(--text-primary)" }}>
                              {deadline.toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>{p.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Recent timeline actions */}
            <div className="crm-card">
              <h3 style={styles.sectionTitle}>Recent Activity Timeline</h3>
              <div style={styles.listContainer}>
                {data.lists.recentActivityList.length === 0 ? (
                  <div style={styles.emptyState}>No activity log yet</div>
                ) : (
                  <div style={styles.timeline}>
                    {data.lists.recentActivityList.map((act: any) => (
                      <div key={act.id} style={styles.timelineItem}>
                        <div style={styles.timelineDot} />
                        <div style={styles.timelineContent}>
                          <div style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                            <strong>{act.user?.name}</strong>: {act.notes}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
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
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
  headerActions: {
    display: "flex",
    gap: "0.75rem",
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
    marginBottom: "1.5rem",
  },
  kpiCard: {
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "1.25rem 1rem",
  },
  kpiIconBox: {
    width: "42px",
    height: "42px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  kpiContent: {
    overflow: "hidden",
  },
  kpiName: {
    fontSize: "0.75rem",
    color: "var(--text-secondary)",
    fontWeight: 500,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  kpiValue: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginTop: "2px",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  kpiArrow: {
    position: "absolute",
    top: "10px",
    right: "10px",
    color: "var(--text-tertiary)",
  },
  distributionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "2rem",
  },
  sectionTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "1.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    borderBottom: "1px solid var(--border-primary)",
    paddingBottom: "0.5rem",
  },
  funnelList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  funnelItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  funnelLabel: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.8125rem",
  },
  progressBarBg: {
    width: "100%",
    height: "6px",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "3px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: "3px",
  },
  distributionList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  distItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "0.875rem",
  },
  distLabel: {
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  listsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
    gap: "1.5rem",
  },
  listContainer: {
    maxHeight: "360px",
    overflowY: "auto",
  },
  emptyState: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--text-tertiary)",
    fontSize: "0.875rem",
  },
  scheduleItem: {
    display: "flex",
    gap: "1rem",
    padding: "0.75rem",
    borderLeft: "3px solid var(--primary-color)",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "4px",
    alignItems: "center",
    fontSize: "0.875rem",
  },
  scheduleTime: {
    fontWeight: 600,
    color: "var(--text-secondary)",
    whiteSpace: "nowrap",
  },
  listItemClickable: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.2s",
    backgroundColor: "var(--bg-primary)",
    fontSize: "0.875rem",
  },
  initialsBox: {
    width: "32px",
    height: "32px",
    borderRadius: "9999px",
    backgroundColor: "var(--border-secondary)",
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.8125rem",
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    paddingLeft: "1rem",
    borderLeft: "2px solid var(--border-primary)",
    gap: "1rem",
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
