import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">AutoShield</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user" end onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/user/posture" onClick={() => setOpen(false)}>
            Security Posture
          </NavLink>
          <NavLink to="/user/projects" onClick={() => setOpen(false)}>
            AutoProtect
          </NavLink>
          <NavLink to="/user/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
          <NavLink to="/user/settings" onClick={() => setOpen(false)}>
            Settings
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ---------- Main ---------- */}
      <main className="layout-main">
        <header className="layout-topbar">
          <div className="topbar-left">
            <button
              className="btn btn-icon mobile-menu-btn"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>

            <h1 style={{ margin: 0 }}>User Security Room</h1>
          </div>

          <div className="topbar-right">
            <span className="badge">Individual</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
