// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — FULL SOC CONTROL (PHASE 4 HARDENED)
// Includes Vulnerability Center
// Scroll-safe
// Clean navigation
// Production ready

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
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
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Admin SOC
          </span>
        </div>

        <nav className="layout-nav">

          <NavLink to="." end onClick={closeMenu}>
            Security Posture
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Assets & Inventory
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

          {/* 🔥 NEW */}
          <NavLink to="vulnerability-center" onClick={closeMenu}>
            Vulnerability Center
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance
          </NavLink>

          <NavLink to="policies" onClick={closeMenu}>
            Policies
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Reports
          </NavLink>

          <NavLink to="trading" onClick={closeMenu}>
            Trading Command
          </NavLink>

          <NavLink to="notifications" onClick={closeMenu}>
            Notifications
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          <NavLink to="/manager" onClick={closeMenu}>
            Manager View
          </NavLink>

          <NavLink to="/company" onClick={closeMenu}>
            Company View
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

        {/* ================= ADVISOR ================= */}
        <section
          className={`ai-drawer ${assistantOpen ? "open" : ""}`}
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
              title="Security Advisor"
              getContext={() => ({
                role: "admin",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
