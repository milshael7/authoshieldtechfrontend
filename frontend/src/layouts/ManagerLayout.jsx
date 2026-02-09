// frontend/src/layouts/ManagerLayout.jsx
// AutoShield Tech — Manager Layout
// PURPOSE:
// - Operational SOC view
// - Sidebar + topbar layout
// - Mobile-safe navigation
// - Default export (Vercel-safe)

import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "../styles/layout.css";

export default function ManagerLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>
      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <span>AutoShield Tech</span>
          <small className="muted">Manager Console</small>
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

          <NavLink
            to="/manager/vulnerabilities"
            onClick={() => setMenuOpen(false)}
          >
            Vulnerabilities
          </NavLink>

          <NavLink to="/manager/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <NavLink
            to="/manager/notifications"
            onClick={() => setMenuOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>
      </aside>

      {/* ================= OVERLAY (MOBILE) ================= */}
      <div
        className="sidebar-overlay"
        onClick={() => setMenuOpen(false)}
      />

      {/* ================= MAIN ================= */}
      <div className="layout-main">
        {/* ===== TOPBAR ===== */}
        <header className="layout-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="badge">Manager</div>
        </header>

        {/* ===== CONTENT ===== */}
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
