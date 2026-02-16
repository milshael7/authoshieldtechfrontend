// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — LIMITED ORGANIZATION CONTROL
// Scoped to small-company permissions
// No global visibility
// Upgrade path preserved
// Phase 2 architecture lock

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
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
      <aside className="layout-sidebar small-company">

        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Small Company Security
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
            Incident Tracking
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Basic Reports
          </NavLink>

          <hr style={{ opacity: 0.2 }} />

          <NavLink
            to="upgrade"
            className="upgrade-link"
            onClick={closeMenu}
          >
            Upgrade to Full Company
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
              {advisorOpen
                ? "▼ Hide Security Insights"
                : "▲ Show Security Insights"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="Small Company Security Insights"
              getContext={() => ({
                role: "small_company",
                scope: "organization-only",
                tier: "limited",
                location: window.location.pathname,
              })}
            />
          </div>

        </section>

      </main>
    </div>
  );
}
