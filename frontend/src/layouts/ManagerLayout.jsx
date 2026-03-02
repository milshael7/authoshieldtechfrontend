// frontend/src/layouts/ManagerLayout.jsx
// Manager Layout — Dark Unified v5 (Advisor Rail Unified)

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, getSavedUser } from "../lib/api.js";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function ManagerLayout() {
  const navigate = useNavigate();
  const { wsStatus, systemStatus } = useSecurity();
  const user = getSavedUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const [oversightOpen, setOversightOpen] = useState(true);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("manager.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("manager.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
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
  const isUnlimited = user?.role?.toLowerCase() === "manager";

  const DRAWER_OPEN_W = 360;
  const drawerWidth = advisorOpen ? DRAWER_OPEN_W : 0;

  return (
    <div
      className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}
      style={{ background: "#0a0f1c", color: "#fff" }}
    >
      {menuOpen && <div className="sidebar-overlay" onClick={closeMenu} />}

      {/* ================= SIDEBAR ================= */}
      <aside className="layout-sidebar manager">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Operational Oversight Console
          </span>
        </div>

        <nav className="layout-nav">
          <div className="nav-section-label">
            Global Monitoring
          </div>

          <NavLink to="." end className={navClass} onClick={closeMenu}>
            Global Posture
          </NavLink>

          <NavLink to="assets" className={navClass} onClick={closeMenu}>
            Global Assets
          </NavLink>

          <NavLink to="incidents" className={navClass} onClick={closeMenu}>
            Incident Oversight
          </NavLink>

          <NavLink to="vulnerabilities" className={navClass} onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="compliance" className={navClass} onClick={closeMenu}>
            Compliance View
          </NavLink>

          <NavLink to="reports" className={navClass} onClick={closeMenu}>
            Operational Reports
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          <div
            className="nav-section-label clickable"
            onClick={() => setOversightOpen(v => !v)}
          >
            Entity Oversight {oversightOpen ? "▾" : "▸"}
          </div>

          {oversightOpen && (
            <>
              <NavLink to="/company" className={navClass} onClick={closeMenu}>
                All Companies
              </NavLink>

              <NavLink to="/small-company" className={navClass} onClick={closeMenu}>
                Small Companies
              </NavLink>

              <NavLink to="/user" className={navClass} onClick={closeMenu}>
                Individuals
              </NavLink>
            </>
          )}

          <hr style={{ opacity: 0.18 }} />

          <div className="nav-section-label">
            Internal Trading
          </div>

          <NavLink to="trading" className={navClass} onClick={closeMenu}>
            Market Activity
          </NavLink>

          <hr style={{ opacity: 0.18 }} />

          <NavLink to="notifications" className={navClass} onClick={closeMenu}>
            System Notifications
          </NavLink>
        </nav>

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
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: wsColor() }} />
              <span style={{ opacity: 0.7 }}>
                WS: {wsStatus.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: systemColor() }} />
              <span style={{ opacity: 0.7 }}>
                SYSTEM: {systemStatus.toUpperCase()}
              </span>
            </div>

            <div style={{ opacity: 0.6 }}>
              SCOPE: MULTI-COMPANY
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

            <div style={{ opacity: 0.6 }}>
              AUTODEV: {isUnlimited ? "UNLIMITED" : "LIMITED"}
            </div>
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
              role: "manager",
              location: window.location.pathname,
              scope: "multi-company-oversight",
              authority: "approval-visible-no-override",
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
