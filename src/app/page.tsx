"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2, 
  Users, Briefcase, Receipt, MessageSquare, Clock, Calendar, 
  TrendingUp, Globe, Lock, ChevronRight, Layers, Bot,
  Award, Terminal, Laptop, BarChart3, Star, Cpu, ArrowUpRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"superadmin" | "bda" | "developer">("superadmin");

  useEffect(() => {
    // Check if user session exists
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setIsLoggedIn(true);
          }
        }
      } catch (err) {
        // Not logged in or transient error
      }
    }
    checkSession();
  }, []);

  return (
    <div style={{ backgroundColor: "#070b14", color: "#f8fafc", minHeight: "100vh", fontFamily: "var(--font-sans), system-ui, sans-serif" }}>
      
      {/* Background Glow Blobs */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100vw", maxWidth: "1200px", height: "600px", background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.15), transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Top Navbar */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(16px)", backgroundColor: "rgba(7, 11, 20, 0.75)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }} onClick={() => router.push("/")}>
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.5)",
              color: "#ffffff"
            }}>
              <Sparkles size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  NEXUS AI
                </span>
                <span style={{ fontSize: "0.65rem", backgroundColor: "rgba(99, 102, 241, 0.2)", color: "#818cf8", padding: "2px 7px", borderRadius: "20px", fontWeight: 800, border: "1px solid rgba(99, 102, 241, 0.4)" }}>
                  2.0 CRM
                </span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500, margin: 0, letterSpacing: "0.2px" }}>
                Autonomous Agency & Lead Ops Engine
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden md:flex">
            <a href="#features" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Features</a>
            <a href="#roles" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Role Workspaces</a>
            <a href="#architecture" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Intelligence</a>
            <a href="#creator" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>About Developer</a>
          </nav>

          {/* Action Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.25rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.2s ease"
                }}
              >
                ⚡ Enter Live Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Link 
                  href="/login" 
                  style={{
                    color: "#cbd5e1",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    padding: "0.5rem 1rem"
                  }}
                >
                  Sign In
                </Link>
                <Link 
                  href="/login" 
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.2rem",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    boxShadow: "0 0 15px rgba(99, 102, 241, 0.35)"
                  }}
                >
                  Launch CRM <ArrowUpRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: "relative", zIndex: 1, padding: "5rem 1.5rem 4rem", textAlign: "center", maxWidth: "1100px", margin: "0 auto" }}>
        
        {/* Release Pill Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 1.1rem", borderRadius: "30px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.3)", marginBottom: "2rem" }}>
          <span style={{ display: "flex", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 10px #10b981" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#c7d2fe", letterSpacing: "0.2px" }}>
            Next-Gen Multi-Tenant AI CRM Architecture • Powered by Next.js 16 Turbopack
          </span>
        </div>

        {/* Hero Title */}
        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.25rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-1.5px", marginBottom: "1.5rem" }}>
          The Unified AI-Driven CRM for{" "}
          <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            High-Performance Teams
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)", color: "#94a3b8", maxWidth: "800px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          Designed specifically for Modern Software Agencies & Business Developers. Streamline leads pipeline, multi-currency projects, GST tax invoices, live biometric shifts, and instant collaborative real-time team chats in one lightning-fast workspace.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.9rem 2rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 0 30px rgba(79, 70, 229, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.15)"
            }}
          >
            {isLoggedIn ? "Access Your CRM Space" : "Get Started Instantly"} <ArrowRight size={18} />
          </Link>
          <a
            href="#roles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.9rem 1.75rem",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#e2e8f0",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
              border: "1px solid rgba(255, 255, 255, 0.1)"
            }}
          >
            Explore Role Features <ChevronRight size={18} />
          </a>
        </div>

        {/* Live Metrics Showcase Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", padding: "1.5rem", borderRadius: "16px", backgroundColor: "rgba(17, 24, 39, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)" }}>
          <div style={{ padding: "0.75rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#818cf8", fontFamily: "monospace" }}>3-Tier</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>RBAC Role Separation</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#34d399", fontFamily: "monospace" }}>100% Live</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>SSE Real-Time Project Chat</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f472b6", fontFamily: "monospace" }}>Multi-Currency</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>USD, EUR, GBP, AED & INR</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fbbf24", fontFamily: "monospace" }}>Auto-Audit</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>Weekly Attendance Email Engine</div>
          </div>
        </div>
      </section>

      {/* Role-Based Interactive Explorer Section */}
      <section id="roles" style={{ padding: "5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.75rem" }}>
            Engineered Specifically For Every Role
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Zero clutter. Each team member accesses an optimized workspace customized specifically to their core operational responsibilities.
          </p>

          {/* Role Tabs */}
          <div style={{ display: "inline-flex", gap: "0.5rem", padding: "6px", backgroundColor: "rgba(17, 24, 39, 0.8)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "2rem" }}>
            <button
              onClick={() => setActiveRoleTab("superadmin")}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "superadmin" ? "#4f46e5" : "transparent",
                color: activeRoleTab === "superadmin" ? "#ffffff" : "#94a3b8"
              }}
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => setActiveRoleTab("bda")}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "bda" ? "#4f46e5" : "transparent",
                color: activeRoleTab === "bda" ? "#ffffff" : "#94a3b8"
              }}
            >
              💼 BDA (Business Development)
            </button>
            <button
              onClick={() => setActiveRoleTab("developer")}
              style={{
                padding: "0.6rem 1.4rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "developer" ? "#4f46e5" : "transparent",
                color: activeRoleTab === "developer" ? "#ffffff" : "#94a3b8"
              }}
            >
              💻 Developer Workspace
            </button>
          </div>
        </div>

        {/* Role Content Card */}
        <div style={{ backgroundColor: "#0f172a", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "20px", padding: "2.5rem", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)" }}>
          {activeRoleTab === "superadmin" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#818cf8", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <ShieldCheck size={18} /> FULL EXECUTIVE AUTHORITY & CONTROL
                </div>
                <h3 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "1rem" }}>Super Admin Command Center</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Super Admins receive overarching oversight of the agency’s entire finances, client accounts, employee presence, and tax invoice generation.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Complete Zoho-Style GST Tax Invoice Generator with instant PDF download & direct email dispatch",
                    "Team Workday & Attendance Hub with live Office vs Home check-in tracker",
                    "Master Weekly Email Digest delivering team presence & office hours automatically",
                    "Global multi-currency financial aggregation converting USD/EUR/GBP/AED into accurate INR totals",
                    "Complete User & Role management, Trash soft-delete restore system, and activity audits"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>TAX INVOICE PREVIEW</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(16, 185, 129, 0.2)", color: "#34d399", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>PI-000088</span>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Client: Cyberdyne Systems</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#818cf8", fontFamily: "monospace", marginTop: "4px" }}>₹17,700.00 (IGST 18%)</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Automated Bank Remittance & In-Words Converter Included</div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                  "Sent with official sender branding from Pixxelu Digital Technology."
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === "bda" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#38bdf8", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <TrendingUp size={18} /> SALES PIPELINE & CLIENT CONVERSION
                </div>
                <h3 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "1rem" }}>BDA & Sales Operations Engine</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Business Development Associates focus purely on sourcing high-ticket clients, scheduling kickoff meetings, and monitoring deal progression.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Lead capture & follow-up scheduler with automated priority tags (Hot, Warm, Cold)",
                    "1-Click Lead to Client Account Conversion with automatic project creation",
                    "Interactive Calendar with Call / Meeting scheduling and real-time reminders",
                    "Client Portfolios in both List View (Table) and Grid View in native project currencies",
                    "Individual clock-in/out attendance logging with live daily office work timer"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>LEAD CONVERSION FLOW</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>Won Deal</span>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>Sarah Connor (Cyberdyne Systems)</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>Value: $4,500 USD • Mobile App & UI/UX</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "6px", fontWeight: 600 }}>Converted to Client • Project Spun Up</div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === "developer" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#a855f7", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <Laptop size={18} /> ZERO-DISTRACTION BUILDER WORKSPACE
                </div>
                <h3 style={{ fontSize: "1.85rem", fontWeight: 800, marginBottom: "1rem" }}>Developer Dedicated Suite</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Developers get a focused environment strictly showing their assigned projects, sprint deadlines, personal work logs, and direct team chat.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Multi-developer assignment support per project with individual task tracking",
                    "Persistent Project Chat box with real-time SSE updates (messages never disappear)",
                    "Developer Notes & Activity attachments directly inside project tabs",
                    "Automatic conditional Client Review modal triggering on project completion",
                    "Automated weekly email report showing hours spent in Office vs Home"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#a855f7" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#1e293b", padding: "1.5rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>PROJECT COLLABORATION SUITE</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>In Progress</span>
                </div>
                <div style={{ backgroundColor: "#0f172a", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>FinTech Mobile App Redesign</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>Assigned: Ankit & Naveen • Deadline in 4 Days</div>
                  <div style={{ fontSize: "0.75rem", color: "#818cf8", marginTop: "6px" }}>⚡ Real-Time SSE Project Chat Active</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" style={{ padding: "5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Comprehensive Core Modules</h2>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Everything an agency requires to scale operations from zero to enterprise.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          
          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Receipt size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Zoho-Grade Tax Invoicing</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Generates pixel-perfect GST Tax Invoices matching reference design. Includes Indian Currency In-Words converter, bank info, PDF generation, and custom company sender emails.
            </p>
          </div>

          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Clock size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Live Shift & Attendance Hub</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Interactive Clock-in/Clock-out buttons on the topbar. Super Admin monitors who arrived, departed, work location (Office/Home), and total active work hours in real-time.
            </p>
          </div>

          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(244, 114, 182, 0.15)", color: "#f472b6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Globe size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Multi-Currency Intelligence</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Retains native currencies (USD, EUR, GBP, AED, CAD, AUD, INR) across client accounts and projects while automatically converting master pending bills into unified INR KPIs.
            </p>
          </div>

          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <MessageSquare size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>SSE Real-Time Chat Engine</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Dedicated right-hand project messaging panel with Server-Sent Events, attachment support, unread counters, and zero scroll jumping.
            </p>
          </div>

          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Bot size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Weekly Digest Automation</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Automated SMTP email dispatch delivering individualized attendance breakdowns to developers and a consolidated master team summary to Super Admin.
            </p>
          </div>

          <div style={{ backgroundColor: "#0f172a", padding: "2rem", borderRadius: "16px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Persistent JWT Sessions</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Never randomly log out. Robust session management keeps users seamlessly authenticated across refreshes until explicit manual logout.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)", border: "1px solid rgba(99, 102, 241, 0.4)", borderRadius: "24px", padding: "4rem 2rem", position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "1rem" }}>Ready to Supercharge Your Agency?</h2>
          <p style={{ color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
            Experience the next level of operational clarity, financial transparency, and team velocity.
          </p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "1rem 2.5rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1.1rem",
              boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)"
            }}
          >
            {isLoggedIn ? "Open Dashboard Now" : "Launch CRM Dashboard"} <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer & Developer Credits */}
      <footer id="creator" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "3rem 1.5rem", backgroundColor: "#050811" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff" }}>
                <Sparkles size={14} />
              </div>
              <span style={{ fontWeight: 800, fontSize: "1rem", color: "#f8fafc" }}>NEXUS AI DIGITAL CRM</span>
            </div>
            <p style={{ color: "#64748b", fontSize: "0.8125rem", margin: 0 }}>
              Enterprise Grade Agency Management & AI BDA Operations Suite.
            </p>
          </div>

          {/* DEVELOPER CREDIT HIGHLIGHT */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "0.6rem 1.25rem", borderRadius: "30px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <Award size={18} color="#fbbf24" />
            <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Crafted & Developed with Precision by <strong style={{ color: "#f8fafc", background: "linear-gradient(135deg, #818cf8 0%, #c084fc 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: "0.95rem" }}>Arnav Sharma</strong>
            </span>
          </div>

          <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
            © {new Date().getFullYear()} All Rights Reserved.
          </div>

        </div>
      </footer>

    </div>
  );
}
