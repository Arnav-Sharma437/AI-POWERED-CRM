"use client";

import React, { useState, useEffect, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, UserSquare2, Briefcase, Calendar, 
  Activity, Bell, Trash2, Settings, Plus, Search, LogOut, 
  User, CheckCircle2, AlertCircle, FileText, CalendarRange, Clock, CreditCard, MessageSquare,
  Sparkles, Zap, Cpu, Bot, Sun, Moon, Building2, Home, MapPin, Menu, X, ReceiptText,
  ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen
} from "lucide-react";

// Context for global state sharing (Quick Add triggers, attendance timer, etc.)
export const formatSecondsToHms = (totalSec: number) => {
  if (!totalSec || totalSec <= 0) return "00h 00m 00s";
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = Math.floor(totalSec % 60);
  return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
};

interface DashboardContextType {
  currentUser: any;
  triggerRefresh: number;
  setTriggerRefresh: React.Dispatch<React.SetStateAction<number>>;
  openQuickAdd: (type: string, data?: any) => void;
  bdas: any[];
  devs: any[];
  clientsList: any[];
  projectsList: any[];
  // Attendance and live stopwatch states
  isWorking: boolean;
  shiftLocation: "Office" | "Home";
  liveWorkedSeconds: number;
  formatSecondsToHms: (sec: number) => string;
  setShowShiftModal: (modal: "start" | "end" | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardLayout");
  }
  return context;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("crm_user");
        return cached ? JSON.parse(cached) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [bdas, setBdas] = useState<any[]>([]);
  const [devs, setDevs] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  
  // UI states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("crm_sidebar_collapsed") === "true";
    }
    return false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [quickAddType, setQuickAddType] = useState<string | null>(null); // 'lead' | 'client' | 'project' | 'meeting' | 'payment' | 'note'
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());

  // In-Dashboard Workday Attendance & Clock-In / Clock-Out states
  const [isWorking, setIsWorking] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("crm_is_working");
      return saved === "true";
    }
    return false;
  });
  const [workStartedAt, setWorkStartedAt] = useState<Date | null>(null);
  const [showShiftModal, setShowShiftModal] = useState<"start" | "end" | null>(null);
  const [shiftLocation, setShiftLocation] = useState<"Office" | "Home">("Office");
  const [shiftNote, setShiftNote] = useState("");
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [baseWorkedSeconds, setBaseWorkedSeconds] = useState<number>(0);
  const [currentSessionStart, setCurrentSessionStart] = useState<string | null>(null);
  const [liveWorkedSeconds, setLiveWorkedSeconds] = useState<number>(0);

  // Live stopwatch and topbar clock ticking every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentLiveTime(new Date());

      if (isWorking && currentSessionStart) {
        const sessionElapsedSec = Math.max(0, Math.floor((Date.now() - new Date(currentSessionStart).getTime()) / 1000));
        setLiveWorkedSeconds(baseWorkedSeconds + sessionElapsedSec);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorking, currentSessionStart, baseWorkedSeconds]);

  // 30-second Heartbeat for active session & system liveness
  useEffect(() => {
    if (!currentUser || !isWorking) return;

    const pingHeartbeat = async () => {
      try {
        await fetch("/api/auth/attendance/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "heartbeat", location: shiftLocation })
        });
      } catch (err) {
        // quiet catch
      }
    };

    // Ping immediately then every 30s
    pingHeartbeat();
    const hbInterval = setInterval(pingHeartbeat, 30000);

    return () => {
      clearInterval(hbInterval);
    };
  }, [currentUser, isWorking, shiftLocation]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("crm_theme") as "light" | "dark" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const initial = prefersDark ? "dark" : "light";
      setTheme(initial);
      document.documentElement.className = initial;
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("crm_theme", newTheme);
    document.documentElement.className = newTheme;
  };

  // Quick Add forms state
  const [leadForm, setLeadForm] = useState({ name: "", linkedinUrl: "", company: "", jobTitle: "", country: "", city: "", industry: "", profilePhoto: "", source: "LinkedIn", customSource: "", priority: "Warm", status: "New", notes: "", tags: "", primaryBdaId: "", assignedBdaIds: [] as string[] });
  const [enriching, setEnriching] = useState(false);
  const [clientForm, setClientForm] = useState({ name: "", email: "", company: "", phone: "", website: "" });
  const [projectForm, setProjectForm] = useState({ 
    name: "", 
    clientId: "", 
    status: "Ongoing",
    source: "Upwork", 
    platform: "Upwork",
    platformAccountId: "Rakesh",
    startDate: "", 
    deadline: "", 
    deadlineTime: "18:00", 
    currency: "INR", 
    pricingModel: "Fixed", 
    hourlyRate: "", 
    estimatedHours: "", 
    finalBudget: "", 
    bonus: "0", 
    primaryBdaId: "", 
    serviceType: "Web Design",
    devId: "",
    workDetails: ""
  });
  const [meetingForm, setMeetingForm] = useState({ title: "", type: "Meeting", startTime: "", notes: "", leadId: "", projectId: "", assignedUserIds: [] as string[] });
  const [paymentForm, setPaymentForm] = useState({ projectId: "", amount: "", note: "" });
  const [noteForm, setNoteForm] = useState({ leadId: "", projectId: "", content: "" });
  
  const [showInnerClientForm, setShowInnerClientForm] = useState(false);
  const [innerClientForm, setInnerClientForm] = useState({ name: "", email: "", company: "", phone: "", website: "" });
  const [innerClientLoading, setInnerClientLoading] = useState(false);
  const [customServiceType, setCustomServiceType] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        const count = data.conversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
        setUnreadChatCount(count);
      }
    } catch (err) {
      console.error("Failed to fetch unread chat count:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    }
  }, [currentUser, triggerRefresh]);

  // Dynamic Browser Tab Title with unread message badge (e.g. "(3) Pixxelu CRM - Agency Operations")
  useEffect(() => {
    if (typeof document !== "undefined") {
      const baseTitle = "Pixxelu CRM - Agency Operations";
      if (unreadChatCount > 0) {
        document.title = `(${unreadChatCount}) ${baseTitle}`;
      } else {
        document.title = baseTitle;
      }
    }
  }, [unreadChatCount]);

  const [popupNotification, setPopupNotification] = useState<{ id?: string; title: string; message: string; linkUrl?: string } | null>(null);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Request browser desktop notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  const sendDesktopNotification = (title: string, body: string, url?: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const notif = new Notification(title, {
          body,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `crm-${Date.now()}`
        });
        notif.onclick = () => {
          window.focus();
          if (url) router.push(url);
          notif.close();
        };
      } catch (e) {
        console.error("Desktop notification trigger failed:", e);
      }
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    const eventSource = new EventSource("/api/chat/realtime");
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message") {
          const newMsg = payload.data;
          fetchUnreadCount();
          fetchNotifications();

          // If message is from someone else, display a floating notification popup toast
          if (newMsg.senderId !== currentUser.id) {
            setPopupNotification({
              title: `New Message from ${newMsg.senderName}`,
              message: newMsg.content || "Sent an attachment",
              linkUrl: `/dashboard/chat?id=${newMsg.conversationId}`
            });

            // Native Desktop / System popup notification if user is in another tab or minimized
            sendDesktopNotification(
              `New Message from ${newMsg.senderName}`,
              newMsg.content || "Sent an attachment in CRM chat",
              `/dashboard/chat?id=${newMsg.conversationId}`
            );

            // Auto dismiss popup after 6 seconds
            setTimeout(() => {
              setPopupNotification(null);
            }, 6000);
          }
        } else if (payload.type === "read") {
          fetchUnreadCount();
        } else if (payload.type === "crm_update") {
          // Instant sync for all dashboards, calendar, leads, and projects
          setTriggerRefresh(prev => prev + 1);
          fetchNotifications();

          const upd = payload.data;
          if (upd && upd.entity === "meeting") {
            const meeting = upd.meeting;
            const assignedIds = meeting?.assignedUserIds || meeting?.assignments?.map((a: any) => a.userId) || [];
            if (assignedIds.includes(currentUser.id)) {
              setPopupNotification({
                title: `Meeting Invitation`,
                message: `Scheduled: "${meeting.title}"`,
                linkUrl: `/dashboard/calendar`
              });
              sendDesktopNotification(
                `📅 Meeting Scheduled: ${meeting.title}`,
                `You have a new meeting scheduled on your calendar. Click to view.`,
                `/dashboard/calendar`
              );
              setTimeout(() => {
                setPopupNotification(null);
              }, 6000);
            }
          }
        }
      } catch (err) {
        console.error("SSE parse error in layout:", err);
      }
    };
    return () => {
      eventSource.close();
    };
  }, [currentUser]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial profile & reference data
  useEffect(() => {
    async function loadInitialData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) {
          if (meRes.status === 401 && typeof window !== "undefined" && !localStorage.getItem("crm_user")) {
            router.push("/login");
          }
          return;
        }
        const meData = await meRes.json();
        if (meData?.user) {
          setCurrentUser(meData.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("crm_user", JSON.stringify(meData.user));
          }
        }

        // Parallelize all reference data calls for ultra-fast load
        const [uRes, clRes, prRes, attRes] = await Promise.all([
          fetch("/api/users"),
          fetch("/api/clients"),
          fetch("/api/projects"),
          fetch(`/api/auth/attendance?_t=${Date.now()}`, { cache: "no-store" })
        ]);

        if (uRes.ok) {
          const uData = await uRes.json();
          setBdas(uData.users.filter((u: any) => u.isActive && (u.roleName === "BDA" || u.roleName === "Super Admin")));
          setDevs(uData.users.filter((u: any) => u.isActive && u.roleName === "Developer"));
        }

        if (clRes.ok) {
          const clData = await clRes.json();
          setClientsList(clData.clients || []);
        }

        if (prRes.ok) {
          const prData = await prRes.json();
          setProjectsList(prData.projects || []);
        }

        if (attRes.ok) {
          const attData = await attRes.json();
          const mySummary = attData.userSummaries?.find((u: any) => u.userId === meData.user.id);
          if (mySummary) {
            const workingState = Boolean(mySummary.isCurrentlyWorking);
            setIsWorking(workingState);
            if (typeof window !== "undefined") {
              localStorage.setItem("crm_is_working", String(workingState));
            }
            if (mySummary.currentLocation) {
              setShiftLocation(mySummary.currentLocation as "Office" | "Home");
            }
            const baseSec = mySummary.baseWorkedSecondsToday || 0;
            setBaseWorkedSeconds(baseSec);
            setCurrentSessionStart(mySummary.currentSessionStart || null);

            if (workingState && mySummary.currentSessionStart) {
              const sessionElapsedSec = Math.max(0, Math.floor((Date.now() - new Date(mySummary.currentSessionStart).getTime()) / 1000));
              setLiveWorkedSeconds(baseSec + sessionElapsedSec);
            } else {
              setLiveWorkedSeconds(mySummary.totalWorkedSeconds || (mySummary.totalWorkedMinutes || 0) * 60);
            }
          }
        }

        // Default primary BDA in forms to current user
        setLeadForm(prev => ({ ...prev, primaryBdaId: meData.user.id }));
        setProjectForm(prev => ({ ...prev, primaryBdaId: meData.user.id }));
        setMeetingForm(prev => ({ ...prev, assignedUserIds: [meData.user.id] }));

      } catch (err) {
        console.error("Failed to load initial layout data", err);
      }
    }
    loadInitialData();
  }, [triggerRefresh, router]);

  // Load Notifications
  useEffect(() => {
    if (!currentUser) return;
    async function loadNotifications() {
      const res = await fetch(`/api/notifications?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [currentUser, triggerRefresh]);

  // Global Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Global search error", err);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleStartWorkSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttendanceLoading(true);
    const nowIso = new Date().toISOString();
    // Immediate optimistic update
    setIsWorking(true);
    setCurrentSessionStart(nowIso);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_is_working", "true");
    }
    try {
      const res = await fetch("/api/auth/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_work",
          location: shiftLocation,
          note: shiftNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start workday");

      setIsWorking(true);
      const startAt = data.workStartedAt || nowIso;
      setCurrentSessionStart(startAt);
      setWorkStartedAt(new Date(startAt));
      if (currentUser) {
        setCurrentUser((prev: any) => ({ ...prev, workLocation: shiftLocation }));
      }
      showToast(data.message || `Work session started from ${shiftLocation}!`);
      setShowShiftModal(null);
      setShiftNote("");
      setTriggerRefresh(prev => prev + 1);
    } catch (err: any) {
      setIsWorking(false);
      setCurrentSessionStart(null);
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_is_working", "false");
      }
      showToast(err.message, "error");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleClockOutSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttendanceLoading(true);
    // Immediate optimistic update
    setIsWorking(false);
    setCurrentSessionStart(null);
    if (typeof window !== "undefined") {
      localStorage.setItem("crm_is_working", "false");
    }
    try {
      const res = await fetch("/api/auth/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clock_out",
          location: currentUser?.workLocation || shiftLocation,
          note: shiftNote
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clock out");

      setIsWorking(false);
      setCurrentSessionStart(null);
      showToast(data.message || "Clocked out successfully. Super Admin has been notified!");
      setShowShiftModal(null);
      setShiftNote("");
      setTriggerRefresh(prev => prev + 1);
    } catch (err: any) {
      setIsWorking(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("crm_is_working", "true");
      }
      showToast(err.message, "error");
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleNotificationClick = async (notif: any) => {
    // Optimistic UI state update immediately
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    setShowNotifications(false);
    try {
      await fetch(`/api/notifications/${notif.id}`, { method: "PUT" });
      setTriggerRefresh(prev => prev + 1);
    } catch (err) {
      console.error("Error updating notification", err);
    }
    if (notif.linkUrl) router.push(notif.linkUrl);
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!currentUser) return;
    // Optimistically mark all as read
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await fetch(`/api/notifications`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      setTriggerRefresh(prev => prev + 1);
    } catch (err) {
      console.error("Error marking all notifications read", err);
    }
  };

  // LinkedIn URL pasting triggers simulated enrichment
  const handleLinkedinPaste = async (url: string) => {
    setLeadForm(prev => ({ ...prev, linkedinUrl: url }));
    if (!url.includes("linkedin.com/")) return;

    setEnriching(true);
    showToast("Retrieving public profile details...", "info");
    try {
      const res = await fetch(`/api/leads/enrich?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const enriched = await res.json();
        setLeadForm(prev => ({
          ...prev,
          name: enriched.profile.name || prev.name,
          company: enriched.profile.company || prev.company,
          jobTitle: enriched.profile.jobTitle || prev.jobTitle,
          country: enriched.profile.country || "",
          city: enriched.profile.city || "",
          industry: enriched.profile.industry || "",
          notes: enriched.profile.notes || prev.notes
        }));
        
        if (enriched.profile.isEnriched) {
          showToast("LinkedIn profile details populated successfully!");
        } else {
          showToast("LinkedIn enrichment is not configured. Please fill details manually.", "info");
        }
      }
    } catch (err) {
      console.error("Enrichment error", err);
      showToast("Could not enrich automatically. Please fill details manually.", "info");
    } finally {
      setEnriching(false);
    }
  };

  // Submit handlers
  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    let url = "";
    let body: any = {};

    switch (quickAddType) {
      case "lead":
        url = "/api/leads";
        body = {
          ...leadForm,
          tags: leadForm.tags.split(",").map(t => t.trim()).filter(Boolean)
        };
        break;
      case "client":
        url = "/api/clients";
        body = clientForm;
        break;
      case "project":
        url = "/api/projects";
        const combinedProjectDeadline = projectForm.deadline 
          ? new Date(`${projectForm.deadline}T${projectForm.deadlineTime || "18:00"}:00`).toISOString()
          : undefined;
        body = {
          ...projectForm,
          deadline: combinedProjectDeadline,
          serviceType: projectForm.serviceType === "Other" ? customServiceType : projectForm.serviceType
        };
        break;
      case "meeting":
        url = "/api/meetings";
        body = meetingForm;
        break;
      case "payment":
        url = `/api/projects/${paymentForm.projectId}/payments`;
        body = paymentForm;
        break;
      case "note":
        url = `/api/activities`;
        body = {
          type: "Note",
          notes: noteForm.content,
          leadId: noteForm.leadId || undefined,
          projectId: noteForm.projectId || undefined
        };
        break;
    }

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      showToast(`${quickAddType?.toUpperCase()} added successfully!`);
      
      // Reset forms
      setLeadForm({ name: "", linkedinUrl: "", company: "", jobTitle: "", country: "", city: "", industry: "", profilePhoto: "", source: "LinkedIn", customSource: "", priority: "Warm", status: "New", notes: "", tags: "", primaryBdaId: currentUser?.id || "", assignedBdaIds: [] });
      setClientForm({ name: "", email: "", company: "", phone: "", website: "" });
      setProjectForm({ 
        name: "", 
        clientId: "", 
        status: "Ongoing",
        source: "Upwork (Rakesh)", 
        platform: "Upwork",
        platformAccountId: "Rakesh",
        startDate: "", 
        deadline: "", 
        deadlineTime: "18:00", 
        currency: "INR", 
        pricingModel: "Fixed", 
        hourlyRate: "", 
        estimatedHours: "", 
        finalBudget: "", 
        bonus: "0", 
        primaryBdaId: currentUser?.id || "", 
        serviceType: "Web Design",
        devId: "",
        workDetails: ""
      });
      setCustomServiceType("");
      setMeetingForm({ title: "", type: "Meeting", startTime: "", notes: "", leadId: "", projectId: "", assignedUserIds: [currentUser?.id || ""] });
      setPaymentForm({ projectId: "", amount: "", note: "" });
      setNoteForm({ leadId: "", projectId: "", content: "" });

      setQuickAddType(null);
      setTriggerRefresh(prev => prev + 1);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const allNavItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Leads", icon: UserSquare2, path: "/dashboard/leads" },
    { name: "Clients", icon: UserSquare2, path: "/dashboard/clients" },
    { name: "Projects", icon: Briefcase, path: "/dashboard/projects" },
    { name: "Payments", icon: CreditCard, path: "/dashboard/payments" },
    { name: "Invoices", icon: ReceiptText, path: "/dashboard/invoices", superAdminOnly: true },
    { name: "Calendar", icon: Calendar, path: "/dashboard/calendar" },
    { name: "Activities", icon: Activity, path: "/dashboard/activities" },
    { name: "Chat", icon: MessageSquare, path: "/dashboard/chat" },
    { name: "Team", icon: Users, path: "/dashboard/team" },
    { name: "Trash", icon: Trash2, path: "/dashboard/trash" },
  ];

  // Role-based navigation: 
  // Super Admin: sees all items including Invoices
  // Developer: Dashboard, Projects, Calendar, and Chat
  // BDA / Other: All except Invoices (Super Admin only) & Payments (Confidential)
  const navItems = currentUser?.roleName === "Developer"
    ? allNavItems.filter(item => ["Dashboard", "Projects", "Calendar", "Chat"].includes(item.name))
    : currentUser?.roleName === "Super Admin"
      ? allNavItems
      : allNavItems.filter(item => !item.superAdminOnly);

  return (
    <DashboardContext.Provider value={{
      currentUser,
      triggerRefresh,
      setTriggerRefresh,
      openQuickAdd: (type, data) => {
        setQuickAddType(type);
        if (type === "lead" && data) {
          setLeadForm(prev => ({ ...prev, ...data }));
        }
      },
      bdas,
      devs,
      clientsList,
      projectsList,
      isWorking,
      shiftLocation,
      liveWorkedSeconds,
      formatSecondsToHms,
      setShowShiftModal
    }}>
      <div className="crm-layout">
        {/* Mobile Backdrop Overlay */}
        {mobileSidebarOpen && (
          <div 
            onClick={() => setMobileSidebarOpen(false)}
            className="crm-sidebar-overlay"
          />
        )}

        {/* Left Sidebar */}
        <aside className={`crm-sidebar ${mobileSidebarOpen ? "mobile-open" : ""} ${isSidebarCollapsed ? "crm-sidebar-collapsed" : ""}`}>
          <div style={{ ...sidebarStyles.logoArea, display: "flex", justifyContent: "space-between", alignItems: "center", padding: isSidebarCollapsed ? "1.5rem 0.5rem" : "1.75rem 1.25rem", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", textDecoration: "none", cursor: "pointer", width: "100%", justifyContent: isSidebarCollapsed ? "center" : "flex-start" }} onClick={() => { router.push("/dashboard"); setMobileSidebarOpen(false); }}>
              <div style={{
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: isSidebarCollapsed ? "4px" : "4px 10px",
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid var(--border-primary)",
                boxShadow: "0 2px 10px rgba(0, 0, 0, 0.06)",
                width: isSidebarCollapsed ? "42px" : "100%",
                transition: "all 0.2s ease"
              }}>
                <img 
                  src="/logo.png" 
                  alt="Pixxelu" 
                  style={{ height: isSidebarCollapsed ? "20px" : "24px", width: "auto", objectFit: "contain" }} 
                />
              </div>
            </div>

            {/* Minimize / Expand Toggle Button (Desktop) */}
            <button
              onClick={() => {
                const nextState = !isSidebarCollapsed;
                setIsSidebarCollapsed(nextState);
                if (typeof window !== "undefined") {
                  localStorage.setItem("crm_sidebar_collapsed", String(nextState));
                }
              }}
              className="crm-sidebar-collapse-btn hidden md:flex"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Minimize Sidebar"}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                border: "1px solid var(--border-primary)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0
              }}
            >
              {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close Button */}
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="crm-mobile-sidebar-close"
              title="Close Menu"
            >
              <X size={20} />
            </button>
          </div>

          <nav style={{ ...sidebarStyles.nav, padding: isSidebarCollapsed ? "1.25rem 0.5rem" : "1.5rem 0.75rem" }}>
            {navItems.map(item => {
              const active = pathname === item.path || (item.path !== "/dashboard" && pathname.startsWith(item.path));
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.path);
                    setMobileSidebarOpen(false);
                  }}
                  title={isSidebarCollapsed ? item.name : undefined}
                  style={{
                    ...sidebarStyles.navItem,
                    backgroundColor: active ? "var(--primary-light)" : "transparent",
                    color: active ? "var(--primary-color)" : "var(--text-secondary)",
                    fontWeight: active ? 700 : 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: isSidebarCollapsed ? "center" : "space-between",
                    padding: isSidebarCollapsed ? "0.75rem" : "0.75rem 1rem",
                    width: "100%",
                    position: "relative"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: isSidebarCollapsed ? "0" : "0.75rem", justifyContent: isSidebarCollapsed ? "center" : "flex-start", width: isSidebarCollapsed ? "auto" : "100%" }}>
                    <item.icon size={isSidebarCollapsed ? 20 : 18} style={{ flexShrink: 0 }} />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </div>
                  {item.name === "Chat" && unreadChatCount > 0 && (
                    <span style={{
                      position: isSidebarCollapsed ? "absolute" : "static",
                      top: isSidebarCollapsed ? "4px" : "auto",
                      right: isSidebarCollapsed ? "4px" : "auto",
                      backgroundColor: "var(--danger-color)",
                      color: "#ffffff",
                      fontSize: "0.675rem",
                      fontWeight: 700,
                      borderRadius: "10px",
                      padding: "2px 6px",
                      lineHeight: 1
                    }}>
                      {unreadChatCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div style={{ ...sidebarStyles.footer, padding: isSidebarCollapsed ? "1rem 0.5rem" : "1.5rem" }}>
            {currentUser && (
              <div style={{ ...sidebarStyles.userCard, justifyContent: isSidebarCollapsed ? "center" : "flex-start" }} title={`${currentUser.name} (${currentUser.roleName})`}>
                <div style={{ ...sidebarStyles.avatar, overflow: "hidden", padding: 0 }}>
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={currentUser.name} 
                      style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
                    />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                {!isSidebarCollapsed && (
                  <div style={sidebarStyles.userInfo}>
                    <div style={sidebarStyles.userName}>{currentUser.name}</div>
                    <div style={sidebarStyles.userRole}>{currentUser.roleName}</div>
                  </div>
                )}
              </div>
            )}
            <button 
              onClick={handleLogout} 
              style={{ ...sidebarStyles.logoutBtn, padding: isSidebarCollapsed ? "0.625rem 0" : "0.625rem", justifyContent: "center" }}
              title="Logout Session"
            >
              <LogOut size={16} />
              {!isSidebarCollapsed && <span>Logout Session</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="crm-main-content">
          {/* Top Bar */}
          <header className="crm-topbar">
            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="crm-mobile-hamburger"
              title="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            {/* Global Search */}
            <div style={topbarStyles.searchArea} className="crm-topbar-search">
              <Search size={18} style={topbarStyles.searchIcon} />
              <input
                type="text"
                placeholder="Search leads, clients, projects, timeline..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchDropdown(true)}
                style={topbarStyles.searchInput}
              />
              {showSearchDropdown && searchResults && (
                <div style={topbarStyles.searchDropdown}>
                  <div style={topbarStyles.dropdownHeader}>
                    <span>Global Search Results</span>
                    <button onClick={() => { setShowSearchDropdown(false); setSearchQuery(""); }} style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.75rem", cursor: "pointer" }}>Clear</button>
                  </div>
                  <div style={topbarStyles.dropdownBody}>
                    {/* Leads */}
                    {searchResults.leads?.length > 0 && (
                      <div style={topbarStyles.section}>
                        <div style={topbarStyles.sectionTitle}>Leads ({searchResults.leads.length})</div>
                        {searchResults.leads.map((l: any) => (
                          <div key={l.id} onClick={() => { router.push(`/dashboard/leads/${l.id}`); setShowSearchDropdown(false); }} style={topbarStyles.resultItem}>
                            <div><strong>{l.name}</strong> - {l.company || "No Company"}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{l.status} • {l.priority}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Clients */}
                    {searchResults.clients?.length > 0 && (
                      <div style={topbarStyles.section}>
                        <div style={topbarStyles.sectionTitle}>Clients ({searchResults.clients.length})</div>
                        {searchResults.clients.map((c: any) => (
                          <div key={c.id} onClick={() => { router.push(`/dashboard/clients/${c.id}`); setShowSearchDropdown(false); }} style={topbarStyles.resultItem}>
                            <div><strong>{c.name}</strong> - {c.company}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Projects */}
                    {searchResults.projects?.length > 0 && (
                      <div style={topbarStyles.section}>
                        <div style={topbarStyles.sectionTitle}>Projects ({searchResults.projects.length})</div>
                        {searchResults.projects.map((p: any) => (
                          <div key={p.id} onClick={() => { router.push(`/dashboard/projects/${p.id}`); setShowSearchDropdown(false); }} style={topbarStyles.resultItem}>
                            <div><strong>{p.name}</strong></div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{p.status}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.leads?.length === 0 && searchResults.clients?.length === 0 && searchResults.projects?.length === 0 && (
                      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-tertiary)" }}>No results found for "{searchQuery}"</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Topbar Actions */}
            <div style={topbarStyles.actions} className="crm-topbar-actions">
              {/* Live Global Clock Display - Visible to all roles */}
              <div 
                className="crm-topbar-clock"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-primary)",
                  padding: "0.45rem 0.85rem",
                  borderRadius: "10px",
                  boxShadow: "var(--shadow-sm)"
                }}
                title="Real-time Indian Standard Time (IST) Clock"
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "28px",
                  height: "28px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(99, 102, 241, 0.15)",
                  color: "var(--primary-color)"
                }}>
                  <Clock size={16} className="animate-pulse" />
                </div>
                <div>
                  <div style={{
                    fontSize: "0.875rem",
                    fontWeight: 400,
                    color: "var(--text-primary)",
                    letterSpacing: "0.02em",
                    lineHeight: 1.1
                  }}>
                    {currentLiveTime.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true
                    })}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", fontWeight: 400, lineHeight: 1 }}>
                    {currentLiveTime.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                </div>
              </div>

              {/* Interactive In-Dashboard Work Status & Attendance Control (Clock-In / Clock-Out) */}
              <button
                type="button"
                onClick={() => {
                  if (isWorking) {
                    setShowShiftModal("end");
                  } else {
                    setShowShiftModal("start");
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  backgroundColor: isWorking 
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.12)",
                  color: isWorking
                    ? "#10b981"
                    : "var(--danger-color)",
                  border: isWorking
                    ? "1px solid rgba(16, 185, 129, 0.45)"
                    : "1px solid rgba(239, 68, 68, 0.35)",
                  padding: "0.45rem 0.9rem",
                  borderRadius: "10px",
                  fontSize: "0.775rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isWorking ? "0 0 12px rgba(16, 185, 129, 0.15)" : "none"
                }}
                title={isWorking ? `Working from ${currentUser?.workLocation || shiftLocation || "Office"} (Click to Clock Out)` : "Off Duty / Clocked Out (Click to Start Work)"}
              >
                {isWorking ? (
                  <>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 10px #10b981" }} />
                    {currentUser?.workLocation === "Home" || shiftLocation === "Home" ? <Home size={14} style={{ color: "#10b981" }} /> : <Building2 size={14} style={{ color: "#10b981" }} />}
                    <span style={{ color: "#10b981", fontFamily: "monospace", letterSpacing: "0.03em" }}>{formatSecondsToHms(liveWorkedSeconds)}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.7rem" }}>• {currentUser?.workLocation || shiftLocation || "Office"}</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444" }} />
                    <span>Clocked Out • Start Work</span>
                  </>
                )}
              </button>

              {/* Quick Add Dropdown Trigger - hidden for Developer role */}
              {currentUser?.roleName !== "Developer" && (
                <div style={{ position: "relative" }}>
                  <button 
                    onClick={() => setShowQuickAddMenu(!showQuickAddMenu)}
                    className="crm-btn crm-btn-primary"
                    style={{ padding: "0.5rem 1rem", height: "40px" }}
                  >
                    <Plus size={16} />
                    Quick Add
                  </button>
                  {showQuickAddMenu && (
                    <div style={topbarStyles.quickAddMenu}>
                      <div style={topbarStyles.menuTitle}>Create New Record</div>
                      <button onClick={() => { setQuickAddType("lead"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><Users size={14} /> Add Lead</button>
                      <button onClick={() => { setQuickAddType("client"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><UserSquare2 size={14} /> Add Client</button>
                      <button onClick={() => { setQuickAddType("project"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><Briefcase size={14} /> Add Project</button>
                      <button onClick={() => { setQuickAddType("meeting"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><CalendarRange size={14} /> Schedule Activity</button>
                      <button onClick={() => { setQuickAddType("payment"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><CreditCard size={14} /> Add Payment</button>
                      <button onClick={() => { setQuickAddType("note"); setShowQuickAddMenu(false); }} style={topbarStyles.menuItem}><FileText size={14} /> Add Timeline Note</button>
                    </div>
                  )}
                </div>
              )}

              {/* Light / Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                style={{ ...topbarStyles.iconBtn, color: "var(--text-secondary)" }}
                title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              >
                {theme === "dark" ? <Sun size={19} color="#f59e0b" /> : <Moon size={19} color="var(--primary-color)" />}
              </button>

              {/* Notifications Bell */}
              <div style={{ position: "relative" }}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ ...topbarStyles.iconBtn, color: showNotifications ? "var(--primary-color)" : "var(--text-secondary)" }}
                >
                  <Bell size={20} />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span style={topbarStyles.badge}>{notifications.filter(n => !n.isRead).length}</span>
                  )}
                </button>

                {showNotifications && (
                  <div style={topbarStyles.notifDropdown}>
                    <div style={topbarStyles.dropdownHeader}>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>Notifications</span>
                      {notifications.filter(n => !n.isRead).length > 0 && (
                        <button 
                          onClick={handleMarkAllNotificationsRead} 
                          style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 500 }}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div style={topbarStyles.notifList}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            style={{
                              ...topbarStyles.notifItem,
                              backgroundColor: n.isRead ? "transparent" : "var(--bg-primary)",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              gap: "0.5rem"
                            }}
                          >
                            <div style={{ display: "flex", gap: "0.5rem", flexGrow: 1 }}>
                              {!n.isRead && <span style={topbarStyles.unreadDot} />}
                              <div>
                                <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{n.title}</div>
                                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>{n.message}</div>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "4px" }}>
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>

                            {!n.isRead && (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, isRead: true } : item));
                                  try {
                                    await fetch(`/api/notifications/${n.id}`, { method: "PUT" });
                                    setTriggerRefresh(prev => prev + 1);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  color: "var(--text-tertiary)",
                                  cursor: "pointer",
                                  fontSize: "0.7rem",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  whiteSpace: "nowrap"
                                }}
                                title="Mark as read"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              {currentUser && (
                <div style={{ position: "relative" }}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} style={topbarStyles.profileArea}>
                    <div style={{ ...topbarStyles.profileAvatar, overflow: "hidden", padding: 0 }}>
                      {currentUser.avatar ? (
                        <img 
                          src={currentUser.avatar} 
                          alt={currentUser.name} 
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} 
                        />
                      ) : (
                        currentUser.name.charAt(0)
                      )}
                    </div>
                  </button>
                  {showProfileMenu && (
                    <div style={topbarStyles.profileMenu}>
                      <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "var(--primary-light)", color: "var(--primary-color)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                          {currentUser.avatar ? (
                            <img src={currentUser.avatar} alt={currentUser.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            currentUser.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{currentUser.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{currentUser.email}</div>
                        </div>
                      </div>
                      <button onClick={() => { router.push("/dashboard/settings"); setShowProfileMenu(false); }} style={topbarStyles.profileMenuItem}><Settings size={14} /> Profile Settings</button>
                      <button onClick={() => { router.push("/"); setShowProfileMenu(false); }} style={topbarStyles.profileMenuItem}><Sparkles size={14} /> Product Showcase</button>
                      <button onClick={handleLogout} style={{ ...topbarStyles.profileMenuItem, color: "var(--danger-color)" }}><LogOut size={14} /> Logout Session</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Live Floating Notification Popup */}
          {popupNotification && (
            <div 
              style={{
                position: "fixed",
                top: "80px",
                right: "24px",
                zIndex: 1000,
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--primary-color)",
                borderLeft: "4px solid var(--primary-color)",
                padding: "1rem 1.25rem",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.875rem",
                maxWidth: "360px",
                animation: "fadeIn 0.25s ease-out",
                cursor: popupNotification.linkUrl ? "pointer" : "default"
              }}
              onClick={() => {
                if (popupNotification.linkUrl) {
                  router.push(popupNotification.linkUrl);
                  setPopupNotification(null);
                }
              }}
            >
              <div style={{ 
                width: "36px", 
                height: "36px", 
                borderRadius: "50%", 
                backgroundColor: "var(--primary-light)", 
                color: "var(--primary-color)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                flexShrink: 0 
              }}>
                <MessageSquare size={18} />
              </div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {popupNotification.title}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupNotification(null);
                    }}
                    style={{ border: "none", background: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: "1.1rem", padding: "0 0 0 0.5rem" }}
                  >
                    &times;
                  </button>
                </div>
                <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {popupNotification.message}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--primary-color)", marginTop: "4px", fontWeight: 600 }}>
                  Click to reply →
                </div>
              </div>
            </div>
          )}

          {/* Toast Alert */}
          {toast && (
            <div 
              style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 100,
                backgroundColor: toast.type === "success" ? "var(--success-light)" : toast.type === "error" ? "var(--danger-light)" : "var(--info-light)",
                color: toast.type === "success" ? "var(--success-text)" : toast.type === "error" ? "var(--danger-text)" : "var(--info-text)",
                border: "1px solid currentColor",
                padding: "0.875rem 1.5rem",
                borderRadius: "8px",
                boxShadow: "var(--shadow-lg)",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                fontWeight: 500,
                fontSize: "0.875rem",
                animation: "fadeIn 0.2s ease"
              }}
            >
              {toast.type === "success" && <CheckCircle2 size={16} />}
              {toast.type === "error" && <AlertCircle size={16} />}
              {toast.type === "info" && <Clock size={16} />}
              {toast.message}
            </div>
          )}

          {/* Page Contents */}
          <main style={{ flexGrow: 1 }}>
            {children}
          </main>
        </div>

        {/* Quick Add Modals */}
        {quickAddType && (
          <div style={modalStyles.overlay}>
            <div style={modalStyles.container} className="animate-fade-in">
              <div style={modalStyles.header}>
                <h3 style={modalStyles.title}>Quick Add {quickAddType.toUpperCase()}</h3>
                <button onClick={() => setQuickAddType(null)} style={modalStyles.closeBtn}>&times;</button>
              </div>

              <form onSubmit={handleQuickAddSubmit} style={modalStyles.body}>
                {/* Lead Form */}
                {quickAddType === "lead" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="crm-input-group">
                      <label style={modalStyles.label}>LinkedIn Profile URL (Unique & Auto-Populates)</label>
                      <input 
                        type="url" 
                        className="crm-input" 
                        placeholder="https://linkedin.com/in/username" 
                        value={leadForm.linkedinUrl}
                        onChange={(e) => handleLinkedinPaste(e.target.value)}
                      />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Name</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          placeholder="e.g. John Doe"
                          value={leadForm.name}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, name: e.target.value }))}
                          disabled={enriching}
                          required
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Company</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          placeholder="e.g. Acme Corp"
                          value={leadForm.company}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, company: e.target.value }))}
                          disabled={enriching}
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Job Title</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          placeholder="e.g. CEO"
                          value={leadForm.jobTitle}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                          disabled={enriching}
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Lead Source</label>
                        <select 
                          className="crm-select"
                          value={leadForm.source}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, source: e.target.value }))}
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="Upwork">Upwork</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Referral">Referral</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {leadForm.source === "Other" && (
                      <div>
                        <label style={modalStyles.label}>Custom Source Name</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          value={leadForm.customSource}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, customSource: e.target.value }))}
                          required
                        />
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Priority</label>
                        <select 
                          className="crm-select"
                          value={leadForm.priority}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, priority: e.target.value }))}
                        >
                          <option value="Hot">Hot 🔥</option>
                          <option value="Warm">Warm ⚡</option>
                          <option value="Cold">Cold ❄️</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Primary BDA</label>
                        <select 
                          className="crm-select"
                          value={leadForm.primaryBdaId}
                          onChange={(e) => setLeadForm(prev => ({ ...prev, primaryBdaId: e.target.value }))}
                          required
                        >
                          <option value="">Select BDA</option>
                          {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={modalStyles.label}>Custom Tags (comma separated)</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="Shopify, USA, High Budget"
                        value={leadForm.tags}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, tags: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label style={modalStyles.label}>Brief Notes</label>
                      <textarea 
                        className="crm-textarea" 
                        rows={2} 
                        value={leadForm.notes}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Client Form */}
                {quickAddType === "client" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Client Name</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="John Doe"
                        value={clientForm.name}
                        onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Company Name</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="e.g. Acme Inc"
                        value={clientForm.company}
                        onChange={(e) => setClientForm(prev => ({ ...prev, company: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Email Address</label>
                      <input 
                        type="email" 
                        className="crm-input" 
                        placeholder="client@company.com"
                        value={clientForm.email}
                        onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))}
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Phone Number</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          placeholder="+1..."
                          value={clientForm.phone}
                          onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Website URL</label>
                        <input 
                          type="url" 
                          className="crm-input" 
                          placeholder="https://..."
                          value={clientForm.website}
                          onChange={(e) => setClientForm(prev => ({ ...prev, website: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Project Form */}
                {quickAddType === "project" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Project Name</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="Shopify Redesign"
                        value={projectForm.name}
                        onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    {/* Lead/Client Acquisition Platform */}
                    <div style={{ display: "grid", gridTemplateColumns: (projectForm.platform === "Upwork" || projectForm.platform === "Freelancer") ? "1fr 1fr" : "1fr", gap: "1rem", backgroundColor: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div>
                        <label style={modalStyles.label}>Client Platform / Source</label>
                        <select 
                          className="crm-select"
                          value={projectForm.platform}
                          onChange={(e) => {
                            const plat = e.target.value;
                            const defaultAccount = plat === "Upwork" ? "Rakesh" : plat === "Freelancer" ? "Pixxelu" : "";
                            setProjectForm(prev => ({ 
                              ...prev, 
                              platform: plat, 
                              platformAccountId: defaultAccount,
                              source: defaultAccount ? `${plat} (${defaultAccount})` : plat
                            }));
                          }}
                        >
                          <option value="Upwork">Upwork</option>
                          <option value="Freelancer">Freelancer</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="Outside">Outside / Direct Client</option>
                        </select>
                      </div>

                      {projectForm.platform === "Upwork" && (
                        <div>
                          <label style={modalStyles.label}>Upwork Account / ID</label>
                          <select 
                            className="crm-select"
                            value={projectForm.platformAccountId}
                            onChange={(e) => {
                              const acc = e.target.value;
                              setProjectForm(prev => ({ 
                                ...prev, 
                                platformAccountId: acc,
                                source: `Upwork (${acc})`
                              }));
                            }}
                          >
                            <option value="Rakesh">Rakesh</option>
                            <option value="Shikha">Shikha</option>
                            <option value="Deepali">Deepali</option>
                            <option value="Divya">Divya</option>
                            <option value="Archna">Archna</option>
                          </select>
                        </div>
                      )}

                      {projectForm.platform === "Freelancer" && (
                        <div>
                          <label style={modalStyles.label}>Freelancer Account / ID</label>
                          <select 
                            className="crm-select"
                            value={projectForm.platformAccountId}
                            onChange={(e) => {
                              const acc = e.target.value;
                              setProjectForm(prev => ({ 
                                ...prev, 
                                platformAccountId: acc,
                                source: `Freelancer (${acc})`
                              }));
                            }}
                          >
                            <option value="Pixxelu">Pixxelu</option>
                            <option value="Archna">Archna</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <label style={modalStyles.label}>Select Client</label>
                          <span 
                            onClick={() => setShowInnerClientForm(true)}
                            style={{ color: "var(--primary-color)", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                          >
                            + Add New Client
                          </span>
                        </div>
                        <select 
                          className="crm-select"
                          value={projectForm.clientId}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, clientId: e.target.value }))}
                          required
                        >
                          <option value="">Choose Client</option>
                          {clientsList.map(c => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Project Type</label>
                        <select 
                          className="crm-select"
                          value={projectForm.serviceType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProjectForm(prev => ({ ...prev, serviceType: val }));
                            if (val !== "Other") {
                              setCustomServiceType("");
                            }
                          }}
                        >
                          <option value="Web Design">Web Design</option>
                          <option value="Web Development">Web Development</option>
                          <option value="Shopify">Shopify</option>
                          <option value="WordPress">WordPress</option>
                          <option value="UI/UX">UI/UX</option>
                          <option value="Mobile App">Mobile App</option>
                          <option value="Custom Software">Custom Software</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Project Status</label>
                        <select 
                          className="crm-select"
                          value={projectForm.status}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, status: e.target.value }))}
                        >
                          <option value="Ongoing">⚡ Ongoing</option>
                          <option value="Not Started">Not Started</option>
                          <option value="Work in Progress">Work in Progress</option>
                          <option value="Review">Review</option>
                          <option value="Completed">Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </div>
                    </div>

                    {projectForm.serviceType === "Other" && (
                      <div style={{ marginTop: "-0.5rem", marginBottom: "0.5rem" }}>
                        <label style={modalStyles.label}>Custom Project Type</label>
                        <input 
                          type="text" 
                          className="crm-input" 
                          placeholder="Enter project type" 
                          value={customServiceType}
                          onChange={(e) => setCustomServiceType(e.target.value)}
                          required
                        />
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                      <div>
                        <label style={modalStyles.label}>Start Date</label>
                        <input 
                          type="date" 
                          className="crm-input"
                          value={projectForm.startDate}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Deadline Date</label>
                        <input 
                          type="date" 
                          className="crm-input"
                          value={projectForm.deadline}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, deadline: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Deadline Time</label>
                        <input 
                          type="time" 
                          className="crm-input"
                          value={projectForm.deadlineTime}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, deadlineTime: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    {/* Currency & Pricing Model Section */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "var(--bg-secondary)", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div>
                        <label style={modalStyles.label}>Contract Currency</label>
                        <select
                          className="crm-select"
                          value={projectForm.currency}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, currency: e.target.value }))}
                        >
                          <option value="INR">INR (₹) - Indian Rupee</option>
                          <option value="USD">USD ($) - US Dollar</option>
                          <option value="EUR">EUR (€) - Euro</option>
                          <option value="GBP">GBP (£) - British Pound</option>
                          <option value="AED">AED (د.إ) - UAE Dirham</option>
                          <option value="CAD">CAD ($) - Canadian Dollar</option>
                          <option value="AUD">AUD ($) - Australian Dollar</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Engagement & Pricing Model</label>
                        <select
                          className="crm-select"
                          value={projectForm.pricingModel}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, pricingModel: e.target.value }))}
                        >
                          <option value="Monthly">🔄 Monthly Retainer / Ongoing</option>
                          <option value="Fixed">📦 One-Time / Fixed Milestone</option>
                          <option value="Hourly">⏱️ Hourly Rate Contract</option>
                        </select>
                      </div>
                    </div>

                    {/* Hourly Inputs if Hourly selected */}
                    {projectForm.pricingModel === "Hourly" ? (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", backgroundColor: "var(--bg-primary)", padding: "0.75rem", borderRadius: "8px", border: "1px dashed var(--border-primary)" }}>
                        <div>
                          <label style={modalStyles.label}>Hourly Rate ({projectForm.currency})</label>
                          <input 
                            type="number" 
                            className="crm-input"
                            placeholder="e.g. 25"
                            value={projectForm.hourlyRate}
                            onChange={(e) => {
                              const rate = e.target.value;
                              const hrs = projectForm.estimatedHours;
                              const calcTotal = rate && hrs ? String(parseFloat(rate) * parseFloat(hrs)) : projectForm.finalBudget;
                              setProjectForm(prev => ({ ...prev, hourlyRate: rate, finalBudget: calcTotal }));
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label style={modalStyles.label}>Est. Hours</label>
                          <input 
                            type="number" 
                            className="crm-input"
                            placeholder="e.g. 40"
                            value={projectForm.estimatedHours}
                            onChange={(e) => {
                              const hrs = e.target.value;
                              const rate = projectForm.hourlyRate;
                              const calcTotal = rate && hrs ? String(parseFloat(rate) * parseFloat(hrs)) : projectForm.finalBudget;
                              setProjectForm(prev => ({ ...prev, estimatedHours: hrs, finalBudget: calcTotal }));
                            }}
                            required
                          />
                        </div>
                        <div>
                          <label style={modalStyles.label}>Est. Total Budget ({projectForm.currency})</label>
                          <input 
                            type="number" 
                            className="crm-input"
                            placeholder="Auto-calculated"
                            value={projectForm.finalBudget}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, finalBudget: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                          <label style={modalStyles.label}>
                            {projectForm.pricingModel === "Monthly" 
                              ? `Monthly Retainer Budget (${projectForm.currency}/month)` 
                              : `Final Fixed Budget (${projectForm.currency})`}
                          </label>
                          <input 
                            type="number" 
                            className="crm-input"
                            placeholder={projectForm.pricingModel === "Monthly" ? "e.g. 50000/mo" : "e.g. 50000"}
                            value={projectForm.finalBudget}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, finalBudget: e.target.value }))}
                            required
                          />
                        </div>
                        <div>
                          <label style={modalStyles.label}>Bonus Budget ({projectForm.currency})</label>
                          <input 
                            type="number" 
                            className="crm-input"
                            placeholder="0"
                            value={projectForm.bonus}
                            onChange={(e) => setProjectForm(prev => ({ ...prev, bonus: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Assigned Primary BDA</label>
                        <select 
                          className="crm-select"
                          value={projectForm.primaryBdaId}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, primaryBdaId: e.target.value }))}
                          required
                        >
                          {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Assign Developer (Locks Assignment)</label>
                        <select 
                          className="crm-select"
                          value={projectForm.devId}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, devId: e.target.value }))}
                        >
                          <option value="">-- No Developer (Assign Later) --</option>
                          {devs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
                        </select>
                      </div>
                    </div>

                    {projectForm.devId && (
                      <div>
                        <label style={modalStyles.label}>Developer Task Requirements / Initial Instructions</label>
                        <textarea
                          className="crm-textarea"
                          rows={3}
                          placeholder="Provide project overview, technology stack, and initial deliverables for the assigned developer..."
                          value={projectForm.workDetails}
                          onChange={(e) => setProjectForm(prev => ({ ...prev, workDetails: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Schedule Activity Form */}
                {quickAddType === "meeting" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Activity Title</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="Intro Call / Follow-up Discussion"
                        value={meetingForm.title}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Activity Type</label>
                        <select 
                          className="crm-select"
                          value={meetingForm.type}
                          onChange={(e) => setMeetingForm(prev => ({ ...prev, type: e.target.value }))}
                        >
                          <option value="Meeting">Meeting</option>
                          <option value="Call">Call</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Demo">Demo</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Date & Time</label>
                        <input 
                          type="datetime-local" 
                          className="crm-input"
                          value={meetingForm.startTime}
                          onChange={(e) => setMeetingForm(prev => ({ ...prev, startTime: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Link to Lead (Optional)</label>
                        <select 
                          className="crm-select"
                          value={meetingForm.leadId}
                          onChange={(e) => setMeetingForm(prev => ({ ...prev, leadId: e.target.value }))}
                        >
                          <option value="">None</option>
                          {/* We'll populate lead options if needed, but since it's quick add, we can search or list */}
                          <option value="l1">John Smith</option>
                          <option value="l2">Sarah Connor</option>
                          <option value="l3">Amit Patel</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Link to Project (Optional)</label>
                        <select 
                          className="crm-select"
                          value={meetingForm.projectId}
                          onChange={(e) => setMeetingForm(prev => ({ ...prev, projectId: e.target.value }))}
                        >
                          <option value="">None</option>
                          {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={modalStyles.label}>Invite Team Members / Developers</label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", maxHeight: "100px", overflowY: "auto", padding: "0.5rem", border: "1px solid var(--border-primary)", borderRadius: "8px", backgroundColor: "var(--bg-primary)" }}>
                        {[...bdas, ...devs].map((user: any) => {
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
                                padding: "3px 8px",
                                borderRadius: "6px",
                                border: isSelected ? "1px solid var(--primary-color)" : "1px solid var(--border-secondary)",
                                backgroundColor: isSelected ? "var(--primary-light)" : "var(--bg-secondary)",
                                color: isSelected ? "var(--primary-color)" : "var(--text-primary)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontWeight: isSelected ? 600 : 400
                              }}
                            >
                              {isSelected ? <CheckCircle2 size={12} /> : null}
                              {user.name} ({user.roleName || "Member"})
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={modalStyles.label}>Brief Notes / Agenda</label>
                      <textarea 
                        className="crm-textarea" 
                        rows={2} 
                        value={meetingForm.notes}
                        onChange={(e) => setMeetingForm(prev => ({ ...prev, notes: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Add Payment Form */}
                {quickAddType === "payment" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Select Project</label>
                      <select 
                        className="crm-select"
                        value={paymentForm.projectId}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, projectId: e.target.value }))}
                        required
                      >
                        <option value="">Choose Project</option>
                        {projectsList.map(p => <option key={p.id} value={p.id}>{p.name} ({p.client?.name})</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={modalStyles.label}>
                        Payment Amount ({(() => {
                          const selectedProj = projectsList.find(p => p.id === paymentForm.projectId);
                          return selectedProj?.currency || "INR";
                        })()})
                      </label>
                      <input 
                        type="number" 
                        className="crm-input" 
                        placeholder="e.g. 500"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Note / Invoice Number</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="First Milestone payment"
                        value={paymentForm.note}
                        onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* Add Note Form */}
                {quickAddType === "note" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Link to Lead</label>
                        <select 
                          className="crm-select"
                          value={noteForm.leadId}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, leadId: e.target.value, projectId: "" }))}
                        >
                          <option value="">None</option>
                          <option value="l1">John Smith</option>
                          <option value="l2">Sarah Connor</option>
                          <option value="l3">Amit Patel</option>
                        </select>
                      </div>
                      <div>
                        <label style={modalStyles.label}>Link to Project</label>
                        <select 
                          className="crm-select"
                          value={noteForm.projectId}
                          onChange={(e) => setNoteForm(prev => ({ ...prev, projectId: e.target.value, leadId: "" }))}
                        >
                          <option value="">None</option>
                          {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={modalStyles.label}>Timeline Note Content</label>
                      <textarea 
                        className="crm-textarea" 
                        rows={4}
                        placeholder="Varun spoke to client. They are happy to proceed with Shopify."
                        value={noteForm.content}
                        onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                )}

                <div style={modalStyles.actions}>
                  <button type="button" onClick={() => setQuickAddType(null)} className="crm-btn crm-btn-secondary">Cancel</button>
                  <button type="submit" disabled={actionLoading || enriching} className="crm-btn crm-btn-primary">
                    {actionLoading ? "Saving..." : "Save Record"}
                  </button>
                </div>
              </form>
            </div>
          </div>
         )}

        {/* Add Client Directly from Project Form Sub-Modal */}
        {showInnerClientForm && (
          <div style={{ ...modalStyles.overlay, zIndex: 1100 }}>
            <div style={modalStyles.container} className="animate-fade-in">
              <div style={modalStyles.header}>
                <h3 style={modalStyles.title}>Add New Client</h3>
                <button type="button" onClick={() => setShowInnerClientForm(false)} style={modalStyles.closeBtn}>&times;</button>
              </div>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  setInnerClientLoading(true);
                  try {
                    const res = await fetch("/api/clients", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(innerClientForm)
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Failed to create client");
                    
                    // Add newly created client to context list
                    setClientsList(prev => [...prev, data.client]);
                    // Set current project selection to newly created client
                    setProjectForm(prev => ({ ...prev, clientId: data.client.id }));
                    
                    // Reset forms
                    setInnerClientForm({ name: "", email: "", company: "", phone: "", website: "" });
                    setShowInnerClientForm(false);
                    showToast("Client added and selected successfully!");
                  } catch (err: any) {
                    showToast(err.message, "error");
                  } finally {
                    setInnerClientLoading(false);
                  }
                }} 
                style={modalStyles.body}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Client Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder="John Doe"
                      value={innerClientForm.name}
                      onChange={(e) => setInnerClientForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Company Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder="e.g. Acme Inc"
                      value={innerClientForm.company}
                      onChange={(e) => setInnerClientForm(prev => ({ ...prev, company: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Email Address</label>
                    <input 
                      type="email" 
                      className="crm-input" 
                      placeholder="client@company.com"
                      value={innerClientForm.email}
                      onChange={(e) => setInnerClientForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Phone Number</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="+1..."
                        value={innerClientForm.phone}
                        onChange={(e) => setInnerClientForm(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Website URL</label>
                      <input 
                        type="url" 
                        className="crm-input" 
                        placeholder="https://..."
                        value={innerClientForm.website}
                        onChange={(e) => setInnerClientForm(prev => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <div style={modalStyles.actions}>
                  <button type="button" onClick={() => setShowInnerClientForm(false)} className="crm-btn crm-btn-secondary">Cancel</button>
                  <button type="submit" disabled={innerClientLoading} className="crm-btn crm-btn-primary">
                    {innerClientLoading ? "Saving..." : "Save Client"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Work Shift Attendance Modal (Clock-In / Start Work & Clock-Out) */}
        {showShiftModal && (
          <div style={{ ...modalStyles.overlay, zIndex: 1200 }}>
            <div style={{ ...modalStyles.container, maxWidth: "440px" }} className="animate-fade-in">
              <div style={modalStyles.header}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: showShiftModal === "start" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: showShiftModal === "start" ? "#10b981" : "#ef4444"
                  }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 style={modalStyles.title}>
                      {showShiftModal === "start" ? "Start Workday / Clock In" : "End Workday / Clock Out"}
                    </h3>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                      Logged automatically to your dashboard attendance & time tracker.
                    </div>
                  </div>
                </div>
                <button type="button" onClick={() => setShowShiftModal(null)} style={modalStyles.closeBtn}>&times;</button>
              </div>

              <form onSubmit={showShiftModal === "start" ? handleStartWorkSession : handleClockOutSession} style={modalStyles.body}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  
                  {showShiftModal === "start" ? (
                    <div>
                      <label style={modalStyles.label}>Select Where You Are Working From:</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "0.25rem" }}>
                        <button
                          type="button"
                          onClick={() => setShiftLocation("Office")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: shiftLocation === "Office" ? "2px solid var(--primary-color)" : "1px solid var(--border-primary)",
                            backgroundColor: shiftLocation === "Office" ? "rgba(99, 102, 241, 0.15)" : "var(--bg-primary)",
                            color: shiftLocation === "Office" ? "var(--primary-color)" : "var(--text-secondary)",
                            fontWeight: shiftLocation === "Office" ? 700 : 500,
                            cursor: "pointer"
                          }}
                        >
                          <Building2 size={16} /> Office (In-Person)
                        </button>
                        <button
                          type="button"
                          onClick={() => setShiftLocation("Home")}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.75rem",
                            borderRadius: "8px",
                            border: shiftLocation === "Home" ? "2px solid #10b981" : "1px solid var(--border-primary)",
                            backgroundColor: shiftLocation === "Home" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-primary)",
                            color: shiftLocation === "Home" ? "#10b981" : "var(--text-secondary)",
                            fontWeight: shiftLocation === "Home" ? 700 : 500,
                            cursor: "pointer"
                          }}
                        >
                          <Home size={16} /> Home (Remote)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: "0.85rem", 
                      borderRadius: "8px", 
                      backgroundColor: "rgba(239, 68, 68, 0.08)", 
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem"
                    }}>
                      <div style={{ color: "#ef4444" }}>
                        <LogOut size={22} />
                      </div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                        Clocking out will record your workday finish time and notify Super Admin immediately.
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={modalStyles.label}>Workday Notes / Status Update (Optional)</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder={showShiftModal === "start" ? "e.g. Working on client Shopify redesign..." : "e.g. Completed today's targets and tasks"}
                      value={shiftNote}
                      onChange={(e) => setShiftNote(e.target.value)}
                    />
                  </div>
                </div>

                <div style={modalStyles.actions}>
                  <button type="button" onClick={() => setShowShiftModal(null)} className="crm-btn crm-btn-secondary">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={attendanceLoading} 
                    className="crm-btn"
                    style={{
                      backgroundColor: showShiftModal === "start" ? "var(--primary-color)" : "var(--danger-color)",
                      color: "#ffffff"
                    }}
                  >
                    {attendanceLoading 
                      ? "Logging..." 
                      : showShiftModal === "start" ? "Confirm Start Work" : "Confirm Clock Out"
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}

const sidebarStyles: Record<string, React.CSSProperties> = {
  logoArea: {
    padding: "2rem 1.5rem",
    borderBottom: "1px solid var(--border-primary)",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "-0.5px",
  },
  logoSubtitle: {
    fontSize: "0.7rem",
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    display: "block",
    marginTop: "2px",
  },
  nav: {
    padding: "1.5rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    flexGrow: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    width: "100%",
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
  },
  footer: {
    padding: "1.5rem",
    borderTop: "1px solid var(--border-primary)",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  userCard: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "9999px",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "0.875rem",
  },
  userInfo: {
    overflow: "hidden",
  },
  userName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  userRole: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.625rem",
    border: "1px solid var(--border-primary)",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    fontSize: "0.8125rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
};

const topbarStyles: Record<string, React.CSSProperties> = {
  searchArea: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    width: "360px",
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-tertiary)",
  },
  searchInput: {
    width: "100%",
    padding: "0.625rem 1rem 0.625rem 2.5rem",
    borderRadius: "9999px",
    border: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "all 0.2s ease",
  },
  searchDropdown: {
    position: "absolute",
    top: "100%",
    left: 0,
    width: "100%",
    maxHeight: "400px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
    marginTop: "0.5rem",
    zIndex: 90,
    display: "flex",
    flexDirection: "column",
  },
  dropdownHeader: {
    padding: "0.75rem 1rem",
    borderBottom: "1px solid var(--border-primary)",
    fontSize: "0.75rem",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    display: "flex",
    justifyContent: "space-between",
  },
  dropdownBody: {
    overflowY: "auto",
    padding: "0.5rem 0",
  },
  section: {
    padding: "0.5rem 0",
    borderBottom: "1px solid var(--border-primary)",
  },
  sectionTitle: {
    padding: "0.25rem 1rem",
    fontSize: "0.7rem",
    fontWeight: 700,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
  },
  resultItem: {
    padding: "0.5rem 1rem",
    cursor: "pointer",
    fontSize: "0.875rem",
    transition: "background 0.2s",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
  },
  quickAddMenu: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    width: "210px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "10px",
    boxShadow: "var(--shadow-lg)",
    padding: "0.5rem 0",
    zIndex: 80,
  },
  menuTitle: {
    padding: "0.5rem 1rem",
    fontSize: "0.75rem",
    fontWeight: 700,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.625rem 1rem",
    border: "none",
    background: "none",
    color: "var(--text-secondary)",
    textAlign: "left",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  iconBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    borderRadius: "9999px",
    border: "1px solid var(--border-primary)",
    background: "var(--bg-secondary)",
    cursor: "pointer",
    transition: "all 0.2s ease",
  },
  badge: {
    position: "absolute",
    top: "2px",
    right: "2px",
    width: "18px",
    height: "18px",
    borderRadius: "9999px",
    backgroundColor: "var(--danger-color)",
    color: "#ffffff",
    fontSize: "0.65rem",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "2px solid var(--bg-secondary)",
  },
  notifDropdown: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    width: "360px",
    maxHeight: "480px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
    zIndex: 80,
    display: "flex",
    flexDirection: "column",
  },
  notifList: {
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  notifItem: {
    padding: "1rem",
    borderBottom: "1px solid var(--border-primary)",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  unreadDot: {
    width: "8px",
    height: "8px",
    borderRadius: "9999px",
    backgroundColor: "var(--primary-color)",
    marginTop: "5px",
    flexShrink: 0,
  },
  profileArea: {
    display: "flex",
    alignItems: "center",
    border: "none",
    background: "none",
    cursor: "pointer",
  },
  profileAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "9999px",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
  },
  profileMenu: {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    width: "200px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "8px",
    boxShadow: "var(--shadow-lg)",
    zIndex: 80,
    padding: "0.25rem 0",
  },
  profileMenuItem: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.625rem 1rem",
    border: "none",
    background: "none",
    color: "var(--text-secondary)",
    textAlign: "left",
    fontSize: "0.875rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
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
    maxWidth: "560px",
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
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  closeBtn: {
    border: "none",
    background: "none",
    fontSize: "1.5rem",
    color: "var(--text-secondary)",
    cursor: "pointer",
    padding: "0 0.5rem",
  },
  body: {
    padding: "1.25rem 1.5rem",
    overflowY: "auto",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
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
};

