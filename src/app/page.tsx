"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, ShieldCheck, Zap, ArrowRight, CheckCircle2, 
  Users, Briefcase, Receipt, MessageSquare, Clock, Calendar, 
  TrendingUp, Globe, Lock, ChevronRight, Layers, Bot,
  Award, Terminal, Laptop, BarChart3, Star, Cpu, ArrowUpRight,
  MousePointerClick, Check
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<"superadmin" | "bda" | "developer">("superadmin");

  useEffect(() => {
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
    <div style={{ backgroundColor: "#060911", color: "#f8fafc", minHeight: "100vh", fontFamily: "var(--font-sans), sans-serif", overflowX: "hidden" }}>
      
      {/* Background Glow Blobs */}
      <div style={{ position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", width: "100vw", maxWidth: "1200px", height: "550px", background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(224, 86, 36, 0.18), rgba(99, 102, 241, 0.12), transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Top Navbar */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", backgroundColor: "rgba(6, 9, 17, 0.8)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", padding: "0.85rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          
          {/* Brand Logo with Pixxelu Emblem */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", cursor: "pointer" }} onClick={() => router.push("/")}>
            <div style={{
              height: "38px",
              display: "flex",
              alignItems: "center",
              padding: "4px 10px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              boxShadow: "0 0 20px rgba(224, 86, 36, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              <img 
                src="/logo.png" 
                alt="Pixxelu Logo" 
                style={{ height: "24px", width: "auto", objectFit: "contain" }} 
              />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "-0.4px", color: "#ffffff" }}>
                  PIXXELU
                </span>
                <span style={{ fontSize: "0.65rem", backgroundColor: "rgba(224, 86, 36, 0.2)", color: "#f97316", padding: "2px 7px", borderRadius: "12px", fontWeight: 800, border: "1px solid rgba(224, 86, 36, 0.4)" }}>
                  CRM
                </span>
              </div>
              <p style={{ fontSize: "0.68rem", color: "#94a3b8", fontWeight: 500, margin: 0 }}>
                High-Speed Agency & Team Engine
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2rem" }} className="hidden md:flex">
            <a href="#benefits" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Why Pixxelu</a>
            <a href="#roles" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Role Workspaces</a>
            <a href="#features" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Key Features</a>
            <a href="#creator" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "0.875rem", fontWeight: 500, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}>Developer Credit</a>
          </nav>

          {/* Action Button */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.35rem",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #e05624 0%, #f97316 100%)",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  boxShadow: "0 4px 16px rgba(224, 86, 36, 0.4)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease"
                }}
                className="hover:scale-105"
              >
                ⚡ Enter Live Workspace <ArrowRight size={16} />
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
                    padding: "0.5rem 1rem",
                    transition: "color 0.15s"
                  }}
                  className="hover:text-white"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login" 
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1.25rem",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #e05624 0%, #f97316 100%)",
                    color: "#ffffff",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    boxShadow: "0 4px 14px rgba(224, 86, 36, 0.35)",
                    transition: "transform 0.15s ease"
                  }}
                  className="hover:scale-105"
                >
                  Get Started <ArrowUpRight size={15} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ position: "relative", zIndex: 1, padding: "5.5rem 1.5rem 4rem", textAlign: "center", maxWidth: "1050px", margin: "0 auto" }}>
        
        {/* Release Pill Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 1.1rem", borderRadius: "30px", backgroundColor: "rgba(224, 86, 36, 0.12)", border: "1px solid rgba(224, 86, 36, 0.35)", marginBottom: "2rem" }}>
          <span style={{ display: "flex", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#e05624", boxShadow: "0 0 10px #e05624" }} />
          <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#fed7aa", letterSpacing: "0.2px" }}>
            Pixxelu Business OS • Built for High-Velocity Software Teams
          </span>
        </div>

        {/* Hero Title */}
        <h1 style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.2rem)", fontWeight: 900, lineHeight: 1.12, letterSpacing: "-1.5px", marginBottom: "1.5rem" }}>
          Run Your Entire Agency in{" "}
          <span style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 50%, #ffffff 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            One Simple Workspace
          </span>
        </h1>

        {/* Clear High-Converting Subtitle */}
        <p style={{ fontSize: "clamp(1.05rem, 2vw, 1.25rem)", color: "#94a3b8", maxWidth: "780px", margin: "0 auto 2.5rem", lineHeight: 1.6 }}>
          Close more deals, assign developers to projects, bill clients in multiple currencies, and track live office shifts without complicated software.
        </p>

        {/* Direct CTA Action Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "3.5rem" }}>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "0.95rem 2.2rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e05624 0%, #f97316 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1rem",
              boxShadow: "0 8px 25px rgba(224, 86, 36, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              transition: "transform 0.15s ease, box-shadow 0.15s ease"
            }}
            className="hover:scale-105"
          >
            {isLoggedIn ? "Open Dashboard Now" : "Start Using Pixxelu"} <ArrowRight size={18} />
          </Link>
          <a
            href="#roles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.95rem 1.85rem",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#e2e8f0",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "1rem",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              transition: "background 0.15s ease"
            }}
            className="hover:bg-white/10"
          >
            See How It Works <ChevronRight size={18} />
          </a>
        </div>

        {/* Live Metrics Showcase Banner */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", padding: "1.5rem", borderRadius: "16px", backgroundColor: "rgba(17, 24, 39, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", backdropFilter: "blur(12px)" }}>
          <div style={{ padding: "0.75rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#f97316", fontFamily: "monospace" }}>3 Roles</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>Admin, BDA & Developer</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#10b981", fontFamily: "monospace" }}>Real-Time</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>Instant Project Chats</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#38bdf8", fontFamily: "monospace" }}>Global</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>USD, EUR, GBP, AED & INR</div>
          </div>
          <div style={{ padding: "0.75rem", borderLeft: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: "2rem", fontWeight: 900, color: "#fbbf24", fontFamily: "monospace" }}>Auto Mails</div>
            <div style={{ fontSize: "0.8125rem", color: "#94a3b8", marginTop: "4px" }}>Weekly Team Reports</div>
          </div>
        </div>
      </section>

      {/* Why Pixxelu Benefits Section */}
      <section id="benefits" style={{ padding: "4.5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.5rem" }}>
            Built for Real Team Workflows
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            No complicated configuration. Simple, clean tools that help your team work faster.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          
          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", transition: "transform 0.2s ease, border-color 0.2s ease" }} className="hover:scale-[1.02] hover:border-orange-500/40">
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(224, 86, 36, 0.15)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <TrendingUp size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Never Lose a Lead</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Organize leads by priority (Hot, Warm, Cold). Set automated follow-up reminders and convert winning leads into client projects in 1-click.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", transition: "transform 0.2s ease, border-color 0.2s ease" }} className="hover:scale-[1.02] hover:border-emerald-500/40">
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Clock size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Simple Attendance & Shift Logging</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Developers and BDAs click one button to start and stop their work session. Admins see who is active in Office vs Home with automated weekly email digests.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)", transition: "transform 0.2s ease, border-color 0.2s ease" }} className="hover:scale-[1.02] hover:border-blue-500/40">
            <div style={{ width: "45px", height: "45px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Receipt size={22} />
            </div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.5rem" }}>Professional GST Invoices</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Create standard Tax Invoices with SAC codes, GST calculation, amount in words, bank details, PDF download, and direct client email sending.
            </p>
          </div>

        </div>
      </section>

      {/* Role-Based Interactive Explorer Section */}
      <section id="roles" style={{ padding: "4.5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "0.5rem" }}>
            Custom Views for Every Team Member
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: "600px", margin: "0 auto" }}>
            Each person sees only what they need to do their job without confusing tabs.
          </p>

          {/* Role Tabs */}
          <div style={{ display: "inline-flex", gap: "0.5rem", padding: "6px", backgroundColor: "rgba(17, 24, 39, 0.8)", borderRadius: "12px", border: "1px solid rgba(255, 255, 255, 0.08)", marginTop: "1.75rem" }}>
            <button
              onClick={() => setActiveRoleTab("superadmin")}
              style={{
                padding: "0.6rem 1.35rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "superadmin" ? "#e05624" : "transparent",
                color: activeRoleTab === "superadmin" ? "#ffffff" : "#94a3b8"
              }}
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => setActiveRoleTab("bda")}
              style={{
                padding: "0.6rem 1.35rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "bda" ? "#e05624" : "transparent",
                color: activeRoleTab === "bda" ? "#ffffff" : "#94a3b8"
              }}
            >
              💼 BDA (Sales)
            </button>
            <button
              onClick={() => setActiveRoleTab("developer")}
              style={{
                padding: "0.6rem 1.35rem",
                borderRadius: "8px",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                backgroundColor: activeRoleTab === "developer" ? "#e05624" : "transparent",
                color: activeRoleTab === "developer" ? "#ffffff" : "#94a3b8"
              }}
            >
              💻 Developer
            </button>
          </div>
        </div>

        {/* Role Content Card */}
        <div style={{ backgroundColor: "#0e1424", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", padding: "2.5rem", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)" }}>
          {activeRoleTab === "superadmin" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#f97316", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <ShieldCheck size={18} /> COMPLETE AGENCY OVERSIGHT
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>Super Admin Command Hub</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Master control over company billing, team attendance logs, client finances, and system permissions.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Create and dispatch official GST Tax Invoices directly with company branding",
                    "Monitor live team attendance with first in, last out, and total active office hours",
                    "Receive automated Master Weekly Attendance email summaries of the entire company",
                    "View total company pending bills accurately converted into INR from USD/EUR/AED",
                    "Manage team member roles, permissions, and restore trashed items"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#f97316" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#172033", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>TAX INVOICE MODULE</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(224, 86, 36, 0.2)", color: "#f97316", padding: "2px 8px", borderRadius: "8px", fontWeight: 700 }}>PI-000088</span>
                </div>
                <div style={{ backgroundColor: "#0b0f19", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Client: Cyberdyne Systems</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#f97316", fontFamily: "monospace", marginTop: "4px" }}>₹17,700.00 (IGST 18%)</div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>Remittance Info & Amount in Words included</div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  Dispatched from official sender email: <strong>rakeshrinku16@gmail.com</strong>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === "bda" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#38bdf8", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <TrendingUp size={18} /> SALES & CLIENT CONVERSION
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>BDA & Sales Suite</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  A focused pipeline for business development associates to track leads, schedule calls, and close projects.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Lead capture & follow-up scheduler with Hot, Warm, and Cold priority filters",
                    "1-Click Lead to Client Account conversion with instant project creation",
                    "Interactive Calendar with meeting schedule reminders and notifications",
                    "Client Portfolios in both List View and Grid View in original currencies ($/€/£/₹)",
                    "Simple Clock-In & Clock-Out button on topbar with live work timer"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#38bdf8" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#172033", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>DEAL WON STATUS</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", padding: "2px 8px", borderRadius: "8px", fontWeight: 700 }}>Closed</span>
                </div>
                <div style={{ backgroundColor: "#0b0f19", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>Sarah Connor (Cyberdyne Systems)</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>Contract: $4,500 USD • Mobile App</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "6px", fontWeight: 600 }}>✓ Converted to Client Account</div>
                </div>
              </div>
            </div>
          )}

          {activeRoleTab === "developer" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2.5rem", alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "#a855f7", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.5rem" }}>
                  <Laptop size={18} /> DEVELOPER FOCUSED WORKSPACE
                </div>
                <h3 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "1rem" }}>Developer Workspace</h3>
                <p style={{ color: "#94a3b8", lineHeight: 1.6, marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  Clean space strictly showing assigned projects, sprint deadlines, notes, and real-time team chats.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    "Multi-developer assignment support per project with individual task tracking",
                    "Persistent Project Chat box with real-time updates (messages never disappear)",
                    "Developer Notes & Project activity attachments directly inside project tabs",
                    "Automatic Client Review popup triggering upon project completion",
                    "Weekly email report showing personal hours logged in Office vs Home"
                  ].map((feat, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <CheckCircle2 size={18} color="#a855f7" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.875rem", color: "#e2e8f0" }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ backgroundColor: "#172033", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontWeight: 600 }}>PROJECT HUB</span>
                  <span style={{ fontSize: "0.75rem", backgroundColor: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "2px 8px", borderRadius: "8px", fontWeight: 700 }}>In Progress</span>
                </div>
                <div style={{ backgroundColor: "#0b0f19", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f8fafc" }}>FinTech Mobile App Redesign</div>
                  <div style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>Assigned: Ankit & Naveen • Due in 4 Days</div>
                  <div style={{ fontSize: "0.75rem", color: "#f97316", marginTop: "6px" }}>⚡ Real-Time Project Chat Active</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" style={{ padding: "4.5rem 1.5rem", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-0.5px" }}>Everything You Need in One System</h2>
          <p style={{ color: "#94a3b8", marginTop: "0.5rem" }}>Powerful features designed without unnecessary complexity.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
          
          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-orange-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(224, 86, 36, 0.15)", color: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Receipt size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Official Tax Invoicing</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Create GST invoices with itemized rates, tax breakup, bank remittance info, PDF download, and direct email sending with your company name.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-emerald-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Live Workday Tracker</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Topbar Clock-In/Clock-Out button. Super Admin can view when members arrive, depart, where they work from (Office/Home), and total daily active hours.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-pink-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(244, 114, 182, 0.15)", color: "#f472b6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Globe size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Multi-Currency Projects</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Bill clients in their native currency (USD, EUR, GBP, AED, CAD, AUD, INR) while dashboard automatically aggregates total pending balance in INR.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-blue-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <MessageSquare size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Real-Time Project Chats</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Chat directly inside project tabs with instant message synchronization, file attachments, and zero scroll jumping.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-amber-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(251, 191, 36, 0.15)", color: "#fbbf24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Bot size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>Weekly Email Reports</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Automated email delivery sending individualized attendance breakdowns to developers and a master team summary to Super Admin.
            </p>
          </div>

          <div style={{ backgroundColor: "#0e1424", padding: "2rem", borderRadius: "14px", border: "1px solid rgba(255, 255, 255, 0.08)" }} className="hover:border-purple-500/30 transition-all">
            <div style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "rgba(168, 85, 247, 0.15)", color: "#c084fc", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
              <Lock size={20} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" }}>30-Day Persistent Login</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.875rem", lineHeight: 1.6 }}>
              Never get randomly logged out during busy workdays. Sessions stay securely active until you explicitly click logout.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: "4rem 1.5rem", maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(224, 86, 36, 0.18) 0%, rgba(99, 102, 241, 0.18) 100%)", border: "1px solid rgba(224, 86, 36, 0.4)", borderRadius: "20px", padding: "4rem 2rem", position: "relative", overflow: "hidden" }}>
          <h2 style={{ fontSize: "2.3rem", fontWeight: 900, marginBottom: "1rem" }}>Ready to Supercharge Your Team?</h2>
          <p style={{ color: "#cbd5e1", maxWidth: "600px", margin: "0 auto 2rem", fontSize: "1.05rem" }}>
            Experience seamless agency operations, financial transparency, and faster project delivery today.
          </p>
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.6rem",
              padding: "1rem 2.5rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #e05624 0%, #f97316 100%)",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              fontSize: "1.05rem",
              boxShadow: "0 6px 24px rgba(224, 86, 36, 0.5)",
              transition: "transform 0.15s ease"
            }}
            className="hover:scale-105"
          >
            {isLoggedIn ? "Open Dashboard Now" : "Launch Pixxelu CRM"} <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer & Developer Credits */}
      <footer id="creator" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", padding: "3rem 1.5rem", backgroundColor: "#04060d" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1.5rem" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              height: "32px",
              display: "flex",
              alignItems: "center",
              padding: "2px 8px",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)"
            }}>
              <img 
                src="/logo.png" 
                alt="Pixxelu Logo" 
                style={{ height: "20px", width: "auto", objectFit: "contain" }} 
              />
            </div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#f8fafc" }}>PIXXELU CRM</span>
          </div>

          {/* DEVELOPER CREDIT HIGHLIGHT */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", backgroundColor: "rgba(255, 255, 255, 0.04)", padding: "0.55rem 1.25rem", borderRadius: "30px", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <Award size={18} color="#f97316" />
            <span style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
              Developed by <strong style={{ color: "#ffffff", fontSize: "0.95rem" }}>Arnav Sharma</strong>
            </span>
          </div>

          <div style={{ color: "#64748b", fontSize: "0.8125rem" }}>
            © {new Date().getFullYear()} Pixxelu Digital Technology. All Rights Reserved.
          </div>

        </div>
      </footer>

    </div>
  );
}
