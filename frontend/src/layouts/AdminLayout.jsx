// frontend/src/layouts/AdminLayout.jsx
// FINAL Stable Layout — Slim Sidebar + Advisor Push + Clean Scroll

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

      {/* SIDEBAR */}
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
              fontSize:16,
              cursor:"pointer"
            }}
          >
            ☰
          </button>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end className={navClass}><span>Dashboard</span></NavLink>
          <NavLink to="/admin/trading" className={navClass}><span>Internal Trading</span></NavLink>
          <NavLink to="/admin/security" className={navClass}><span>Security</span></NavLink>
          <NavLink to="/admin/reports" className={navClass}><span>Reports</span></NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

      {/* MAIN + ADVISOR */}
      <div className="enterprise-main">

        <div className="layout-main">
          <main className="layout-content">
            <Outlet />
          </main>
        </div>

        {!isMobile && (
          <div
            className="enterprise-ai-panel"
            style={{
              width: advisorOpen ? PANEL_WIDTH : 0
            }}
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

      {/* ADVISOR TOGGLE */}
      {!isMobile && (
        <div
          onClick={() => setAdvisorOpen(v => !v)}
          style={{
            position:"fixed",
            top:"50%",
            right:advisorOpen ? PANEL_WIDTH : 0,
            transform:"translateY(-50%)",
            padding:"12px 6px",
            background:"rgba(0,0,0,.6)",
            borderRadius:"8px 0 0 8px",
            cursor:"pointer",
            fontSize:11,
            letterSpacing:".15em",
            transition:"right .25s ease",
            zIndex:10,
            writingMode:"vertical-rl",
            textOrientation:"mixed",
            userSelect:"none"
          }}
        >
          {advisorOpen ? "◀ ADVISOR" : "ADVISOR ▶"}
        </div>
      )}

    </div>
  );
}
