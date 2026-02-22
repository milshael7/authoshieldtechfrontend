// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center v8 (Global Banner Integrated)

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";

import RevenueTrendChart from "../../components/RevenueTrendChart";
import SubscriberGrowthChart from "../../components/SubscriberGrowthChart";
import RefundDisputeChart from "../../components/RefundDisputeChart";
import RevenueRefundOverlayChart from "../../components/RevenueRefundOverlayChart";

import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function riskLevelBadge(level) {
  const L = String(level || "").toUpperCase();
  if (L === "LOW") return { cls: "ok", label: "LOW" };
  if (L === "MODERATE") return { cls: "warn", label: "MODERATE" };
  if (L === "ELEVATED") return { cls: "warn", label: "ELEVATED" };
  if (L === "CRITICAL") return { cls: "warn", label: "CRITICAL" };
  return { cls: "", label: L || "UNKNOWN" };
}

export default function AdminOverview() {
  const [posture, setPosture] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [execRisk, setExecRisk] = useState(null);
  const [predictiveChurn, setPredictiveChurn] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const [
          summary,
          metricData,
          complianceReport,
          riskRes,
          churnRes,
        ] = await Promise.all([
          api.postureSummary(),
          api.adminMetrics(),
          api.adminComplianceReport(),
          api.adminExecutiveRisk(),
          api.adminPredictiveChurn(),
        ]);

        if (!alive) return;

        setPosture(summary || null);
        setMetrics(metricData?.metrics || null);
        setCompliance(complianceReport?.complianceReport || null);
        setExecRisk(riskRes?.executiveRisk || null);
        setPredictiveChurn(churnRes?.predictiveChurn || null);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const totals = posture?.totals || {};

  const revenueDrift = Number(
    compliance?.financialIntegrity?.revenueDrift || 0
  );
  const auditOK = !!compliance?.auditIntegrity?.ok;

  const driftClass = useMemo(() => {
    return revenueDrift === 0 ? "metric-positive" : "metric-negative";
  }, [revenueDrift]);

  const riskIndex = Number(execRisk?.riskIndex ?? 0);
  const riskLevel = execRisk?.level || "UNKNOWN";
  const riskBadge = riskLevelBadge(riskLevel);

  const churnScore = Number(predictiveChurn?.score ?? 0);
  const churnLevel = predictiveChurn?.level || "UNKNOWN";
  const churnBadge = riskLevelBadge(churnLevel);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      {/* ======================================================
          🔥 GLOBAL EXECUTIVE RISK BANNER
      ====================================================== */}

      <ExecutiveRiskBanner />

      {/* ======================================================
          EXECUTIVE METRICS
      ====================================================== */}

      <div className="sectionTitle">Executive Metrics</div>

      <div className="kpiGrid">
        <div className="kpiCard executive executiveGlow">
          <small>Total Revenue</small>
          <b>${fmtMoney(metrics?.totalRevenue)}</b>
        </div>

        <div className="kpiCard executive">
          <small>Active Subscribers</small>
          <b>{metrics?.activeSubscribers || 0}</b>
        </div>

        <div className="kpiCard executive">
          <small>MRR</small>
          <b>${fmtMoney(metrics?.MRR)}</b>
        </div>

        <div className="kpiCard executive">
          <small>Churn Rate</small>
          <b>{metrics?.churnRate ?? 0}</b>
        </div>
      </div>

      <RevenueTrendChart />
      <SubscriberGrowthChart />
      <RefundDisputeChart />

      {/* ======================================================
          EXECUTIVE INTELLIGENCE
      ====================================================== */}

      <div className="sectionTitle">Executive Intelligence</div>

      <div className="postureCard executivePanel executiveGlow">
        <div className="executiveBlock">
          <h3>Executive Risk Index</h3>
          <div className="executiveDivider" />

          <p>
            Risk Index: <b>{riskIndex.toFixed(2)}</b>{" "}
            <span className={`badge ${riskBadge.cls}`} style={{ marginLeft: 10 }}>
              {riskBadge.label}
            </span>
          </p>
        </div>

        <div className="executiveBlock">
          <h3>Predictive Churn</h3>
          <div className="executiveDivider" />

          <p>
            Churn Score: <b>{churnScore.toFixed(2)}</b>{" "}
            <span className={`badge ${churnBadge.cls}`} style={{ marginLeft: 10 }}>
              {churnBadge.label}
            </span>
          </p>
        </div>
      </div>

      <RevenueRefundOverlayChart days={90} />

      {/* ======================================================
          COMPLIANCE
      ====================================================== */}

      <div className="sectionTitle">Compliance & Integrity</div>

      <div className="postureCard executivePanel executiveGlow">
        <div className="executiveBlock">
          <h3>Financial Integrity</h3>
          <div className="executiveDivider" />

          <p>
            Revenue Drift:{" "}
            <b className={driftClass}>
              {Number.isFinite(revenueDrift) ? revenueDrift : 0}
            </b>
          </p>

          <p style={{ marginTop: 12 }}>
            Audit Chain:{" "}
            <span className={auditOK ? "integrityBadge ok" : "integrityBadge fail"}>
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

      <SecurityPostureDashboard />

      <div className="postureWrap">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
