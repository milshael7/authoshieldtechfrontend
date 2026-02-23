// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — Unified Enterprise Advisor Architecture
// Limited Tier Organization
// Same Advisor Body • Different Brain

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 Standardized advisor persistence
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("smallcompany.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("smallcompany.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
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

      {/* ================= MAIN + ADVISOR ================= */}
      <div className="enterprise-main">
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* RIGHT ADVISOR DOCK */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "small_company",
                scope: "organization-only",
                tier: "limited",
                location: window.location.pathname,
              })}
            />
          </div>
        </aside>
      </div>

      {/* FLOATING TOGGLE */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisorOpen(v => !v)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
