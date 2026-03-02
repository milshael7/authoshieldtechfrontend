// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Final Push + Vertical Handle Version

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

  return (
    <div
      className="layout-root enterprise"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a0f1c",
        color: "#fff",
      }}
    >
      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span style={{ fontSize: 12 }}>
            Enterprise Administration
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="/admin" end className={navClass}>
            Dashboard
          </NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

      {/* ================= MAIN + PANEL ================= */}
      <div style={{ flex: 1, display: "flex", position: "relative" }}>

        {/* ================= MAIN CONTENT ================= */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            transition: "all .3s ease",
          }}
        >
          <main style={{ flex: 1, padding: 20 }}>
            <Outlet />
          </main>
        </div>

        {/* ================= ADVISOR PANEL ================= */}
        {!isMobile && (
          <div
            style={{
              width: advisorOpen ? PANEL_WIDTH : 0,
              transition: "width .3s ease",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              borderLeft: advisorOpen
                ? "1px solid rgba(255,255,255,.08)"
                : "none",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.45))",
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

        {/* ================= VERTICAL STANDING HANDLE ================= */}
        {!isMobile && (
          <div
            onClick={() => setAdvisorOpen(v => !v)}
            style={{
              position: "absolute",
              top: "50%",
              right: advisorOpen ? PANEL_WIDTH - 8 : -8,
              transform: "translateY(-50%)",
              padding: "12px 6px",
              background: "rgba(0,0,0,.6)",
              borderRadius: "8px 0 0 8px",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: ".15em",
              transition: "right .3s ease",
              zIndex: 10,
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              userSelect: "none",
            }}
          >
            {advisorOpen ? "◀ ADVISOR" : "ADVISOR ▶"}
          </div>
        )}

      </div>
    </div>
  );
}
