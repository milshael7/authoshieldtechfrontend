// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — Enterprise SOC Architecture (POLISHED)
// Professional collapsible AUTHOSHIELD Advisory dock
// Stable scroll / fixed input
// Production ready

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // AI Dock State
  const [advisorOpen, setAdvisorOpen] = useState(true);

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

        {/* CENTER CONTENT */}
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* RIGHT ADVISOR DOCK */}
        <aside className={`enterprise-ai-panel ${advisorOpen ? "open" : "collapsed"}`}>

          {/* TOP HEADER — CLICK TO OPEN/CLOSE */}
          <div
            className="enterprise-ai-header"
            onClick={() => setAdvisorOpen(v => !v)}
            title={advisorOpen ? "Collapse Advisory Panel" : "Open Advisory Panel"}
          >
            <span className="enterprise-ai-title">
              AUTHOSHIELD Advisory
            </span>

            <span className="enterprise-ai-toggle">
              {advisorOpen ? "›" : "‹"}
            </span>
          </div>

          {/* PANEL BODY */}
          {advisorOpen && (
            <div className="enterprise-ai-inner">
              <AuthoDevPanel
                title=""
                getContext={() => ({
                  role: "admin",
                  location: window.location.pathname,
                  access: "full-control",
                  scope: "global-visibility",
                })}
              />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
