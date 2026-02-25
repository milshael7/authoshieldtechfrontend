// Executive Command Center v10 — Live Enterprise Intelligence Layer

import React, { useEffect, useMemo, useState, useCallback } from "react";
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
  const [auditPreview, setAuditPreview] = useState([]);
  const [autodevStats, setAutodevStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [moduleErrors, setModuleErrors] = useState([]);

  const load = useCallback(async () => {
    const results = await Promise.allSettled([
      api.postureSummary(),
      api.adminMetrics(),
      api.adminComplianceReport(),
      api.adminExecutiveRisk(),
      api.adminPredictiveChurn(),
      api.adminAuditPreview?.(),      // optional if exists
      api.adminAutodevStats?.(),      // optional if exists
    ]);

    const errors = [];

    results.forEach((res, i) => {
      if (res.status !== "fulfilled") {
        errors.push(i);
        return;
      }

      const data = res.value;

      switch (i) {
        case 0:
          setPosture(data || null);
          break;
        case 1:
          setMetrics(data?.metrics || null);
          break;
        case 2:
          setCompliance(data?.complianceReport || null);
          break;
        case 3:
          setExecRisk(data?.executiveRisk || null);
          break;
        case 4:
          setPredictiveChurn(data?.predictiveChurn || null);
          break;
        case 5:
          setAuditPreview(data?.events || []);
          break;
        case 6:
          setAutodevStats(data || null);
          break;
        default:
          break;
      }
    });

    setModuleErrors(errors);
    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [load]);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  const totals = posture?.totals || {};
  const riskIndex = Number(execRisk?.riskIndex ?? execRisk?.score ?? 0);
  const riskBadge = riskLevelBadge(execRisk?.level);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">Executive Command Center</div>
        <div>
          <button className="btn primary" onClick={load}>
            Refresh
          </button>
          {lastUpdated && (
            <small style={{ marginLeft: 15 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </small>
          )}
        </div>
      </div>

      {moduleErrors.length > 0 && (
        <div className="dashboard-warning">
          Some modules failed to load. Core systems remain operational.
        </div>
      )}

      <ExecutiveRiskBanner />

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
      <RevenueRefundOverlayChart days={90} />

      <div className="postureCard executivePanel executiveGlow">
        <h3>Executive Risk Index</h3>
        <p>
          {riskIndex.toFixed(2)}
          <span className={`badge ${riskBadge.cls}`} style={{ marginLeft: 10 }}>
            {riskBadge.label}
          </span>
        </p>
      </div>

      {autodevStats && (
        <div className="postureCard executivePanel">
          <h3>Autodev 6.5 Global Automation</h3>
          <div className="stats">
            <div>Total Subscribers <b>{autodevStats.totalSubscribers}</b></div>
            <div>Active Subscribers <b>{autodevStats.activeSubscribers}</b></div>
            <div>Past Due <b>{autodevStats.pastDueSubscribers}</b></div>
          </div>
        </div>
      )}

      <div className="postureCard">
        <h3>Recent Audit Events</h3>
        {auditPreview.length === 0 ? (
          <div className="muted">No recent events.</div>
        ) : (
          auditPreview.slice(0, 10).map((e) => (
            <div key={e.id} className="auditRow">
              <small>{new Date(e.timestamp).toLocaleString()}</small>
              <div>{e.action}</div>
            </div>
          ))
        )}
      </div>

      <div className="sectionTitle">Security Operations</div>

      <SecurityPostureDashboard />
      <SecurityPipeline />
      <SecurityRadar />
      <IncidentBoard />
      <SecurityFeedPanel />

      <div className="postureCard executivePanel">
        <h3>Platform Totals</h3>
        <div className="stats">
          <div>Users <b>{totals.users || 0}</b></div>
          <div>Companies <b>{totals.companies || 0}</b></div>
          <div>Audit Events <b>{totals.auditEvents || 0}</b></div>
          <div>Notifications <b>{totals.notifications || 0}</b></div>
        </div>
      </div>

    </div>
  );
}
