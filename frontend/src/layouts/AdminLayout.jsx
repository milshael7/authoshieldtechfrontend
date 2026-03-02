import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
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

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

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

  const navClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

  return (
    <div className={`layout-root ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      {/* FIXED LOGO + OPEN BUTTON */}
      {!isMobile && (
        <div className="brand-corner">
          <Logo size="md" />
          {!sidebarOpen && (
            <button className="brand-open-btn" onClick={() => setSidebarOpen(true)}>
              ☰
            </button>
          )}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="layout-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <div className="sidebar-header-title">ADMIN</div>
            {!isMobile && (
              <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
                ☰
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-body">
          <nav className="layout-nav">
            <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>
            <NavLink to="/admin/security" className={navClass}>Security Overview</NavLink>
            <NavLink to="/admin/risk" className={navClass}>Risk Monitor</NavLink>
            <NavLink to="/admin/trading" className={navClass}>Internal Trading</NavLink>
            <NavLink to="/admin/assets" className={navClass}>Assets</NavLink>
            <NavLink to="/admin/incidents" className={navClass}>Incident Management</NavLink>
            <NavLink to="/admin/reports" className={navClass}>Executive Reporting</NavLink>
          </nav>

          <button className="btn logout-btn" onClick={logout}>
            Secure Log Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="enterprise-main">
        <div className="layout-main">
          <main className="layout-content">
            <Outlet />
          </main>
        </div>

        {!isMobile && (
          <div className="enterprise-ai-panel" style={{ width: advisorOpen ? PANEL_WIDTH : 0 }}>
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus,
                location: window.location.pathname,
              })}
            />
          </div>
        )}
      </div>

      {/* ADVISOR TOGGLE */}
      {!isMobile && (
        <div
          onClick={() => setAdvisorOpen(v => !v)}
          style={{
            position: "fixed",
            top: "50%",
            right: advisorOpen ? PANEL_WIDTH : 0,
            transform: "translateY(-50%)",
            padding: "14px 8px",
            background: "rgba(0,0,0,.6)",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            fontSize: 12,
            letterSpacing: ".15em",
            transition: "right .25s ease",
            zIndex: 10,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
          }}
        >
          {advisorOpen ? "◀ ADVISOR" : "ADVISOR ▶"}
        </div>
      )}
    </div>
  );
}
