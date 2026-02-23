// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Fixed Arrow Logic + Full Navigation Restored

import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { clearToken, clearUser, api } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeCompanyId, setCompany, clearScope } = useCompany();

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [companies, setCompanies] = useState([]);
  const [systemState, setSystemState] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeRef = useRef(null);

  const DRAWER_OPEN_W = 360;
  const DRAWER_CLOSED_W = 28;

  const drawerWidth = advisorOpen ? DRAWER_OPEN_W : DRAWER_CLOSED_W;

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  return (
    <div className="layout-root enterprise">

      {/* ================= SIDEBAR (RESTORED FULL NAV) ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Enterprise Administration
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end>Dashboard</NavLink>
          <NavLink to="assets">Assets</NavLink>
          <NavLink to="threats">Threat Intelligence</NavLink>
          <NavLink to="incidents">Incident Management</NavLink>
          <NavLink to="vulnerabilities">Vulnerability Oversight</NavLink>
          <NavLink to="compliance">Regulatory Compliance</NavLink>
          <NavLink to="reports">Executive Reporting</NavLink>
          <NavLink to="trading">Trading Command</NavLink>
          <NavLink to="global">Global Control</NavLink>
          <NavLink to="notifications">System Notifications</NavLink>

          <hr />

          <div className="nav-section-label">Operational Oversight</div>
          <NavLink to="/manager">Manager Command</NavLink>
          <NavLink to="/company">Corporate Entities</NavLink>
          <NavLink to="/user">User Governance</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div
        className="enterprise-main"
        style={{
          marginRight: isMobile ? 0 : drawerWidth,
          transition: "margin-right .22s ease",
        }}
      >
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>
      </div>

      {/* ================= ADVISOR DOOR ================= */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: drawerWidth,
            transition: "width .22s ease",
            display: "flex",
            borderLeft: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.55))",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
            zIndex: 2000,
          }}
        >
          {/* HANDLE STRIP */}
          <button
            onClick={() => setAdvisorOpen(v => !v)}
            style={{
              width: DRAWER_CLOSED_W,
              minWidth: DRAWER_CLOSED_W,
              height: "100%",
              border: "none",
              background: "rgba(0,0,0,.22)",
              color: "#ffffff",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {/* Arrow indicates direction panel will move */}
            <div style={{ fontSize: 14 }}>
              {advisorOpen ? "→" : "←"}
            </div>

            <div
              style={{
                transform: "rotate(-90deg)",
                fontSize: 11,
                letterSpacing: ".18em",
                fontWeight: 900,
              }}
            >
              ADVISOR
            </div>
          </button>

          {advisorOpen && (
            <div style={{ flex: 1 }}>
              <AuthoDevPanel
                title="Advisor"
                getContext={() => ({
                  role: "admin",
                  scope: activeCompanyId ? "entity" : "global",
                  systemStatus: systemState?.securityStatus,
                })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
