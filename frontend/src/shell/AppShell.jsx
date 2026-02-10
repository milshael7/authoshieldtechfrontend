// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (FINAL HARDENED)
//
// PURPOSE:
// - Global background mounting
// - Brand watermark layer
// - Single visual wrapper for entire platform
// - Z-index safety boundary (FIXED)
//
// HARD RULES (ENFORCED):
// - NO routing
// - NO layouts
// - NO business logic
// - NO state
//
// This file is INFRASTRUCTURE. Keep it stable.

import React from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import "../styles/background.css";

export default function AppShell({ children }) {
  return (
    <div
      className="app-shell"
      style={{
        position: "relative",
        minHeight: "100vh",
        width: "100%",
        overflow: "hidden",
        backgroundColor: "#0B0E14", // safety fallback (prevents blue blank)
      }}
    >
      {/* ===== BACKGROUND LAYER (z-index: 0) ===== */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0 }}>
        <BackgroundLayer />
      </div>

      {/* ===== BRAND WATERMARK (z-index: 1) ===== */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1 }}>
        <BrandMark />
      </div>

      {/* ===== APPLICATION UI (z-index: 10) ===== */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
