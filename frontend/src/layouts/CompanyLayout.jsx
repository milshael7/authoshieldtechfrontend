// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — Enterprise Hardened v3
// Tenant Scoped • Seat Visible • Subscription Enforced • ZeroTrust Aware

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  clearToken,
  clearUser,
  getSavedUser
} from "../lib/api.js";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();
  const user = getSavedUser();
  const { wsStatus, systemStatus } = useSecurity();

  const [menuOpen, setMenuOpen] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("company.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("company.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const isSeatUser = Boolean(user?.companyId);
  const subscriptionStatus = user?.subscriptionStatus || "Unknown";
  const companyId = user?.companyId || "N/A";

  /* ================= STATUS COLORS ================= */

  function wsColor() {
    if (wsStatus === "connected") return "#22c55e";
    if (wsStatus === "reconnecting") return "#f59e0b";
    return "#ef4444";
  }

  function systemColor() {
    return systemStatus === "compromised" ? "#ef4444" : "#22c55e";
  }

  function subscriptionColor() {
    if (subscriptionStatus === "Active") return "#22c55e";
    if (
      subscriptionStatus === "Locked" ||
      subscriptionStatus === "Past Due"
    )
      return "#ef4444";
    return "#f59e0b";
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}>
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar company">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Organization Security Control
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end className={navClass} onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="assets" className={navClass} onClick={closeMenu}>
            Asset Inventory
          </NavLink>

          <NavLink to="threats" className={navClass} onClick={closeMenu}>
            Threat Monitoring
          </NavLink>

          <NavLink to="incidents" className={navClass} onClick={closeMenu}>
            Incident Response
          </NavLink>

          <NavLink to="vulnerabilities" className={navClass} onClick={closeMenu}>
            Vulnerability Management
          </NavLink>

          <NavLink to="compliance" className={navClass} onClick={closeMenu}>
            Compliance Status
          </NavLink>

          <NavLink to="reports" className={navClass} onClick={closeMenu}>
            Reports
          </NavLink>

          <NavLink to="notifications" className={navClass} onClick={closeMenu}>
            Notifications
          </NavLink>

          {/* 🔓 Freedom Upgrade Awareness */}
          {isSeatUser && (
            <>
              <hr style={{ opacity: 0.15 }} />
              <div className="nav-section-label">
                Upgrade Options
              </div>
              <NavLink to="/pricing" onClick={closeMenu}>
                Buy Freedom (Become Independent)
              </NavLink>
            </>
          )}
        </nav>

        <div style={{ padding: "12px 16px", fontSize: 11, opacity: 0.7 }}>
          <div>Company ID: {companyId}</div>
          <div style={{ color: subscriptionColor() }}>
            Subscription: {subscriptionStatus}
          </div>
          <div style={{ opacity: 0.6 }}>
            Seat: {isSeatUser ? "Organization Member" : "Independent"}
          </div>
        </div>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div
        className="enterprise-main"
        style={{ display: "flex", flexDirection: "column" }}
      >
        {/* ===== TENANT STATUS BAR ===== */}
        <div
          style={{
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            borderBottom: "1px solid rgba(255,255,255,.05)",
            background: "rgba(255,255,255,.015)",
            fontSize: 11,
            letterSpacing: ".05em",
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: wsColor(),
                }}
              />
              <span style={{ opacity: 0.7 }}>
                WS: {wsStatus.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: systemColor(),
                }}
              />
              <span style={{ opacity: 0.7 }}>
                SYSTEM: {systemStatus.toUpperCase()}
              </span>
            </div>

            <div style={{ opacity: 0.6 }}>
              SCOPE: TENANT (NO GLOBAL ACCESS)
            </div>
          </div>

          <div
            style={{
              padding: "2px 8px",
              borderRadius: 20,
              fontSize: 10,
              background: "rgba(255,255,255,.06)",
            }}
          >
            {subscriptionStatus.toUpperCase()}
          </div>
        </div>

        <main className="layout-main">
          <section className="layout-content">
            <Outlet />
          </section>
        </main>

        {/* ===== ADVISOR PANEL ===== */}
        <aside
          className={`enterprise-ai-panel ${
            advisorOpen ? "" : "collapsed"
          }`}
        >
          <div className="enterprise-ai-inner">
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "company",
                scope: "organization-only",
                tenant: companyId,
                seatUser: isSeatUser,
                subscription: subscriptionStatus,
                location: window.location.pathname,
                systemStatus,
              })}
            />
          </div>
        </aside>
      </div>

      {/* ===== FLOATING TOGGLE ===== */}
      <button
        className="advisor-fab"
        onClick={() => setAdvisorOpen(v => !v)}
        title={advisorOpen ? "Close Advisor" : "Open Advisor"}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
