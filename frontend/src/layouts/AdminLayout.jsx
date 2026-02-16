// frontend/src/layouts/AdminLayout.jsx
// Admin Layout — Enterprise SOC Architecture (FINAL STABLE)
// Collapsible Right AuthoShield Advisor Dock
// Production Ready

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
    <div className="layout-root enterprise">
      
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

          <hr style={{ opacity: 0.18 }} />

          <NavLink to="/manager">Manager Global View</NavLink>
          <NavLink to="/company">Company Global View</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN + AI ================= */}
      <div className="enterprise-main">

        {/* CENTER CONTENT */}
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* RIGHT AI DOCK */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "open" : "collapsed"
          }`}
        >
          {/* Toggle Button */}
          <button
            className="advisor-tab"
            onClick={() => setAdvisorOpen((v) => !v)}
            title={advisorOpen ? "Collapse Advisor" : "Open AuthoShield Advisor"}
          >
            {advisorOpen ? "‹" : "AuthoShield Advisor"}
          </button>

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

      </div>
    </div>
  );
}
