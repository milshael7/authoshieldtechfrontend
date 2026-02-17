// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — GLOBAL OPERATIONAL OVERSIGHT
// Admin > Manager hierarchy respected
// Sticky Advisor Dock
// No override authority
// Clean enterprise structure

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

  // Persist advisor state
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
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Manager Operational Oversight
          </span>
        </div>

        <nav className="layout-nav">

          {/* ===== GLOBAL MONITORING ===== */}
          <NavLink to="." end onClick={closeMenu}>
            Global Posture
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Global Assets
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Global Threats
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Global Incidents
          </NavLink>

          <NavLink to="vulnerabilities" onClick={closeMenu}>
            Global Vulnerabilities
          </NavLink>

          <NavLink to="compliance" onClick={closeMenu}>
            Compliance Oversight
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Operational Reports
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== TRADING (Oversight Only) ===== */}
          <NavLink to="trading" onClick={closeMenu}>
            Trading Oversight
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

        {/* Sticky Advisor Dock */}
        <aside className={`enterprise-ai-panel ${advisorOpen ? "open" : "collapsed"}`}>
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title=""
              getContext={() => ({
                role: "manager",
                location: window.location.pathname,
                scope: "global-oversight",
                authority: "no-override",
              })}
            />
          </div>
        </aside>
      </div>

      {/* Floating Toggle */}
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
