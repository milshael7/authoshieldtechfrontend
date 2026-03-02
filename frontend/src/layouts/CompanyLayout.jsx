// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — Dark Unified v2 (White Strip Removed)

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

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div
      className={`layout-root enterprise ${menuOpen ? "sidebar-open" : ""}`}
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#0a0f1c",
        color: "#fff",
      }}
    >
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

          <NavLink to="intelligence" className={navClass} onClick={closeMenu}>
            Intelligence
          </NavLink>

          <NavLink to="soc" className={navClass} onClick={closeMenu}>
            SOC
          </NavLink>

          <NavLink to="assets" className={navClass} onClick={closeMenu}>
            Asset Inventory
          </NavLink>

          <NavLink to="incidents" className={navClass} onClick={closeMenu}>
            Incident Response
          </NavLink>

          <NavLink to="vulnerabilities" className={navClass} onClick={closeMenu}>
            Vulnerabilities
          </NavLink>

          <NavLink to="risk" className={navClass} onClick={closeMenu}>
            Risk Monitor
          </NavLink>

          <NavLink to="sessions" className={navClass} onClick={closeMenu}>
            Sessions
          </NavLink>

          <NavLink to="device-integrity" className={navClass} onClick={closeMenu}>
            Device Integrity
          </NavLink>

          <NavLink to="reports" className={navClass} onClick={closeMenu}>
            Reports
          </NavLink>

          <NavLink to="notifications" className={navClass} onClick={closeMenu}>
            Notifications
          </NavLink>

          <NavLink to="trading" className={navClass} onClick={closeMenu}>
            Trading Room
          </NavLink>

          {isSeatUser && (
            <>
              <hr style={{ opacity: 0.15 }} />
              <div className="nav-section-label">
                Upgrade Options
              </div>
              <NavLink to="/pricing" onClick={closeMenu}>
                Buy Freedom
              </NavLink>
            </>
          )}
        </nav>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div
        className="enterprise-main"
        style={{
          flex: 1,
          display: "flex",
          background: "#0a0f1c",
        }}
      >
        <main
          style={{
            flex: 1,
            padding: 20,
            background: "#0a0f1c",
          }}
        >
          <Outlet />
        </main>

        {/* ================= ADVISOR ================= */}
        <aside
          style={{
            width: advisorOpen ? 340 : 0,
            transition: "width .25s ease",
            overflow: "hidden",
            borderLeft: advisorOpen
              ? "1px solid rgba(255,255,255,.08)"
              : "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,.04), rgba(0,0,0,.55))",
            backdropFilter: "blur(10px)",
          }}
        >
          {advisorOpen && (
            <div style={{ padding: 18 }}>
              <AuthoDevPanel
                title="Advisor"
                getContext={() => ({
                  role: "company",
                  scope: "organization-only",
                  tenant: companyId,
                  subscription: subscriptionStatus,
                  location: window.location.pathname,
                  systemStatus,
                })}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Advisor Toggle Button */}
      <button
        onClick={() => setAdvisorOpen(v => !v)}
        style={{
          position: "fixed",
          right: advisorOpen ? 340 : 0,
          top: "50%",
          transform: "translateY(-50%)",
          padding: "6px 10px",
          background: "#111827",
          color: "#fff",
          border: "1px solid rgba(255,255,255,.08)",
          cursor: "pointer",
        }}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>
    </div>
  );
}
