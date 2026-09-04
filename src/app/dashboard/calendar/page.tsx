"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Calendar as CalendarIcon, Clock, User, Filter, 
  ChevronLeft, ChevronRight, List, Grid3X3, Briefcase, Users,
  Video, Plus, ExternalLink, CheckCircle2, Sparkles, UserCheck, Trash2, CalendarCheck, Edit3
} from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

type CalendarView = "month" | "week" | "day" | "list";

export default function CalendarPage() {
  const router = useRouter();
  const { currentUser, bdas, devs, openQuickAdd, triggerRefresh } = useDashboard();
  const isDeveloper = currentUser?.roleName === "Developer";
  
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>("month");
  
  // Selected Event Details Modal
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Schedule Google Meet Modal
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: "",
    type: "Meeting",
    startTime: "",
    durationMinutes: "30",
    projectId: "",
    notes: "",
    customMeetLink: "",
    assignedUserIds: [] as string[]
  });
  
  // Filtering state
  const [filterType, setFilterType] = useState<"all" | "my" | string>("all"); // 'all' | 'my' | bdaUserId

  const [allUsers, setAllUsers] = useState<any[]>([]);

  useEffect(() => {
    async function loadCalendarData() {
      try {
        const [meetRes, projRes, userRes] = await Promise.all([
          fetch("/api/meetings"),
          fetch("/api/projects"),
          fetch("/api/users")
        ]);
        if (meetRes.ok) {
          const meetData = await meetRes.json();
          setMeetings(meetData.meetings || []);
        }
        if (projRes.ok) {
          const projData = await projRes.json();
          setProjects(projData.projects || []);
        }
        if (userRes.ok) {
          const uData = await userRes.json();
          setAllUsers(uData.users || []);
        }
      } catch (err) {
        console.error("Error loading calendar events:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendarData();
  }, [triggerRefresh]);

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

// Predefined Gazetted & Sectioned Public Holidays
const SECTIONED_HOLIDAYS = [
  { month: 0, day: 1, title: "New Year's Day", type: "Holiday", description: "Global New Year Celebration", kind: "gazetted" },
  { month: 0, day: 26, title: "Republic Day", type: "Holiday", description: "National Holiday - Republic Day of India", kind: "national" },
  { month: 2, day: 14, title: "Holi (Festival of Colours)", type: "Holiday", description: "Gazetted Festival Holiday", kind: "gazetted" },
  { month: 2, day: 31, title: "Id-ul-Fitr (Eid)", type: "Holiday", description: "Gazetted Public Holiday", kind: "gazetted" },
  { month: 3, day: 14, title: "Dr. Ambedkar Jayanti / Baisakhi", type: "Holiday", description: "Gazetted Public Holiday", kind: "gazetted" },
  { month: 4, day: 1, title: "May Day / International Workers' Day", type: "Holiday", description: "Public Holiday", kind: "gazetted" },
  { month: 5, day: 7, title: "Bakrid / Eid al-Adha", type: "Holiday", description: "Gazetted Festival Holiday", kind: "gazetted" },
  { month: 6, day: 6, title: "Muharram", type: "Holiday", description: "Gazetted Public Holiday", kind: "gazetted" },
  { month: 7, day: 15, title: "Independence Day", type: "Holiday", description: "National Holiday - Independence Day of India", kind: "national" },
  { month: 7, day: 27, title: "Raksha Bandhan / Janmashtami", type: "Holiday", description: "Festive Holiday", kind: "gazetted" },
  { month: 8, day: 5, title: "Milad-un-Nabi (Id-e-Milad)", type: "Holiday", description: "Gazetted Public Holiday", kind: "gazetted" },
  { month: 9, day: 2, title: "Mahatma Gandhi Jayanti", type: "Holiday", description: "National Holiday - Birthday of Mahatma Gandhi", kind: "national" },
  { month: 9, day: 20, title: "Dussehra / Vijayadashami", type: "Holiday", description: "Gazetted Festival Holiday", kind: "gazetted" },
  { month: 10, day: 8, title: "Diwali (Deepavali)", type: "Holiday", description: "Gazetted Festival of Lights", kind: "gazetted" },
  { month: 10, day: 10, title: "Govardhan Puja / Bhai Dooj", type: "Holiday", description: "Festive Holiday", kind: "gazetted" },
  { month: 10, day: 24, title: "Guru Nanak Jayanti", type: "Holiday", description: "Gazetted Festival Holiday", kind: "gazetted" },
  { month: 11, day: 25, title: "Christmas Day", type: "Holiday", description: "Gazetted Public Holiday", kind: "gazetted" },
  { month: 11, day: 31, title: "New Year's Eve", type: "Holiday", description: "Sectioned Observance / Year End", kind: "gazetted" }
];

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

    // Find any sectioned / gazetted holidays for this month & day
    const dayHolidays = SECTIONED_HOLIDAYS.filter(
      h => h.month === currentDate.getMonth() && h.day === day
    ).map((h, idx) => {
      const holidayDate = new Date(currentDate.getFullYear(), h.month, h.day, 9, 0, 0);
      return {
        id: `holiday-${h.month}-${h.day}-${idx}`,
        title: `🎉 ${h.title}`,
        type: h.type,
        notes: h.description,
        startTime: holidayDate.toISOString(),
        status: "Holiday",
        eventKind: "holiday",
        isHoliday: true,
        kind: h.kind
      };
    });

    return [...dayHolidays, ...dayMeetings, ...dayDeadlines];
  };

  const handleScheduleGMeetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingForm.title || !meetingForm.startTime) return;
    setScheduleLoading(true);

    const gmeetLink = meetingForm.customMeetLink.trim();

    const attendees = Array.from(new Set([
      ...(meetingForm.assignedUserIds.length > 0 ? meetingForm.assignedUserIds : []),
      currentUser?.id
    ].filter(Boolean)));

    let notesText = meetingForm.notes ? meetingForm.notes.trim() : "";
    if (gmeetLink) {
      notesText = notesText ? `${notesText}\n\nGoogle Meet Link: ${gmeetLink}` : `Google Meet Link: ${gmeetLink}`;
    }

    const newMeetingData = {
      title: meetingForm.title,
      type: "Meeting",
      startTime: new Date(meetingForm.startTime).toISOString(),
      notes: notesText,
      projectId: meetingForm.projectId || undefined,
      assignedUserIds: attendees
    };

    // Optimistic UI Append for 0ms instant feedback
    const optimisticMeeting = {
      id: `temp-${Date.now()}`,
      ...newMeetingData,
      status: "Upcoming",
      assignedUserIds: attendees,
      createdAt: new Date().toISOString()
    };
    setMeetings(prev => [...prev, optimisticMeeting]);
    setShowScheduleModal(false);

    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMeetingData)
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(prev => prev.map(m => m.id === optimisticMeeting.id ? data.meeting : m));
        setMeetingForm({
          title: "",
          type: "Meeting",
          startTime: "",
          durationMinutes: "30",
          projectId: "",
          notes: "",
          customMeetLink: "",
          assignedUserIds: []
        });
      } else {
        const err = await res.json();
        setMeetings(prev => prev.filter(m => m.id !== optimisticMeeting.id));
        alert(err.error || "Failed to schedule meeting");
      }
    } catch (err) {
      console.error(err);
      setMeetings(prev => prev.filter(m => m.id !== optimisticMeeting.id));
      alert("Failed to schedule meeting");
    } finally {
      setScheduleLoading(false);
    }
  };

  return (
    <div className="crm-container animate-fade-in">
      {/* Header controls */}
      <div style={styles.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <h1 style={styles.title}>Shared Calendar</h1>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {meetings.length} {meetings.length === 1 ? "Meeting" : "Meetings"}
            </span>
          </div>
          <p style={styles.subtitle}>Team meetings, client calls, Google Meet discussions, and project deadlines</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          {/* Schedule GMeet Button */}
          <button 
            onClick={() => setShowScheduleModal(true)} 
            className="crm-btn crm-btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <Video size={16} /> Schedule Google Meet
          </button>

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
            {!isDeveloper && (
              <select 
                className="crm-select" 
                style={{ width: "160px", height: "38px", padding: "0 0.5rem" }}
                value={filterType === "all" || filterType === "my" ? "" : filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="">Select BDA</option>
                {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
          </div>
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
        <AiLoader label="Synchronizing Global Calendar Events..." sublabel="Fetching Google Meet appointments, deadlines, and team schedules" />
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
                      onClick={() => setSelectedEvent(m)}
                      style={{
                        ...styles.eventItem,
                        borderLeftColor: m.isHoliday ? "#f43f5e" : m.eventKind === "deadline" ? "var(--danger-color)" : m.type === "Call" ? "var(--info-color)" : m.type === "Follow-up" ? "var(--warning-color)" : "var(--primary-color)",
                        backgroundColor: m.isHoliday ? "rgba(244, 63, 94, 0.1)" : m.eventKind === "deadline" ? "rgba(239, 68, 68, 0.08)" : "var(--bg-primary)"
                      }}
                    >
                      <div style={{ ...styles.eventTitle, fontWeight: m.isHoliday || m.eventKind === "deadline" ? 600 : 500, color: m.isHoliday ? "#e11d48" : "inherit" }}>
                        {m.title}
                      </div>
                      <div style={styles.eventTime}>
                        {m.isHoliday ? "Gazetted Holiday" : m.eventKind === "deadline" ? "Target Due" : new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-tertiary)" }}>No meetings, holidays, or deadlines scheduled for this filter.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                ...SECTIONED_HOLIDAYS.map((h, idx) => ({
                  id: `holiday-list-${h.month}-${h.day}-${idx}`,
                  title: `🎉 ${h.title}`,
                  type: "Official Holiday",
                  notes: h.description,
                  startTime: new Date(currentDate.getFullYear(), h.month, h.day, 9, 0, 0).toISOString(),
                  status: "Holiday",
                  eventKind: "holiday",
                  isHoliday: true
                })),
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
                  onClick={() => setSelectedEvent(m)}
                  style={{
                    ...styles.listItem,
                    backgroundColor: m.isHoliday ? "rgba(244, 63, 94, 0.04)" : "transparent"
                  }}
                >
                  <div style={styles.listItemTimeCol}>
                    <CalendarIcon size={16} style={{ color: m.isHoliday ? "#f43f5e" : m.eventKind === "deadline" ? "var(--danger-color)" : "var(--text-tertiary)" }} />
                    <div>
                      <div style={{ fontWeight: 600, color: m.isHoliday ? "#e11d48" : m.eventKind === "deadline" ? "var(--danger-color)" : "inherit" }}>{new Date(m.startTime).toLocaleDateString()}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {m.isHoliday ? "Official Holiday" : m.eventKind === "deadline" ? "Deadline" : new Date(m.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  <div style={{ flexGrow: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ fontWeight: 600, fontSize: "1rem" }}>{m.title}</div>
                      {m.notes?.includes("meet.google.com") && (
                        <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", padding: "1px 6px", borderRadius: "4px", fontWeight: 600, display: "flex", alignItems: "center", gap: "3px" }}>
                          <Video size={10} /> Google Meet
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Type: {m.type} {m.lead && `• Lead: ${m.lead.name} (${m.lead.company})`} {m.project && `• Project: ${m.project.name}`}
                    </div>
                    {m.notes?.includes("meet.google.com") && (
                      <div style={{ marginTop: "6px" }}>
                        <a
                          href={m.notes.split("Google Meet Link:")[1]?.trim().split(" ")[0] || m.notes.match(/https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+/)?.[0] || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#ffffff",
                            backgroundColor: "var(--primary-color)",
                            padding: "0.25rem 0.625rem",
                            borderRadius: "6px",
                            textDecoration: "none"
                          }}
                        >
                          <Video size={12} /> Join Google Meet <ExternalLink size={11} />
                        </a>
                      </div>
                    )}
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

      {/* Schedule Google Meet Modal */}
      {showScheduleModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="animate-fade-in" style={{
            width: "100%",
            maxWidth: "480px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "12px",
            border: "1px solid var(--border-primary)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-primary)", paddingBottom: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Video size={18} />
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>Schedule Google Meet</h3>
              </div>
              <button onClick={() => setShowScheduleModal(false)} style={{ border: "none", background: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-tertiary)" }}>&times;</button>
            </div>

            <form onSubmit={handleScheduleGMeetSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Meeting Title / Topic
                </label>
                <input 
                  type="text" 
                  className="crm-input"
                  placeholder="e.g. Sprint Review / Architecture Discussion"
                  value={meetingForm.title}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                    Date & Time
                  </label>
                  <input 
                    type="datetime-local" 
                    className="crm-input"
                    value={meetingForm.startTime}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                    Duration
                  </label>
                  <select 
                    className="crm-select"
                    value={meetingForm.durationMinutes}
                    onChange={(e) => setMeetingForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Related Project (Optional)
                </label>
                <select 
                  className="crm-select"
                  value={meetingForm.projectId}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, projectId: e.target.value }))}
                >
                  <option value="">None (General Meeting)</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Invite Team Members */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
                    Invite Team Members / Developers ({meetingForm.assignedUserIds.length} selected)
                  </label>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <button
                      type="button"
                      onClick={() => {
                        const targetList = allUsers.length > 0 ? allUsers : [...bdas, ...devs];
                        setMeetingForm(prev => ({
                          ...prev,
                          assignedUserIds: targetList.map((u: any) => u.id)
                        }));
                      }}
                      style={{ fontSize: "0.7rem", color: "var(--primary-color)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                    >
                      Select All
                    </button>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>•</span>
                    <button
                      type="button"
                      onClick={() => setMeetingForm(prev => ({ ...prev, assignedUserIds: [] }))}
                      style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", maxHeight: "120px", overflowY: "auto", padding: "0.6rem", border: "1px solid var(--border-primary)", borderRadius: "8px", backgroundColor: "var(--bg-primary)" }}>
                  {(allUsers.length > 0 ? allUsers : [...bdas, ...devs]).map((user: any) => {
                    const isSelected = meetingForm.assignedUserIds.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          setMeetingForm(prev => ({
                            ...prev,
                            assignedUserIds: isSelected 
                              ? prev.assignedUserIds.filter(id => id !== user.id)
                              : [...prev.assignedUserIds, user.id]
                          }));
                        }}
                        style={{
                          fontSize: "0.75rem",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          border: isSelected ? "1px solid var(--primary-color)" : "1px solid var(--border-secondary)",
                          backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-secondary)",
                          color: isSelected ? "var(--primary-color)" : "var(--text-primary)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontWeight: isSelected ? 600 : 400
                        }}
                      >
                        {isSelected ? <CheckCircle2 size={13} /> : <span style={{ width: "10px", height: "10px", borderRadius: "50%", border: "1px solid var(--border-secondary)" }} />}
                        {user.name} <span style={{ fontSize: "0.68rem", opacity: 0.75 }}>({user.roleName || user.role?.name || "Member"})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                    Google Meet URL / Meeting Link
                  </label>
                  <a 
                    href="https://meet.google.com/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: "3px" }}
                  >
                    <Plus size={12} /> Create on Google Meet <ExternalLink size={11} />
                  </a>
                </div>
                <input 
                  type="url" 
                  className="crm-input"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingForm.customMeetLink}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, customMeetLink: e.target.value }))}
                />
                <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "3px", display: "block" }}>
                  Click "Create on Google Meet" to open a real meeting room, then paste the link here.
                </span>
              </div>

              <div>
                <label style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  Meeting Agenda / Notes
                </label>
                <textarea 
                  className="crm-textarea"
                  rows={2}
                  placeholder="Briefly describe key agenda points..."
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="crm-btn crm-btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={scheduleLoading} className="crm-btn crm-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Video size={16} />
                  {scheduleLoading ? "Scheduling..." : "Create GMeet Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="animate-fade-in" style={{
            width: "100%",
            maxWidth: "460px",
            backgroundColor: "var(--bg-secondary)",
            borderRadius: "12px",
            border: "1px solid var(--border-primary)",
            padding: "1.75rem",
            boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
              <div>
                <span className={`badge ${selectedEvent.isHoliday ? "badge-danger" : selectedEvent.eventKind === "deadline" ? "badge-danger" : selectedEvent.status === "Completed" ? "badge-success" : "badge-primary"}`} style={{ marginBottom: "0.5rem", backgroundColor: selectedEvent.isHoliday ? "#f43f5e" : undefined, color: selectedEvent.isHoliday ? "#fff" : undefined }}>
                  {selectedEvent.isHoliday ? "🎉 Official Gazetted Holiday" : selectedEvent.eventKind === "deadline" ? "Project Target Deadline" : selectedEvent.type}
                </span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>{selectedEvent.title}</h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} style={{ border: "none", background: "none", fontSize: "1.25rem", cursor: "pointer", color: "var(--text-tertiary)" }}>&times;</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
                <Clock size={16} />
                <span>{new Date(selectedEvent.startTime).toLocaleString([], { dateStyle: "full", timeStyle: "short" })}</span>
              </div>

              {selectedEvent.notes && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)", whiteSpace: "pre-wrap" }}>
                  {selectedEvent.notes}
                </div>
              )}

              {selectedEvent.notes?.includes("meet.google.com") && (
                <a
                  href={selectedEvent.notes.split("Google Meet Link:")[1]?.trim().split(" ")[0] || selectedEvent.notes.match(/https:\/\/meet\.google\.com\/[a-zA-Z0-9-]+/)?.[0] || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "#ffffff",
                    backgroundColor: "var(--primary-color)",
                    padding: "0.625rem 1.25rem",
                    borderRadius: "8px",
                    textDecoration: "none",
                    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.2)"
                  }}
                >
                  <Video size={16} /> Join Google Meet Call <ExternalLink size={14} />
                </a>
              )}

              {selectedEvent.projectId && (
                <button 
                  onClick={() => {
                    const pid = selectedEvent.projectId;
                    setSelectedEvent(null);
                    router.push(`/dashboard/projects/${pid}`);
                  }}
                  className="crm-btn crm-btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Briefcase size={15} /> View Project Workspace →
                </button>
              )}

              {/* Super Admin Manage & Delete Controls */}
              {selectedEvent.eventKind !== "deadline" && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-primary)", paddingTop: "1rem" }}>
                  {currentUser?.roleName === "Super Admin" || currentUser?.roleName === "BDA" ? (
                    <button
                      onClick={async () => {
                        const newStatus = selectedEvent.status === "Completed" ? "Upcoming" : "Completed";
                        try {
                          const res = await fetch(`/api/meetings/${selectedEvent.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus })
                          });
                          if (res.ok) {
                            setMeetings(prev => prev.map(m => m.id === selectedEvent.id ? { ...m, status: newStatus } : m));
                            setSelectedEvent(null);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="crm-btn crm-btn-secondary"
                      style={{ flex: 1, justifyContent: "center", fontSize: "0.75rem" }}
                    >
                      <CheckCircle2 size={13} /> {selectedEvent.status === "Completed" ? "Mark Upcoming" : "Mark Completed"}
                    </button>
                  ) : null}

                  {currentUser?.roleName === "Super Admin" && (
                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete meeting "${selectedEvent.title}"?`)) {
                          try {
                            const res = await fetch(`/api/meetings/${selectedEvent.id}`, { method: "DELETE" });
                            if (res.ok) {
                              setMeetings(prev => prev.filter(m => m.id !== selectedEvent.id));
                              setSelectedEvent(null);
                            } else {
                              const err = await res.json();
                              alert(err.error || "Failed to delete meeting");
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className="crm-btn"
                      style={{ backgroundColor: "var(--danger-light)", color: "var(--danger-color)", borderColor: "var(--danger-color)", fontSize: "0.75rem", padding: "0.5rem 0.75rem" }}
                      title="Delete meeting (Super Admin)"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
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
