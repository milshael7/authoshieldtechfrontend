/* =========================================================
   AutoShield Tech — Application Shell
   INSTITUTIONAL SCROLL ARCHITECTURE
   Global Enforcement Layer Enabled
   ========================================================= */

import React, { useEffect, useState } from "react";
import BackgroundLayer from "../components/BackgroundLayer.jsx";
import BrandMark from "../components/BrandMark.jsx";
import TopHeader from "../components/TopHeader.jsx";
import "../styles/background.css";

/* =========================================================
   GLOBAL ENFORCEMENT EVENT BUS
   (Listens to api.js dispatches)
========================================================= */

function listenEnforcement(callback) {
  window.addEventListener("as:enforcement", callback);
  return () => window.removeEventListener("as:enforcement", callback);
}

/* =========================================================
   SAFE WRAPPER
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
   ENFORCEMENT OVERLAY
========================================================= */

function EnforcementOverlay({ state, onClose }) {
  if (!state) return null;

  const messages = {
    SESSION_EXPIRED: {
      title: "Session Expired",
      message: "Your session has expired. Please log in again.",
    },
    FORBIDDEN: {
      title: "Access Restricted",
      message: "You do not have permission to perform this action.",
    },
    RATE_LIMITED: {
      title: "Rate Limit Triggered",
      message: "Too many requests. Please wait and try again.",
    },
  };

  const content = messages[state] || {
    title: "Security Enforcement",
    message: "Action blocked by platform security policy.",
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "#111827",
          borderRadius: 12,
          padding: 32,
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 14 }}>{content.title}</h2>
        <p style={{ opacity: 0.8 }}>{content.message}</p>

        <button
          style={{
            marginTop: 24,
            padding: "8px 18px",
            borderRadius: 6,
            background: "#2563eb",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   APP SHELL
========================================================= */

export default function AppShell({ children }) {
  const [enforcementState, setEnforcementState] = useState(null);

  useEffect(() => {
    return listenEnforcement((e) => {
      const type = e.detail;
      setEnforcementState(type);

      if (type === "SESSION_EXPIRED") {
        setTimeout(() => {
          window.location.replace("/login");
        }, 1500);
      }
    });
  }, []);

  return (
    <div
      className="app-shell"
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0B0E14",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ================= BACKGROUND ================= */}
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

      {/* ================= BRAND WATERMARK ================= */}
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

      {/* ================= GLOBAL HEADER ================= */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          width: "100%",
          background: "rgba(11,14,20,0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <SafeRender>
          <TopHeader />
        </SafeRender>
      </div>

      {/* ================= APPLICATION CONTENT ================= */}
      <div
        className="app-shell-content"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          flex: 1,
        }}
      >
        {children}
      </div>

      {/* ================= GLOBAL ENFORCEMENT ================= */}
      <EnforcementOverlay
        state={enforcementState}
        onClose={() => setEnforcementState(null)}
      />
    </div>
  );
}
