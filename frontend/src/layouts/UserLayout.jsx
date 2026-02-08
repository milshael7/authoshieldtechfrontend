// frontend/src/layouts/UserLayout.jsx
// STEP 32 — Sliding AI Panel Shell (User)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import AuthoDevPanel from "../components/AuthoDevPanel";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className={`layout-root ${open ? "sidebar-open" : ""}`}>
      {/* ---------- Mobile Overlay ---------- */}
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ---------- Sidebar ---------- */}
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <span className="brand-logo">👤</span>
          <span className="brand-text">User</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user" end onClick={() => setOpen(false)}>
            Overview
          </NavLink>
          <NavLink to="/user/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        {/* ---------- Topbar ---------- */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0 }}>User Dashboard</h1>
          </div>

          <div className="topbar-right">
            <button
              className="btn"
              onClick={() => setAiOpen((v) => !v)}
              title="Toggle AI Assistant"
            >
              🤖 AI
            </button>
            <span className="badge">User</span>
          </div>
        </header>

        {/* ---------- Page Content ---------- */}
        <section className="layout-content">
          <Outlet />
        </section>

        {/* ---------- Sliding AI Panel ---------- */}
        <section
          className={`ai-drawer ${aiOpen ? "open" : ""}`}
          aria-hidden={!aiOpen}
        >
          <div className="ai-drawer-handle">
            <button
              className="ai-toggle"
              onClick={() => setAiOpen((v) => !v)}
            >
              {aiOpen ? "▼ Hide Assistant" : "▲ Show Assistant"}
            </button>
          </div>

          <div className="ai-drawer-body">
            <AuthoDevPanel
              title="AuthoDev 6.5 — Assistant"
              getContext={() => ({
                role: "user",
                room: "user",
              })}
            />
          </div>
        </section>
      </main>

      {/* ---------- Local Styles ---------- */}
      <style>{`
        .ai-drawer {
          position: sticky;
          bottom: 0;
          width: 100%;
          background: rgba(10, 14, 22, 0.98);
          border-top: 1px solid rgba(255,255,255,.12);
          transition: transform .35s ease;
          transform: translateY(calc(100% - 48px));
          z-index: 20;
        }

        .ai-drawer.open {
          transform: translateY(0);
        }

        .ai-drawer-handle {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid rgba(255,255,255,.08);
        }

        .ai-toggle {
          background: none;
          border: none;
          font-weight: 700;
          color: #7aa2ff;
          cursor: pointer;
        }

        .ai-drawer-body {
          height: min(70vh, 520px);
          padding: 12px;
          overflow: hidden;
        }

        @media (min-width: 900px) {
          .ai-drawer-body {
            height: 420px;
          }
        }
      `}</style>
    </div>
  );
}
