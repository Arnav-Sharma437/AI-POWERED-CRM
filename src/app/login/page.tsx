"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, RefreshCw, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP verification state variables
  const [requiresOtp, setRequiresOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState("");

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (data.requiresVerification) {
        setRequiresOtp(true);
        setMessage("We've sent a 6-digit verification code to your registered email.");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      setError("Please enter a valid 6-digit code.");
      return;
    }

    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Success - Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError("");
    setMessage("");
    setResendCooldown(60);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend code");
      }

      setMessage("A new verification code has been sent to your email.");
      setOtp(""); // Reset input code
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code.");
      setResendCooldown(0); // Reset cooldown on error
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.glassCard} className="animate-fade-in">
        <div style={styles.header}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)",
            boxShadow: "0 6px 20px rgba(99, 102, 241, 0.4)",
            marginBottom: "1rem",
            position: "relative"
          }}>
            <Sparkles size={28} color="#ffffff" />
            <span style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: "#10b981",
              boxShadow: "0 0 10px #10b981"
            }} />
          </div>
          
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
            <span style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px"
            }}>
              NEXUS AI
            </span>
            <span style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              color: "var(--primary-color)",
              padding: "2px 6px",
              borderRadius: "4px",
              border: "1px solid rgba(99, 102, 241, 0.3)"
            }}>
              CRM
            </span>
          </div>
          
          {!requiresOtp ? (
            <>
              <h2 style={styles.title}>AI-Powered Lead Management</h2>
              <p style={styles.subtitle}>Sign in to access your intelligent sales & project workspace</p>
            </>
          ) : (
            <>
              <h2 style={styles.title}>Verify your email</h2>
              <p style={styles.subtitle}>We've sent a verification code to your email.</p>
            </>
          )}
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}
        {message && <div style={styles.successBox}>{message}</div>}

        {!requiresOtp ? (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="varun@bda.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={styles.label}>Password</label>
                <span 
                  onClick={() => alert("Please contact BDA Super Admin (Varun) to reset your password.")}
                  style={{ ...styles.forgot, cursor: "pointer" }}
                >
                  Forgot Password?
                </span>
              </div>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Access Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>6-Digit Verification Code</label>
              <div style={styles.inputWrapper}>
                <ShieldCheck size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" disabled={verifying} style={styles.button}>
              {verifying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <button 
              type="button" 
              onClick={handleResendOtp}
              disabled={resendCooldown > 0} 
              style={{
                ...styles.button,
                backgroundColor: "transparent",
                border: "1px solid var(--border-primary)",
                color: resendCooldown > 0 ? "var(--text-tertiary)" : "var(--text-primary)",
                boxShadow: "none",
                marginTop: "0.25rem"
              }}
            >
              <RefreshCw size={14} className={resendCooldown > 0 ? "" : "animate-pulse"} />
              {resendCooldown > 0 ? `Resend Code (${resendCooldown}s)` : "Resend Code"}
            </button>

            <button 
              type="button" 
              onClick={() => {
                setRequiresOtp(false);
                setError("");
                setMessage("");
                setOtp("");
              }}
              style={{
                fontSize: "0.875rem",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "center",
                marginTop: "0.5rem",
                textDecoration: "underline"
              }}
            >
              Back to Sign In
            </button>
          </form>
        )}

        <div style={styles.footer}>
          <p style={{ ...styles.footerText, marginBottom: "1rem" }}>
            Don't have an account?{" "}
            <span 
              onClick={() => router.push("/signup")}
              style={{ color: "var(--primary-color)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
            >
              Sign Up
            </span>
          </p>
          <p style={styles.footerText}>
            Demo Accounts: <code>varun@bda.com</code> / <code>arnav@bda.com</code><br/>
            Password: <code>password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    background: "radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 45%)",
    padding: "1.5rem",
  },
  glassCard: {
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "var(--bg-secondary)",
    border: "1px solid var(--border-primary)",
    borderRadius: "16px",
    padding: "2.5rem 2rem",
    boxShadow: "var(--shadow-lg)",
  },
  header: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  logoBox: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    background: "linear-gradient(135deg, var(--primary-color) 0%, var(--info-color) 100%)",
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "1.25rem",
    marginBottom: "1rem",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.2)",
  },
  logoText: {
    letterSpacing: "0.5px",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "0.5rem",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "0.875rem",
    color: "var(--text-secondary)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  errorBox: {
    backgroundColor: "var(--danger-light)",
    color: "var(--danger-text)",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    border: "1px solid rgba(239, 68, 68, 0.15)",
    marginBottom: "1rem",
  },
  successBox: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    border: "1px solid rgba(16, 185, 129, 0.15)",
    marginBottom: "1rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
  },
  label: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--text-secondary)",
  },
  forgot: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--primary-color)",
    cursor: "pointer",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: "1rem",
    color: "var(--text-tertiary)",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem 0.75rem 2.5rem",
    borderRadius: "8px",
    border: "1px solid var(--border-primary)",
    backgroundColor: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: "0.875rem",
    outline: "none",
    transition: "border-color 0.2s ease, box-shadow 0.2s ease",
  },
  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    width: "100%",
    padding: "0.75rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--primary-color)",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginTop: "0.5rem",
    boxShadow: "0 4px 10px rgba(99, 102, 241, 0.15)",
  },
  footer: {
    marginTop: "2rem",
    textAlign: "center",
    borderTop: "1px solid var(--border-primary)",
    paddingTop: "1.25rem",
  },
  footerText: {
    fontSize: "0.75rem",
    color: "var(--text-tertiary)",
    lineHeight: "1.5",
  },
};
