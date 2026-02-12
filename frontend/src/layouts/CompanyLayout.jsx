// frontend/src/layouts/CompanyLayout.jsx
// Company Layout — SOC Command Architecture (PHASE 2)

import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import AuthoDevPanel from "../components/AuthoDevPanel";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

export default function CompanyLayout() {
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);

  // 🧠 NEW: layout modes
  const [layoutMode, setLayoutMode] = useState("standard");
  // standard | focus | command

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  function cycleLayoutMode() {
    setLayoutMode((prev) => {
      if (prev === "standard") return "focus";
      if (prev === "focus") return "command";
      return "standard";
    });
  }

  const isCommand = layoutMode === "command";
  const isFocus = layoutMode === "focus";

  return (
    <div
      className={`layout-root ${menuOpen ? "sidebar-open" : ""} layout-${layoutMode}`}
    >
      {/* ================= MOBILE OVERLAY ================= */}
      {menuOpen && !isCommand && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      {!isCommand && (
        <aside className={`layout-sidebar company ${isFocus ? "collapsed" : ""}`}>
          <div className="layout-brand">
            <Logo size="md" />
            <span className="muted" style={{ fontSize: 12 }}>
              Company Visibility
            </span>
          </div>

          <nav className="layout-nav">
            <NavLink to="/company" end>
              Security Overview
            </NavLink>
            <NavLink to="/company/assets">Assets</NavLink>
            <NavLink to="/company/threats">Threats</NavLink>
            <NavLink to="/company/incidents">Incidents</NavLink>
            <NavLink to="/company/reports">Reports</NavLink>
            <NavLink to="/company/notifications">
              Notifications
            </NavLink>
          </nav>

          <button className="btn logout-btn" onClick={logout}>
            Log out
          </button>
        </aside>
      )}

      {/* ================= MAIN ================= */}
      <main className={`layout-main ${isCommand ? "command-main" : ""}`}>
        
        {/* ===== MODE SWITCHER ===== */}
        <div className="layout-mode-toggle">
          <button className="btn small" onClick={cycleLayoutMode}>
            {layoutMode === "standard" && "Switch to Focus"}
            {layoutMode === "focus" && "Switch to Command"}
            {layoutMode === "command" && "Back to Standard"}
          </button>
        </div>

        {/* ================= CONTENT ================= */}
        <section
          className={`layout-content ${
            isCommand ? "command-content" : ""
          }`}
        >
          <Outlet />
        </section>

        {/* ================= ADVISOR ================= */}
        {!isCommand && (
          <section
            className={`ai-drawer ${advisorOpen ? "open" : ""}`}
          >
            <div className="ai-drawer-handle">
              <button
                className="ai-toggle"
                onClick={() => setAdvisorOpen((v) => !v)}
              >
                {advisorOpen
                  ? "▼ Hide Advisor"
                  : "▲ Show Security Advisor"}
              </button>
            </div>

            <div
              className="ai-drawer-body"
              style={{ overflow: "auto" }}
            >
              <AuthoDevPanel
                title="Security Advisor"
                getContext={() => ({
                  role: "company",
                  mode: "advisory",
                  location: window.location.pathname,
                })}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
