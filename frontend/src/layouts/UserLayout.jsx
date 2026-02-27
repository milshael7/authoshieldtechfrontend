// frontend/src/layouts/UserLayout.jsx
// Individual User Layout — Context Aligned v2
// Single Source of Truth • Drift Eliminated • Clean Logout

import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useTools } from "../pages/tools/ToolContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function UserLayout() {
  const { user } = useTools(); // 🔥 single source of truth

  const [menuOpen, setMenuOpen] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("user.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("user.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    window.location.replace("/login"); // 🔥 full rehydrate
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const subscriptionStatus = user?.subscriptionStatus || "Unknown";
  const freedomEnabled = !!user?.freedomEnabled;
  const autoprotectEnabled = !!user?.autoprotectEnabled;

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && (
        <div className="sidebar-overlay" onClick={closeMenu} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <Logo size="sm" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Personal Security
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="notifications" onClick={closeMenu}>
            Notifications
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            My Reports
          </NavLink>

          <hr style={{ opacity: 0.15 }} />

          <div className="nav-section-label">
            Managed Companies
          </div>

          <NavLink to="managed" onClick={closeMenu}>
            My External Companies (Max 10)
          </NavLink>

          {!freedomEnabled && (
            <NavLink to="/pricing" onClick={closeMenu}>
              Activate Freedom
            </NavLink>
          )}

          {freedomEnabled && (
            <NavLink to="autoprotect" onClick={closeMenu}>
              Autoprotect (Autodev 6.5)
            </NavLink>
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

        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "individual",
                scope: "individual-control",
                freedom: freedomEnabled,
                autoprotect: autoprotectEnabled,
                subscription: subscriptionStatus,
                location: window.location.pathname,
              })}
            />
          </div>
        </aside>
      </div>

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
