"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit, Calendar, PlusCircle, FileText, CheckCircle, 
  Trash2, Send, Paperclip, ExternalLink, Globe, MapPin, 
  Flame, HelpCircle, Briefcase, Plus, RefreshCw, X
} from "lucide-react";
import { useDashboard } from "../../layout";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { bdas, setTriggerRefresh, triggerRefresh, openQuickAdd } = useDashboard();
  
  // Resolve params using React.use()
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [loading, setLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);
  
  // Modals state
  const [activeModal, setActiveModal] = useState<string | null>(null); // 'edit' | 'followup' | 'activity' | 'attachment' | 'convert'
  const [editForm, setEditForm] = useState<any>({});
  const [followupForm, setFollowupForm] = useState({ nextFollowup: "", followupNotes: "" });
  const [activityForm, setActivityForm] = useState({ type: "Call", notes: "" });
  const [attachmentForm, setAttachmentForm] = useState({ name: "", fileType: "PDF", url: "" });
  const [convertForm, setConvertForm] = useState({ name: "", company: "", email: "", phone: "", website: "" });

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadLeadDetails() {
      try {
        const res = await fetch(`/api/leads/${id}`);
        if (!res.ok) throw new Error("Failed to fetch lead");
        const data = await res.json();
        setLead(data.lead);
        
        // Populate edit form
        setEditForm({
          name: data.lead.name,
          linkedinUrl: data.lead.linkedinUrl,
          company: data.lead.company || "",
          jobTitle: data.lead.jobTitle || "",
          country: data.lead.country || "",
          city: data.lead.city || "",
          industry: data.lead.industry || "",
          leadSource: data.lead.leadSource,
          customLeadSource: data.lead.customLeadSource || "",
          status: data.lead.status,
          priority: data.lead.priority,
          primaryBdaId: data.lead.primaryBdaId || "",
          assignedBdaIds: data.lead.assignments?.map((a: any) => a.userId) || [],
          tags: data.lead.tags?.join(", ") || "",
          notes: data.lead.notes || ""
        });

        setFollowupForm({
          nextFollowup: data.lead.nextFollowup ? new Date(data.lead.nextFollowup).toISOString().split("T")[0] : "",
          followupNotes: data.lead.followupNotes || ""
        });

        setConvertForm({
          name: data.lead.name,
          company: data.lead.company || "",
          email: `${data.lead.name.toLowerCase().replace(/\s+/g, "")}@company.com`,
          phone: "",
          website: ""
        });

      } catch (err) {
        console.error("Error loading lead", err);
        setErrorMessage("Lead could not be loaded.");
      } finally {
        setLoading(false);
      }
    }
    loadLeadDetails();
  }, [id, triggerRefresh]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMessage("");

    let url = `/api/leads/${id}`;
    let method = "PUT";
    let body: any = {};

    switch (activeModal) {
      case "edit":
        body = {
          ...editForm,
          tags: editForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        };
        break;
      case "followup":
        body = {
          nextFollowup: followupForm.nextFollowup,
          followupNotes: followupForm.followupNotes
        };
        break;
      case "activity":
        url = "/api/activities";
        method = "POST";
        body = {
          type: activityForm.type,
          notes: activityForm.notes,
          leadId: id
        };
        break;
      case "attachment":
        url = `/api/leads/${id}/attachments`;
        method = "POST";
        body = attachmentForm;
        break;
      case "convert":
        url = `/api/leads/${id}/convert`;
        method = "POST";
        body = convertForm;
        break;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      // Success
      setActiveModal(null);
      setTriggerRefresh((prev: any) => prev + 1);
      
      // If converted to client, redirect to client view
      if (activeModal === "convert") {
        router.push(`/dashboard/clients/${data.client.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!confirm("Are you sure you want to move this lead to trash?")) return;
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTriggerRefresh((prev: any) => prev + 1);
        router.push("/dashboard/leads");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (errorMessage && !lead) {
    return (
      <div className="crm-container">
        <div className="crm-card" style={{ textAlign: "center", padding: "3rem" }}>
          <h2>{errorMessage}</h2>
          <button onClick={() => router.push("/dashboard/leads")} className="crm-btn crm-btn-secondary" style={{ marginTop: "1rem" }}>
            Back to Leads
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-container animate-fade-in">
      {/* Back & Breadcrumb */}
      <div style={styles.breadcrumbRow}>
        <button onClick={() => router.push("/dashboard/leads")} style={styles.backBtn}>
          <ArrowLeft size={16} />
          Back to Pipeline
        </button>
      </div>

      {/* Profile Overview Header Card */}
      <div className="crm-card" style={styles.profileHeaderCard}>
        <div style={styles.profileHeaderContent}>
          <img 
            src={lead.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"} 
            alt={lead.name}
            style={styles.profileAvatar} 
          />
          <div style={styles.profileInfo}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <h2 style={styles.leadName}>{lead.name}</h2>
              <span className="badge badge-primary">{lead.status}</span>
              {lead.priority === "Hot" && (
                <span className="badge badge-danger" style={{ display: "inline-flex", gap: "0.25rem", alignItems: "center" }}>
                  <Flame size={12} /> Hot Pipeline
                </span>
              )}
            </div>
            <div style={styles.jobText}>
              {lead.jobTitle} at <strong>{lead.company || "Self Employed"}</strong>
            </div>
            <div style={styles.locText}>
              <MapPin size={12} />
              {lead.city ? `${lead.city}, ` : ""}{lead.country || "Global Location"}
              <span style={{ margin: "0 0.5rem", color: "var(--border-secondary)" }}>|</span>
              <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" style={styles.linkedinLink}>
                <Globe size={12} />
                LinkedIn profile
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>

        {/* Quick actions panel */}
        <div style={styles.quickActions}>
          <button onClick={() => setActiveModal("edit")} className="crm-btn crm-btn-secondary"><Edit size={14} /> Edit</button>
          <button onClick={() => setActiveModal("followup")} className="crm-btn crm-btn-secondary"><Calendar size={14} /> Schedule Follow-up</button>
          <button onClick={() => setActiveModal("activity")} className="crm-btn crm-btn-secondary"><PlusCircle size={14} /> Log Call</button>
          <button onClick={() => setActiveModal("attachment")} className="crm-btn crm-btn-secondary"><Paperclip size={14} /> Add File</button>
          {lead.status !== "Won" ? (
            <button onClick={() => setActiveModal("convert")} className="crm-btn crm-btn-primary"><CheckCircle size={14} /> Convert to Client</button>
          ) : (
            <button onClick={() => router.push(`/dashboard/clients/${lead.convertedClientId}`)} className="crm-btn crm-btn-primary"><Briefcase size={14} /> View Client Account</button>
          )}
          <button onClick={handleMoveToTrash} className="crm-btn crm-btn-danger" style={{ padding: "0.5rem" }}><Trash2 size={16} /></button>
        </div>
      </div>

      {/* Two Column Layout details / timeline */}
      <div style={styles.detailsGrid}>
        {/* Left Column: Info, Follow-up, Attachments */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* CRM Info Card */}
          <div className="crm-card">
            <h3 style={styles.cardTitle}>CRM Qualification details</h3>
            <div style={styles.detailsList}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Assigned Service / Requirement</span>
                <span style={styles.detailValue}>
                  {lead.serviceRequirements?.join(", ") || lead.customServiceRequirement || "Not specified"}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Lead Source</span>
                <span style={styles.detailValue}>{lead.leadSource}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Primary BDA Assigned</span>
                <span style={styles.detailValue}>{lead.primaryBda?.name || "Unassigned"}</span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Additional Team Members</span>
                <span style={styles.detailValue}>
                  {lead.assignments?.map((a: any) => a.user?.name).join(", ") || "None"}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Custom Tags</span>
                <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", marginTop: "4px" }}>
                  {lead.tags?.length === 0 ? (
                    <span style={{ color: "var(--text-tertiary)", fontSize: "0.875rem" }}>No tags</span>
                  ) : (
                    lead.tags?.map((t: string, i: number) => <span key={i} className="badge badge-primary">{t}</span>)
                  )}
                </div>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Internal Lead Notes</span>
                <p style={styles.notesBlock}>{lead.notes || "No notes written yet."}</p>
              </div>
            </div>
          </div>

          {/* Follow-up Card */}
          <div className="crm-card">
            <h3 style={styles.cardTitle}>Follow-up Schedules</h3>
            <div style={styles.detailsList}>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Next Follow-up Deadline</span>
                <span style={{ ...styles.detailValue, fontWeight: 600, color: lead.nextFollowup ? "var(--warning-color)" : "var(--text-tertiary)" }}>
                  {lead.nextFollowup ? new Date(lead.nextFollowup).toLocaleDateString() : "No follow-up set"}
                </span>
              </div>
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>Follow-up Target Notes</span>
                <p style={styles.notesBlock}>{lead.followupNotes || "No follow-up tasks defined yet."}</p>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Documents & Attachments</h3>
              <button onClick={() => setActiveModal("attachment")} style={styles.addSmallBtn}>
                <Plus size={14} /> Add File
              </button>
            </div>
            {lead.attachments?.length === 0 ? (
              <div style={styles.emptyBox}>No files uploaded for this pipeline.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {lead.attachments?.map((file: any) => (
                  <div key={file.id} style={styles.attachmentItem}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                      <FileText size={18} style={{ color: "var(--primary-color)", flexShrink: 0 }} />
                      <div style={{ overflow: "hidden" }}>
                        <div style={styles.fileName}>{file.name}</div>
                        <div style={styles.fileMeta}>
                          {file.fileType} • {(file.size / 1024).toFixed(0)} KB • By {file.uploadedBy?.name || "System"}
                        </div>
                      </div>
                    </div>
                    <a href={file.url} download style={styles.downloadLink}><ExternalLink size={14} /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Meetings and Chronological activity timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Scheduled Meetings Card */}
          <div className="crm-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ ...styles.cardTitle, marginBottom: 0 }}>Meetings & Discussions</h3>
              <button onClick={() => openQuickAdd("meeting")} style={styles.addSmallBtn}>
                <Plus size={14} /> Schedule Meeting
              </button>
            </div>
            {lead.meetings?.length === 0 ? (
              <div style={styles.emptyBox}>No meetings set up for this contact.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {lead.meetings?.map((meeting: any) => (
                  <div key={meeting.id} style={styles.meetingItem}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{meeting.title}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {new Date(meeting.startTime).toLocaleString()}
                      </div>
                    </div>
                    <span className={`badge ${meeting.status === "Completed" ? "badge-success" : "badge-info"}`}>
                      {meeting.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="crm-card">
            <h3 style={styles.cardTitle}>Pipeline Activity History</h3>
            {lead.activities?.length === 0 ? (
              <div style={styles.emptyBox}>No history recorded.</div>
            ) : (
              <div style={styles.timeline}>
                {lead.activities?.map((act: any) => (
                  <div key={act.id} style={styles.timelineItem}>
                    <div style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
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
            )}
          </div>
        </div>
      </div>

      {/* Modals Overlay */}
      {activeModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.container} className="animate-fade-in">
            <div style={modalStyles.header}>
              <h3 style={modalStyles.title}>
                {activeModal === "edit" && "Edit Pipeline Profile"}
                {activeModal === "followup" && "Schedule Next Follow-up"}
                {activeModal === "activity" && "Log Timeline Action"}
                {activeModal === "attachment" && "Attach Requirement File"}
                {activeModal === "convert" && "Convert Pipeline to Client Account"}
              </h3>
              <button onClick={() => setActiveModal(null)} style={modalStyles.closeBtn}>&times;</button>
            </div>

            <form onSubmit={handleActionSubmit} style={modalStyles.body}>
              {errorMessage && <div style={modalStyles.errorBox}>{errorMessage}</div>}

              {/* Edit Form */}
              {activeModal === "edit" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Lead Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      value={editForm.name}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Company</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        value={editForm.company}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, company: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Job Title</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        value={editForm.jobTitle}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, jobTitle: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Country</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        value={editForm.country}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, country: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>City</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        value={editForm.city}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Pipeline Status</label>
                      <select 
                        className="crm-select"
                        value={editForm.status}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, status: e.target.value }))}
                      >
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Connected">Connected</option>
                        <option value="Replied">Replied</option>
                        <option value="Interested">Interested</option>
                        <option value="Meeting">Meeting</option>
                        <option value="Proposal Sent">Proposal Sent</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    <div>
                      <label style={modalStyles.label}>Priority Level</label>
                      <select 
                        className="crm-select"
                        value={editForm.priority}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="Hot">Hot 🔥</option>
                        <option value="Warm">Warm ⚡</option>
                        <option value="Cold">Cold ❄️</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Primary BDA</label>
                      <select 
                        className="crm-select"
                        value={editForm.primaryBdaId}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, primaryBdaId: e.target.value }))}
                      >
                        <option value="">Unassigned</option>
                        {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={modalStyles.label}>Lead Source</label>
                      <select 
                        className="crm-select"
                        value={editForm.leadSource}
                        onChange={(e) => setEditForm((prev: any) => ({ ...prev, leadSource: e.target.value }))}
                      >
                        <option value="LinkedIn">LinkedIn</option>
                        <option value="Upwork">Upwork</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Referral">Referral</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={modalStyles.label}>Custom Tags (comma separated)</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      value={editForm.tags}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label style={modalStyles.label}>Internal Notes</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={3} 
                      value={editForm.notes}
                      onChange={(e) => setEditForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Follow-up Form */}
              {activeModal === "followup" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Next Follow-up Date</label>
                    <input 
                      type="date" 
                      className="crm-input" 
                      value={followupForm.nextFollowup}
                      onChange={(e) => setFollowupForm((prev: any) => ({ ...prev, nextFollowup: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Follow-up Target / Agenda Notes</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={4} 
                      placeholder="Share proposal details, ask for meeting confirmation..."
                      value={followupForm.followupNotes}
                      onChange={(e) => setFollowupForm((prev: any) => ({ ...prev, followupNotes: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Activity Log Form */}
              {activeModal === "activity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>Action Channel</label>
                    <select 
                      className="crm-select"
                      value={activityForm.type}
                      onChange={(e) => setActivityForm((prev: any) => ({ ...prev, type: e.target.value }))}
                    >
                      <option value="Call">Call</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="LinkedIn">LinkedIn</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Note">Note / Text Update</option>
                    </select>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Action Summary Notes</label>
                    <textarea 
                      className="crm-textarea" 
                      rows={4} 
                      placeholder="Spoke with client. Discussed milestones and Shopify features."
                      value={activityForm.notes}
                      onChange={(e) => setActivityForm((prev: any) => ({ ...prev, notes: e.target.value }))}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Attachment Form */}
              {activeModal === "attachment" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label style={modalStyles.label}>File Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      placeholder="Requirements Document.pdf"
                      value={attachmentForm.name}
                      onChange={(e) => setAttachmentForm((prev: any) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Document Type</label>
                      <select 
                        className="crm-select"
                        value={attachmentForm.fileType}
                        onChange={(e) => setAttachmentForm((prev: any) => ({ ...prev, fileType: e.target.value }))}
                      >
                        <option value="PDF">PDF File</option>
                        <option value="DOCX">Word Document</option>
                        <option value="Excel">Excel Sheet</option>
                        <option value="Image">Screenshot / Image</option>
                        <option value="Proposal">Proposal Brief</option>
                      </select>
                    </div>
                    <div>
                      <label style={modalStyles.label}>Simulated Path / S3 URL</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        placeholder="/uploads/requirements_brief.pdf"
                        value={attachmentForm.url}
                        onChange={(e) => setAttachmentForm((prev: any) => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Convert Form */}
              {activeModal === "convert" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={modalStyles.alertBox}>
                    <Briefcase size={16} />
                    <span>Converts lead directly to Client. All documents, leads, and histories are preserved.</span>
                  </div>
                  <div>
                    <label style={modalStyles.label}>Client Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      value={convertForm.name}
                      onChange={(e) => setConvertForm((prev: any) => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Company Name</label>
                    <input 
                      type="text" 
                      className="crm-input" 
                      value={convertForm.company}
                      onChange={(e) => setConvertForm((prev: any) => ({ ...prev, company: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label style={modalStyles.label}>Email Address</label>
                    <input 
                      type="email" 
                      className="crm-input" 
                      value={convertForm.email}
                      onChange={(e) => setConvertForm((prev: any) => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                      <label style={modalStyles.label}>Phone Number</label>
                      <input 
                        type="text" 
                        className="crm-input" 
                        value={convertForm.phone}
                        onChange={(e) => setConvertForm((prev: any) => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label style={modalStyles.label}>Website URL</label>
                      <input 
                        type="url" 
                        className="crm-input" 
                        value={convertForm.website}
                        onChange={(e) => setConvertForm((prev: any) => ({ ...prev, website: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={modalStyles.actions}>
                <button type="button" onClick={() => setActiveModal(null)} className="crm-btn crm-btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="crm-btn crm-btn-primary">
                  {actionLoading ? "Processing..." : activeModal === "convert" ? "Convert Account" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "6rem",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid var(--border-primary)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  breadcrumbRow: {
    marginBottom: "1.5rem",
  },
  backBtn: {
    border: "none",
    background: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    color: "var(--text-secondary)",
    fontSize: "0.875rem",
    fontWeight: 500,
    transition: "color 0.2s",
  },
  profileHeaderCard: {
    padding: "2rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "1.5rem",
    marginBottom: "1.5rem",
  },
  profileHeaderContent: {
    display: "flex",
    alignItems: "center",
    gap: "1.5rem",
    flexWrap: "wrap",
  },
  profileAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
  },
  profileInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  leadName: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  jobText: {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
  },
  locText: {
    fontSize: "0.8125rem",
    color: "var(--text-tertiary)",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    marginTop: "2px",
  },
  linkedinLink: {
    color: "var(--primary-color)",
    textDecoration: "none",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  quickActions: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap",
  },
  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: "1.5rem",
  },
  cardTitle: {
    fontSize: "0.9375rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "1.25rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  detailsList: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  detailLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-tertiary)",
  },
  detailValue: {
    fontSize: "0.875rem",
    color: "var(--text-primary)",
    fontWeight: 500,
  },
  notesBlock: {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    backgroundColor: "var(--bg-primary)",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
    marginTop: "4px",
    whiteSpace: "pre-wrap",
  },
  addSmallBtn: {
    border: "none",
    background: "none",
    color: "var(--primary-color)",
    fontWeight: 600,
    fontSize: "0.8125rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
  },
  emptyBox: {
    padding: "2rem",
    textAlign: "center",
    color: "var(--text-tertiary)",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "8px",
    border: "1px dashed var(--border-secondary)",
    fontSize: "0.875rem",
  },
  attachmentItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
  },
  fileName: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  fileMeta: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)",
    marginTop: "2px",
  },
  downloadLink: {
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  meetingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.75rem",
    backgroundColor: "var(--bg-primary)",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
  },
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
    maxWidth: "520px",
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
  errorBox: {
    backgroundColor: "var(--danger-light)",
    color: "var(--danger-text)",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    border: "1px solid rgba(239, 68, 68, 0.15)",
  },
  alertBox: {
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
