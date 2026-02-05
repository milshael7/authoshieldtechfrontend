// frontend/src/layouts/UserLayout.jsx
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

export default function UserLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className="layout-root">
      {/* Sidebar */}
      <aside className="layout-sidebar">
        <div className="layout-brand">
          <span className="brand-logo">🛡️</span>
          <span className="brand-text">AutoShield</span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/user/dashboard">Dashboard</NavLink>
          <NavLink to="/user/posture">Security Posture</NavLink>
          <NavLink to="/user/projects">AutoProtect</NavLink>
          <NavLink to="/user/notifications">Notifications</NavLink>
          <NavLink to="/user/settings">Settings</NavLink>
        </nav>

        <button className="logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* Main Content */}
      <main className="layout-main">
        {/* Top Bar */}
        <header className="layout-topbar">
          <div className="topbar-left">
            <h1>User Security Room</h1>
          </div>
          <div className="topbar-right">
            <span className="role-badge user">Individual</span>
          </div>
        </header>

        {/* Page Content */}
        <section className="layout-content">
          <Outlet />
        </section>
      </main>
