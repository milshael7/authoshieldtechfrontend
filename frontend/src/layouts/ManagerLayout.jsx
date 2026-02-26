// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — MULTI-COMPANY OPERATIONAL CONSOLE
// Enforcement visibility layer
// Admin supersedes Manager
// Trading = INTERNAL ONLY (Admin + Manager)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function ManagerLayout() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [oversightOpen, setOversightOpen] = useState(true);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("manager.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("manager.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

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

          <NavLink to="." end className={navClass} onClick={closeMenu}>
            Global Posture
          </NavLink>

          <NavLink to="assets" className={navClass} onClick={closeMenu}>
            Global Assets
          </NavLink>

          <NavLink to="threats" className={navClass} onClick={closeMenu}>
            Threat Intelligence
          </NavLink>

          <NavLink to="incidents" className={navClass} onClick={closeMenu}>
            Incident Oversight
          </NavLink>

          <NavLink to="vulnerabilities" className={navClass} onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="compliance" className={navClass} onClick={closeMenu}>
            Compliance View
          </NavLink>

          <NavLink to="reports" className={navClass} onClick={closeMenu}>
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
              {/* Cross-scope navigation intentionally absolute */}
              <NavLink to="/company" className={navClass} onClick={closeMenu}>
                All Companies
              </NavLink>

              <NavLink to="/small-company" className={navClass} onClick={closeMenu}>
                Small Companies
              </NavLink>

              <NavLink to="/user" className={navClass} onClick={closeMenu}>
                Individuals
              </NavLink>

              <NavLink to="/admin/global" className={navClass} onClick={closeMenu}>
                Approval Queue (Admin Review)
              </NavLink>
            </>
          )}

          <hr style={{ opacity: 0.18 }} />

          {/* ===== INTERNAL TRADING ===== */}
          <div className="nav-section-label">
            Internal Trading
          </div>

          <NavLink to="trading" className={navClass} onClick={closeMenu}>
            Market Activity
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          {/* ===== NOTIFICATIONS ===== */}
          <NavLink to="notifications" className={navClass} onClick={closeMenu}>
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
            advisorOpen ? "" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
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
        onClick={() => setAdvisorOpen(v => !v)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
