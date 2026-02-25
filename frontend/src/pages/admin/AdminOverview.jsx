// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center v10.5 — Live Enterprise Intelligence + Visual Security Telemetry

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

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
  if (L === "STABLE") return { cls: "ok", label: "STABLE" };
  return { cls: "", label: L || "UNKNOWN" };
}

function tsOf(e) {
  // backend audit uses "ts" (audit.js). Some routes may return "timestamp".
  const raw = e?.ts ?? e?.timestamp ?? e?.createdAt ?? null;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

export default function AdminOverview() {
  const {
    systemStatus,
    riskScore,
    assetExposure,
    integrityAlert,
  } = useSecurity();

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
    const calls = [
      api.postureSummary(),
      api.adminMetrics(),
      api.adminComplianceReport(),
      api.adminExecutiveRisk(),
      api.adminPredictiveChurn(),
      typeof api.adminAuditPreview === "function" ? api.adminAuditPreview() : Promise.resolve({ ok: true, events: [] }),
      typeof api.adminAutodevStats === "function" ? api.adminAutodevStats() : Promise.resolve(null),
    ];

    const results = await Promise.allSettled(calls);
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
          setAuditPreview(Array.isArray(data?.events) ? data.events : []);
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
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const totals = posture?.totals || {};

  const riskIndex = Number(execRisk?.riskIndex ?? execRisk?.score ?? 0);
  const riskBadge = riskLevelBadge(execRisk?.level);

  const churnScore = Number(predictiveChurn?.score ?? predictiveChurn?.probability ?? 0);
  const churnBadge = riskLevelBadge(predictiveChurn?.level || predictiveChurn?.riskLevel);

  const revenueDrift = Number(compliance?.financialIntegrity?.revenueDrift || 0);
  const driftClass = useMemo(() => (revenueDrift === 0 ? "metric-positive" : "metric-negative"), [revenueDrift]);
  const auditOK = !!compliance?.auditIntegrity?.ok;

  const exposureTop = useMemo(() => {
    const entries = Object.entries(assetExposure || {});
    entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    return entries.slice(0, 6);
  }, [assetExposure]);

  const liveStatusBadge = useMemo(() => {
    const s = String(systemStatus || "secure").toLowerCase();
    if (s === "secure") return { cls: "ok", label: "SECURE" };
    if (s === "compromised") return { cls: "warn", label: "COMPROMISED" };
    return { cls: "warn", label: s.toUpperCase() };
  }, [systemStatus]);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="sectionTitle">Executive Command Center</div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`badge ${liveStatusBadge.cls}`}>{liveStatusBadge.label}</span>

          <button className="btn primary" onClick={load}>
            Refresh
          </button>

          {lastUpdated && (
            <small style={{ marginLeft: 8, opacity: 0.7 }}>
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

      {/* 🔥 LIVE INTEGRITY BANNER */}
      {integrityAlert && (
        <div className="dashboard-warning" style={{ borderColor: "rgba(255,90,95,.35)" }}>
          <b>Integrity Alert:</b> Audit ledger integrity failure detected. System status elevated to{" "}
          <b>COMPROMISED</b>.
        </div>
      )}

      <ExecutiveRiskBanner />

      {/* KPI GRID */}
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

      {/* CHARTS */}
      <RevenueTrendChart />
      <SubscriberGrowthChart />
      <RefundDisputeChart />
      <RevenueRefundOverlayChart days={90} />

      {/* EXEC RISK + CHURN */}
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
            Churn Score: <b>{Number.isFinite(churnScore) ? churnScore.toFixed(2) : "0.00"}</b>{" "}
            <span className={`badge ${churnBadge.cls}`} style={{ marginLeft: 10 }}>
              {churnBadge.label}
            </span>
          </p>
        </div>
      </div>

      {/* 🔥 LIVE SECURITY TELEMETRY (WebSocket) */}
      <div className="postureCard executivePanel">
        <div className="executiveBlock">
          <h3>Live Security Telemetry</h3>
          <div className="executiveDivider" />

          <p style={{ marginBottom: 10 }}>
            Live Risk Score:{" "}
            <b style={{ marginLeft: 8 }}>{Number(riskScore || 0)}</b>{" "}
            <span className={`badge ${Number(riskScore || 0) >= 70 ? "warn" : "ok"}`} style={{ marginLeft: 10 }}>
              {Number(riskScore || 0) >= 70 ? "ELEVATED" : "NORMAL"}
            </span>
          </p>

          <div className="muted" style={{ fontSize: 12, opacity: 0.75 }}>
            Updates stream in real-time from the Intelligence Engine via WebSocket.
          </div>
        </div>

        <div className="executiveBlock">
          <h3>Top Asset Exposure</h3>
          <div className="executiveDivider" />

          {exposureTop.length === 0 ? (
            <div className="muted">No exposure data yet.</div>
          ) : (
            <div className="stats">
              {exposureTop.map(([asset, score]) => (
                <div key={asset}>
                  {asset} <b>{Number(score || 0)}</b>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* COMPLIANCE */}
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
            <div>Users <b>{totals.users || 0}</b></div>
            <div>Companies <b>{totals.companies || 0}</b></div>
            <div>Audit Events <b>{totals.auditEvents || 0}</b></div>
            <div>Notifications <b>{totals.notifications || 0}</b></div>
          </div>
        </div>
      </div>

      {/* AUTODEV */}
      {autodevStats && (
        <div className="postureCard executivePanel">
          <div className="executiveBlock">
            <h3>Autodev 6.5 Global Automation</h3>
            <div className="executiveDivider" />
            <div className="stats">
              <div>Total Subscribers <b>{autodevStats.totalSubscribers}</b></div>
              <div>Active Subscribers <b>{autodevStats.activeSubscribers}</b></div>
              <div>Past Due <b>{autodevStats.pastDueSubscribers}</b></div>
              <div>Companies Protected <b>{autodevStats.totalAttachedCompanies}</b></div>
              <div>Automation Load <b>{autodevStats.automationLoadScore}</b></div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT PREVIEW */}
      <div className="postureCard">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Recent Audit Events</h3>
          <a href="/admin/audit" className="btn ok" style={{ textDecoration: "none" }}>
            Open Audit Explorer
          </a>
        </div>

        <div style={{ marginTop: 14 }}>
          {auditPreview.length === 0 ? (
            <div className="muted">No recent events.</div>
          ) : (
            auditPreview
              .slice(0, 10)
              .map((e) => (
                <div
                  key={e.id || `${e.seq || ""}-${tsOf(e)}`}
                  className="auditRow"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                  }}
                >
                  <small style={{ opacity: 0.75 }}>
                    {new Date(tsOf(e)).toLocaleString()}
                  </small>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <b>{e.action || "UNKNOWN"}</b>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* SECURITY OPS */}
      <div className="sectionTitle">Security Operations</div>

      <SecurityPostureDashboard />
      <SecurityPipeline />
      <SecurityRadar />
      <IncidentBoard />
      <SecurityFeedPanel />
    </div>
  );
}
