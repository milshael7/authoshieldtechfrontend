import React, { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/layout.css";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);

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
          <strong>AutoShield</strong>
          <span>Admin Console</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end onClick={() => setOpen(false)}>
            Global Security
          </NavLink>
          <NavLink to="/admin/trading" onClick={() => setOpen(false)}>
            Trading
          </NavLink>
          <NavLink to="/manager" onClick={() => setOpen(false)}>
            Manager View
          </NavLink>
          <NavLink to="/company" onClick={() => setOpen(false)}>
            Company View
          </NavLink>
          <NavLink to="/admin/notifications" onClick={() => setOpen(false)}>
            Notifications
          </NavLink>
        </nav>
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

            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          </div>

          <div className="topbar-right">
            <span className="badge">Admin</span>
          </div>
        </header>

        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
