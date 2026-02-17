// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — Enterprise SOC Architecture (FINAL)
// Right Advisor dock: STICKY (doesn't move)
// Only message feed scrolls (ChatGPT-style)
// Collapsible: when closed, panel is truly gone (content expands)
// Top-right Advisor button/tab (not in the middle)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // ✅ Advisor dock open/close (persisted)
  const [advisorOpen, setAdvisorOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("as_advisor_open");
      if (raw === "0") setAdvisorOpen(false);
    } catch {}
  }, []);

  function setAdvisor(next) {
    setAdvisorOpen(next);
    try {
      localStorage.setItem("as_advisor_open", next ? "1" : "0");
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
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Admin Control
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end onClick={closeMenu}>Security Posture</NavLink>
          <NavLink to="assets" onClick={closeMenu}>Assets</NavLink>
          <NavLink to="threats" onClick={closeMenu}>Threats</NavLink>
          <NavLink to="incidents" onClick={closeMenu}>Incidents</NavLink>
          <NavLink to="vulnerabilities" onClick={closeMenu}>Vulnerabilities</NavLink>
          <NavLink to="vulnerability-center" onClick={closeMenu}>Vulnerability Center</NavLink>
          <NavLink to="compliance" onClick={closeMenu}>Compliance</NavLink>
          <NavLink to="policies" onClick={closeMenu}>Policies</NavLink>
          <NavLink to="reports" onClick={closeMenu}>Reports</NavLink>
          <NavLink to="trading" onClick={closeMenu}>Trading Command</NavLink>
          <NavLink to="notifications" onClick={closeMenu}>Notifications</NavLink>

          <hr style={{ opacity: 0.18 }} />

          <NavLink to="/manager" onClick={closeMenu}>Manager Global View</NavLink>
          <NavLink to="/company" onClick={closeMenu}>Company Global View</NavLink>
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

        {/* ✅ Dock exists in layout, but truly collapses to width:0 */}
        <aside className={`enterprise-ai-panel ${advisorOpen ? "open" : "collapsed"}`}>
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="" // no big header title
              getContext={() => ({
                role: "admin",
                location: window.location.pathname,
                scope: "global-visibility",
                access: "full-control",
              })}
            />
          </div>
        </aside>
      </div>

      {/* ✅ TOP-RIGHT TAB (always reachable, not covering your tools) */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisor(!advisorOpen)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
        aria-label={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "AuthoShield Advisor"}
      </button>
    </div>
  );
