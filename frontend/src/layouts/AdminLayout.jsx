// frontend/src/layouts/AdminLayout.jsx

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import SystemStatusIndicator from "../components/SystemStatusIndicator.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [systemState, setSystemState] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  const DRAWER_OPEN_W = 360;
  const DRAWER_CLOSED_W = 26;
  const drawerWidth = advisorOpen ? DRAWER_OPEN_W : DRAWER_CLOSED_W;

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ================= SAFE SAME-ORIGIN HEALTH ================= */

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch("/health");
        const data = await res.json();
        setSystemState(data.systemState || null);
      } catch {
        setSystemState(null);
      }
    }
    loadHealth();
  }, []);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className="layout-root enterprise">
      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Enterprise Administration
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end className={navClass}>
            Dashboard
          </NavLink>

          <hr />

          <div className="nav-section-label">Security Command</div>

          <NavLink to="security" className={navClass}>
            Security Overview
          </NavLink>

          <NavLink to="risk" className={navClass}>
            Risk Monitor
          </NavLink>

          <NavLink to="sessions" className={navClass}>
            Session Monitor
          </NavLink>

          <NavLink to="device-integrity" className={navClass}>
            Device Integrity
          </NavLink>

          {/* 🔥 INTERNAL TRADING */}
          <NavLink to="trading" className={navClass}>
            Internal Trading
          </NavLink>

          <hr />

          <div className="nav-section-label">Security Modules</div>

          <NavLink to="assets" className={navClass}>
            Assets
          </NavLink>

          <NavLink to="threats" className={navClass}>
            Threat Intelligence
          </NavLink>

          <NavLink to="incidents" className={navClass}>
            Incident Management
          </NavLink>

          <NavLink to="vulnerabilities" className={navClass}>
            Vulnerability Oversight
          </NavLink>

          <NavLink to="compliance" className={navClass}>
            Regulatory Compliance
          </NavLink>

          <NavLink to="reports" className={navClass}>
            Executive Reporting
          </NavLink>

          <hr />

          <div className="nav-section-label">Platform Intelligence</div>

          <NavLink to="audit" className={navClass}>
            Audit Explorer
          </NavLink>

          <NavLink to="global" className={navClass}>
            Global Control
          </NavLink>

          <NavLink to="notifications" className={navClass}>
            System Notifications
          </NavLink>

          <hr />

          <div className="nav-section-label">Operational Oversight</div>

          <NavLink to="companies" className={navClass}>
            Company Oversight
          </NavLink>

          <NavLink to="/manager" className={navClass}>
            Manager Command
          </NavLink>

          <NavLink to="/company" className={navClass}>
            Corporate Entities
          </NavLink>

          <NavLink to="/user" className={navClass}>
            User Governance
          </NavLink>
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
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 24,
            display: "flex",
            alignItems: "center",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255,255,255,.04)",
            background: "rgba(255,255,255,.01)",
            fontSize: 11,
            letterSpacing: ".05em",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SystemStatusIndicator />
            <span style={{ opacity: 0.6 }}>PLATFORM</span>
          </div>
        </div>

        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>
      </div>

      {/* ================= ADVISOR DRAWER ================= */}
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
          <button
            onClick={() => setAdvisorOpen((v) => !v)}
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
              position: "relative",
            }}
          >
            {!advisorOpen && (
              <div style={{ position: "absolute", top: 12, fontSize: 12 }}>
                ◀
              </div>
            )}

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

            {advisorOpen && (
              <div style={{ position: "absolute", bottom: 12, fontSize: 12 }}>
                ▶
              </div>
            )}
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
