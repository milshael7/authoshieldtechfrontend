// frontend/src/layouts/AdminLayout.jsx
// PROPER SLIDE SIDEBAR + FIXED LOGO

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, getSavedUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

const PANEL_WIDTH = 380;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const { systemStatus } = useSecurity();
  const user = getSavedUser();

  const [advisorOpen, setAdvisorOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className={`layout-root ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

      {/* SIDEBAR */}
      <aside className="layout-sidebar">

        <div className="sidebar-header">
          <Logo size="md" />
        </div>

        <div className="sidebar-body">
          <nav className="layout-nav">
            <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/admin/security" className={navClass}>Security Overview</NavLink>
            <NavLink to="/admin/trading" className={navClass}>Internal Trading</NavLink>
            <NavLink to="/admin/reports" className={navClass}>Executive Reporting</NavLink>
          </nav>

          <button className="btn logout-btn" onClick={logout}>
            Secure Log Out
          </button>
        </div>
      </aside>

      {/* TOGGLE TAB */}
      <div
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(v => !v)}
      >
        {sidebarOpen ? "◀" : "▶"}
      </div>

      {/* MAIN */}
      <div className="enterprise-main">

        <div className="layout-main">
          <main className="layout-content">
            <Outlet />
          </main>
        </div>

        {!isMobile && (
          <div
            className="enterprise-ai-panel"
            style={{ width: advisorOpen ? PANEL_WIDTH : 0 }}
          >
            <AuthoDevPanel title="Advisor" />
          </div>
        )}
      </div>

    </div>
  );
}
