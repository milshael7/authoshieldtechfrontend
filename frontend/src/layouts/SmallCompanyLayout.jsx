// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — Unified Enterprise Advisor Architecture
// Limited Tier Organization
// Same Advisor Body • Different Brain
// Upgrade Path → Full Company (seat-based)

import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, getSavedUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
  const navigate = useNavigate();
  const user = useMemo(() => getSavedUser(), []);

  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 Standardized advisor persistence (match other layouts)
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("small_company.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("small_company.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const subscriptionStatus = user?.subscriptionStatus || "Unknown";

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

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

          {/* ✅ Use /pricing so it always exists (avoid missing "upgrade" route) */}
          <div className="nav-section-label">Upgrade</div>

          <NavLink to="/pricing" className="upgrade-link" onClick={closeMenu}>
            Upgrade to Full Company
          </NavLink>
        </nav>

        <div style={{ padding: "12px 16px", fontSize: 11, opacity: 0.6 }}>
          Subscription: {subscriptionStatus}
        </div>

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
        <aside className={`enterprise-ai-panel ${advisorOpen ? "" : "collapsed"}`}>
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "small_company",
                scope: "organization-only",
                tier: "limited",
                subscription: subscriptionStatus,
                location: window.location.pathname,
              })}
            />
          </div>
        </aside>
      </div>

      {/* FLOATING TOGGLE */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisorOpen((v) => !v)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
