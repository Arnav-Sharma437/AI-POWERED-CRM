"use client";

import React from "react";
import { Sparkles, Cpu, Bot, Zap } from "lucide-react";

interface AiLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
}

export default function AiLoader({
  label = "Synthesizing AI Engine...",
  sublabel = "Accessing neural data stream & pipeline",
  size = "md"
}: AiLoaderProps) {
  const isFullscreen = size === "fullscreen";
  const isSmall = size === "sm";

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(9, 13, 22, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        gap: "1.5rem"
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isSmall ? "1.5rem" : "3.5rem 2rem",
        gap: "1.25rem",
        width: "100%"
      };

  const orbSize = isSmall ? 48 : isFullscreen ? 88 : 64;

  return (
    <div style={containerStyle} className="animate-fade-in">
      {/* Central Neural Quantum Core */}
      <div
        style={{
          position: "relative",
          width: `${orbSize}px`,
          height: `${orbSize}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Outer Orbit Track 1 (Pixxelu Orange Dashed Track) */}
        <div
          style={{
            position: "absolute",
            inset: -8,
            borderRadius: "50%",
            border: "2px dashed rgba(224, 86, 36, 0.55)",
            animation: "ai-spin 5s linear infinite"
          }}
        />

        {/* Orbit Track 2 (Orange/Amber Arc) */}
        <div
          style={{
            position: "absolute",
            inset: -4,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#f97316",
            borderRightColor: "#fbbf24",
            animation: "ai-spin-reverse 2.5s linear infinite"
          }}
        />

        {/* Core Glowing Pixxelu Emblem */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
            boxShadow: "0 0 25px rgba(224, 86, 36, 0.4)",
            border: "2px solid rgba(224, 86, 36, 0.3)",
            animation: "ai-pulse-glow 2s ease-in-out infinite"
          }}
        >
          <img 
            src="/logo.png" 
            alt="Pixxelu" 
            style={{ 
              width: "80%", 
              height: "auto", 
              objectFit: "contain",
              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
            }} 
          />
        </div>

        {/* Floating Quantum Particle 1 */}
        <div
          style={{
            position: "absolute",
            top: "-6px",
            right: "2px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#f97316",
            boxShadow: "0 0 10px #f97316",
            animation: "ai-particle-float 2s ease-in-out infinite"
          }}
        />

        {/* Floating Quantum Particle 2 */}
        <div
          style={{
            position: "absolute",
            bottom: "-4px",
            left: "4px",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: "#fbbf24",
            boxShadow: "0 0 8px #fbbf24",
            animation: "ai-particle-float 2.5s ease-in-out infinite reverse"
          }}
        />
      </div>

      {/* Futuristic Labeling */}
      <div style={{ textAlign: "center" }}>
        <div
          className="ai-shimmer-text"
          style={{
            fontSize: isSmall ? "0.875rem" : isFullscreen ? "1.25rem" : "1.05rem",
            letterSpacing: "0.5px",
            marginBottom: "4px"
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: isSmall ? "0.75rem" : "0.8125rem",
              color: "var(--text-tertiary)",
              fontWeight: 400
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
