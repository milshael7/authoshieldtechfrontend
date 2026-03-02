// frontend/src/layouts/AdminLayout.jsx
// Stable Layout — Full Sidebar Restored + Advisor Stable

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

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className={`layout-root enterprise ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

      <aside className="layout-sidebar admin">

        <div style={{
          display:"flex",
          alignItems:"center",
          justifyContent:"space-between"
        }}>
          <Logo size="md" />
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              background:"none",
              border:"none",
              color:"#fff",
              fontSize:18,
              cursor:"pointer"
            }}
          >
            ☰
          </button>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>

          <hr />
          <div className="nav-section-label">Security Command</div>
          <NavLink to="/admin/security" className={navClass}>Security Overview</NavLink>
          <NavLink to="/admin/risk" className={navClass}>Risk Monitor</NavLink>
          <NavLink to="/admin/sessions" className={navClass}>Session Monitor</NavLink>
          <NavLink to="/admin/device-integrity" className={navClass}>Device Integrity</NavLink>
          <NavLink to="/admin/trading" className={navClass}>Internal Trading</NavLink>

          <hr />
          <div className="nav-section-label">Security Modules</div>
          <NavLink to="/admin/assets" className={navClass}>Assets</NavLink>
          <NavLink to="/admin/incidents" className={navClass}>Incident Management</NavLink>
          <NavLink to="/admin/vulnerabilities" className={navClass}>Vulnerability Oversight</NavLink>
          <NavLink to="/admin/compliance" className={navClass}>Regulatory Compliance</NavLink>
          <NavLink to="/admin/reports" className={navClass}>Executive Reporting</NavLink>

          <hr />
          <div className="nav-section-label">Platform Intelligence</div>
          <NavLink to="/admin/audit" className={navClass}>Audit Explorer</NavLink>
          <NavLink to="/admin/global" className={navClass}>Global Control</NavLink>
          <NavLink to="/admin/notifications" className={navClass}>System Notifications</NavLink>

          <hr />
          <div className="nav-section-label">Operational Oversight</div>
          <NavLink to="/admin/companies" className={navClass}>Company Oversight</NavLink>
          <NavLink to="/manager" className={navClass}>Manager Command</NavLink>
          <NavLink to="/company" className={navClass}>Corporate Entities</NavLink>
          <NavLink to="/user" className={navClass}>User Governance</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

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

      {!isMobile && (
        <div
          onClick={() => setAdvisorOpen(v => !v)}
          style={{
            position:"fixed",
            top:"50%",
            right:advisorOpen ? PANEL_WIDTH : 0,
            transform:"translateY(-50%)",
            padding:"14px 8px",
            background:"rgba(0,0,0,.6)",
            borderRadius:"8px 0 0 8px",
            cursor:"pointer",
            fontSize:12,
            letterSpacing:".15em",
            transition:"right .25s ease",
            zIndex:10,
            writingMode:"vertical-rl",
            textOrientation:"mixed"
          }}
        >
          {advisorOpen ? "◀ ADVISOR" : "ADVISOR ▶"}
        </div>
      )}

    </div>
  );
}
