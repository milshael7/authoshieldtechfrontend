// frontend/src/layouts/AdminLayout.jsx
// Advisor Door — Dual Visual Handle System (Top Open / Bottom Close)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const DRAWER_OPEN_W = 360;
  const DRAWER_CLOSED_W = 34;
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

      {/* SIDEBAR */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
        </div>

        <nav className="layout-nav">
          <NavLink to="." end>Dashboard</NavLink>
          <NavLink to="trading">Trading</NavLink>
          <NavLink to="global">Global Control</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

      {/* MAIN CONTENT PUSH AREA */}
      <div
        className="enterprise-main"
        style={{
          marginRight: drawerWidth,
          transition: "margin-right .22s ease",
        }}
      >
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>
      </div>

      {/* ADVISOR DOOR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          width: drawerWidth,
          transition: "width .22s ease",
          display: "flex",
          flexDirection: "row",
          borderLeft: "1px solid rgba(255,255,255,0.10)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.55))",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
          zIndex: 2000,
        }}
      >
        {/* HANDLE COLUMN */}
        <div
          style={{
            width: DRAWER_CLOSED_W,
            minWidth: DRAWER_CLOSED_W,
            height: "100%",
            background: "rgba(0,0,0,.25)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0",
          }}
        >
          {/* TOP OPEN INDICATOR (only when closed) */}
          {!advisorOpen && (
            <button
              onClick={() => setAdvisorOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: 14,
                opacity: .85,
              }}
              title="Open Advisor"
            >
              ▶
            </button>
          )}

          {/* ROTATED TITLE */}
          <button
            onClick={() => setAdvisorOpen(v => !v)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ffffff",
            }}
          >
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

          {/* BOTTOM CLOSE INDICATOR (only when open) */}
          {advisorOpen && (
            <button
              onClick={() => setAdvisorOpen(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: 14,
                opacity: .85,
              }}
              title="Close Advisor"
            >
              ◀
            </button>
          )}
        </div>

        {/* PANEL */}
        {advisorOpen && (
          <div style={{ flex: 1 }}>
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
              })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
