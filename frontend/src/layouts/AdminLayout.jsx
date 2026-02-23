// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Stable Build
// ✔ Navigation preserved
// ✔ Advisor door preserved
// ✔ Backend status indicator added cleanly

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

  useEffect(() => {
    async function loadHealth() {
      try {
        const base = import.meta.env.VITE_API_BASE?.trim();
        if (!base) return;
        const res = await fetch(`${base.replace(/\/+$/, "")}/health`);
        const data = await res.json();
        setSystemState(data.systemState || null);
      } catch {}
    }
    loadHealth();
  }, []);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function getStatusColor() {
    if (!systemState) return "#999";
    if (systemState.securityStatus === "NORMAL") return "#16c784";
    if (systemState.securityStatus === "WARNING") return "#f5b400";
    if (systemState.securityStatus === "LOCKDOWN") return "#ff3b30";
    return "#999";
  }

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
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ===== Operational Status Strip (NEW) ===== */}
        <div
          style={{
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            background: "rgba(255,255,255,.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <strong style={{ fontSize: 13 }}>Platform Status</strong>
            <SystemStatusIndicator />
          </div>

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {systemState?.securityStatus || "Checking backend..."}
          </div>
        </div>

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
