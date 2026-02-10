// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (UPGRADED)
//
// PURPOSE:
// - Global background mounting
// - Single visual wrapper for entire platform
// - Z-index safety layer
// - Future-ready for global UI (toasts, modals)
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
      {/* Global SOC Background (always behind UI) */}
      <BackgroundLayer />

      {/* Foreground Application Content */}
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
