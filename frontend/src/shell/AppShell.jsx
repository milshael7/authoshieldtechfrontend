// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (HARDENED)
//
// PURPOSE:
// - Global background mounting
// - Brand watermark layer
// - Single visual wrapper for entire platform
// - Z-index safety boundary
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
      }}
    >
      {/* Absolute background (furthest back) */}
      <BackgroundLayer />

      {/* Brand watermark (above background, below UI) */}
      <BrandMark />

      {/* Foreground application UI */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          width: "100%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
