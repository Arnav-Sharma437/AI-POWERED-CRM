"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Filter, SlidersHorizontal, ArrowUpDown, 
  Flame, ExternalLink, Calendar, PlusCircle, Check, AlertCircle,
  Users, MapPin
} from "lucide-react";
import { useDashboard } from "../layout";
import AiLoader from "@/components/AiLoader";

export default function LeadsPage() {
  const router = useRouter();
  const { openQuickAdd, triggerRefresh, bdas, currentUser } = useDashboard();
  
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterBda, setFilterBda] = useState("");
  const [filterService, setFilterService] = useState("");
  const [filterSource, setFilterSource] = useState("");
  
  // LinkedIn quick paste state
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [pastingError, setPastingError] = useState("");
  const [existingLeadId, setExistingLeadId] = useState("");
  const [addingLead, setAddingLead] = useState(false);

  useEffect(() => {
    async function loadLeads() {
      try {
        const res = await fetch("/api/leads");
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads || []);
        }
      } catch (err) {
        console.error("Error loading leads", err);
        setError("Could not load leads.");
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, [triggerRefresh]);

  const handleQuickLinkedinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkedinUrl.trim()) return;

    setAddingLead(true);
    setPastingError("");
    setExistingLeadId("");

    try {
      // 1. Check for duplicates
      const checkRes = await fetch(`/api/search?q=${encodeURIComponent(linkedinUrl)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        // Exact match check on URL
        const matched = checkData.results?.leads?.find((l: any) => l.linkedinUrl.toLowerCase() === linkedinUrl.toLowerCase().trim());
        if (matched) {
          setPastingError("This lead already exists.");
          setExistingLeadId(matched.id);
          setAddingLead(false);
          return;
        }
      }

      // 2. Fetch enriched details
      let enrichedProfile: any = { isEnriched: false };
      try {
        const enrichRes = await fetch(`/api/leads/enrich?url=${encodeURIComponent(linkedinUrl)}`);
        if (enrichRes.ok) {
          const enrichData = await enrichRes.json();
          enrichedProfile = enrichData.profile || { isEnriched: false };
        }
      } catch (enrichErr) {
        console.error("Enrichment API network/fetch error:", enrichErr);
      }

      // 3. Check if enrichment is configured/available
      if (!enrichedProfile.isEnriched) {
        setPastingError("LinkedIn enrichment is not configured. Please fill in the details manually.");
        openQuickAdd("lead", {
          linkedinUrl: linkedinUrl.trim(),
          name: "",
          company: "",
          jobTitle: "",
          country: "",
          city: "",
          industry: "",
          notes: "LinkedIn enrichment is not configured. Hand-filled profile.",
          primaryBdaId: currentUser?.id || ""
        });
        setLinkedinUrl("");
        setAddingLead(false);
        return;
      }

      // 4. Create lead automatically (only if provider returned data)
      const createRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: enrichedProfile.name || "Enriched Profile",
          linkedinUrl: linkedinUrl.trim(),
          profilePhoto: enrichedProfile.profilePhoto,
          company: enrichedProfile.company || "",
          jobTitle: enrichedProfile.jobTitle || "",
          country: enrichedProfile.country || "",
          city: enrichedProfile.city || "",
          industry: enrichedProfile.industry || "",
          notes: enrichedProfile.notes || "Added via quick paste URL.",
          source: "LinkedIn",
          priority: "Warm",
          status: "New",
          primaryBdaId: currentUser?.id || ""
        })
      });

      if (!createRes.ok) {
        const createData = await createRes.json();
        throw new Error(createData.error || "Failed to create lead");
      }

      setLinkedinUrl("");
      router.refresh();
      // Reload local state
      const reloadRes = await fetch("/api/leads");
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        setLeads(reloadData.leads || []);
      }
    } catch (err: any) {
      setPastingError(err.message || "An error occurred adding the lead.");
    } finally {
      setAddingLead(false);
    }
  };

  // Filter & Search match logic
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = !filterPriority || lead.priority === filterPriority;
    const matchesStatus = !filterStatus || lead.status === filterStatus;
    const matchesBda = !filterBda || lead.primaryBdaId === filterBda;
    const matchesSource = !filterSource || lead.leadSource === filterSource;
    const matchesService = !filterService || lead.serviceRequirements?.includes(filterService);

    return matchesSearch && matchesPriority && matchesStatus && matchesBda && matchesSource && matchesService;
  });

  return (
    <div className="crm-container animate-fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1 style={styles.title}>Leads Pipeline</h1>
            <span style={{
              fontSize: "0.8125rem",
              fontWeight: 700,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary-color)",
              padding: "0.25rem 0.75rem",
              borderRadius: "20px",
              border: "1px solid rgba(224, 86, 36, 0.2)"
            }}>
              Total: {leads.length} {leads.length === 1 ? "Lead" : "Leads"}
            </span>
          </div>
          <p style={styles.subtitle}>Manage incoming contacts, qualification states, and follow-ups</p>
        </div>
        <button onClick={() => openQuickAdd("lead")} className="crm-btn crm-btn-primary">
          <Plus size={16} />
          Create Lead Manually
        </button>
      </div>

      {/* Quick URL Paste Box */}
      <div className="crm-card" style={styles.quickPasteCard}>
        <h4 style={styles.quickPasteTitle}>Quick Add via LinkedIn Profile</h4>
        <form onSubmit={handleQuickLinkedinSubmit} style={styles.quickPasteForm}>
          <input
            type="url"
            placeholder="Paste LinkedIn profile URL here (e.g. https://linkedin.com/in/username)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            disabled={addingLead}
            className="crm-input"
            style={{ flexGrow: 1 }}
            required
          />
          <button type="submit" disabled={addingLead} className="crm-btn crm-btn-primary" style={{ height: "42px", flexShrink: 0 }}>
            {addingLead ? "Enriching..." : "Add & Auto-Fill"}
          </button>
        </form>
        {pastingError && (
          <div style={styles.errorBanner}>
            <AlertCircle size={16} />
            <span>{pastingError}</span>
            {existingLeadId && (
              <button 
                onClick={() => router.push(`/dashboard/leads/${existingLeadId}`)}
                style={styles.errorLinkBtn}
              >
                View Existing Lead Record <ExternalLink size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters panel */}
      <div className="crm-card" style={styles.searchFilterCard}>
        <div style={styles.searchRow}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search leads by name, company, title, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="crm-input"
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="crm-btn crm-btn-secondary"
            style={{ gap: "0.5rem" }}
          >
            <SlidersHorizontal size={16} />
            Filters
            {(filterPriority || filterStatus || filterBda || filterService || filterSource) && (
              <span style={styles.filterDot} />
            )}
          </button>
        </div>

        {showFilters && (
          <div style={styles.filtersDrawer}>
            <div style={styles.filterGrid}>
              <div>
                <label style={styles.filterLabel}>Priority</label>
                <select className="crm-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="Hot">Hot 🔥</option>
                  <option value="Warm">Warm ⚡</option>
                  <option value="Cold">Cold ❄️</option>
                </select>
              </div>

              <div>
                <label style={styles.filterLabel}>Status</label>
                <select className="crm-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
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
                <label style={styles.filterLabel}>Assigned BDA</label>
                <select className="crm-select" value={filterBda} onChange={(e) => setFilterBda(e.target.value)}>
                  <option value="">All BDAs</option>
                  {bdas.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>

              <div>
                <label style={styles.filterLabel}>Service</label>
                <select className="crm-select" value={filterService} onChange={(e) => setFilterService(e.target.value)}>
                  <option value="">All Services</option>
                  <option value="Web Design">Web Design</option>
                  <option value="Web Development">Web Development</option>
                  <option value="Shopify">Shopify</option>
                  <option value="WordPress">WordPress</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Custom Software">Custom Software</option>
                </select>
              </div>

              <div>
                <label style={styles.filterLabel}>Source</label>
                <select className="crm-select" value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                  <option value="">All Sources</option>
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Upwork">Upwork</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div style={styles.filterFooter}>
              <button 
                onClick={() => {
                  setFilterPriority("");
                  setFilterStatus("");
                  setFilterBda("");
                  setFilterService("");
                  setFilterSource("");
                  setSearchTerm("");
                }}
                style={styles.clearBtn}
              >
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      {loading ? (
        <AiLoader label="Scanning AI Lead Database..." sublabel="Extracting prospect scores, contact insights, and pipeline status" />
      ) : filteredLeads.length === 0 ? (
        <div className="crm-card" style={styles.emptyStateCard}>
          <Users size={48} style={{ color: "var(--text-tertiary)", marginBottom: "1rem" }} />
          <h3>No leads match your search criteria</h3>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>Try adjusting your search queries or filters above.</p>
        </div>
      ) : (
        <div className="crm-table-container">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Lead Profile</th>
                <th>Company & Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Primary BDA</th>
                <th>Requirement</th>
                <th>Next Follow-up</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div style={styles.profileCell}>
                      <img 
                        src={lead.profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"} 
                        alt={lead.name}
                        style={styles.profileImg} 
                      />
                      <div>
                        <div style={styles.profileName}>{lead.name}</div>
                        <div style={styles.profileLoc}>
                          <MapPin size={10} style={{ marginRight: "2px" }} />
                          {lead.city ? `${lead.city}, ` : ""}{lead.country || "Global"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{lead.company || "Self-Employed"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>{lead.jobTitle || "No Title"}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      lead.status === "Won" ? "badge-success" : 
                      lead.status === "Lost" ? "badge-danger" : 
                      lead.status === "Meeting" ? "badge-info" : "badge-primary"
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      color: lead.priority === "Hot" ? "var(--danger-color)" : lead.priority === "Warm" ? "var(--warning-color)" : "var(--text-tertiary)",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}>
                      {lead.priority === "Hot" && <Flame size={12} />}
                      {lead.priority}
                    </span>
                  </td>
                  <td>{lead.primaryBda?.name || "Unassigned"}</td>
                  <td>
                    <div style={styles.requirementsBox}>
                      {lead.serviceRequirements?.slice(0, 2).map((s: string, i: number) => (
                        <span key={i} style={styles.tagBadge}>{s}</span>
                      ))}
                      {lead.serviceRequirements?.length > 2 && (
                        <span style={styles.tagBadge}>+{lead.serviceRequirements.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {lead.nextFollowup ? (
                      <div style={styles.followupCell}>
                        <Calendar size={12} />
                        <span>{new Date(lead.nextFollowup).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-tertiary)", fontSize: "0.75rem" }}>None set</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                      className="crm-btn crm-btn-secondary"
                      style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                    >
                      Open Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
  quickPasteCard: {
    padding: "1.25rem 1.5rem",
    marginBottom: "1.5rem",
  },
  quickPasteTitle: {
    fontSize: "0.875rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    marginBottom: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  quickPasteForm: {
    display: "flex",
    gap: "0.75rem",
  },
  errorBanner: {
    backgroundColor: "var(--danger-light)",
    color: "var(--danger-text)",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    marginTop: "0.75rem",
    fontSize: "0.8125rem",
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  errorLinkBtn: {
    border: "none",
    background: "none",
    color: "currentColor",
    fontWeight: "bold",
    textDecoration: "underline",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    cursor: "pointer",
    fontSize: "0.8125rem",
  },
  searchFilterCard: {
    padding: "1rem",
    marginBottom: "1.5rem",
  },
  searchRow: {
    display: "flex",
    gap: "1rem",
  },
  searchWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    flexGrow: 1,
  },
  searchIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-tertiary)",
  },
  filterDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    backgroundColor: "var(--primary-color)",
    marginLeft: "4px",
  },
  filtersDrawer: {
    borderTop: "1px solid var(--border-primary)",
    marginTop: "1rem",
    paddingTop: "1rem",
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
    gap: "1rem",
  },
  filterLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "0.375rem",
    display: "block",
  },
  filterFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "1rem",
  },
  clearBtn: {
    border: "none",
    background: "none",
    color: "var(--text-tertiary)",
    fontSize: "0.75rem",
    cursor: "pointer",
    textDecoration: "underline",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    padding: "4rem",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid var(--border-primary)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  emptyStateCard: {
    padding: "4rem 2rem",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  profileCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  profileImg: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "var(--border-secondary)",
  },
  profileName: {
    fontWeight: 600,
    color: "var(--text-primary)",
  },
  profileLoc: {
    fontSize: "0.7rem",
    color: "var(--text-tertiary)",
    display: "flex",
    alignItems: "center",
    marginTop: "2px",
  },
  requirementsBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem",
  },
  tagBadge: {
    fontSize: "0.7rem",
    padding: "0.15rem 0.4rem",
    borderRadius: "4px",
    backgroundColor: "var(--bg-primary)",
    border: "1px solid var(--border-primary)",
    color: "var(--text-secondary)",
    fontWeight: 500,
  },
  followupCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.8125rem",
    color: "var(--text-primary)",
    fontWeight: 500,
  },
};
