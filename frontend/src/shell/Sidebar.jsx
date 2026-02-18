// frontend/src/shell/Sidebar.jsx
// LIGHT ENTERPRISE COLLAPSIBLE SIDEBAR

import React from "react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ open, toggle, role }) {
  return (
    <aside className={`enterprise-sidebar ${open ? "open" : "collapsed"}`}>

      {/* TOGGLE */}
      <div className="sidebar-top">
        <button className="sidebar-toggle" onClick={toggle}>
          {open ? "‹" : "›"}
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="." end>
          <span className="icon">🏠</span>
          {open && <span>Dashboard</span>}
        </NavLink>

        <NavLink to="assets">
          <span className="icon">🗂</span>
          {open && <span>Assets</span>}
        </NavLink>

        <NavLink to="incidents">
          <span className="icon">🚨</span>
          {open && <span>Incidents</span>}
        </NavLink>

        <NavLink to="reports">
          <span className="icon">📊</span>
          {open && <span>Reports</span>}
        </NavLink>
      </nav>

    </aside>
  );
}
