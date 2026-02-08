import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

/**
 * AdminLayout.jsx
 * SOC Command Layout — FINAL BASELINE
 *
 * - Sidebar + topbar are structural (not decorative)
 * - Main content is primary focus
 * - AI assistant is a secondary, bottom-drawer advisor
 * - No floating AI panels anywhere
 */

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <strong>AutoShield</strong>
          <span>Security Operations</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end onClick={() => setMenuOpen(false)}>
            Security Posture
          </NavLink>

          <NavLink to="/admin/trading" onClick={() => setMenuOpen(false)}>
            Trading Oversight
          </NavLink>

          <NavLink to="/manager" onClick={() => setMenuOpen(false)}>
            Manager View
          </NavLink>

          <NavLink to="/company" onClick={() => setMenuOpen(false)}>
            Company View
          </NavLink>

          <NavLink
            to="/admin/notifications"
            onClick={() => setMenuOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        {/* ================= TOP BAR ================= */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0 }}>SOC Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAiOpen((v) => !v)}
              title="Toggle AI Assistant"
            >
              🤖 Assistant
            </button>

            <span className="badge">Admin</span>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= AI ASSISTANT (BOTTOM ONLY) ================= */}
        <section
          className={`ai-drawer ${aiOpen ? "open" : ""}`}
          aria-hidden={!aiOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAiOpen((v) => !v)}
            >
              {aiOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AuthoDev 6.5 — SOC Advisor"
              getContext={() => ({
                role: "admin",
                scope: "soc",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
