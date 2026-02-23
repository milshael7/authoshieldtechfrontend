// frontend/src/layouts/AdminLayout.jsx
// Enterprise Admin Layout — Executive-Safe Scope Architecture
// ✅ Scope Selector Isolated (No Dashboard Interference)
// ✅ Advisor Drawer "Door" (overlay, never squeezes dashboards)

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

  // Persist advisor open state
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [companies, setCompanies] = useState([]);
  const [systemState, setSystemState] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  // Scope dropdown
  const [scopeOpen, setScopeOpen] = useState(false);
  const scopeRef = useRef(null);

  // Drawer widths (door behavior)
  const DRAWER_OPEN_W = 380;
  const DRAWER_CLOSED_W = 54;

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

  // Close scope dropdown on outside click
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
    ? companies.find((c) => String(c.id) === String(activeCompanyId))?.name ||
      "Entity"
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
          <NavLink to="." end>
            Dashboard
          </NavLink>
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
      <div className="enterprise-main" style={{ position: "relative" }}>
        {/* Compact Executive Header (never affects dashboard width) */}
        <div
          style={{
            padding: "12px 28px",
            borderBottom: "1px solid rgba(255,255,255,.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(255,255,255,0.02)",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
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

          {/* ISOLATED SCOPE CONTROL (dropdown, no layout squeeze) */}
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
              title="Select scope"
            >
              Scope: {currentScopeLabel} ▾
            </button>

            {scopeOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  marginTop: 8,
                  background: "rgba(10,12,18,0.98)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  minWidth: 260,
                  padding: 8,
                  zIndex: 9999,
                  boxShadow: "0 14px 40px rgba(0,0,0,.45)",
                  maxHeight: 360,
                  overflow: "auto",
                }}
              >
                <div
                  style={{
                    padding: "10px 10px",
                    cursor: "pointer",
                    borderRadius: 10,
                    fontWeight: 800,
                  }}
                  onClick={() => selectCompany("")}
                >
                  Global
                </div>

                <div
                  style={{
                    height: 1,
                    background: "rgba(255,255,255,0.08)",
                    margin: "6px 0",
                  }}
                />

                {companies.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "10px 10px",
                      cursor: "pointer",
                      borderRadius: 10,
                    }}
                    onClick={() => selectCompany(c.id)}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(120,160,255,.12)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
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

        {/* ================= ADVISOR "DOOR" DRAWER (OVERLAY) ================= */}
        {!isMobile && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              width: advisorOpen ? DRAWER_OPEN_W : DRAWER_CLOSED_W,
              transition: "width .22s ease",
              zIndex: 2000,
              display: "flex",
              flexDirection: "row",
              borderLeft: "1px solid rgba(255,255,255,0.10)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.55))",
              backdropFilter: "blur(10px)",
              overflow: "hidden",
              boxShadow: advisorOpen
                ? "0 0 0 1px rgba(94,198,255,.12), 0 18px 60px rgba(0,0,0,.55)"
                : "none",
            }}
          >
            {/* Door Handle (always visible) */}
            <button
              onClick={() => setAdvisorOpen((v) => !v)}
              title={advisorOpen ? "Close Advisor" : "Open Advisor"}
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
                  fontSize: 12,
                  letterSpacing: ".14em",
                  fontWeight: 900,
                  opacity: 0.9,
                  userSelect: "none",
                }}
              >
                ADVISOR
              </div>

              {/* little notch icon */}
              <div
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: 16,
                  opacity: 0.9,
                }}
              >
                {advisorOpen ? "›" : "‹"}
              </div>
            </button>

            {/* Drawer Content */}
            <div style={{ flex: 1, height: "100%", display: "flex" }}>
              {advisorOpen && (
                <div style={{ flex: 1, height: "100%" }}>
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
          </div>
        )}
      </div>
    </div>
  );
}
