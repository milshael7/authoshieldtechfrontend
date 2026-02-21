// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center v2
// SOC + Revenue + Compliance + Intelligence

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

export default function AdminOverview() {
  const [posture, setPosture] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [summary, metricData, complianceReport] = await Promise.all([
          api.postureSummary(),
          api.adminMetrics(),
          api.adminComplianceReport()
        ]);

        setPosture(summary);
        setMetrics(metricData?.metrics || null);
        setCompliance(complianceReport?.complianceReport || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Command Center…</div>;
  }

  if (!posture) {
    return <div className="dashboard-error">Unable to load platform data.</div>;
  }

  const totals = posture?.totals || {};

  const revenueDrift = compliance?.financialIntegrity?.revenueDrift || 0;
  const auditOK = compliance?.auditIntegrity?.ok;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ======================================================
          EXECUTIVE KPI ROW
      ====================================================== */}

      <div className="kpiGrid">

        <div className="kpiCard">
          <small>Total Revenue</small>
          <b>${metrics?.totalRevenue?.toFixed(2) || "0.00"}</b>
        </div>

        <div className="kpiCard">
          <small>Active Subscribers</small>
          <b>{metrics?.activeSubscribers || 0}</b>
        </div>

        <div className="kpiCard">
          <small>MRR</small>
          <b>${metrics?.MRR?.toFixed(2) || "0.00"}</b>
        </div>

        <div className="kpiCard">
          <small>Churn Rate</small>
          <b>{metrics?.churnRate || 0}</b>
        </div>

      </div>

      {/* ======================================================
          COMPLIANCE + INTEGRITY STATUS
      ====================================================== */}

      <div className="postureCard" style={{ display: "flex", gap: 24 }}>

        <div style={{ flex: 1 }}>
          <h3>Compliance Integrity</h3>
          <p>
            Revenue Drift:{" "}
            <b style={{ color: revenueDrift === 0 ? "#16c784" : "#ff3b30" }}>
              {revenueDrift}
            </b>
          </p>
          <p>
            Audit Chain:{" "}
            <b style={{ color: auditOK ? "#16c784" : "#ff3b30" }}>
              {auditOK ? "Verified" : "Integrity Failure"}
            </b>
          </p>
        </div>

        <div style={{ flex: 1 }}>
          <h3>Platform Totals</h3>
          <p>Users: <b>{totals.users}</b></p>
          <p>Companies: <b>{totals.companies}</b></p>
          <p>Audit Events: <b>{totals.auditEvents}</b></p>
          <p>Notifications: <b>{totals.notifications}</b></p>
        </div>

      </div>

      {/* ======================================================
          SOC COMMAND GRID
      ====================================================== */}

      <div className="postureWrap">

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SecurityPostureDashboard />
          <SecurityPipeline />
          <SecurityRadar />
          <IncidentBoard />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <SecurityFeedPanel />
        </div>

      </div>
    </div>
  );
}
