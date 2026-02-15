// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — Institutional Operational SOC (PHASE 3 HARDENED)
//
// FIXES:
// - Relative routing
// - Scroll-safe architecture
// - Proper trading route
// - Stable sidebar
// - Clean navigation
// - Production hardened

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
    <div
      className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}
      style={{ height: "100svh" }}
    >
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className="layout-sidebar manager"
        style={{ overflowY: "auto" }}
      >
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Manager SOC
          </span>
        </div>

        <nav className="layout-nav">

          <NavLink to="." end onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Assets
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Threats
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Incidents
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Reports
          </NavLink>

          {/* 🔥 Trading Access (Manager View) */}
          <NavLink to="/admin/trading" onClick={closeMenu}>
            Trading Oversight
          </NavLink>

          <NavLink to="notifications" onClick={closeMenu}>
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main
        className="layout-main"
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* ================= CONTENT ================= */}
        <section
          className="layout-content"
          style={{
            flex: 1,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </section>

        {/* ================= ADVISOR DRAWER ================= */}
        <section
          className={`ai-drawer ${assistantOpen ? "open" : ""}`}
          aria-hidden={!assistantOpen}
        >
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
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
