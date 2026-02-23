// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Advisor Push Mode (Professional Door Behavior)

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

  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [companies, setCompanies] = useState([]);
  const [systemState, setSystemState] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeRef = useRef(null);

  // 🔥 Adjusted widths
  const DRAWER_OPEN_W = 360;
  const DRAWER_CLOSED_W = 34; // thinner than before

  const currentDrawerWidth = advisorOpen
    ? DRAWER_OPEN_W
    : DRAWER_CLOSED_W;

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile) setMenuOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (scopeRef.current && !scopeRef.current.contains(e.target)) {
        setScopeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const list = await api.adminCompanies();
        setCompanies(Array.isArray(list) ? list : []);
      } catch {}
    }
    loadCompanies();
  }, []);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function selectCompany(id) {
    if (!id) clearScope();
    else {
      const company = companies.find((c) => String(c.id) === String(id));
      if (company) setCompany(company);
    }
    setScopeOpen(false);
  }

  function getStatusColor() {
    if (!systemState) return "#999";
    if (systemState.securityStatus === "NORMAL") return "#16c784";
    if (systemState.securityStatus === "WARNING") return "#f5b400";
    if (systemState.securityStatus === "LOCKDOWN") return "#ff3b30";
    return "#999";
  }

  const currentScopeLabel = activeCompanyId
    ? companies.find((c) => String(c.id) === String(activeCompanyId))?.name ||
      "Entity"
    : "Global";

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>

      {/* SIDEBAR */}
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
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Secure Log Out
        </button>
      </aside>

      {/* MAIN AREA — now pushes when advisor opens */}
      <div
        className="enterprise-main"
        style={{
          marginRight: !isMobile ? currentDrawerWidth : 0,
          transition: "margin-right .22s ease",
        }}
      >

        {/* HEADER */}
        <div
          style={{
            padding: "12px 28px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div>
            <strong>Security Status:</strong>{" "}
            <span style={{ color: getStatusColor(), fontWeight: 700 }}>
              {systemState?.securityStatus || "Loading..."}
            </span>
          </div>

          <div ref={scopeRef} style={{ position: "relative" }}>
            <button
              onClick={() => setScopeOpen((v) => !v)}
              style={{
                padding: "6px 14px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Scope: {currentScopeLabel} ▾
            </button>
          </div>
        </div>

        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>
      </div>

      {/* ADVISOR DRAWER (fixed, but content pushes) */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            height: "100vh",
            width: currentDrawerWidth,
            transition: "width .22s ease",
            zIndex: 2000,
            display: "flex",
            flexDirection: "row",
            borderLeft: "1px solid rgba(255,255,255,0.10)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.55))",
            backdropFilter: "blur(10px)",
            overflow: "hidden",
          }}
        >
          {/* HANDLE */}
          <button
            onClick={() => setAdvisorOpen((v) => !v)}
            style={{
              width: DRAWER_CLOSED_W,
              minWidth: DRAWER_CLOSED_W,
              height: "100%",
              border: "none",
              background: "rgba(0,0,0,.20)",
              color: "rgba(255,255,255,.88)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
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
