// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — Operational SOC
//
// SAFE:
// - Full file replacement
// - Default export
// - Matches existing routes
// - No business logic
// - Layout.css compatible

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function ManagerLayout() {
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
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <strong>AutoShield</strong>
          <span>Manager SOC</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/manager" end onClick={() => setMenuOpen(false)}>
            Security Overview
          </NavLink>

          <NavLink to="/manager/assets" onClick={() => setMenuOpen(false)}>
            Assets
          </NavLink>

          <NavLink to="/manager/threats" onClick={() => setMenuOpen(false)}>
            Threats
          </NavLink>

          <NavLink to="/manager/incidents" onClick={() => setMenuOpen(false)}>
            Incidents
          </NavLink>

          <NavLink to="/manager/vulnerabilities" onClick={() => setMenuOpen(false)}>
            Vulnerabilities
          </NavLink>

          <NavLink to="/manager/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <NavLink to="/manager/notifications" onClick={() => setMenuOpen(false)}>
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <h1 style={{ margin: 0 }}>Manager Security Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAssistantOpen((v) => !v)}
            >
              Advisor
            </button>
            <span className="badge">Manager</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>

        <section className={`ai-drawer ${assistantOpen ? "open" : ""}`}>
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen((v) => !v)}
            >
              {assistantOpen ? "▼ Hide Advisor" : "▲ Show Advisor"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AutoDev 6.5 — Manager Advisor"
              getContext={() => ({
                role: "manager",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
