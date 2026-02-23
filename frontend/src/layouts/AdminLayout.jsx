// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Clean Unified Command Architecture
// Trading + Global Integrated Properly

import React, { useEffect, useState } from "react";
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

  function handleCompanySelect(e) {
    const id = e.target.value;
    if (!id) return clearScope();
    const company = companies.find((c) => String(c.id) === String(id));
    if (company) setCompany(company);
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

          {/* Core Command */}
          <NavLink to="." end>Dashboard</NavLink>
          <NavLink to="assets">Assets</NavLink>
          <NavLink to="threats">Threat Intelligence</NavLink>
          <NavLink to="incidents">Incident Management</NavLink>
          <NavLink to="vulnerabilities">Vulnerability Oversight</NavLink>
          <NavLink to="compliance">Regulatory Compliance</NavLink>
          <NavLink to="reports">Executive Reporting</NavLink>

          {/* 🔥 Newly Integrated */}
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

        {/* Header */}
        <div
          style={{
            padding: "14px 28px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <div>
              <strong>Security Status:</strong>{" "}
              <span style={{ color: getStatusColor(), fontWeight: 700 }}>
                {systemState?.securityStatus || "Loading..."}
              </span>
            </div>

            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Audit:{" "}
              {systemState?.lastComplianceCheck
                ? new Date(systemState.lastComplianceCheck).toLocaleDateString()
                : "-"}
            </div>
          </div>

          <div>
            <select
              value={activeCompanyId || ""}
              onChange={handleCompanySelect}
              style={{ minWidth: 220 }}
            >
              <option value="">All Entities</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
          className={`enterprise-ai-panel ${
            advisorOpen ? "" : "collapsed"
          }`}
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
