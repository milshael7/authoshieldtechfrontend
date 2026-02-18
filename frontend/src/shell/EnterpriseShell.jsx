// frontend/src/shell/EnterpriseShell.jsx
// LIGHT ENTERPRISE SHELL — COLLAPSIBLE SIDEBAR + FIXED ADVISOR
// Stable foundation for Company / Small Company / Individual

import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import AuthoDevPanel from "../components/AuthoDevPanel.jsx";

export default function EnterpriseShell({ role }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(true);

  return (
    <div className="enterprise-root">

      {/* SIDEBAR */}
      <Sidebar
        role={role}
        open={sidebarOpen}
        toggle={() => setSidebarOpen(v => !v)}
      />

      {/* MAIN AREA */}
      <div className="enterprise-main">

        <div className="enterprise-content">
          <Outlet />
        </div>

        {/* FIXED ADVISOR */}
        <aside
          className={`enterprise-advisor ${
            advisorOpen ? "open" : "collapsed"
          }`}
        >
          {advisorOpen && (
            <AuthoDevPanel
              getContext={() => ({
                role,
                location: window.location.pathname,
              })}
            />
          )}
        </aside>

      </div>

      {/* ADVISOR TOGGLE */}
      <button
        className="advisor-toggle"
        onClick={() => setAdvisorOpen(v => !v)}
      >
        {advisorOpen ? "›" : "Advisor"}
      </button>

    </div>
  );
}
