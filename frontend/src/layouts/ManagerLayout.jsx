// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — GLOBAL OPERATIONAL OVERSIGHT
// Structured hierarchy
// Trading oversight included
// Admin-compatible visibility
// Phase 2 Architecture Lock

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
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

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>

      {menuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar manager">

        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Global Manager SOC
          </span>
        </div>

        <nav className="layout-nav">

          {/* GLOBAL SECURITY */}
          <NavLink to="." end onClick={closeMenu}>
            Global Posture
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Global Assets
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Global Threats
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Global Incidents
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Global Vulnerabilities
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance Oversight
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Operational Reports
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* TRADING (READ-ONLY OVERSIGHT) */}
          <NavLink to="trading" onClick={closeMenu}>
            Trading Oversight
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* NOTIFICATIONS */}
          <NavLink to="notifications" onClick={closeMenu}>
            System Notifications
          </NavLink>

        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">

        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= AI DRAWER ================= */}
        <section className={`ai-drawer ${assistantOpen ? "open" : ""}`}>

          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen(v => !v)}
            >
              {assistantOpen ? "▼ Hide Advisor" : "▲ Show Advisor"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="Manager Security Advisor"
              getContext={() => ({
                role: "manager",
                scope: "global-oversight",
                location: window.location.pathname,
              })}
            />
          </div>

        </section>

      </main>
    </div>
  );
}
