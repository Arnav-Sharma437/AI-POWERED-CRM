"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CreditCard, UserPlus, RefreshCw, AlertOctagon, 
  Plus, Calendar, Mail, FileText, CheckCircle2, DollarSign,
  Send, Paperclip, MessageSquare, Trash2, X, Clock, Hourglass, 
  AlertTriangle, Flame, Minimize2, Maximize2, ChevronDown, ChevronUp,
  Star, ThumbsUp, ThumbsDown, Award, MessageCircle, Edit, Users
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

  // Dedicated Project Chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatStagedAttachments, setChatStagedAttachments] = useState<any[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
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
  const [assignForm, setAssignForm] = useState<{ devId: string; devIds: string[]; workDetails: string }>({ devId: "", devIds: [], workDetails: "" });
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
        if (data.messages) {
          setChatMessages((prev) => {
            const tempMessages = prev.filter(m => m.id.startsWith("temp-"));
            const missingTemps = tempMessages.filter(
              t => !data.messages.some((m: any) => m.content === t.content && Math.abs(new Date(m.createdAt).getTime() - new Date(t.createdAt).getTime()) < 15000)
            );
            return [...data.messages, ...missingTemps];
          });
        }
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
              const filtered = prev.filter(
                (m) => !(m.id.startsWith("temp-") && m.content === newMsg.content && m.senderId === newMsg.senderId)
              );
              return [...filtered, newMsg];
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

  // Internal auto-scroll for chat container (prevents whole window from jumping/scrolling down)
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
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
        body = {
          devIds: assignForm.devIds.length > 0 ? assignForm.devIds : [assignForm.devId],
          workDetails: assignForm.workDetails
        };
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
      setAssignForm({ devId: "", devIds: [], workDetails: "" });

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

      {/* Top Header Card: Project Identity, Live Countdown & Actions */}
      <div 
        className="crm-card" 
        style={{ 
          padding: "1.25rem 1.5rem", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          flexWrap: "wrap", 
          gap: "1rem", 
          marginBottom: "1.25rem" 
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <span className="badge badge-primary">{project.serviceType}</span>
            <span className="badge" style={{ backgroundColor: "rgba(99, 102, 241, 0.15)", color: "var(--primary-color)", fontWeight: 700 }}>
              {project.currency || "INR"} ({project.pricingModel || "Fixed"})
            </span>
            {project.pricingModel === "Hourly" && project.hourlyRate && (
              <span className="badge" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: 600 }}>
                {project.currency || "INR"} {project.hourlyRate}/hr {project.estimatedHours ? `• ${project.estimatedHours} hrs est.` : ""}
              </span>
            )}
            {project.status && (
              <span className="badge" style={{ 
                backgroundColor: project.status === "Completed" ? "rgba(16, 185, 129, 0.15)" : project.status === "Issue" ? "rgba(239, 68, 68, 0.15)" : "rgba(99, 102, 241, 0.15)",
                color: project.status === "Completed" ? "#10b981" : project.status === "Issue" ? "var(--danger-color)" : "var(--primary-color)",
                fontWeight: 700
              }}>
                Status: {project.status}
              </span>
            )}
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{project.name}</h2>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Client: <strong>{project.client?.name} ({project.client?.company})</strong>
          </div>
        </div>

        {/* Live Countdown in Header */}
        {project.deadline && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.85rem",
            padding: "0.6rem 1rem",
            borderRadius: "10px",
            backgroundColor: "var(--bg-secondary)",
            border: timeLeft.isExpired ? "1px solid var(--danger-color)" : "1px solid var(--border-primary)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: timeLeft.isExpired ? "var(--danger-color)" : timeLeft.days <= 2 ? "#f59e0b" : "var(--primary-color)" }}>
              {timeLeft.isExpired ? <AlertOctagon size={18} /> : <Clock size={18} />}
              <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase" }}>
                {timeLeft.isExpired ? "OVERDUE" : "Target"}:
              </div>
            </div>
            
            {timeLeft.isExpired ? (
              <div style={{ color: "var(--danger-color)", fontWeight: 800, fontSize: "0.875rem" }}>DEADLINE PASSED</div>
            ) : (
              <div style={{ display: "flex", gap: "0.25rem", alignItems: "center", fontSize: "0.875rem", fontWeight: 800, color: "var(--primary-color)" }}>
                <span>{String(timeLeft.days).padStart(2, "0")}d</span> :
                <span>{String(timeLeft.hours).padStart(2, "0")}h</span> :
                <span>{String(timeLeft.minutes).padStart(2, "0")}m</span> :
                <span>{String(timeLeft.seconds).padStart(2, "0")}s</span>
              </div>
            )}

            {!isDeveloper && (
              <button
                type="button"
                onClick={() => setActiveModal("deadline")}
                style={{
                  border: "none",
                  backgroundColor: "rgba(99, 102, 241, 0.12)",
                  color: "var(--primary-color)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Edit
              </button>
            )}
          </div>
        )}

        {/* Header Action Buttons */}
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
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
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
                title="Edit Project Details"
              >
                <Edit size={13} /> Edit Project
              </button>
              <button onClick={() => setActiveModal("status")} className="crm-btn crm-btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}>
                <RefreshCw size={13} /> Status
              </button>
              <button onClick={() => {
                setTimelineForm({ type: "Note", notes: "" });
                setActiveModal("timeline");
              }} className="crm-btn crm-btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}>
                <Plus size={13} /> Timeline
              </button>
              <button onClick={() => setActiveModal("payment")} className="crm-btn crm-btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}>
                <CreditCard size={13} /> Payment
              </button>
              <button onClick={() => setActiveModal("takeover")} className="crm-btn crm-btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}>
                <UserPlus size={13} /> Takeover
              </button>

              <button 
                onClick={() => {
                  setAssignForm({ devId: "", devIds: [], workDetails: "" });
                  setActiveModal("assign");
                }} 
                className="crm-btn crm-btn-secondary" 
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
              >
                <UserPlus size={13} /> Assign Developer
              </button>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button onClick={() => setActiveModal("status")} className="crm-btn crm-btn-secondary" style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }} title="Update Project Kanban Stage / Status">
                <RefreshCw size={13} /> Update Status
              </button>
              <button 
                onClick={() => {
                  setTimelineForm({ type: "Note", notes: "" });
                  setActiveModal("timeline");
                }} 
                className="crm-btn crm-btn-primary" 
                style={{ padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
                title="Add a note or progress update to this project"
              >
                <Plus size={13} /> Add Note / Update
              </button>
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
              style={{ backgroundColor: "var(--danger-light)", color: "var(--danger-color)", borderColor: "var(--danger-color)", padding: "0.45rem 0.75rem", fontSize: "0.8125rem" }}
              title="Delete Project (Super Admin only)"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Side-by-Side: Left Details & Right Dedicated Full View Chat */}
      <div 
        className="crm-project-layout-grid"
        style={{ 
          display: "grid", 
          gridTemplateColumns: project?.conversationId ? "1fr 1fr" : "1fr", 
          gap: "1.25rem", 
          alignItems: "stretch" 
        }}
      >
        {/* Left Column: Financials, Deadlines, Milestones, Ownership & Timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", minWidth: 0 }}>
          
          {/* Financials Overview Card - Hidden for Developer */}
          {!isDeveloper && (
            <div className="crm-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "1rem", backgroundColor: "var(--bg-secondary)", padding: "1.25rem" }}>
              <div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase" }}>
                  Budget ({project.currency || "INR"})
                </div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(project.finalBudget)}
                </div>
                {project.bonus > 0 && (
                  <span style={{ fontSize: "0.7rem", color: "var(--success-color)", fontWeight: 500 }}>
                    +{new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(project.bonus)}
                  </span>
                )}
              </div>

              <div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase" }}>Collected</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--success-color)", marginTop: "2px" }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(project.totalReceived)}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase" }}>Pending</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 700, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)", marginTop: "2px" }}>
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(project.pendingAmount)}
                </div>
              </div>

              <div>
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase" }}>Manager</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {project.primaryBda?.name || "Unassigned"}
                </div>
              </div>
            </div>
          )}

          {/* Project Closure Review & Client Outcome Card - ONLY visible when project is Completed or Cancelled */}
          {(project.status === "Completed" || project.status === "Cancelled") && (
            <div 
              className="crm-card" 
              style={{ 
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Award size={18} color={project.closeOutcome === "Good" ? "#10b981" : project.closeOutcome === "Bad" ? "#ef4444" : "var(--primary-color)"} />
                  <h3 style={{ fontSize: "0.875rem", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                    Closure Review
                  </h3>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "6px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
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
                    {project.closeOutcome === "Good" ? <ThumbsUp size={12} /> : project.closeOutcome === "Bad" ? <ThumbsDown size={12} /> : <Award size={12} />}
                    {project.closeOutcome ? `${project.closeOutcome}` : "Closed"}
                  </span>

                  <div style={{ display: "flex", gap: "2px", alignItems: "center", backgroundColor: "var(--bg-primary)", padding: "0.2rem 0.45rem", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={12} 
                        fill={star <= (Number(project.clientRating) || 5) ? "#f59e0b" : "none"} 
                        color={star <= (Number(project.clientRating) || 5) ? "#f59e0b" : "var(--text-tertiary)"} 
                      />
                    ))}
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, marginLeft: "3px", color: "var(--text-secondary)" }}>
                      {project.clientRating || 5}/5
                    </span>
                  </div>
                </div>
              </div>

              {project.clientFeedback && (
                <div style={{ 
                  backgroundColor: "var(--bg-primary)", 
                  padding: "0.75rem", 
                  borderRadius: "6px", 
                  border: "1px solid var(--border-primary)",
                  fontSize: "0.8125rem",
                  color: "var(--text-primary)"
                }}>
                  "{project.clientFeedback}"
                </div>
              )}
            </div>
          )}

          {/* Flagged Issue Box */}
          {!isDeveloper && project.status === "Issue" && project.issueDescription && (
            <div style={{ 
              backgroundColor: "var(--danger-light)", 
              color: "var(--danger-text)", 
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "0.85rem 1.25rem",
              borderRadius: "8px",
              display: "flex",
              gap: "0.75rem",
              alignItems: "center"
            }}>
              <AlertOctagon size={20} />
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.875rem" }}>Project Issue Flagged</div>
                <div style={{ fontSize: "0.8125rem", marginTop: "2px" }}>{project.issueDescription}</div>
              </div>
            </div>
          )}

          {/* Milestone Details Card */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 0 }}>Project Deadlines & Scope</h3>
              {!isDeveloper && (
                <button
                  type="button"
                  onClick={() => setActiveModal("deadline")}
                  style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.775rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Edit
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.8125rem" }}>
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
              {project.notes && (
                <div style={{ marginTop: "0.35rem", padding: "0.6rem 0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-primary)" }}>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", marginBottom: "2px" }}>Scope / Notes:</div>
                  <div style={{ fontSize: "0.775rem", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>{project.notes}</div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Milestone Log Card - Hidden for Developer */}
          {!isDeveloper && (
            <div className="crm-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 0 }}>Milestone Payments Log</h3>
                <button onClick={() => setActiveModal("payment")} style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.775rem", fontWeight: 600, cursor: "pointer" }}>
                  + Add Payment
                </button>
              </div>

              {project.payments?.length === 0 ? (
                <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>No payments recorded yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {project.payments.map((pay: any) => (
                    <div key={pay.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", backgroundColor: "var(--bg-primary)", borderRadius: "6px", border: "1px solid var(--border-primary)", fontSize: "0.8125rem" }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{new Intl.NumberFormat("en-IN", { style: "currency", currency: project.currency || "INR", maximumFractionDigits: 0 }).format(pay.amount)}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "1px" }}>{pay.note || "Payment recorded"}</div>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                        {new Date(pay.paymentDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ownership Takeovers history */}
          {project.ownershipHistory?.length > 0 && (
            <div className="crm-card">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: "0.75rem" }}>Ownership Logs</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8125rem" }}>
                {project.ownershipHistory.map((h: any) => (
                  <div key={h.id} style={{ borderLeft: "2px solid var(--primary-color)", paddingLeft: "0.6rem" }}>
                    <div>
                      Manager: <strong>{h.newBda?.name}</strong> from <strong>{h.previousBda?.name || "Original BDA"}</strong>
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                      {new Date(h.takeoverDate).toLocaleString()} • Note: {h.note || "No details"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, textTransform: "uppercase", marginBottom: 0 }}>Project timeline & logs</h3>
              <button 
                type="button"
                onClick={() => {
                  setTimelineForm({ type: "Note", notes: "" });
                  setActiveModal("timeline");
                }}
                style={{ border: "none", background: "none", color: "var(--primary-color)", fontSize: "0.775rem", fontWeight: 600, cursor: "pointer" }}
              >
                + Add Note / Update
              </button>
            </div>

            {(!project.activities || project.activities.length === 0) ? (
              <div style={{ padding: "1.25rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.8125rem" }}>
                No activity logs recorded yet.
              </div>
            ) : (
              <>
                <div style={timelineStyles.timeline}>
                  {(showAllActivities ? project.activities : project.activities.slice(0, 3)).map((act: any) => (
                    <div key={act.id} style={timelineStyles.timelineItem}>
                      <div style={timelineStyles.timelineDot} />
                      <div style={timelineStyles.timelineContent}>
                        <div style={{ fontSize: "0.8125rem", color: "var(--text-primary)" }}>
                          <strong>{act.user?.name || "System"}</strong>: {act.notes}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                          {new Date(act.timestamp).toLocaleString()} • {act.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {project.activities.length > 3 && (
                  <div style={{ marginTop: "0.75rem", textAlign: "center", borderTop: "1px solid var(--border-primary)", paddingTop: "0.5rem" }}>
                    <button 
                      type="button"
                      onClick={() => setShowAllActivities(!showAllActivities)}
                      className="crm-btn crm-btn-secondary"
                      style={{ fontSize: "0.75rem", padding: "3px 10px", width: "100%", justifyContent: "center" }}
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

        {/* Right Dedicated Column: Full-Height Project Team Messages & Discussions */}
        {project?.conversationId && (
          <div 
            className="crm-card" 
            style={{ 
              padding: 0, 
              display: "flex", 
              flexDirection: "column", 
              height: "calc(100vh - 200px)", 
              minHeight: "580px",
              position: "sticky", 
              top: "90px",
              overflow: "hidden",
              border: "1px solid var(--border-primary)",
              boxShadow: "var(--shadow-md)"
            }}
          >
            {/* Dedicated Chat Header */}
            <div 
              style={{
                padding: "0.85rem 1.25rem",
                background: "linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%)",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <div style={{ position: "relative" }}>
                  <MessageSquare size={19} />
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
                  <div style={{ fontSize: "0.9375rem", fontWeight: 700, lineHeight: 1.2 }}>Project Messages & Chat</div>
                  <div style={{ fontSize: "0.725rem", opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                    {project.name}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button 
                  type="button"
                  onClick={() => router.push(`/dashboard/chat?id=${project.conversationId}`)}
                  style={{
                    border: "none",
                    background: "rgba(255, 255, 255, 0.2)",
                    color: "#ffffff",
                    borderRadius: "6px",
                    padding: "4px 9px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Open full page chat"
                >
                  <Maximize2 size={13} /> Full Screen
                </button>
              </div>
            </div>

            {/* Project Group Members Header Bar */}
            <div style={{
              padding: "0.5rem 1rem",
              backgroundColor: "var(--bg-secondary)",
              borderBottom: "1px solid var(--border-primary)",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.4rem",
              fontSize: "0.75rem"
            }}>
              <span style={{ color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: "0.25rem", fontWeight: 500, marginRight: "0.25rem" }}>
                <Users size={12} /> Group Members ({project?.conversationMembers?.length || (project?.assignedDevs?.length || 0) + 1}):
              </span>

              {(project?.conversationMembers && project.conversationMembers.length > 0 
                ? project.conversationMembers 
                : [
                    ...(project?.primaryBda ? [{ id: project.primaryBda.id, name: project.primaryBda.name, roleName: "Primary BDA" }] : []),
                    ...(project?.assignedDevs || []).map((d: any) => ({ ...d, roleName: "Developer" }))
                  ]
              ).map((member: any) => (
                <div 
                  key={member.id}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "2px 7px",
                    borderRadius: "12px",
                    backgroundColor: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    fontSize: "0.725rem"
                  }}
                >
                  <span style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "var(--bg-tertiary)",
                    color: "var(--text-primary)",
                    border: "1px solid var(--border-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.625rem",
                    fontWeight: 700
                  }}>
                    {member.name?.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                    {member.name}
                  </span>
                  <span style={{ fontSize: "0.625rem", color: "var(--text-tertiary)" }}>
                    ({member.roleName || "Team"})
                  </span>
                </div>
              ))}
            </div>

            {/* Dedicated Messages Scrollable Panel (Scroll strictly contained here) */}
            <div 
              ref={chatContainerRef}
              style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "1rem", 
                display: "flex", 
                flexDirection: "column", 
                gap: "0.75rem",
                backgroundColor: "var(--bg-secondary)",
                overscrollBehavior: "contain"
              }}
            >
              {chatMessages.length === 0 ? (
                <div style={{ margin: "auto", color: "var(--text-tertiary)", fontSize: "0.875rem", textAlign: "center", padding: "1.5rem" }}>
                  <MessageSquare size={32} style={{ margin: "0 auto 0.5rem auto", opacity: 0.4 }} />
                  <div>No team messages yet.</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>Start the conversation with your team below!</div>
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
                        padding: "0.6rem 0.85rem", 
                        borderRadius: "12px", 
                        backgroundColor: isMe ? "var(--primary-color)" : "var(--bg-primary)",
                        color: isMe ? "#ffffff" : "var(--text-primary)",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                        border: isMe ? "none" : "1px solid var(--border-primary)"
                      }}>
                        {!isMe && (
                          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary-color)", marginBottom: "0.2rem" }}>
                            {m.senderName}
                          </div>
                        )}
                        <div style={{ fontSize: "0.875rem", wordBreak: "break-word", lineHeight: 1.4 }}>{m.content}</div>

                        {/* Attachments rendering */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div style={{ marginTop: "0.45rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                            {m.attachments.map((att: any) => {
                              const isImage = att.fileType.startsWith("image/");
                              return (
                                <div key={att.id}>
                                  {isImage ? (
                                    <a href={`/api/chat/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={`/api/chat/attachments/${att.id}`} 
                                        alt={att.fileName} 
                                        style={{ maxWidth: "180px", maxHeight: "120px", borderRadius: "6px", marginTop: "0.25rem", border: "1px solid var(--border-primary)" }} 
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
                                        gap: "0.35rem",
                                        fontSize: "0.75rem",
                                        color: isMe ? "#ffffff" : "var(--primary-color)",
                                        textDecoration: "underline"
                                      }}
                                    >
                                      <FileText size={14} />
                                      <span>{att.fileName}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.4rem", fontSize: "0.675rem", opacity: 0.8, marginTop: "0.3rem" }}>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && !m.isDeleted && (
                            <button 
                              onClick={() => handleDeleteChatMessage(m.id)}
                              style={{ border: "none", background: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0 }}
                              title="Delete message"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer Panel */}
            <form onSubmit={handleSendChatMessage} style={{ 
              borderTop: "1px solid var(--border-primary)", 
              padding: "0.75rem 1rem", 
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
              flexShrink: 0
            }}>
              {chatStagedAttachments.length > 0 && (
                <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                  {chatStagedAttachments.map((att, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.35rem", backgroundColor: "var(--bg-secondary)", borderRadius: "6px", padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}>
                      <FileText size={13} />
                      <span style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setChatStagedAttachments(prev => prev.filter((_, i) => i !== idx))}
                        style={{ border: "none", background: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => chatFileInputRef.current?.click()}
                  style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.35rem" }}
                  title="Attach file/image"
                >
                  <Paperclip size={18} />
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
                  placeholder="Type a message to project team..." 
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: "0.6rem 0.85rem", 
                    borderRadius: "8px", 
                    border: "1px solid var(--border-primary)", 
                    backgroundColor: "var(--bg-secondary)", 
                    color: "var(--text-primary)",
                    fontSize: "0.875rem",
                    outline: "none"
                  }}
                />
                <button type="submit" style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  width: "38px", 
                  height: "38px", 
                  borderRadius: "8px", 
                  border: "none", 
                  backgroundColor: "var(--primary-color)", 
                  color: "#ffffff", 
                  cursor: "pointer",
                  flexShrink: 0
                }}>
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

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
                    <span>Selected developers will receive task requirements email, in-app notification, and be added to project group chat automatically.</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                      <label style={modalStyles.label}>Select Developers / Team Members (Multiple Allowed)</label>
                      <span style={{ fontSize: "0.75rem", color: "var(--primary-color)", fontWeight: 700 }}>
                        {assignForm.devIds.length} Selected
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: "flex", 
                      flexWrap: "wrap", 
                      gap: "0.5rem", 
                      padding: "0.75rem", 
                      border: "1px solid var(--border-primary)", 
                      borderRadius: "8px", 
                      backgroundColor: "var(--bg-secondary)",
                      maxHeight: "150px",
                      overflowY: "auto"
                    }}>
                      {devs.map((d) => {
                        const isAlreadyAssigned = (project?.assignedDevs || []).some((ad: any) => ad.id === d.id);
                        const isSelected = assignForm.devIds.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            type="button"
                            disabled={isAlreadyAssigned}
                            onClick={() => {
                              if (isAlreadyAssigned) return;
                              setAssignForm(prev => ({
                                ...prev,
                                devIds: isSelected 
                                  ? prev.devIds.filter(id => id !== d.id)
                                  : [...prev.devIds, d.id],
                                devId: isSelected 
                                  ? (prev.devIds.filter(id => id !== d.id)[0] || "")
                                  : d.id
                              }));
                            }}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.4rem 0.75rem",
                              borderRadius: "8px",
                              border: isAlreadyAssigned 
                                ? "1px dashed var(--border-secondary)" 
                                : isSelected 
                                  ? "2px solid var(--primary-color)" 
                                  : "1px solid var(--border-primary)",
                              backgroundColor: isAlreadyAssigned 
                                ? "var(--bg-tertiary)" 
                                : isSelected 
                                  ? "var(--bg-primary)" 
                                  : "var(--bg-primary)",
                              color: isAlreadyAssigned 
                                ? "var(--text-tertiary)" 
                                : isSelected 
                                  ? "var(--primary-color)" 
                                  : "var(--text-primary)",
                              fontWeight: isSelected ? 700 : 500,
                              fontSize: "0.8125rem",
                              cursor: isAlreadyAssigned ? "not-allowed" : "pointer",
                              opacity: isAlreadyAssigned ? 0.65 : 1,
                              transition: "all 0.15s ease"
                            }}
                          >
                            <span style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "4px",
                              border: isAlreadyAssigned
                                ? "1px solid var(--text-tertiary)"
                                : isSelected 
                                  ? "2px solid var(--primary-color)" 
                                  : "1px solid var(--text-tertiary)",
                              backgroundColor: isAlreadyAssigned 
                                ? "var(--bg-tertiary)" 
                                : isSelected 
                                  ? "var(--primary-color)" 
                                  : "transparent",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#ffffff",
                              fontSize: "10px"
                            }}>
                              {isAlreadyAssigned ? "🔒" : isSelected ? "✓" : ""}
                            </span>
                            <span>{d.name}</span>
                            <span style={{ fontSize: "0.7rem", opacity: 0.75 }}>
                              {isAlreadyAssigned ? "(Already Assigned - Locked)" : `(${d.email})`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
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
