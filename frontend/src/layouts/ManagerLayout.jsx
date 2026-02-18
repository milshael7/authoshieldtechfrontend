// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — MULTI-COMPANY OPERATIONAL CONSOLE
// Enforcement visibility layer
// Admin supersedes Manager
// No override authority

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function ManagerLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);
  const [oversightOpen, setOversightOpen] = useState(true);

  /* ================= ADVISOR STATE ================= */

  useEffect(() => {
    try {
      const raw = localStorage.getItem("as_manager_advisor_open");
      if (raw === "0") setAdvisorOpen(false);
    } catch {}
  }, []);

  function setAdvisor(next) {
    setAdvisorOpen(next);
    try {
      localStorage.setItem("as_manager_advisor_open", next ? "1" : "0");
    } catch {}
  }

  /* ================= LOGOUT ================= */

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  /* ================= UI ================= */

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Operational Oversight Console
          </span>
        </div>

        <nav className="layout-nav">

          {/* ===== GLOBAL MONITORING ===== */}
          <div className="nav-section-label">
            Global Monitoring
          </div>

          <NavLink to="." end onClick={closeMenu}>
            Global Posture
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Global Assets
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Threat Intelligence
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Incident Oversight
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance View
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Operational Reports
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== ENTITY OVERSIGHT ===== */}
          <div
            className="nav-section-label clickable"
            onClick={() => setOversightOpen(v => !v)}
          >
            Entity Oversight {oversightOpen ? "▾" : "▸"}
          </div>

          {oversightOpen && (
            <>
              <NavLink to="/company" onClick={closeMenu}>
                All Companies
              </NavLink>

              <NavLink to="/small-company" onClick={closeMenu}>
                Small Companies
              </NavLink>

              <NavLink to="/user" onClick={closeMenu}>
                Individuals
              </NavLink>

              <NavLink to="/admin/global" onClick={closeMenu}>
                Approval Queue (Admin Review)
              </NavLink>
            </>
          )}

          <hr style={{ opacity: 0.18 }} />

          {/* ===== TRADING ===== */}
          <div className="nav-section-label">
            Trading Oversight
          </div>

          <NavLink to="trading" onClick={closeMenu}>
            Market Activity
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== NOTIFICATIONS ===== */}
          <NavLink to="notifications" onClick={closeMenu}>
            System Notifications
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

        {/* ===== ADVISOR PANEL ===== */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "open" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title=""
              getContext={() => ({
                role: "manager",
                location: window.location.pathname,
                scope: "multi-company-oversight",
                authority: "approval-visible-no-override",
              })}
            />
          </div>
        </aside>
      </div>

      {/* ===== FLOATING TOGGLE ===== */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisor(!advisorOpen)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "AuthoShield Advisor"}
      </button>
    </div>
  );
}
