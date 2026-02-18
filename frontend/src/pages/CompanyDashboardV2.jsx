// frontend/src/pages/company/CompanyDashboardV2.jsx
// ENTERPRISE COMPANY DASHBOARD V2
// Multi-company ready • Tier-ready • Tool-ready

import React, { useState } from "react";

export default function CompanyDashboardV2() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="enterprise-page">

      {/* HEADER */}
      <div className="enterprise-header">
        <div>
          <h1>Company Control Center</h1>
          <div className="enterprise-sub">
            Enterprise Security Operations
          </div>
        </div>

        <div className="enterprise-actions">
          <button className="btn-secondary">Switch Company</button>
          <button className="btn-primary">Upgrade Tier</button>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="enterprise-kpi-grid">
        <KpiCard label="Security Score" value="87" trend="+3%" />
        <KpiCard label="Active Users" value="42" />
        <KpiCard label="Installed Tools" value="6" />
        <KpiCard label="Open Incidents" value="2" danger />
      </div>

      {/* TAB NAV */}
      <div className="enterprise-tabs">
        <Tab label="Overview" id="overview" active={activeTab} setActive={setActiveTab} />
        <Tab label="Assets" id="assets" active={activeTab} setActive={setActiveTab} />
        <Tab label="Users" id="users" active={activeTab} setActive={setActiveTab} />
        <Tab label="Tools" id="tools" active={activeTab} setActive={setActiveTab} />
        <Tab label="Billing & Tier" id="billing" active={activeTab} setActive={setActiveTab} />
      </div>

      {/* CONTENT */}
      <div className="enterprise-panel">

        {activeTab === "overview" && (
          <div className="enterprise-grid-2">
            <Panel title="Threat Activity">
              No major threats detected.
            </Panel>

            <Panel title="Compliance Status">
              SOC2: Compliant  
              <br />
              ISO: In Progress
            </Panel>
          </div>
        )}

        {activeTab === "assets" && (
          <Panel title="Assets Overview">
            Devices: 14  
            <br />
            Mailboxes: 21  
            <br />
            Cloud Drives: 7
          </Panel>
        )}

        {activeTab === "users" && (
          <Panel title="User Management">
            Manage company users here.
          </Panel>
        )}

        {activeTab === "tools" && (
          <Panel title="Security Toolbox">
            Install and manage tools here.
          </Panel>
        )}

        {activeTab === "billing" && (
          <Panel title="Tier & Billing">
            Current Tier: Growth  
            <br />
            User Limit: 50
          </Panel>
        )}

      </div>

    </div>
  );
}

/* ========================================================= */

function KpiCard({ label, value, trend, danger }) {
  return (
    <div className={`enterprise-kpi ${danger ? "danger" : ""}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {trend && <div className="kpi-trend">{trend}</div>}
    </div>
  );
}

function Tab({ label, id, active, setActive }) {
  return (
    <button
      onClick={() => setActive(id)}
      className={`enterprise-tab ${active === id ? "active" : ""}`}
    >
      {label}
    </button>
  );
}

function Panel({ title, children }) {
  return (
    <div className="enterprise-card">
      <h3>{title}</h3>
      <div className="enterprise-card-body">
        {children}
      </div>
    </div>
  );
}
