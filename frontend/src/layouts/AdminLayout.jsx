// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Command Architecture v1
// System Intelligence + Scope + Advisor

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, api } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId, activeCompanyName, setCompany, clearScope } = useCompany();

  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);
  const [globalOpen, setGlobalOpen] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [systemState, setSystemState] = useState(null);

  /* ================= LOAD SYSTEM HEALTH ================= */

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await fetch("/health");
        const data = await res.json();
        setSystemState(data.systemState);
      } catch {}
    }

    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ================= LOAD COMPANIES ================= */

  useEffect(() => {
    async function loadCompanies() {
      try {
        const list = await api.adminCompanies();
        setCompanies(Array.isArray(list) ? list : []);
      } catch {}
    }
    loadCompanies();
  }, []);

  /* ================= LOGOUT ================= */

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function handleCompanySelect(e) {
    const id = e.target.value;
    if (!id) return clearScope();

    const company = companies.find(c => String(c.id) === String(id));
    if (company) setCompany(company);
  }

  function getStatusColor() {
    if (!systemState) return "#999";
    if (systemState.securityStatus === "NORMAL") return "#16c784";
    if (systemState.securityStatus === "WARNING") return "#f5b400";
    if (systemState.securityStatus === "LOCKDOWN") return "#ff3b30";
    return "#999";
  }

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar admin">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Enterprise Admin
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end>Dashboard</NavLink>
          <NavLink to="assets">Assets</NavLink>
          <NavLink to="threats">Threats</NavLink>
          <NavLink to="incidents">Incidents</NavLink>
          <NavLink to="vulnerabilities">Vulnerabilities</NavLink>
          <NavLink to="compliance">Compliance</NavLink>
          <NavLink to="reports">Reports</NavLink>
          <NavLink to="notifications">Notifications</NavLink>

          <hr />

          <div className="nav-section-label">Oversight</div>
          <NavLink to="/manager">Manager Control</NavLink>
          <NavLink to="/company">Companies</NavLink>
          <NavLink to="/user">Users</NavLink>
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN AREA ================= */}
      <div className="enterprise-main">

        {/* 🔥 TOP INTELLIGENCE BAR */}
        <div
          style={{
            padding: "10px 24px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)"
          }}
        >
          <div>
            <strong>System Status:</strong>{" "}
            <span style={{ color: getStatusColor(), fontWeight: 600 }}>
              {systemState?.securityStatus || "Loading..."}
            </span>
          </div>

          <div style={{ fontSize: 13, opacity: 0.7 }}>
            Last Check:{" "}
            {systemState?.lastComplianceCheck
              ? new Date(systemState.lastComplianceCheck).toLocaleString()
              : "-"}
          </div>
        </div>

        {/* 🔥 SCOPE BAR */}
        <div
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <b>Scope:</b> {activeCompanyName}
          </div>

          <select
            value={activeCompanyId || ""}
            onChange={handleCompanySelect}
            style={{ minWidth: 220 }}
          >
            <option value="">All Companies</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* MAIN CONTENT */}
        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* ADVISOR */}
        <aside className={`enterprise-ai-panel ${advisorOpen ? "open" : "collapsed"}`}>
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "company" : "global",
                systemStatus: systemState?.securityStatus,
              })}
            />
          </div>
        </aside>
      </div>

      <button
        className="advisor-fab"
        onClick={() => setAdvisorOpen(v => !v)}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
