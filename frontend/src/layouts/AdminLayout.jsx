// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — Enterprise Locked Dock Version (FINAL FIX)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [advisorOpen, setAdvisorOpen] = useState(true);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${advisorOpen ? "advisor-open" : "advisor-closed"}`}>
      
      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Admin Control
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end>Security Posture</NavLink>
          <NavLink to="assets">Assets</NavLink>
          <NavLink to="threats">Threats</NavLink>
          <NavLink to="incidents">Incidents</NavLink>
          <NavLink to="vulnerabilities">Vulnerabilities</NavLink>
          <NavLink to="vulnerability-center">Vulnerability Center</NavLink>
          <NavLink to="compliance">Compliance</NavLink>
          <NavLink to="policies">Policies</NavLink>
          <NavLink to="reports">Reports</NavLink>
          <NavLink to="trading">Trading Command</NavLink>
          <NavLink to="notifications">Notifications</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        <section className="layout-content">
          <Outlet />
        </section>
      </main>

      {/* ================= OPEN BUTTON (ONLY WHEN CLOSED) ================= */}
      {!advisorOpen && (
        <button
          className="advisor-open-button"
          onClick={() => setAdvisorOpen(true)}
        >
          AuthoShield Advisor
        </button>
      )}

      {/* ================= FIXED ADVISOR PANEL ================= */}
      {advisorOpen && (
        <aside className="enterprise-ai-panel">
          
          <div className="advisor-topbar">
            <button
              className="advisor-close-button"
              onClick={() => setAdvisorOpen(false)}
            >
              ✕
            </button>
          </div>

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

        </aside>
      )}

    </div>
  );
}
