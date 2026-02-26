// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — ORGANIZATION SECURITY CONTROL
// Seat-Based Organization Model
// Freedom Upgrade Aware
// No Global Leakage
// Unified Enterprise Advisor System

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearToken,
  clearUser,
  getSavedUser
} from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const user = getSavedUser();

  const [menuOpen, setMenuOpen] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("company.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("company.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const isSeatUser = Boolean(user?.companyId);
  const subscriptionStatus = user?.subscriptionStatus || "Unknown";

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

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

          {/* 🔓 Freedom Upgrade Awareness */}
          {isSeatUser && (
            <>
              <hr style={{ opacity: 0.15 }} />
              <div className="nav-section-label">
                Upgrade Options
              </div>
              <NavLink to="/pricing" onClick={closeMenu}>
                Buy Freedom (Become Independent)
              </NavLink>
            </>
          )}
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

        {/* ===== ADVISOR PANEL ===== */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "company",
                scope: "organization-only",
                seatUser: isSeatUser,
                subscription: subscriptionStatus,
                location: window.location.pathname,
              })}
            />
          </div>
        </aside>
      </div>

      {/* ===== FLOATING TOGGLE ===== */}
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
