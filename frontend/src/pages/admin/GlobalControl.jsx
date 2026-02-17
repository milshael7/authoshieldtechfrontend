// frontend/src/pages/admin/GlobalControl.jsx
// ADMIN GLOBAL CONTROL CENTER
// Full override authority
// View switching (no nested routes)

import React, { useState } from "react";

export default function GlobalControl() {
  const [view, setView] = useState("managers");

  function renderView() {
    switch (view) {
      case "managers":
        return <ManagersPanel />;
      case "companies":
        return <CompaniesPanel />;
      case "small_companies":
        return <SmallCompaniesPanel />;
      case "users":
        return <UsersPanel />;
      default:
        return null;
    }
  }

  return (
    <div className="card">

      <h2 style={{ marginBottom: 20 }}>Global Control Center</h2>

      {/* CONTROL BUTTONS */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <button className="btn" onClick={() => setView("managers")}>
          Managers
        </button>

        <button className="btn" onClick={() => setView("companies")}>
          Companies
        </button>

        <button className="btn" onClick={() => setView("small_companies")}>
          Small Companies
        </button>

        <button className="btn" onClick={() => setView("users")}>
          Users
        </button>
      </div>

      {/* ACTIVE VIEW */}
      <div>
        {renderView()}
      </div>

    </div>
  );
}

/* ================= PANELS ================= */

function ManagersPanel() {
  return (
    <div>
      <h3>Managers Overview</h3>
      <p>Full visibility. Suspend / Audit / Override permissions.</p>
    </div>
  );
}

function CompaniesPanel() {
  return (
    <div>
      <h3>Companies Overview</h3>
      <p>Global visibility. Suspend companies. Upgrade all companies.</p>
    </div>
  );
}

function SmallCompaniesPanel() {
  return (
    <div>
      <h3>Small Companies Overview</h3>
      <p>Monitor compliance. Suspend small companies.</p>
    </div>
  );
}

function UsersPanel() {
  return (
    <div>
      <h3>Users Overview</h3>
      <p>Global monitoring. Suspend users. Audit activity.</p>
    </div>
  );
}
