"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, Clock, User, Filter, 
  ChevronLeft, ChevronRight, List, Grid3X3, Briefcase, Users 
} from "lucide-react";
import { useDashboard } from "../layout";

type CalendarView = "month" | "week" | "day" | "list";

export default function CalendarPage() {
  const router = useRouter();
  const { currentUser, bdas } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  
  // Filtering state
  const [filterType, setFilterType] = useState<"all" | "my" | string>("all"); // 'all' | 'my' | bdaUserId

  useEffect(() => {
    async function loadCalendarData() {
      try {
        const [meetRes, projRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/projects")
        ]);
        if (meetRes.ok) {
          const meetData = await meetRes.json();
          setMeetings(meetData.meetings || []);
        }
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData.projects || []);
        }
      } catch (err) {
        console.error("Error loading calendar events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendarData();
  }, []);

  // Filter meetings
  const filteredMeetings = meetings.filter(m => {
    if (filterType === "all") return true;
    if (filterType === "my" && currentUser) {
      return m.assignedUserIds?.includes(currentUser.id) || m.assignments?.some((a: any) => a.userId === currentUser.id);
    }
    return m.assignedUserIds?.includes(filterType) || m.assignments?.some((a: any) => a.userId === filterType);
  });

  // Filter projects with deadlines
  const filteredProjects = projects.filter(p => {
    if (!p.deadline) return false;
    if (filterType === "my" && currentUser && !isDeveloper) {
      return p.primaryBdaId === currentUser.id;
    }
    if (filterType !== "all" && filterType !== "my") {
      return p.primaryBdaId === filterType;
    }
    return true;
  });

  // Month navigation
  const prevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };
  const nextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  // Calendar calculations
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 6 is Saturday
    return { days, firstDayIndex };
  };

  const { days, firstDayIndex } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: days }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDayIndex }, (_, i) => i);

  const getEventsForDay = (day: number) => {
    const dayMeetings = filteredMeetings.filter(m => {
      const mDate = new Date(m.startTime);
      return (
        mDate.getDate() === day &&
        mDate.getMonth() === currentDate.getMonth() &&
        mDate.getFullYear() === currentDate.getFullYear()
      );
    }).map(m => ({ ...m, eventKind: "meeting" }));

    const dayDeadlines = filteredProjects.filter(p => {
      const pDate = new Date(p.deadline);
      return (
        pDate.getDate() === day &&
        pDate.getMonth() === currentDate.getMonth() &&
        pDate.getFullYear() === currentDate.getFullYear()
      );
    }).map(p => ({
      id: `proj-${p.id}`,
      title: `🏁 Deadline: ${p.name}`,
      type: "Deadline",
      startTime: p.deadline,
      projectId: p.id,
      status: p.status,
      eventKind: "deadline"
    }));

    return [...dayMeetings, ...dayDeadlines];
  };

  return (
    <div className="crm-container animate-fade-in">
      {/* Header controls */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Shared Calendar</h1>
          <p style={styles.subtitle}>Team meetings, client onboarding, and lead follow-up calendars</p>
        </div>
        
        {/* Filters */}
        <div style={styles.filterBar}>
          <button 
            onClick={() => setFilterType("all")} 
            className="crm-btn"
            style={{
              ...styles.filterTab,
              backgroundColor: filterType === "all" ? "var(--primary-color)" : "var(--bg-secondary)",
              color: filterType === "all" ? "#ffffff" : "var(--text-secondary)"
            }}
          >
            All Calendar
          </button>
          <button 
            onClick={() => setFilterType("my")} 
            className="crm-btn"
            style={{
              ...styles.filterTab,
              backgroundColor: filterType === "my" ? "var(--primary-color)" : "var(--bg-secondary)",
              color: filterType === "my" ? "#ffffff" : "var(--text-secondary)"
            }}
          >
            My Schedule
          </button>
          <select 
            className="crm-select" 
            style={{ width: "160px", height: "38px", padding: "0 0.5rem" }}
            value={filterType === "all" || filterType === "my" ? "" : filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">Select BDA</option>
            {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Calendar Navigation header */}
      <div className="crm-card" style={styles.navRow}>
        <div style={styles.navControls}>
          <button onClick={prevMonth} style={styles.arrowBtn}><ChevronLeft size={20} /></button>
          <h2 style={styles.monthTitle}>
            {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
          </h2>
          <button onClick={nextMonth} style={styles.arrowBtn}><ChevronRight size={20} /></button>
        </div>

        <div style={styles.viewSelector}>
          <button onClick={() => setView("month")} style={{ ...styles.viewBtn, color: view === "month" ? "var(--primary-color)" : "var(--text-secondary)" }}><Grid3X3 size={16} /> Month</button>
          <button onClick={() => setView("list")} style={{ ...styles.viewBtn, color: view === "list" ? "var(--primary-color)" : "var(--text-secondary)" }}><List size={16} /> List View</button>
        </div>
      </div>

      {/* Calendar Display */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "6rem" }}>
          <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        </div>
      ) : view === "month" ? (
        <div style={styles.calendarGrid}>
          {/* Weekday Names */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
            <div key={day} style={styles.weekdayHeader}>{day}</div>
          ))}

          {/* Blank boxes for month offset */}
          {blanksArray.map(b => (
            <div key={`blank-${b}`} style={styles.calendarCellEmpty} />
          ))}

          {/* Actual days */}
          {daysArray.map(day => {
            const dayEvents = getEventsForDay(day);
            const isToday = day === new Date().getDate() && currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear();
            return (
              <div key={day} style={{ ...styles.calendarCell, backgroundColor: isToday ? "rgba(99, 102, 241, 0.03)" : "var(--bg-secondary)" }}>
                <span style={{ 
                  ...styles.dayNumber, 
                  backgroundColor: isToday ? "var(--primary-color)" : "transparent",
                  color: isToday ? "#ffffff" : "var(--text-primary)"
                }}>
                  {day}
                </span>

                <div style={styles.eventContainer}>
                  {dayEvents.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => {
                        if (m.projectId) router.push(`/dashboard/projects/${m.projectId}`);
                        else if (m.leadId) router.push(`/dashboard/leads/${m.leadId}`);
                      }}
                      style={{
                        ...styles.eventItem,
                        borderLeftColor: m.eventKind === "deadline" ? "var(--danger-color)" : m.type === "Call" ? "var(--info-color)" : m.type === "Follow-up" ? "var(--warning-color)" : "var(--primary-color)",
                        backgroundColor: m.eventKind === "deadline" ? "rgba(239, 68, 68, 0.08)" : "var(--bg-primary)"
                      }}
                    >
                      <div style={{ ...styles.eventTitle, fontWeight: m.eventKind === "deadline" ? 600 : 500 }}>{m.title}</div>
                      <div style={styles.eventTime}>
                        {m.eventKind === "deadline" ? "Target Due" : new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="crm-card" style={{ padding: 0 }}>
          {filteredMeetings.length === 0 && filteredProjects.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)" }}>No meetings or deadlines scheduled for this filter.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                ...filteredMeetings.map(m => ({ ...m, eventKind: "meeting" })),
                ...filteredProjects.map(p => ({
                  id: `proj-${p.id}`,
                  title: `Deadline: ${p.name}`,
                  type: "Project Deadline",
                  startTime: p.deadline,
                  projectId: p.id,
                  status: p.status,
                  eventKind: "deadline",
                  project: p
                }))
              ].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => {
                    if (m.projectId) router.push(`/dashboard/projects/${m.projectId}`);
                    else if (m.leadId) router.push(`/dashboard/leads/${m.leadId}`);
                  }}
                  style={styles.listItem}
                >
                  <div style={styles.listItemTimeCol}>
                    <CalendarIcon size={16} style={{ color: m.eventKind === "deadline" ? "var(--danger-color)" : "var(--text-tertiary)" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: m.eventKind === "deadline" ? "var(--danger-color)" : "inherit" }}>{new Date(m.startTime).toLocaleDateString()}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {m.eventKind === "deadline" ? "Deadline" : new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{m.title}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Type: {m.type} {m.lead && `• Lead: ${m.lead.name} (${m.lead.company})`} {m.project && `• Project: ${m.project.name}`}
                    </div>
                  </div>

                  <div>
                    <span className={`badge ${m.status === "Completed" ? "badge-success" : m.status === "Issue" ? "badge-danger" : "badge-info"}`}>{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    flexWrap: "wrap",
    gap: "1.5rem",
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
  filterBar: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  filterTab: {
    padding: "0.5rem 1rem",
    fontSize: "0.8125rem",
    border: "1px solid var(--border-primary)",
    height: "38px",
  },
  navRow: {
    padding: "1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  arrowBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  monthTitle: {
    fontSize: "1.125rem",
    fontWeight: 700,
    width: "180px",
    textAlign: "center",
  },
  viewSelector: {
    display: "flex",
    gap: "0.5rem",
  },
  viewBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.875rem",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    overflow: "hidden",
    backgroundColor: "var(--border-primary)",
    gap: "1px",
  },
  weekdayHeader: {
    backgroundColor: "var(--bg-tertiary)",
    padding: "0.75rem",
    textAlign: "center",
    fontSize: "0.8125rem",
    fontWeight: 600,
    color: "var(--text-secondary)",
  },
  calendarCell: {
    minHeight: "120px",
    padding: "0.5rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  calendarCellEmpty: {
    backgroundColor: "var(--bg-primary)",
  },
  dayNumber: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.8125rem",
    fontWeight: 600,
  },
  eventContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    overflowY: "auto",
    flexGrow: 1,
  },
  eventItem: {
    padding: "0.25rem 0.5rem",
    borderRadius: "4px",
    backgroundColor: "var(--bg-primary)",
    borderLeft: "3px solid var(--primary-color)",
    border: "1px solid var(--border-primary)",
    fontSize: "0.75rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  eventTitle: {
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  eventTime: {
    color: "var(--text-tertiary)",
    fontSize: "0.65rem",
    marginTop: "1px",
  },
  listItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--border-primary)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  listItemTimeCol: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    width: "160px",
    flexShrink: 0,
    fontSize: "0.875rem",
  },
};
