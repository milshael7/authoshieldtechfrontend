// frontend/src/layouts/UserLayout.jsx
// Individual User Layout — Personal Security Workspace
// Scoped to single user only
// No organizational controls
// Advisory assistant only
// Architecture aligned

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>

      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeMenu}
        />
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

        {/* ================= ASSISTANT ================= */}
        <section className={`ai-drawer ${assistantOpen ? "open" : ""}`}>

          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen(v => !v)}
            >
              {assistantOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body" style={{ overflow: "auto" }}>
            <AuthoDevPanel
              title="Personal Security Assistant"
              getContext={() => ({
                role: "user",
                scope: "individual-only",
                access: "no-global-visibility",
                location: window.location.pathname,
              })}
            />
          </div>

        </section>

      </main>
    </div>
  );
}
