// frontend/src/layouts/AdminLayout.jsx
// TRUE PUSH LAYOUT VERSION (No Overlay)

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

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

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
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

      {/* HEADER */}
      <div
        style={{
          height: 70,
          background: "#0b0f1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 18px",
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

      {/* BODY ROW */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        <div
          style={{
            width: sidebarOpen ? SIDEBAR_WIDTH : 0,
            transition: "width .28s ease",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.55))",
            borderRight: sidebarOpen
              ? "1px solid rgba(255,255,255,.08)"
              : "none",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {sidebarOpen && (
            <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
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
            </div>
          )}
        </div>

        {/* CENTER CONTENT */}
        <div
          style={{
            flex: 1,
            transition: "all .28s ease",
            display: "flex",
            justifyContent: "center",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1400,
              padding: 20,
              overflowY: "auto"
            }}
          >
            <Outlet />
          </div>
        </div>

        {/* RIGHT ADVISOR */}
        <div
          style={{
            width: advisorOpen ? ADVISOR_WIDTH : 0,
            transition: "width .28s ease",
            overflow: "hidden",
            borderLeft: advisorOpen
              ? "1px solid rgba(255,255,255,.05)"
              : "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.45))",
            display: "flex"
          }}
        >
          {advisorOpen && (
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus,
                location: window.location.pathname
              })}
            />
          )}
        </div>

      </div>

      {/* ADVISOR TOGGLE */}
      <div
        onClick={() => setAdvisorOpen(!advisorOpen)}
        style={{
          position: "absolute",
          right: advisorOpen ? ADVISOR_WIDTH : 0,
          top: "50%",
          transform: "translateY(-50%)",
          padding: "14px 8px",
          background: "rgba(0,0,0,.6)",
          borderRadius: "8px 0 0 8px",
          cursor: "pointer",
          fontSize: 12,
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transition: "right .28s ease"
        }}
      >
        {advisorOpen ? "ADVISOR ▶" : "◀ ADVISOR"}
      </div>

    </div>
  );
}
