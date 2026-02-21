// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center v4
// Revenue Intelligence → Compliance Integrity → SOC Operations

import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";

import RevenueTrendChart from "../../components/RevenueTrendChart";
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
          api.adminComplianceReport(),
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
    return (
      <div className="dashboard-loading">
        Loading Executive Command Center…
      </div>
    );
  }

  if (!posture) {
    return (
      <div className="dashboard-error">
        Unable to load platform data.
      </div>
    );
  }

  const totals = posture?.totals || {};
  const revenueDrift =
    compliance?.financialIntegrity?.revenueDrift || 0;

  const auditOK = compliance?.auditIntegrity?.ok;

  const driftClass =
    revenueDrift === 0
      ? "metric-positive"
      : "metric-negative";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* ======================================================
          EXECUTIVE METRICS
      ====================================================== */}

      <div className="sectionTitle">Executive Metrics</div>

      <div className="kpiGrid">

        <div className="kpiCard executive executiveGlow">
          <small>Total Revenue</small>
          <b>
            ${metrics?.totalRevenue?.toFixed(2) || "0.00"}
          </b>
        </div>

        <div className="kpiCard executive">
          <small>Active Subscribers</small>
          <b>{metrics?.activeSubscribers || 0}</b>
        </div>

        <div className="kpiCard executive">
          <small>MRR</small>
          <b>
            ${metrics?.MRR?.toFixed(2) || "0.00"}
          </b>
        </div>

        <div className="kpiCard executive">
          <small>Churn Rate</small>
          <b>{metrics?.churnRate || 0}</b>
        </div>

      </div>

      {/* ======================================================
          REVENUE INTELLIGENCE CHART
      ====================================================== */}

      <RevenueTrendChart />

      {/* ======================================================
          COMPLIANCE & INTEGRITY
      ====================================================== */}

      <div className="sectionTitle">Compliance & Integrity</div>

      <div className="postureCard executivePanel executiveGlow">

        <div className="executiveBlock">
          <h3>Financial Integrity</h3>
          <div className="executiveDivider" />

          <p>
            Revenue Drift:{" "}
            <b className={driftClass}>
              {revenueDrift}
            </b>
          </p>

          <p style={{ marginTop: 12 }}>
            Audit Chain:{" "}
            <span
              className={
                auditOK
                  ? "integrityBadge ok"
                  : "integrityBadge fail"
              }
            >
              {auditOK ? "Verified" : "Integrity Failure"}
            </span>
          </p>
        </div>

        <div className="executiveBlock">
          <h3>Platform Totals</h3>
          <div className="executiveDivider" />

          <div className="stats">
            <div>Users <b>{totals.users}</b></div>
            <div>Companies <b>{totals.companies}</b></div>
            <div>Audit Events <b>{totals.auditEvents}</b></div>
            <div>Notifications <b>{totals.notifications}</b></div>
          </div>
        </div>

      </div>

      {/* ======================================================
          SECURITY OPERATIONS COMMAND
      ====================================================== */}

      <div className="sectionTitle">Security Operations Command</div>

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
