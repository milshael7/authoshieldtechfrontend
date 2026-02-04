import React from "react";
import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="admin-shell">
      {/* ---------- Top Bar ---------- */}
      <header className="admin-top">
        <div className="brand">
          <strong>AutoShield</strong>
          <span>Admin Console</span>
        </div>

        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Global Security
          </NavLink>

          <NavLink to="/admin/trading">
            Trading
          </NavLink>

          <NavLink to="/manager">
            Manager View
          </NavLink>

          <NavLink to="/company">
            Company View
          </NavLink>

          <NavLink to="/admin/notifications">
            Notifications
          </NavLink>
        </nav>
      </header>

      {/* ---------- Main Body ---------- */}
      <main className="admin-body">
        <Outlet />
      </main>
    </div>
  );
}
