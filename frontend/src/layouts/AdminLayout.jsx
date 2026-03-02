// frontend/src/layouts/AdminLayout.jsx
// MOBILE SAFE + DESKTOP STABLE VERSION

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

const SIDEBAR_WIDTH = 260;
const ADVISOR_WIDTH = 380;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const { systemStatus } = useSecurity();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className="layout-root">

      {/* ================= FIXED HEADER (PHONE FRIENDLY) ================= */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 70,
          background: "#0b0f1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
          zIndex: 100,
          borderBottom: "1px solid rgba(255,255,255,.05)"
        }}
      >
        <Logo size="md" />

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            background: "transparent",
            border: "none",
            color: "#eaf1ff",
            fontSize: 22,
            cursor: "pointer"
          }}
        >
          ☰
        </button>
      </div>

      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          position: isMobile ? "fixed" : "relative",
          top: isMobile ? 70 : 0,
          left: 0,
          height: isMobile ? "calc(100vh - 70px)" : "100vh",
          width: SIDEBAR_WIDTH,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.55))",
          borderRight: "1px solid rgba(255,255,255,.08)",
          backdropFilter: "blur(10px)",
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .28s ease",
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          padding: 18,
          overflowY: "auto"
        }}
      >
        <nav className="layout-nav">
          <NavLink to="/admin" end className={navClass}>Dashboard</NavLink>

          <NavLink to="/admin/security" className={navClass}>Security Overview</NavLink>
          <NavLink to="/admin/risk" className={navClass}>Risk Monitor</NavLink>
          <NavLink to="/admin/sessions" className={navClass}>Session Monitor</NavLink>
          <NavLink to="/admin/device-integrity" className={navClass}>Device Integrity</NavLink>
          <NavLink to="/admin/trading" className={navClass}>Internal Trading</NavLink>

          <NavLink to="/admin/assets" className={navClass}>Assets</NavLink>
          <NavLink to="/admin/incidents" className={navClass}>Incident Management</NavLink>
          <NavLink to="/admin/vulnerabilities" className={navClass}>Vulnerability Oversight</NavLink>
          <NavLink to="/admin/compliance" className={navClass}>Regulatory Compliance</NavLink>
          <NavLink to="/admin/reports" className={navClass}>Executive Reporting</NavLink>

          <NavLink to="/admin/audit" className={navClass}>Audit Explorer</NavLink>
          <NavLink to="/admin/global" className={navClass}>Global Control</NavLink>
          <NavLink to="/admin/notifications" className={navClass}>System Notifications</NavLink>

          <NavLink to="/admin/companies" className={navClass}>Company Oversight</NavLink>
          <NavLink to="/manager" className={navClass}>Manager Command</NavLink>
          <NavLink to="/company" className={navClass}>Corporate Entities</NavLink>
          <NavLink to="/user" className={navClass}>User Governance</NavLink>

          <button
            onClick={logout}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer"
            }}
          >
            Secure Log Out
          </button>
        </nav>
      </aside>

      {/* ================= MAIN ================= */}
      <div
        style={{
          flex: 1,
          marginTop: 70,
          display: "flex",
          overflow: "hidden"
        }}
      >
        <main
          style={{
            flex: 1,
            padding: 20,
            overflowY: "auto"
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            <Outlet />
          </div>
        </main>

        {/* Advisor hidden automatically on phone */}
        {!isMobile && (
          <div
            style={{
              width: advisorOpen ? ADVISOR_WIDTH : 0,
              transition: "width .25s ease",
              overflow: "hidden",
              borderLeft: "1px solid rgba(255,255,255,.05)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.45))"
            }}
          >
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus,
                location: window.location.pathname
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
