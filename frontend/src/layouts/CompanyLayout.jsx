// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — ORGANIZATION SECURITY CONTROL
// Company-level visibility only
// No global leakage
// Clean SOC structure
// Phase 2 architecture lock

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);

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
      <aside className="layout-sidebar company">

        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Company Security
          </span>
        </div>

        <nav className="layout-nav">

          <NavLink to="." end onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Asset Inventory
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Threat Monitoring
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Incident Response
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Vulnerability Management
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance Status
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Reports
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
      <main className="layout-main">

        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= SECURITY ADVISOR ================= */}
        <section className={`ai-drawer ${advisorOpen ? "open" : ""}`}>

          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAdvisorOpen(v => !v)}
            >
              {advisorOpen ? "▼ Hide Advisor" : "▲ Show Security Advisor"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="Company Security Advisor"
              getContext={() => ({
                role: "company",
                scope: "organization-only",
                location: window.location.pathname,
              })}
            />
          </div>

        </section>

      </main>
    </div>
  );
}
