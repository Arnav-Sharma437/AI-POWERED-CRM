"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CreditCard, UserPlus, RefreshCw, AlertOctagon, 
  Plus, Calendar, Mail, FileText, CheckCircle2, DollarSign,
  Send, Paperclip, MessageSquare, Trash2, X, Clock, Hourglass, 
  AlertTriangle, Flame, Minimize2, Maximize2, ChevronDown, ChevronUp,
  Star, ThumbsUp, ThumbsDown, Award, MessageCircle, Edit
} from "lucide-react";
import { useDashboard } from "../../layout";
import AiLoader from "@/components/AiLoader";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { bdas, devs, setTriggerRefresh, triggerRefresh, currentUser } = useDashboard();
  
  // Resolve params
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  // Live Deadline Countdown State
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    totalRemainingMs: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, totalRemainingMs: 0 });

  // Floating Sticky Chat states
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatStagedAttachments, setChatStagedAttachments] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Activity Timeline State
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [timelineForm, setTimelineForm] = useState({ type: "Note", notes: "" });

  // Deadline Update State
  const [deadlineForm, setDeadlineForm] = useState({ deadlineDate: "", deadlineTime: "18:00" });

  // Modal / Input States
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'payment' | 'takeover' | 'assign' | 'status' | 'timeline' | 'deadline' | 'editProject'
  const [paymentForm, setPaymentForm] = useState({ amount: "", note: "" });
  const [takeoverForm, setTakeoverForm] = useState({ newBdaId: "", note: "" });
  const [assignForm, setAssignForm] = useState({ devId: "", workDetails: "" });
  const [editProjectForm, setEditProjectForm] = useState({
    name: "",
    serviceType: "Web Design",
    currency: "INR",
    pricingModel: "Fixed",
    hourlyRate: "",
    estimatedHours: "",
    finalBudget: "",
    bonus: "0",
    notes: ""
  });
  const [statusForm, setStatusForm] = useState({ 
    status: "Work in Progress", 
    issueDescription: "",
    closeOutcome: "Good", // "Good" | "Bad" | "Neutral"
    clientRating: "5", // "1" - "5"
    clientFeedback: "" 
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const loadChatMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load project chat messages:", err);
    }
  };

  useEffect(() => {
    async function loadProjectDetails() {
      try {
        const res = await fetch(`/api/projects/${id}`);
        if (!res.ok) throw new Error("Failed to load project details");
        const data = await res.json();
        setProject(data.project);

        setEditProjectForm({
          name: data.project.name || "",
          serviceType: data.project.serviceType || "Web Design",
          currency: data.project.currency || "INR",
          pricingModel: data.project.pricingModel || "Fixed",
          hourlyRate: String(data.project.hourlyRate || ""),
          estimatedHours: String(data.project.estimatedHours || ""),
          finalBudget: String(data.project.finalBudget || ""),
          bonus: String(data.project.bonus || "0"),
          notes: data.project.notes || ""
        });

        setStatusForm({
          status: data.project.status,
          issueDescription: data.project.issueDescription || "",
          closeOutcome: data.project.closeOutcome || "Good",
          clientRating: String(data.project.clientRating || "5"),
          clientFeedback: data.project.clientFeedback || ""
        });

        if (data.project.deadline) {
          const d = new Date(data.project.deadline);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          const hh = String(d.getHours()).padStart(2, "0");
          const min = String(d.getMinutes()).padStart(2, "0");
          setDeadlineForm({
            deadlineDate: `${yyyy}-${mm}-${dd}`,
            deadlineTime: `${hh}:${min}`
          });
        }

        if (data.project.conversationId) {
          loadChatMessages(data.project.conversationId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProjectDetails();
  }, [id, triggerRefresh]);

  // Live ticking 1-second countdown calculation
  useEffect(() => {
    if (!project?.deadline) return;

    const updateTimer = () => {
      const deadlineDate = new Date(project.deadline).getTime();
      const now = Date.now();
      const diff = deadlineDate - now;

      if (diff <= 0) {
        // Expired
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalRemainingMs: diff
        });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
          totalRemainingMs: diff
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [project?.deadline]);

  // SSE subscription for project detail chat
  useEffect(() => {
    if (!currentUser || !project?.conversationId) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/chat/realtime");

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "message" && payload.data.conversationId === project.conversationId) {
            const newMsg = payload.data;
            setChatMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev.filter((m) => !m.pending || m.id !== newMsg.id), newMsg];
            });
          } else if (payload.type === "delete" && payload.data.conversationId === project.conversationId) {
            const deleteData = payload.data;
            setChatMessages((prev) =>
              prev.map((m) =>
                m.id === deleteData.id
                  ? { ...m, content: "This message was deleted.", isDeleted: true }
                  : m
              )
            );
          }
        } catch (err) {
          console.error("SSE parse error in project details:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("Project chat SSE error, using interval sync:", err);
      };
    } catch (e) {
      console.error("Failed to init project chat SSE:", e);
    }

    const interval = setInterval(() => {
      loadChatMessages(project.conversationId);
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
    };
  }, [currentUser, project?.conversationId]);

  // Auto-scroll project chat
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatText.trim() && chatStagedAttachments.length === 0) return;
    if (!project?.conversationId || !currentUser) return;

    const currentText = chatText;
    const currentAttachments = [...chatStagedAttachments];

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      conversationId: project.conversationId,
      content: currentText,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      attachments: currentAttachments.map((a, i) => ({
        id: `temp-att-${i}`,
        fileName: a.name,
        fileType: a.type,
        storagePath: ""
      })),
      reads: [{ userId: currentUser.id, readAt: new Date().toISOString() }]
    };

    // Instant append
    setChatMessages((prev) => [...prev, optimisticMessage]);
    setChatText("");
    setChatStagedAttachments([]);

    const payload = {
      content: currentText,
      attachments: currentAttachments.map((a) => ({
        fileName: a.name,
        fileType: a.type,
        base64: a.base64
      }))
    };

    try {
      const res = await fetch(`/api/chat/conversations/${project.conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to send message");
        setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
      } else {
        const data = await res.json();
        if (data.message) {
          setChatMessages((prev) =>
            prev.map((m) => (m.id === tempId ? data.message : m))
          );
        }
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const handleChatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} exceeds the 10MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        setChatStagedAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size,
            base64: base64String
          }
        ]);
      };
    });
  };

  const handleDeleteChatMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/chat/messages/${msgId}/delete`, { method: "POST" });
      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to delete message");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    let url = `/api/projects/${id}`;
    let method = "PUT";
    let body: any = {};

    switch (activeModal) {
      case "payment":
        url = `/api/projects/${id}/payments`;
        method = "POST";
        body = paymentForm;
        break;
      case "takeover":
        url = `/api/projects/${id}/takeover`;
        method = "POST";
        body = takeoverForm;
        break;
      case "assign":
        url = `/api/projects/${id}/assign`;
        method = "POST";
        body = assignForm;
        break;
      case "timeline":
        url = `/api/activities`;
        method = "POST";
        body = {
          projectId: id,
          clientId: project?.clientId,
          type: timelineForm.type,
          notes: timelineForm.notes
        };
        break;
      case "deadline":
        url = `/api/projects/${id}`;
        method = "PUT";
        const combinedDateTime = new Date(`${deadlineForm.deadlineDate}T${deadlineForm.deadlineTime || "18:00"}:00`).toISOString();
        body = {
          deadline: combinedDateTime
        };
        break;
      case "editProject":
        url = `/api/projects/${id}`;
        method = "PUT";
        body = {
          name: editProjectForm.name,
          serviceType: editProjectForm.serviceType,
          currency: editProjectForm.currency,
          pricingModel: editProjectForm.pricingModel,
          hourlyRate: editProjectForm.pricingModel === "Hourly" ? editProjectForm.hourlyRate : undefined,
          estimatedHours: editProjectForm.pricingModel === "Hourly" ? editProjectForm.estimatedHours : undefined,
          finalBudget: editProjectForm.finalBudget,
          bonus: editProjectForm.bonus,
          notes: editProjectForm.notes
        };
        break;
      case "status":
        body = statusForm;
        break;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Action failed");

      setToastMessage("Record updated successfully!");
      setTimeout(() => setToastMessage(""), 3000);
      setActiveModal(null);
      
      // Reset forms
      setPaymentForm({ amount: "", note: "" });
      setTakeoverForm({ newBdaId: "", note: "" });
      setAssignForm({ devId: "", workDetails: "" });

      setTriggerRefresh(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <AiLoader label="Synchronizing Project Workspace..." sublabel="Loading deliverables, team members, milestone ledgers, and countdown" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="crm-container">
        <h2>Project not found</h2>
        <button onClick={() => router.push("/dashboard/projects")} className="crm-btn crm-btn-secondary">Back to Projects</button>
      </div>
    );
  }

  const isDeveloper = currentUser?.roleName === "Developer";
  const hasOutstanding = project.pendingAmount > 0;

  return (
    <div className="crm-container animate-fade-in">
      {/* Back Button */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => router.push("/dashboard/projects")} style={{ border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          <ArrowLeft size={16} /> Back to Projects List
        </button>
      </div>

      {/* Live Deadline Countdown Banner */}
      {project.deadline && (
        <div 
          className={`crm-card ${timeLeft.isExpired ? "deadline-expired-alarm" : ""}`}
          style={{ 
            padding: "1.25rem 1.75rem", 
            marginBottom: "1.5rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            border: timeLeft.isExpired 
              ? "2px solid var(--danger-color)" 
              : timeLeft.days <= 2 
                ? "2px solid #f59e0b" 
                : "1px solid var(--border-primary)",
            background: timeLeft.isExpired 
              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.3) 100%)" 
              : timeLeft.days <= 2
                ? "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)"
                : "var(--bg-secondary)",
            transition: "all 0.3s ease"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ 
              width: "48px", 
              height: "48px", 
              borderRadius: "12px", 
              backgroundColor: timeLeft.isExpired ? "var(--danger-color)" : timeLeft.days <= 2 ? "#f59e0b" : "var(--primary-color)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: timeLeft.isExpired ? "0 0 20px rgba(239, 68, 68, 0.8)" : "none"
            }}
            className={timeLeft.isExpired ? "deadline-zoom-badge" : ""}
            >
              {timeLeft.isExpired ? <AlertOctagon size={24} /> : timeLeft.days <= 2 ? <Flame size={24} /> : <Hourglass size={24} />}
            </div>
            <div>
              <div style={{ 
                fontSize: "0.8125rem", 
                fontWeight: 700, 
                textTransform: "uppercase", 
                letterSpacing: "0.05em",
                color: timeLeft.isExpired ? "var(--danger-color)" : timeLeft.days <= 2 ? "#f59e0b" : "var(--text-secondary)"
              }}>
                {timeLeft.isExpired ? "🚨 PROJECT DEADLINE OVERDUE / EXPIRED" : timeLeft.days <= 2 ? "⚡ URGENT: DEADLINE APPROACHING" : "⏳ PROJECT TIME REMAINING"}
              </div>
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "2px", display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span>
                  Target Completion: <strong>{new Date(project.deadline).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(project.deadline).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong>
                </span>
                {!isDeveloper && (
                  <button
                    type="button"
                    onClick={() => setActiveModal("deadline")}
                    style={{
                      border: "none",
                      backgroundColor: "rgba(99, 102, 241, 0.15)",
                      color: "var(--primary-color)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px"
                    }}
                  >
                    <Clock size={12} /> Change Deadline
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Live Countdown Numbers */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {timeLeft.isExpired ? (
              <div 
                className="deadline-zoom-badge"
                style={{ 
                  backgroundColor: "var(--danger-color)", 
                  color: "#ffffff", 
                  padding: "0.6rem 1.25rem", 
                  borderRadius: "8px", 
                  fontWeight: 800, 
                  fontSize: "1.125rem",
                  letterSpacing: "0.05em",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <AlertTriangle size={20} />
                DEADLINE PASSED - IMMEDIATE ATTENTION REQUIRED
              </div>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <div style={{ textAlign: "center", backgroundColor: "var(--bg-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-primary)", minWidth: "56px" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-color)" }}>{String(timeLeft.days).padStart(2, "0")}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Days</div>
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, alignSelf: "center", color: "var(--text-tertiary)" }}>:</div>
                <div style={{ textAlign: "center", backgroundColor: "var(--bg-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-primary)", minWidth: "56px" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-color)" }}>{String(timeLeft.hours).padStart(2, "0")}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Hours</div>
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, alignSelf: "center", color: "var(--text-tertiary)" }}>:</div>
                <div style={{ textAlign: "center", backgroundColor: "var(--bg-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-primary)", minWidth: "56px" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--primary-color)" }}>{String(timeLeft.minutes).padStart(2, "0")}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Mins</div>
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, alignSelf: "center", color: "var(--text-tertiary)" }}>:</div>
                <div style={{ textAlign: "center", backgroundColor: "var(--bg-primary)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-primary)", minWidth: "56px" }}>
                  <div style={{ fontSize: "1.25rem", fontWeight: 800, color: timeLeft.days <= 2 ? "var(--danger-color)" : "var(--primary-color)" }}>{String(timeLeft.seconds).padStart(2, "0")}</div>
                  <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Secs</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header Info */}
      <div className="crm-card" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
            <span className="badge badge-primary">{project.serviceType}</span>
            <span className="badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", fontWeight: 700 }}>
              {project.currency || "INR"} ({project.pricingModel || "Fixed"})
            </span>
            {project.pricingModel === "Hourly" && project.hourlyRate && (
              <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                {project.currency || "INR"} {project.hourlyRate}/hr {project.estimatedHours ? `• ${project.estimatedHours} hrs est.` : ""}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{project.name}</h2>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Client: <strong>{project.client?.name} ({project.client?.company})</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          {!isDeveloper ? (
            <>
              <button 
                onClick={() => {
                  setEditProjectForm({
                    name: project.name || "",
                    serviceType: project.serviceType || "Web Design",
                    currency: project.currency || "INR",
                    pricingModel: project.pricingModel || "Fixed",
                    hourlyRate: String(project.hourlyRate || ""),
                    estimatedHours: String(project.estimatedHours || ""),
                    finalBudget: String(project.finalBudget || ""),
                    bonus: String(project.bonus || "0"),
                    notes: project.notes || ""
                  });
                  setActiveModal("editProject");
                }} 
                className="crm-btn crm-btn-secondary"
                title="Edit Project Details (Budget, Currency, Rates, Type, Notes)"
              >
                <Edit size={14} /> Edit Project
              </button>
              <button onClick={() => setActiveModal("status")} className="crm-btn crm-btn-secondary"><RefreshCw size={14} /> Update Project Status</button>
              <button onClick={() => {
                setTimelineForm({ type: "Note", notes: "" });
                setActiveModal("timeline");
              }} className="crm-btn crm-btn-secondary"><Plus size={14} /> Post Timeline Update</button>
              <button onClick={() => setActiveModal("payment")} className="crm-btn crm-btn-secondary"><CreditCard size={14} /> Record Payment</button>
              <button onClick={() => setActiveModal("takeover")} className="crm-btn crm-btn-secondary"><UserPlus size={14} /> BDA Takeover</button>
              <button onClick={() => setActiveModal("assign")} className="crm-btn crm-btn-primary"><Mail size={14} /> Assign Developer</button>
            </>
          ) : (
            <div style={{ 
              padding: "0.45rem 0.85rem", 
              borderRadius: "8px", 
              backgroundColor: "var(--bg-secondary)", 
              border: "1px solid var(--border-primary)", 
              fontSize: "0.8125rem", 
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem"
            }}>
              <span style={{ color: "var(--text-tertiary)" }}>Assignment Status:</span>
              <strong style={{ color: "var(--text-primary)" }}>Active Deliverable</strong>
            </div>
          )}
          {currentUser?.roleName === "Super Admin" && (
            <button
              onClick={async () => {
                if (confirm(`Are you sure you want to delete project "${project.name}"? It will be moved to Trash.`)) {
                  try {
                    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
                    if (res.ok) {
                      setTriggerRefresh(prev => prev + 1);
                      router.push("/dashboard/projects");
                    } else {
                      const data = await res.json();
                      alert(data.error || "Failed to delete project");
                    }
                  } catch (e) {
                    console.error(e);
                    alert("Failed to delete project");
                  }
                }
              }}
              className="crm-btn"
              style={{ backgroundColor: "var(--danger-light)", color: "var(--danger-color)", borderColor: "var(--danger-color)" }}
              title="Delete Project (Super Admin only)"
            >
              <Trash2 size={14} /> Delete Project
            </button>
          )}
        </div>
      </div>

      {/* Financials Overview Card - Hidden for Developer */}
      {!isDeveloper && (
        <div className="crm-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem", backgroundColor: "var(--bg-secondary)" }}>
          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
              {project.pricingModel === "Hourly" ? "Est. Hourly Budget" : "Contract Fixed Budget"} ({project.currency || "INR"})
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 2 }).format(project.finalBudget)}
            </div>
            {project.bonus > 0 && (
              <span style={{ fontSize: "0.75rem", color: "var(--success-color)", fontWeight: 500 }}>
                + {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(project.bonus)} Bonus
              </span>
            )}
          </div>

          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Total Collected</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success-color)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 2 }).format(project.totalReceived)}
            </div>
          </div>

          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Outstanding Balance</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 2 }).format(project.pendingAmount)}
            </div>
          </div>

          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Primary BDA Manager</div>
            <div style={{ fontSize: "1.125rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px" }}>
              {project.primaryBda?.name}
            </div>
          </div>
        </div>
      )}

      {/* Project Closure Review & Client Outcome Card (Visible to Developers, BDAs & Admins) */}
      {(project.clientFeedback || project.closeOutcome || project.status === "Completed" || project.status === "Cancelled") && (
        <div 
          className="crm-card" 
          style={{ 
            marginBottom: "1.5rem", 
            border: project.closeOutcome === "Good" 
              ? "1px solid rgba(16, 185, 129, 0.4)" 
              : project.closeOutcome === "Bad" 
                ? "1px solid rgba(239, 68, 68, 0.4)" 
                : "1px solid var(--border-primary)",
            background: project.closeOutcome === "Good"
              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, var(--bg-secondary) 100%)"
              : project.closeOutcome === "Bad"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, var(--bg-secondary) 100%)"
                : "var(--bg-secondary)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Award size={20} color={project.closeOutcome === "Good" ? "#10b981" : project.closeOutcome === "Bad" ? "#ef4444" : "var(--primary-color)"} />
              <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                Project Closure Review & Client Feedback
              </h3>
            </div>
            
            {/* Outcome Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.75rem",
                borderRadius: "8px",
                fontWeight: 700,
                fontSize: "0.8125rem",
                backgroundColor: project.closeOutcome === "Good" 
                  ? "rgba(16, 185, 129, 0.15)" 
                  : project.closeOutcome === "Bad" 
                    ? "rgba(239, 68, 68, 0.15)" 
                    : "rgba(99, 102, 241, 0.15)",
                color: project.closeOutcome === "Good" 
                  ? "#10b981" 
                  : project.closeOutcome === "Bad" 
                    ? "var(--danger-color)" 
                    : "var(--primary-color)",
                border: "1px solid currentColor"
              }}>
                {project.closeOutcome === "Good" ? <ThumbsUp size={14} /> : project.closeOutcome === "Bad" ? <ThumbsDown size={14} /> : <Award size={14} />}
                Closure Outcome: {project.closeOutcome ? `${project.closeOutcome} Project Closure` : "Standard Closure"}
              </span>

              {/* Star Rating */}
              <div style={{ display: "flex", gap: "2px", alignItems: "center", backgroundColor: "var(--bg-primary)", padding: "0.3rem 0.6rem", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={14} 
                    fill={star <= (Number(project.clientRating) || 5) ? "#f59e0b" : "none"} 
                    color={star <= (Number(project.clientRating) || 5) ? "#f59e0b" : "var(--text-tertiary)"} 
                  />
                ))}
                <span style={{ fontSize: "0.75rem", fontWeight: 700, marginLeft: "4px", color: "var(--text-secondary)" }}>
                  {project.clientRating || 5}/5
                </span>
              </div>
            </div>
          </div>

          {/* Client Feedback Comment */}
          <div style={{ 
            backgroundColor: "var(--bg-primary)", 
            padding: "1rem 1.25rem", 
            borderRadius: "8px", 
            border: "1px solid var(--border-primary)",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "var(--text-primary)"
          }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
              <MessageCircle size={13} />
              Client Feedback & Performance Review
            </div>
            <div style={{ fontStyle: project.clientFeedback ? "normal" : "italic", color: project.clientFeedback ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              {project.clientFeedback ? `"${project.clientFeedback}"` : "Client review recorded. Deliverables accepted."}
            </div>
          </div>
        </div>
      )}

      {/* Flagged Issue Box */}
      {!isDeveloper && project.status === "Issue" && project.issueDescription && (
        <div style={{ 
          backgroundColor: "var(--danger-light)", 
          color: "var(--danger-text)", 
          border: "1px solid rgba(239, 68, 68, 0.2)",
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}>
          <AlertOctagon size={24} />
          <div>
            <div style={{ fontWeight: 700 }}>Project Issue Flagged</div>
            <div style={{ fontSize: "0.875rem", marginTop: "2px" }}>{project.issueDescription}</div>
          </div>
        </div>
      )}

      {/* Two Columns Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
        
        {/* Left Column: Payments & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Milestone Details Card */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 0 }}>Project Deadlines</h3>
              {!isDeveloper && (
                <button
                  type="button"
                  onClick={() => setActiveModal("deadline")}
                  style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Edit Deadline
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Start Date</span>
                <strong>{new Date(project.startDate).toLocaleDateString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Target Deadline</span>
                <strong style={{ color: timeLeft.isExpired ? "var(--danger-color)" : "var(--text-primary)" }}>
                  {new Date(project.deadline).toLocaleDateString()} at {new Date(project.deadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Sales Source</span>
                <strong>{project.source || "None"}</strong>
              </div>
            </div>
          </div>

          {/* Payment Milestone Log Card - Hidden for Developer */}
          {!isDeveloper && (
            <div className="crm-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 0 }}>Milestone Payments Log</h3>
                <button onClick={() => setActiveModal("payment")} style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>
                  + Add Transaction
                </button>
              </div>

              {project.payments?.length === 0 ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No payments recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {project.payments.map((pay: any) => (
                    <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "8px", border: "1px solid var(--border-primary)", fontSize: "0.875rem" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(pay.amount)}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>{pay.note || "No note"}</div>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Ownership & History */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Ownership Takeovers history */}
          {project.ownershipHistory?.length > 0 && (
            <div className="crm-card">
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "1rem" }}>Project Managers Ownership Logs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
                {project.ownershipHistory.map((h: any) => (
                  <div key={h.id} style={{ borderLeft: "2px solid var(--primary-color)", paddingLeft: "0.75rem" }}>
                    <div>
                      Manager: <strong>{h.newBda?.name}</strong> taken over from <strong>{h.previousBda?.name || "Original BDA"}</strong>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      Date: {new Date(h.takeoverDate).toLocaleString()} • Note: {h.note || "No details"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 0 }}>Project timeline & logs</h3>
              {!isDeveloper && (
                <button 
                  type="button"
                  onClick={() => {
                    setTimelineForm({ type: "Note", notes: "" });
                    setActiveModal("timeline");
                  }}
                  style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}
                >
                  + Add Update
                </button>
              )}
            </div>

            {(!project.activities || project.activities.length === 0) ? (
              <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                No activity logs recorded yet.
              </div>
            ) : (
              <>
                <div style={timelineStyles.timeline}>
                  {(showAllActivities ? project.activities : project.activities.slice(0, 3)).map((act: any) => (
                    <div key={act.id} style={timelineStyles.timelineItem}>
                      <div style={timelineStyles.timelineDot} />
                      <div style={timelineStyles.timelineContent}>
                        <div style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
                          <strong>{act.user?.name || "System"}</strong>: {act.notes}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          {new Date(act.timestamp).toLocaleString()} • {act.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {project.activities.length > 3 && (
                  <div style={{ marginTop: "1rem", textAlign: "center", borderTop: "1px solid var(--border-primary)", paddingTop: "0.75rem" }}>
                    <button 
                      type="button"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="crm-btn crm-btn-secondary"
                      style={{ fontSize: "0.775rem", padding: "4px 12px", width: "100%", justifyContent: "center" }}
                    >
                      {showAllActivities 
                        ? `Show Less (Collapse)` 
                        : `Show More (${project.activities.length - 3} older updates)`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

      </div>

      {/* Modern Floating Sticky Project Chat Widget */}
      {project?.conversationId && (
        <div 
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            width: isChatMinimized ? "300px" : "390px",
            maxHeight: isChatMinimized ? "52px" : "520px",
            zIndex: 1000,
            borderRadius: "14px",
            boxShadow: "0 14px 40px -4px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--border-primary)",
            backgroundColor: "var(--bg-primary)",
            overflow: "hidden",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            display: isChatOpen ? "flex" : "none",
            flexDirection: "column"
          }}
        >
          {/* Sticky Chat Header */}
          <div 
            onClick={() => setIsChatMinimized(!isChatMinimized)}
            style={{
              padding: "0.75rem 1rem",
              background: "linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%)",
              color: "#ffffff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div style={{ position: "relative" }}>
                <MessageSquare size={18} />
                <span style={{ 
                  position: "absolute", 
                  top: "-2px", 
                  right: "-2px", 
                  width: "8px", 
                  height: "8px", 
                  borderRadius: "50%", 
                  backgroundColor: "#10b981", 
                  border: "2px solid #ffffff" 
                }} />
              </div>
              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, lineHeight: 1.2 }}>Project Team Chat</div>
                <div style={{ fontSize: "0.7rem", opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }}>
                  {project.name}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/dashboard/chat?id=${project.conversationId}`);
                }}
                style={{
                  border: "none",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "3px 7px",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px"
                }}
                title="Open full page chat"
              >
                <Maximize2 size={11} /> Full View
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatMinimized(!isChatMinimized);
                }}
                style={{
                  border: "none",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "3px 6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center"
                }}
                title={isChatMinimized ? "Expand Chat" : "Minimize Chat"}
              >
                {isChatMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>

              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChatOpen(false);
                }}
                style={{
                  border: "none",
                  background: "rgba(255, 255, 255, 0.15)",
                  color: "#ffffff",
                  cursor: "pointer",
                  padding: "3px 6px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center"
                }}
                title="Close floating chat widget"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Sticky Chat Body */}
          {!isChatMinimized && (
            <div style={{ display: "flex", flexDirection: "column", height: "420px", backgroundColor: "var(--bg-secondary)" }}>
              {/* Messages Panel */}
              <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "0.85rem", 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.65rem" 
              }}>
                {chatMessages.length === 0 ? (
                  <div style={{ margin: "auto", color: "var(--text-tertiary)", fontSize: "0.8125rem", textAlign: "center", padding: "1rem" }}>
                    💬 No team messages yet.<br />Post an update to collaborate!
                  </div>
                ) : (
                  chatMessages.map((m) => {
                    const isMe = m.senderId === currentUser?.id;
                    return (
                      <div 
                        key={m.id} 
                        style={{ 
                          display: "flex", 
                          justifyContent: isMe ? "flex-end" : "flex-start",
                          width: "100%"
                        }}
                      >
                        <div style={{ 
                          maxWidth: "85%", 
                          padding: "0.5rem 0.75rem", 
                          borderRadius: "10px", 
                          backgroundColor: isMe ? "var(--primary-color)" : "var(--bg-primary)",
                          color: isMe ? "#ffffff" : "var(--text-primary)",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          border: isMe ? "none" : "1px solid var(--border-primary)"
                        }}>
                          {!isMe && (
                            <div style={{ fontSize: "0.725rem", fontWeight: 700, color: "var(--primary-color)", marginBottom: "0.15rem" }}>
                              {m.senderName}
                            </div>
                          )}
                          <div style={{ fontSize: "0.8125rem", wordBreak: "break-word" }}>{m.content}</div>

                          {/* Attachments rendering */}
                          {m.attachments && m.attachments.length > 0 && (
                            <div style={{ marginTop: "0.35rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {m.attachments.map((att: any) => {
                                const isImage = att.fileType.startsWith("image/");
                                return (
                                  <div key={att.id}>
                                    {isImage ? (
                                      <a href={`/api/chat/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                                        <img 
                                          src={`/api/chat/attachments/${att.id}`} 
                                          alt={att.fileName} 
                                          style={{ maxWidth: "140px", maxHeight: "100px", borderRadius: "6px", marginTop: "0.25rem" }} 
                                        />
                                      </a>
                                    ) : (
                                      <a 
                                        href={`/api/chat/attachments/${att.id}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "0.25rem",
                                          fontSize: "0.725rem",
                                          color: isMe ? "#ffffff" : "var(--primary-color)"
                                        }}
                                      >
                                        <FileText size={13} />
                                        <span style={{ textDecoration: "underline" }}>{att.fileName}</span>
                                      </a>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.35rem", fontSize: "0.65rem", opacity: 0.8, marginTop: "0.2rem" }}>
                            <span>
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isMe && !m.isDeleted && (
                              <button 
                                onClick={() => handleDeleteChatMessage(m.id)}
                                style={{ border: "none", background: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0 }}
                                title="Delete message"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Composer Panel */}
              <form onSubmit={handleSendChatMessage} style={{ 
                borderTop: "1px solid var(--border-primary)", 
                padding: "0.6rem 0.75rem", 
                backgroundColor: "var(--bg-primary)",
                display: "flex",
                flexDirection: "column",
                gap: "0.35rem"
              }}>
                {chatStagedAttachments.length > 0 && (
                  <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                    {chatStagedAttachments.map((att, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--bg-secondary)", borderRadius: "4px", padding: "0.15rem 0.35rem", fontSize: "0.7rem" }}>
                        <FileText size={11} />
                        <span style={{ maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                        <button 
                          type="button" 
                          onClick={() => setChatStagedAttachments(prev => prev.filter((_, i) => i !== idx))}
                          style={{ border: "none", background: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0 }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button 
                    type="button" 
                    onClick={() => chatFileInputRef.current?.click()}
                    style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem" }}
                    title="Attach file/image"
                  >
                    <Paperclip size={16} />
                  </button>
                  <input 
                    type="file" 
                    multiple 
                    ref={chatFileInputRef}
                    onChange={handleChatFileChange}
                    style={{ display: "none" }}
                  />
                  <input 
                    type="text" 
                    placeholder="Message team..." 
                    value={chatText}
                    onChange={(e) => setChatText(e.target.value)}
                    style={{ 
                      flex: 1, 
                      padding: "0.45rem 0.75rem", 
                      borderRadius: "8px", 
                      border: "1px solid var(--border-primary)", 
                      backgroundColor: "var(--bg-secondary)", 
                      color: "var(--text-primary)",
                      fontSize: "0.8125rem",
                      outline: "none"
                    }}
                  />
                  <button type="submit" style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    width: "32px", 
                    height: "32px", 
                    borderRadius: "8px", 
                    border: "none", 
                    backgroundColor: "var(--primary-color)", 
                    color: "#ffffff", 
                    cursor: "pointer",
                    flexShrink: 0
                  }}>
                    <Send size={13} />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Toggle button if chat is closed */}
      {project?.conversationId && !isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsChatMinimized(false);
          }}
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "var(--primary-color)",
            color: "#ffffff",
            border: "none",
            boxShadow: "0 8px 24px rgba(99, 102, 241, 0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Open Project Team Chat"
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 100, backgroundColor: "var(--success-light)", color: "var(--success-text)", border: "1px solid currentColor", padding: "0.875rem 1.5rem", borderRadius: "8px", boxShadow: "var(--shadow-lg)", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 500, fontSize: "0.875rem" }}>
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Modals */}
      {activeModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.container} className="animate-fade-in">
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>
                {activeModal === "deadline" && "Change Project Target Deadline & Time"}
                {activeModal === "timeline" && "Post Project Timeline & Activity Update"}
                {activeModal === "payment" && "Record Milestone Payment"}
                {activeModal === "takeover" && "Relinquish and Takeover Project BDA"}
                {activeModal === "assign" && "Assign Developer Task details"}
                {activeModal === "status" && "Update Project Status / Report Issue"}
              </h3>
              <button onClick={() => setActiveModal(null)} style={modalStyles.closeBtn}>&times;</button>
            </div>

            <form onSubmit={handleActionSubmit} style={modalStyles.body}>
              
              {/* Change Deadline Form */}
              {activeModal === "deadline" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={modalStyles.infoBanner}>
                    <Clock size={16} />
                    <span>Set the exact date and time cutoff for deliverables. Live countdown will automatically sync and alert upon expiry.</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Target Deadline Date</label>
                      <input 
                        type="date"
                        className="crm-input"
                        value={deadlineForm.deadlineDate}
                        onChange={(e) => setDeadlineForm(prev => ({ ...prev, deadlineDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Target Deadline Time</label>
                      <input 
                        type="time"
                        className="crm-input"
                        value={deadlineForm.deadlineTime}
                        onChange={(e) => setDeadlineForm(prev => ({ ...prev, deadlineTime: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Timeline Update Form */}
              {activeModal === "timeline" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Update / Action Type</label>
                    <select 
                      className="crm-select"
                      value={timelineForm.type}
                      onChange={(e) => setTimelineForm(prev => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="Note">Note / General Update</option>
                      <option value="Meeting">Meeting Completed</option>
                      <option value="Call">Client / Developer Call</option>
                      <option value="Email">Email Communication</option>
                      <option value="WhatsApp">WhatsApp Message</option>
                      <option value="System">Milestone Progress</option>
                    </select>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Timeline Update Notes / Milestones</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={4} 
                      placeholder="e.g. Design review completed with client. Frontend development started on staging..."
                      value={timelineForm.notes}
                      onChange={(e) => setTimelineForm(prev => ({ ...prev, notes: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}
              
              {/* Payment Form */}
              {activeModal === "payment" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Milestone Payment Amount (INR)</label>
                    <input 
                      type="number" 
                      className="crm-input" 
                      placeholder="e.g. 15000"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Milestone Note</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder="e.g. Design Approved / First Milestone"
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Takeover Form */}
              {activeModal === "takeover" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Select New Project BDA Manager</label>
                    <select 
                      className="crm-select"
                      value={takeoverForm.newBdaId}
                      onChange={(e) => setTakeoverForm(prev => ({ ...prev, newBdaId: e.target.value }))}
                      required
                    >
                      <option value="">Choose BDA</option>
                      {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Takeover Reason / Handover Note</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={3} 
                      placeholder="Details of project handover..."
                      value={takeoverForm.note}
                      onChange={(e) => setTakeoverForm(prev => ({ ...prev, note: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Assign Developer Form */}
              {activeModal === "assign" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={modalStyles.infoBanner}>
                    <Mail size={16} />
                    <span>Developer will receive task details and documents email without any financial budget info.</span>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Select developer / Team member</label>
                    <select 
                      className="crm-select"
                      value={assignForm.devId}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, devId: e.target.value }))}
                      required
                    >
                      <option value="">Select Developer</option>
                      {devs.map(d => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Task Requirements & Important Notes</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={5} 
                      placeholder="Build Frontend components for e-commerce website using Next.js. Deliverable target in 3 weeks..."
                      value={assignForm.workDetails}
                      onChange={(e) => setAssignForm(prev => ({ ...prev, workDetails: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              {activeModal === "status" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Project Status</label>
                    <select 
                      className="crm-select"
                      value={statusForm.status}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="Work in Progress">Work in Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Review">Review</option>
                      <option value="Issue">Issue / Flagged</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  {statusForm.status === "Issue" && (
                    <div>
                      <label style={modalStyles.label}>Issue Description</label>
                      <textarea 
                        className="crm-textarea" 
                        rows={4} 
                        placeholder="Explain the problem in detail so team can review..."
                        value={statusForm.issueDescription}
                        onChange={(e) => setStatusForm(prev => ({ ...prev, issueDescription: e.target.value }))}
                        required
                      />
                    </div>
                  )}

                  {/* Closure Review & Client Feedback for Team/Developer Visibility */}
                  {(statusForm.status === "Completed" || statusForm.status === "Cancelled" || statusForm.status === "Review") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--primary-color)", textTransform: "uppercase" }}>
                        Project Closure & Client Review Details
                      </div>
                      
                      <div>
                        <label style={modalStyles.label}>Close Outcome (Acha / Bura / Normal)</label>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => setStatusForm(prev => ({ ...prev, closeOutcome: "Good" }))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                              padding: "0.5rem",
                              borderRadius: "6px",
                              border: statusForm.closeOutcome === "Good" ? "2px solid #10b981" : "1px solid var(--border-primary)",
                              backgroundColor: statusForm.closeOutcome === "Good" ? "rgba(16, 185, 129, 0.15)" : "var(--bg-primary)",
                              color: statusForm.closeOutcome === "Good" ? "#10b981" : "var(--text-secondary)",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              cursor: "pointer"
                            }}
                          >
                            <ThumbsUp size={14} /> Good (Acha)
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusForm(prev => ({ ...prev, closeOutcome: "Bad" }))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                              padding: "0.5rem",
                              borderRadius: "6px",
                              border: statusForm.closeOutcome === "Bad" ? "2px solid #ef4444" : "1px solid var(--border-primary)",
                              backgroundColor: statusForm.closeOutcome === "Bad" ? "rgba(239, 68, 68, 0.15)" : "var(--bg-primary)",
                              color: statusForm.closeOutcome === "Bad" ? "#ef4444" : "var(--text-secondary)",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              cursor: "pointer"
                            }}
                          >
                            <ThumbsDown size={14} /> Bad (Bura)
                          </button>
                          <button
                            type="button"
                            onClick={() => setStatusForm(prev => ({ ...prev, closeOutcome: "Neutral" }))}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "0.35rem",
                              padding: "0.5rem",
                              borderRadius: "6px",
                              border: statusForm.closeOutcome === "Neutral" ? "2px solid var(--primary-color)" : "1px solid var(--border-primary)",
                              backgroundColor: statusForm.closeOutcome === "Neutral" ? "rgba(99, 102, 241, 0.15)" : "var(--bg-primary)",
                              color: statusForm.closeOutcome === "Neutral" ? "var(--primary-color)" : "var(--text-secondary)",
                              fontWeight: 700,
                              fontSize: "0.8125rem",
                              cursor: "pointer"
                            }}
                          >
                            <Award size={14} /> Average
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={modalStyles.label}>Client Star Rating (1 to 5 Stars)</label>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setStatusForm(prev => ({ ...prev, clientRating: String(star) }))}
                              style={{
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                padding: "4px"
                              }}
                            >
                              <Star 
                                size={22} 
                                fill={star <= Number(statusForm.clientRating) ? "#f59e0b" : "none"} 
                                color={star <= Number(statusForm.clientRating) ? "#f59e0b" : "var(--text-tertiary)"} 
                              />
                            </button>
                          ))}
                          <span style={{ fontSize: "0.875rem", fontWeight: 700, marginLeft: "0.5rem", color: "var(--text-primary)" }}>
                            {statusForm.clientRating} / 5 Stars
                          </span>
                        </div>
                      </div>

                      <div>
                        <label style={modalStyles.label}>Client Feedback / Review Comment</label>
                        <textarea 
                          className="crm-textarea" 
                          rows={3} 
                          placeholder="Client review comment, e.g. 'Project was delivered on time with high code quality. Client is happy with the frontend design.'..."
                          value={statusForm.clientFeedback}
                          onChange={(e) => setStatusForm(prev => ({ ...prev, clientFeedback: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Edit Project Form */}
              {activeModal === "editProject" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Project Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      value={editProjectForm.name}
                      onChange={(e) => setEditProjectForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Service / Project Type</label>
                    <select 
                      className="crm-select"
                      value={editProjectForm.serviceType}
                      onChange={(e) => setEditProjectForm(prev => ({ ...prev, serviceType: e.target.value }))}
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

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", backgroundColor: "var(--bg-secondary)", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-primary)" }}>
                    <div>
                      <label style={modalStyles.label}>Currency</label>
                      <select
                        className="crm-select"
                        value={editProjectForm.currency}
                        onChange={(e) => setEditProjectForm(prev => ({ ...prev, currency: e.target.value }))}
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
                      <label style={modalStyles.label}>Pricing Model</label>
                      <select
                        className="crm-select"
                        value={editProjectForm.pricingModel}
                        onChange={(e) => setEditProjectForm(prev => ({ ...prev, pricingModel: e.target.value }))}
                      >
                        <option value="Fixed">Fixed Price Project</option>
                        <option value="Hourly">Hourly Rate Contract</option>
                      </select>
                    </div>
                  </div>

                  {editProjectForm.pricingModel === "Hourly" ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", backgroundColor: "var(--bg-primary)", padding: "0.75rem", borderRadius: "8px", border: "1px dashed var(--border-primary)" }}>
                      <div>
                        <label style={modalStyles.label}>Hourly Rate ({editProjectForm.currency})</label>
                        <input 
                          type="number" 
                          className="crm-input"
                          placeholder="e.g. 25"
                          value={editProjectForm.hourlyRate}
                          onChange={(e) => {
                            const rate = e.target.value;
                            const hrs = editProjectForm.estimatedHours;
                            const calcTotal = rate && hrs ? String(parseFloat(rate) * parseFloat(hrs)) : editProjectForm.finalBudget;
                            setEditProjectForm(prev => ({ ...prev, hourlyRate: rate, finalBudget: calcTotal }));
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
                          value={editProjectForm.estimatedHours}
                          onChange={(e) => {
                            const hrs = e.target.value;
                            const rate = editProjectForm.hourlyRate;
                            const calcTotal = rate && hrs ? String(parseFloat(rate) * parseFloat(hrs)) : editProjectForm.finalBudget;
                            setEditProjectForm(prev => ({ ...prev, estimatedHours: hrs, finalBudget: calcTotal }));
                          }}
                          required
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Est. Total Budget</label>
                        <input 
                          type="number" 
                          className="crm-input"
                          value={editProjectForm.finalBudget}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, finalBudget: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={modalStyles.label}>Final Fixed Budget ({editProjectForm.currency})</label>
                        <input 
                          type="number" 
                          className="crm-input"
                          value={editProjectForm.finalBudget}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, finalBudget: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label style={modalStyles.label}>Bonus Budget ({editProjectForm.currency})</label>
                        <input 
                          type="number" 
                          className="crm-input"
                          value={editProjectForm.bonus}
                          onChange={(e) => setEditProjectForm(prev => ({ ...prev, bonus: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={modalStyles.label}>Project Scope & Description Notes</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={3} 
                      value={editProjectForm.notes}
                      onChange={(e) => setEditProjectForm(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div style={modalStyles.actions}>
                <button type="button" onClick={() => setActiveModal(null)} className="crm-btn crm-btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="crm-btn crm-btn-primary">
                  {actionLoading ? "Processing..." : "Submit Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const timelineStyles: Record<string, React.CSSProperties> = {
  timeline: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    paddingLeft: "1rem",
    borderLeft: "2px solid var(--border-primary)",
    gap: "1.25rem",
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
    maxWidth: "500px",
    maxHeight: "90vh",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "12px",
    boxShadow: "var(--shadow-lg)",
    display: "flex",
    flexDirection: "column",
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
    padding: "0 0.5rem",
  },
  body: {
    padding: "1.5rem",
    overflowY: "auto",
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
};
