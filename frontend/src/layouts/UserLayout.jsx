// frontend/src/layouts/UserLayout.jsx
// User Layout — SOC Baseline (UPGRADED)
//
// PURPOSE:
// - End-user visibility shell
// - Notifications + overview only
// - Advisory assistant (NO execution)
//
// HARD RULES:
// - No admin / manager controls
// - No trading / SOC governance
// - Assistant is advisory only
//
// SAFE:
// - Full file replacement
// - Default export
// - layout.css aligned
// - Visual parity with other layouts

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

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
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <Logo size="sm" />
          <span className="muted" style={{ fontSize: 12 }}>
            User Portal
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user" end onClick={() => setMenuOpen(false)}>
            Overview
          </NavLink>

          <NavLink
            to="/user/notifications"
            onClick={() => setMenuOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        {/* ================= TOP BAR ================= */}
        <header className="layout-topbar">
          <div
            className="topbar-left"
            style={{ display: "flex", alignItems: "center", gap: 14 }}
          >
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0, fontSize: 18 }}>
              User Dashboard
            </h1>
          </div>

          <div
            className="topbar-right"
            style={{ display: "flex", alignItems: "center", gap: 12 }}
          >
            <button
              className="btn"
              onClick={() => setAssistantOpen((v) => !v)}
            >
              Assistant
            </button>

            <span className="badge">User</span>
          </div>
        </header>

        {/* ================= PAGE CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= ASSISTANT DRAWER ================= */}
        <section
          className={`ai-drawer ${assistantOpen ? "open" : ""}`}
          aria-hidden={!assistantOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen((v) => !v)}
            >
              {assistantOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AutoDev 6.5 — User Assistant"
              getContext={() => ({
                role: "user",
                scope: "individual",
                permissions: "advisory-only",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
