// frontend/src/layouts/AdminLayout.jsx
// FINAL CONTROLLED ENTERPRISE LAYOUT
// Fixed Logo + True Slide Sidebar + Stable Advisor

import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken, clearUser } from "../lib/api.js";
import { useCompany } from "../context/CompanyContext";
import { useSecurity } from "../context/SecurityContext.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";
import Logo from "../components/Logo.jsx";
import "../styles/layout.css";

const SIDEBAR_WIDTH = 260;
const ADVISOR_WIDTH = 380;

export default function AdminLayout() {
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const { systemStatus } = useSecurity();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [advisorOpen, setAdvisorOpen] = useState(() => {
    const saved = localStorage.getItem("admin.advisor.open");
    return saved !== "false";
  });

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  useEffect(() => {
    localStorage.setItem("admin.advisor.open", advisorOpen);
  }, [advisorOpen]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  function logout() {
    clearToken();
    clearUser();
    navigate("/login");
  }

  const navClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className={`layout-root ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

      {/* ================= FIXED LOGO ================= */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: SIDEBAR_WIDTH,
            padding: "18px 18px 10px 18px",
            zIndex: 50,
          }}
        >
          <Logo size="md" />

          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                marginTop: 12,
                background: "transparent",
                border: "none",
                color: "#eaf1ff",
                fontSize: 20,
                cursor: "pointer",
              }}
              aria-label="Open Menu"
            >
              ☰
            </button>
          )}
        </div>
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        style={{
          width: sidebarOpen ? SIDEBAR_WIDTH : 0,
          transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "all .28s ease",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.05), rgba(0,0,0,.55))",
          borderRight: sidebarOpen
            ? "1px solid rgba(255,255,255,.08)"
            : "none",
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
          paddingTop: sidebarOpen ? 95 : 0,
          zIndex: 20,
        }}
      >
        {sidebarOpen && (
          <>
            {/* HEADER */}
            <div
              style={{
                padding: 18,
                borderBottom: "1px solid rgba(255,255,255,.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: ".12em",
                  opacity: 0.9,
                }}
              >
                ADMIN
              </div>

              {!isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#eaf1ff",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                  aria-label="Close Menu"
                >
                  ☰
                </button>
              )}
            </div>

            {/* NAV */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 18,
              }}
            >
              <nav className="layout-nav">
                <NavLink to="/admin" end className={navClass}>
                  Dashboard
                </NavLink>

                <NavLink to="/admin/security" className={navClass}>
                  Security Overview
                </NavLink>

                <NavLink to="/admin/risk" className={navClass}>
                  Risk Monitor
                </NavLink>

                <NavLink to="/admin/trading" className={navClass}>
                  Internal Trading
                </NavLink>

                <NavLink to="/admin/assets" className={navClass}>
                  Assets
                </NavLink>

                <NavLink to="/admin/incidents" className={navClass}>
                  Incident Management
                </NavLink>

                <NavLink to="/admin/reports" className={navClass}>
                  Executive Reporting
                </NavLink>
              </nav>

              <button
                onClick={logout}
                style={{
                  marginTop: 20,
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Secure Log Out
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ================= MAIN ================= */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <main
            style={{
              flex: 1,
              padding: "90px 28px 28px 28px",
              display: "flex",
              justifyContent: "center",
              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 1400,
              }}
            >
              <Outlet />
            </div>
          </main>
        </div>

        {/* ================= ADVISOR ================= */}
        {!isMobile && (
          <div
            style={{
              width: advisorOpen ? ADVISOR_WIDTH : 0,
              transition: "width .25s ease",
              overflow: "hidden",
              borderLeft: "1px solid rgba(255,255,255,.05)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.03), rgba(0,0,0,.45))",
              backdropFilter: "blur(10px)",
            }}
          >
            <AuthoDevPanel
              title="Advisor"
              getContext={() => ({
                role: "admin",
                scope: activeCompanyId ? "entity" : "global",
                systemStatus,
                location: window.location.pathname,
              })}
            />
          </div>
        )}
      </div>

      {/* ================= ADVISOR TOGGLE ================= */}
      {!isMobile && (
        <div
          onClick={() => setAdvisorOpen((v) => !v)}
          style={{
            position: "fixed",
            top: "50%",
            right: advisorOpen ? ADVISOR_WIDTH : 0,
            transform: "translateY(-50%)",
            padding: "14px 8px",
            background: "rgba(0,0,0,.6)",
            borderRadius: "8px 0 0 8px",
            cursor: "pointer",
            fontSize: 12,
            letterSpacing: ".15em",
            transition: "right .25s ease",
            zIndex: 10,
            writingMode: "vertical-rl",
            textOrientation: "mixed",
            userSelect: "none",
          }}
        >
          {advisorOpen ? "◀ ADVISOR" : "ADVISOR ▶"}
        </div>
      )}
    </div>
  );
}
