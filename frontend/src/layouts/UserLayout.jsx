// frontend/src/layouts/UserLayout.jsx
// User Layout — SOC Baseline (PHASE 1 CLEAN)
//
// RULES:
// - No layout-level topbar
// - Scroll-safe content
// - Advisory-only assistant
// - Structural parity with Admin / Manager / Company

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

  return (
    <div className={`layout-root ${menuOpen ? "sidebar-open" : ""}`}>
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <Logo size="sm" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            User Portal
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user" end onClick={() => setMenuOpen(false)}>
            Overview
          </NavLink>

          <NavLink
            to="/user/notifications"
            onClick={() => setMenuOpen(false)}
          >
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <main className="layout-main">
        {/* ================= CONTENT ================= */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ================= ASSISTANT ================= */}
        <section
          className={`ai-drawer ${assistantOpen ? "open" : ""}`}
          aria-hidden={!assistantOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAssistantOpen(v => !v)}
            >
              {assistantOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div
            className="ai-drawer-body"
            style={{ overflow: "auto" }}  // 🔑 SCROLL FIX
          >
            <AuthoDevPanel
              title="Security Assistant"
              getContext={() => ({
                role: "user",
                scope: "individual",
                permissions: "advisory-only",
                location: window.location.pathname,
              })}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
