import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";

export default function ManagerLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className="platformShell">
      {/* Sidebar */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">Manager View</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/manager/overview">Overview</NavLink>
          <NavLink to="/manager/companies">Companies</NavLink>
          <NavLink to="/manager/users">Users</NavLink>
          <NavLink to="/manager/posture">Security Posture</NavLink>
          <NavLink to="/manager/audit">Audit Logs</NavLink>
          <NavLink to="/manager/notifications">Notifications</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* Main */}
      <main className="layout-main">
        {/* Top Bar */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <h1>Manager Oversight Room</h1>
          </div>

          <div className="topbar-right">
            <span className="role-badge manager">Read-Only</span>
          </div>
        </header>

        {/* Content */}
        <section className="layout-content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
