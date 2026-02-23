// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Executive-Safe Scope Architecture
// Scope Selector Isolated (No Dashboard Interference)

import React, { useEffect, useState, useRef } from "react";
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

  /* ================= CLOSE SCOPE DROPDOWN ================= */

  useEffect(() => {
    function handleClickOutside(e) {
      if (scopeRef.current && !scopeRef.current.contains(e.target)) {
        setScopeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ================= SYSTEM HEALTH ================= */

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

  /* ================= COMPANIES ================= */

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
    if (!id) {
      clearScope();
    } else {
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

  const navClick = () => {
    if (isMobile) setMenuOpen(false);
  };

  const currentScopeLabel = activeCompanyId
    ? companies.find((c) => String(c.id) === String(activeCompanyId))?.name || "Entity"
    : "Global";

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {isMobile && menuOpen && (
        <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Enterprise Administration
          </span>
        </div>

        <nav className="layout-nav" onClick={navClick}>
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

      {/* ================= MAIN WORKSPACE ================= */}
      <div className="enterprise-main">

        {/* Compact Executive Header */}
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

          {/* ISOLATED SCOPE CONTROL */}
          <div ref={scopeRef} style={{ position: "relative" }}>
            <button
              onClick={() => setScopeOpen(v => !v)}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Scope: {currentScopeLabel} ▾
            </button>

            {scopeOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 8,
                  background: "#111",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  minWidth: 220,
                  padding: 8,
                  zIndex: 1000,
                }}
              >
                <div
                  style={{ padding: 8, cursor: "pointer" }}
                  onClick={() => selectCompany("")}
                >
                  Global
                </div>
                {companies.map((c) => (
                  <div
                    key={c.id}
                    style={{ padding: 8, cursor: "pointer" }}
                    onClick={() => selectCompany(c.id)}
                  >
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* ADVISOR PANEL */}
        <aside
          className={`enterprise-ai-panel ${advisorOpen ? "" : "collapsed"}`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus: systemState?.securityStatus,
              })}
            />
          </div>
        </aside>
      </div>

      {/* FAB */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisorOpen((v) => !v)}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
