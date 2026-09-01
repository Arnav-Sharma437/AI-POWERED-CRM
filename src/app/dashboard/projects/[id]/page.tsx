"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, CreditCard, UserPlus, RefreshCw, AlertOctagon, 
  Plus, Calendar, Mail, FileText, CheckCircle2, DollarSign,
  Send, Paperclip, MessageSquare, Trash2, X
} from "lucide-react";
import { useDashboard } from "../../layout";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { bdas, devs, setTriggerRefresh, triggerRefresh, currentUser } = useDashboard();
  
  // Resolve params
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  // Mini chat states
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatStagedAttachments, setChatStagedAttachments] = useState<any[]>([]);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Modal / Input States
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'payment' | 'takeover' | 'assign' | 'status'
  const [paymentForm, setPaymentForm] = useState({ amount: "", note: "" });
  const [takeoverForm, setTakeoverForm] = useState({ newBdaId: "", note: "" });
  const [assignForm, setAssignForm] = useState({ devId: "", workDetails: "" });
  const [statusForm, setStatusForm] = useState({ status: "Work in Progress", issueDescription: "" });

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

        setStatusForm({
          status: data.project.status,
          issueDescription: data.project.issueDescription || ""
        });

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

  // SSE subscription for project detail chat
  useEffect(() => {
    if (!currentUser || !project?.conversationId) return;

    const eventSource = new EventSource("/api/chat/realtime");

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "message" && payload.data.conversationId === project.conversationId) {
          const newMsg = payload.data;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
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

    return () => {
      eventSource.close();
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
      <div style={{ display: "flex", justifyContent: "center", padding: "6rem" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid var(--border-primary)", borderTopColor: "var(--primary-color)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
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

      {/* Header Info */}
      <div className="crm-card" style={{ padding: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: "0.5rem" }}>{project.serviceType}</span>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>{project.name}</h2>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
            Client: <strong>{project.client?.name} ({project.client?.company})</strong>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button onClick={() => setActiveModal("status")} className="crm-btn crm-btn-secondary"><RefreshCw size={14} /> Update Status ({project.status})</button>
          {!isDeveloper && (
            <>
              <button onClick={() => setActiveModal("payment")} className="crm-btn crm-btn-secondary"><CreditCard size={14} /> Record Payment</button>
              <button onClick={() => setActiveModal("takeover")} className="crm-btn crm-btn-secondary"><UserPlus size={14} /> BDA Takeover</button>
              <button onClick={() => setActiveModal("assign")} className="crm-btn crm-btn-primary"><Mail size={14} /> Assign Developer</button>
            </>
          )}
        </div>
      </div>

      {/* Financials Overview Card - Hidden for Developer */}
      {!isDeveloper && (
        <div className="crm-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "1.5rem", backgroundColor: "var(--bg-secondary)" }}>
          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Contract Budget</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(project.finalBudget)}
            </div>
            {project.bonus > 0 && <span style={{ fontSize: "0.75rem", color: "var(--success-color)", fontWeight: 500 }}>+ {project.bonus} Bonus</span>}
          </div>

          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Total Collected</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--success-color)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(project.totalReceived)}
            </div>
          </div>

          <div style={{ padding: "0.5rem" }}>
            <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase" }}>Outstanding Balance</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: hasOutstanding ? "var(--warning-color)" : "var(--text-tertiary)", marginTop: "4px" }}>
              {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(project.pendingAmount)}
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

      {project.status === "Issue" && project.issueDescription && (
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
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "1rem" }}>Project Deadlines</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Start Date</span>
                <strong>{new Date(project.startDate).toLocaleDateString()}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-tertiary)" }}>Target Deadline</span>
                <strong style={{ color: "var(--danger-color)" }}>{new Date(project.deadline).toLocaleDateString()}</strong>
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
            <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "1.25rem" }}>Project timeline & logs</h3>
            <div style={timelineStyles.timeline}>
              {project.activities?.map((act: any) => (
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
          </div>
        </div>

      </div>

      {/* Project Chat Card */}
      {project?.conversationId && (
        <div className="crm-card" style={{ marginTop: "1.5rem", padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <MessageSquare size={18} style={{ color: "var(--primary-color)" }} />
              <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, textTransform: "uppercase", marginBottom: 0 }}>
                Project Team Chat
              </h3>
            </div>
            <button 
              onClick={() => router.push(`/dashboard/chat?id=${project.conversationId}`)}
              style={{
                border: "none",
                background: "none",
                color: "var(--primary-color)",
                fontSize: "0.8125rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline"
              }}
            >
              Open Full Chat View
            </button>
          </div>
          
          <div style={{ 
            height: "350px", 
            display: "flex", 
            flexDirection: "column", 
            border: "1px solid var(--border-primary)", 
            borderRadius: "8px", 
            overflow: "hidden",
            backgroundColor: "var(--bg-secondary)"
          }}>
            {/* Messages Panel */}
            <div style={{ 
              flex: 1, 
              overflowY: "auto", 
              padding: "1rem", 
              display: "flex", 
              flexDirection: "column", 
              gap: "0.75rem" 
            }}>
              {chatMessages.length === 0 ? (
                <div style={{ margin: "auto", color: "var(--text-tertiary)", fontSize: "0.875rem" }}>
                  No messages yet. Send a message to start!
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
                        maxWidth: "80%", 
                        padding: "0.5rem 0.75rem", 
                        borderRadius: "8px", 
                        backgroundColor: isMe ? "var(--primary-color)" : "var(--bg-primary)",
                        color: isMe ? "#ffffff" : "var(--text-primary)"
                      }}>
                        {!isMe && (
                          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--primary-color)", marginBottom: "0.15rem" }}>
                            {m.senderName}
                          </div>
                        )}
                        <div style={{ fontSize: "0.875rem" }}>{m.content}</div>

                        {/* Attachments rendering */}
                        {m.attachments && m.attachments.length > 0 && (
                          <div style={{ marginTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                            {m.attachments.map((att: any) => {
                              const isImage = att.fileType.startsWith("image/");
                              return (
                                <div key={att.id}>
                                  {isImage ? (
                                    <a href={`/api/chat/attachments/${att.id}`} target="_blank" rel="noopener noreferrer">
                                      <img 
                                        src={`/api/chat/attachments/${att.id}`} 
                                        alt={att.fileName} 
                                        style={{ maxWidth: "120px", maxHeight: "100px", borderRadius: "4px", marginTop: "0.25rem" }} 
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
                                        fontSize: "0.75rem",
                                        color: isMe ? "#ffffff" : "var(--primary-color)"
                                      }}
                                    >
                                      <FileText size={14} />
                                      <span style={{ textDecoration: "underline" }}>{att.fileName}</span>
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.35rem", fontSize: "0.675rem", opacity: 0.8, marginTop: "0.15rem" }}>
                          <span>
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMe && !m.isDeleted && (
                            <button 
                              onClick={() => handleDeleteChatMessage(m.id)}
                              style={{ border: "none", background: "none", color: "var(--danger-color)", cursor: "pointer", padding: 0 }}
                            >
                              <Trash2 size={10} />
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
              padding: "0.5rem 0.75rem", 
              backgroundColor: "var(--bg-primary)",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem"
            }}>
              {chatStagedAttachments.length > 0 && (
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                  {chatStagedAttachments.map((att, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem", backgroundColor: "var(--bg-secondary)", borderRadius: "4px", padding: "0.15rem 0.35rem", fontSize: "0.75rem" }}>
                      <FileText size={12} />
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button 
                  type="button" 
                  onClick={() => chatFileInputRef.current?.click()}
                  style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer", padding: "0.25rem" }}
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
                  placeholder="Type message..." 
                  value={chatText}
                  onChange={(e) => setChatText(e.target.value)}
                  style={{ 
                    flex: 1, 
                    padding: "0.375rem 0.75rem", 
                    borderRadius: "4px", 
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
                  width: "28px", 
                  height: "28px", 
                  borderRadius: "4px", 
                  border: "none", 
                  backgroundColor: "var(--primary-color)", 
                  color: "#ffffff", 
                  cursor: "pointer" 
                }}>
                  <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>
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
                {activeModal === "payment" && "Record Milestone Payment"}
                {activeModal === "takeover" && "Relinquish and Takeover Project BDA"}
                {activeModal === "assign" && "Assign Developer Task details"}
                {activeModal === "status" && "Update Project Status / Report Issue"}
              </h3>
              <button onClick={() => setActiveModal(null)} style={modalStyles.closeBtn}>&times;</button>
            </div>

            <form onSubmit={handleActionSubmit} style={modalStyles.body}>
              
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
