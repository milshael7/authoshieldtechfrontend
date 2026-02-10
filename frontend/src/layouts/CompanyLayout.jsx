// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — SOC Visibility Baseline (PHASE 1 CLEAN)
//
// RULES ENFORCED:
// - NO topbar (handled globally)
// - Sidebar + content only
// - Scroll-safe
// - Advisory-only assistant
// - No AI branding text

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
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Company Visibility
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/company" end onClick={() => setMenuOpen(false)}>
            Security Overview
          </NavLink>

          <NavLink to="/company/assets" onClick={() => setMenuOpen(false)}>
            Assets
          </NavLink>

          <NavLink to="/company/threats" onClick={() => setMenuOpen(false)}>
            Threats
          </NavLink>

          <NavLink to="/company/incidents" onClick={() => setMenuOpen(false)}>
            Incidents
          </NavLink>

          <NavLink to="/company/reports" onClick={() => setMenuOpen(false)}>
            Reports
          </NavLink>

          <NavLink
            to="/company/notifications"
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
        {/* ================= CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= ADVISOR (VISIBILITY ONLY) ================= */}
        <section
          className={`ai-drawer ${advisorOpen ? "open" : ""}`}
          aria-hidden={!advisorOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAdvisorOpen(v => !v)}
            >
              {advisorOpen
                ? "▼ Hide Advisor"
                : "▲ Show Security Advisor"}
            </button>
          </div>

          <div
            className="ai-drawer-body"
            style={{ overflow: "auto" }} // 🔑 FIX: allow scroll + input
          >
            <AuthoDevPanel
              title="Security Advisor"
              getContext={() => ({
                role: "company",
                mode: "advisory",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
