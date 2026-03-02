// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Stable Overlay Advisor Version

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, getSavedUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const { wsStatus, systemStatus } = useSecurity();
  const user = getSavedUser();

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

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

  function wsColor() {
    if (wsStatus === "connected") return "#22c55e";
    if (wsStatus === "reconnecting") return "#f59e0b";
    return "#ef4444";
  }

  function systemColor() {
    return systemStatus === "compromised" ? "#ef4444" : "#22c55e";
  }

  const subscriptionStatus = user?.subscriptionStatus || "Unknown";

  return (
    <div
      className="layout-root enterprise"
      style={{
        background: "#0a0f1c",
        color: "#fff",
        position: "relative",
      }}
    >
      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Enterprise Administration
          </span>
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

      {/* ================= MAIN ================= */}
      <div
        className="enterprise-main"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#0a0f1c",
        }}
      >
        {/* STATUS BAR */}
        <div
          style={{
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            background: "rgba(255,255,255,.02)",
            fontSize: 11,
            letterSpacing: ".05em",
          }}
        >
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: wsColor() }} />
              <span style={{ opacity: 0.7 }}>WS: {wsStatus.toUpperCase()}</span>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: systemColor() }} />
              <span style={{ opacity: 0.7 }}>SYSTEM: {systemStatus.toUpperCase()}</span>
            </div>

            <div style={{ opacity: 0.6 }}>
              SCOPE: {activeCompanyId ? "ENTITY" : "GLOBAL"}
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ opacity: 0.7 }}>
              ROLE: {user?.role?.toUpperCase()}
            </div>

            <div
              style={{
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 10,
                background:
                  subscriptionStatus === "Active"
                    ? "rgba(34,197,94,.15)"
                    : "rgba(239,68,68,.15)",
                color:
                  subscriptionStatus === "Active"
                    ? "#22c55e"
                    : "#ef4444",
              }}
            >
              {subscriptionStatus.toUpperCase()}
            </div>
          </div>
        </div>

        <main style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </main>
      </div>

      {/* ================= ADVISOR OVERLAY ================= */}
      {!isMobile && (
        <>
          <div
            style={{
              position: "fixed",
              top: 0,
              right: advisorOpen ? 0 : -380,
              width: 380,
              height: "100vh",
              transition: "right .3s ease",
              zIndex: 30,
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

          <div
            style={{
              position: "fixed",
              top: "50%",
              right: advisorOpen ? 380 : 0,
              transform: "translateY(-50%)",
              transition: "right .3s ease",
              background: "rgba(0,0,0,.4)",
              padding: "12px 6px",
              cursor: "pointer",
              zIndex: 31,
            }}
            onClick={() => setAdvisorOpen(v => !v)}
          >
            <div style={{ fontSize: 14 }}>
              {advisorOpen ? "▶" : "◀"}
            </div>
            <div style={{ writingMode: "vertical-rl", fontSize: 11, margin: "6px 0" }}>
              ADVISOR
            </div>
            <div style={{ fontSize: 14 }}>
              {advisorOpen ? "▶" : "◀"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
