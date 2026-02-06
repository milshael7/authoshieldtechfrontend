import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

export default function ManagerLayout() {
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
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">Manager View</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/manager" end onClick={() => setOpen(false)}>
            Overview
          </NavLink>
          <NavLink to="/manager/companies" onClick={() => setOpen(false)}>
            Companies
          </NavLink>
          <NavLink to="/manager/users" onClick={() => setOpen(false)}>
            Users
          </NavLink>
          <NavLink to="/manager/posture" onClick={() => setOpen(false)}>
            Security Posture
          </NavLink>
          <NavLink to="/manager/audit" onClick={() => setOpen(false)}>
            Audit Logs
          </NavLink>
          <NavLink to="/manager/notifications" onClick={() => setOpen(false)}>
            Notifications
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

            <h1 style={{ margin: 0 }}>Manager Oversight Room</h1>
          </div>

          <div className="topbar-right">
            <span className="badge">Read-only</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
