// frontend/src/shell/AppShell.jsx
// AutoShield Tech — Application Shell (CRASH SAFE HARDENED)

import React from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import TopHeader from "../components/TopHeader.jsx";
import "../styles/background.css";

/* =========================================================
   SAFE WRAPPER (prevents visual layers from crashing app)
========================================================= */

class SafeRender extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("Shell Layer Crash:", error);
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

/* =========================================================
   APP SHELL
========================================================= */

export default function AppShell({ children }) {
  return (
    <div
      className="app-shell"
      style={{
        position: "relative",
        minHeight: "100svh",
        width: "100%",
        backgroundColor: "#0B0E14",
        isolation: "isolate",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ===== BACKGROUND LAYER ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <SafeRender>
          <BackgroundLayer />
        </SafeRender>
      </div>

      {/* ===== BRAND WATERMARK ===== */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
        }}
      >
        <SafeRender>
          <BrandMark />
        </SafeRender>
      </div>

      {/* ===== GLOBAL TOP HEADER ===== */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          width: "100%",
        }}
      >
        <SafeRender>
          <TopHeader />
        </SafeRender>
      </div>

      {/* ===== APPLICATION UI ===== */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          width: "100%",
          overflow: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}
