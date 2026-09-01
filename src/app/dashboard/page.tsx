"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Flame, Calendar, BellRing, Briefcase, 
  AlertTriangle, DollarSign, ArrowUpRight, Plus, 
  MapPin, ClipboardList, CheckCircle, Clock
} from "lucide-react";
import { useDashboard } from "./layout";

export default function DashboardPage() {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh, currentUser } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [devProjects, setDevProjects] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [statsRes, projRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/projects")
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setData(statsData.stats);
        }
        if (projRes.ok) {
          const projData = await projRes.json();
          setDevProjects(projData.projects || []);
        }
      } catch (err) {
        console.error("Error loading dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [triggerRefresh]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>Loading Workspace...</p>
      </div>
    );
  }

  if (!data) return <div style={{ padding: "2rem" }}>Error loading dashboard data.</div>;

  // Developer Specific KPIs
  const devKpiList = [
    { name: "Assigned Projects", val: devProjects.length, icon: Briefcase, color: "var(--primary-color)", bg: "var(--primary-light)", link: "/dashboard/projects" },
    { name: "In Progress", val: devProjects.filter(p => p.status === "Work in Progress").length, icon: Clock, color: "var(--info-color)", bg: "var(--info-light)", link: "/dashboard/projects" },
    { name: "In Review / QA", val: devProjects.filter(p => p.status === "Review").length, icon: CheckCircle, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/projects" },
    { name: "Flagged Issues", val: devProjects.filter(p => p.status === "Issue").length, icon: AlertTriangle, color: "var(--danger-color)", bg: "var(--danger-light)", link: "/dashboard/projects" },
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
    { name: "Followups Today", val: data.kpis.followupsToday, icon: BellRing, color: "var(--warning-color)", bg: "var(--warning-light)", link: "/dashboard/leads" },
    { name: "Active Projects", val: data.kpis.activeProjects, icon: Briefcase, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/projects" },
    { name: "Deadlines (7d)", val: data.kpis.upcomingDeadlines, icon: AlertTriangle, color: "var(--danger-color)", bg: "var(--danger-light)", link: "/dashboard/projects" },
    { name: "Pending Bills", val: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(data.kpis.pendingPaymentsSum), icon: DollarSign, color: "#10b981", bg: "rgba(16, 185, 129, 0.1)", link: "/dashboard/projects" },
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
              ? "Your active development tasks, milestone deliverables, and schedule."
              : "Real-time metrics, pipeline distribution, and team schedules"}
          </p>
        </div>
        {!isDeveloper && (
          <div style={styles.headerActions}>
            <button 
              onClick={() => openQuickAdd("lead")} 
              className="crm-btn crm-btn-primary"
            >
              <Plus size={16} />
              Add Lead URL
            </button>
          </div>
        )}
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
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "calc(100vh - 70px)",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid var(--border-primary)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "2rem",
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
    marginBottom: "2rem",
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
