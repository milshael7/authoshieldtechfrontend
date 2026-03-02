// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — Dark Unified v3 (Advisor Rail Unified)

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

  const DRAWER_OPEN_W = 360;
  const drawerWidth = advisorOpen ? DRAWER_OPEN_W : 0;

  return (
    <div
      className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}
      style={{
        background: "#0a0f1c",
        color: "#fff",
      }}
    >
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

      {/* ================= MAIN ================= */}
      <div
        className="enterprise-main"
        style={{
          marginRight: drawerWidth,
          transition: "margin-right .25s ease",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0a0f1c",
        }}
      >
        <main style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </main>
      </div>

      {/* ================= ADVISOR PANEL ================= */}
      <>
        <div
          className={`enterprise-ai-panel ${advisorOpen ? "" : "collapsed"}`}
        >
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

        {/* ================= VERTICAL RAIL ================= */}
        <div
          className="advisor-rail"
          style={{ right: advisorOpen ? DRAWER_OPEN_W : 0 }}
          onClick={() => setAdvisorOpen(v => !v)}
        >
          <div className="advisor-rail-arrow">
            {advisorOpen ? "▶" : "◀"}
          </div>

          <div className="advisor-rail-text">
            ADVISOR
          </div>

          <div className="advisor-rail-arrow">
            {advisorOpen ? "▶" : "◀"}
          </div>
        </div>
      </>
    </div>
  );
}
