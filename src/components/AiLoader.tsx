"use client";

import React from "react";

interface AiLoaderProps {
  label?: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg" | "fullscreen";
}

export default function AiLoader({
  label = "Pixxelu Operations",
  sublabel = "Syncing workspace data...",
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
        gap: "1.25rem"
      }
    : {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isSmall ? "1.5rem" : "3rem 1.5rem",
        gap: "1rem",
        width: "100%"
      };

  const orbSize = isSmall ? 40 : isFullscreen ? 68 : 52;

  return (
    <div style={containerStyle} className="animate-fade-in">
      {/* Clean Minimal Spinner with Pixxelu Logo */}
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
        {/* Subtle circular track */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid var(--border-primary)",
            borderTopColor: "var(--primary-color)",
            animation: "ai-spin 0.9s linear infinite"
          }}
        />

        {/* Central Clean Pixxelu Logo */}
        <div
          style={{
            width: `${orbSize - 12}px`,
            height: `${orbSize - 12}px`,
            borderRadius: "50%",
            backgroundColor: "var(--bg-secondary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "6px",
            border: "1px solid var(--border-primary)"
          }}
        >
          <img 
            src="/logo.png" 
            alt="Pixxelu" 
            style={{ 
              width: "100%", 
              height: "auto", 
              objectFit: "contain"
            }} 
          />
        </div>
      </div>

      {/* Clean, Simple, Non-bold Typography */}
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: isSmall ? "0.8125rem" : isFullscreen ? "1.1rem" : "0.9375rem",
            color: "var(--text-primary)",
            fontWeight: 500,
            marginBottom: "2px"
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: isSmall ? "0.725rem" : "0.775rem",
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
