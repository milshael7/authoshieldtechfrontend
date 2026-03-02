// frontend/src/layouts/SmallCompanyLayout.jsx
// Small Company Layout — Dark Unified v2 (White Strip Removed)

import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser, getSavedUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function SmallCompanyLayout() {
  const navigate = useNavigate();
  const user = useMemo(() => getSavedUser(), []);

  const [menuOpen, setMenuOpen] = useState(false);

  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("small_company.advisor.open");
    return saved !== "false";
  });

  useEffect(() => {
    localStorage.setItem("small_company.advisor.open", advisorOpen);
  }, [advisorOpen]);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const subscriptionStatus = user?.subscriptionStatus || "Unknown";

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
      <aside className="layout-sidebar small-company">
        <div className="layout-brand">
          <Logo size="md" />
          <span className="muted" style={{ fontSize: 12 }}>
            Small Company Security
          </span>
        </div>

        <nav className="layout-nav">
          <NavLink to="." end onClick={closeMenu}>
            Security Overview
          </NavLink>

          <NavLink to="assets" onClick={closeMenu}>
            Asset Inventory
          </NavLink>

          <NavLink to="threats" onClick={closeMenu}>
            Threat Monitoring
          </NavLink>

          <NavLink to="incidents" onClick={closeMenu}>
            Incident Tracking
          </NavLink>

          <NavLink to="reports" onClick={closeMenu}>
            Basic Reports
          </NavLink>

          <hr style={{ opacity: 0.2 }} />

          <div className="nav-section-label">Upgrade</div>

          <NavLink to="/pricing" className="upgrade-link" onClick={closeMenu}>
            Upgrade to Full Company
          </NavLink>
        </nav>

        <div style={{ padding: "12px 16px", fontSize: 11, opacity: 0.6 }}>
          Subscription: {subscriptionStatus}
        </div>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </aside>

      {/* ================= MAIN ================= */}
      <div
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
            width: advisorOpen ? 320 : 0,
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
                  role: "small_company",
                  scope: "organization-only",
                  tier: "limited",
                  subscription: subscriptionStatus,
                  location: window.location.pathname,
                })}
              />
            </div>
          )}
        </aside>
      </div>

      {/* Advisor Toggle */}
      <button
        onClick={() => setAdvisorOpen(v => !v)}
        style={{
          position: "fixed",
          right: advisorOpen ? 320 : 0,
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
