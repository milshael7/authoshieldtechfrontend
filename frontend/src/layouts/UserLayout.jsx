// frontend/src/layouts/UserLayout.jsx
// Individual User Layout — Dark Unified v5 (Advisor Rail Unified)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useTools } from "../pages/tools/ToolContext.jsx";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function UserLayout() {
  const { user } = useTools();
  const { wsStatus, systemStatus } = useSecurity();

  const [menuOpen, setMenuOpen] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("user.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("user.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    window.location.replace("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const subscriptionStatus = user?.subscriptionStatus || "Unknown";
  const freedomEnabled = !!user?.freedomEnabled;
  const autoprotectEnabled = !!user?.autoprotectEnabled;
  const managedCompanies = user?.managedCompanies || [];

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
    if (subscriptionStatus === "Locked" || subscriptionStatus === "Past Due")
      return "#ef4444";
    return "#f59e0b";
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  const DRAWER_OPEN_W = 360;
  const drawerWidth = advisorOpen ? DRAWER_OPEN_W : 0;

  return (
    <div
      className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}
      style={{ background: "#0a0f1c", color: "#fff" }}
    >
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar user">
        <div className="layout-brand">
          <Logo size="sm" />
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            Personal Security Control
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end className={navClass} onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="notifications" className={navClass} onClick={closeMenu}>
            Notifications
          </NavLink>

          <NavLink to="reports" className={navClass} onClick={closeMenu}>
            My Reports
          </NavLink>

          <hr style={{ opacity: 0.15 }} />

          <div className="nav-section-label">
            Managed Companies
          </div>

          <NavLink to="managed" className={navClass} onClick={closeMenu}>
            My External Companies ({managedCompanies.length}/10)
          </NavLink>

          {!freedomEnabled && (
            <NavLink to="/pricing" className={navClass} onClick={closeMenu}>
              Activate Freedom
            </NavLink>
          )}

          {freedomEnabled && (
            <NavLink to="autoprotect" className={navClass} onClick={closeMenu}>
              Autoprotect (Autodev 6.5)
            </NavLink>
          )}
        </nav>

        <div style={{ padding: "12px 16px", fontSize: 11 }}>
          <div style={{ color: subscriptionColor() }}>
            Subscription: {subscriptionStatus}
          </div>
          <div style={{ opacity: 0.6 }}>
            Freedom: {freedomEnabled ? "ENABLED" : "DISABLED"}
          </div>
          <div style={{ opacity: 0.6 }}>
            Autodev: {autoprotectEnabled ? "ACTIVE" : "INACTIVE"}
          </div>
        </div>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div
        className="enterprise-main"
        style={{
          marginRight: drawerWidth,
          transition: "margin-right .25s ease",
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
              SCOPE: INDIVIDUAL (NO TENANT ACCESS)
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

        <main style={{ flex: 1, padding: 20 }}>
          <Outlet />
        </main>
      </div>

      {/* ================= ADVISOR PANEL ================= */}
      <>
        <div
          className={`enterprise-ai-panel ${advisorOpen ? "" : "collapsed"}`}
        >
          <AuthoDevPanel
            title="Advisor"
            getContext={() => ({
              role: "individual",
              scope: "individual-control",
              freedom: freedomEnabled,
              autoprotect: autoprotectEnabled,
              managedCount: managedCompanies.length,
              subscription: subscriptionStatus,
              location: window.location.pathname,
              systemStatus,
            })}
          />
        </div>

        {/* ================= VERTICAL RAIL ================= */}
        <div
          className="advisor-rail"
          style={{ right: advisorOpen ? DRAWER_OPEN_W : 0 }}
          onClick={() => setAdvisorOpen(v => !v)}
        >
          <div className="advisor-rail-arrow">
            {advisorOpen ? "▶" : "◀"}
          </div>

          <div className="advisor-rail-text">
            ADVISOR
          </div>

          <div className="advisor-rail-arrow">
            {advisorOpen ? "▶" : "◀"}
          </div>
        </div>
      </>
    </div>
  );
}
