// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center v11 — Institutional Risk Intelligence + Drift Telemetry

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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

/* ========================================================= */

function fmtMoney(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0.00";
  return x.toFixed(2);
}

function tsOf(e) {
  const raw = e?.ts ?? e?.timestamp ?? e?.createdAt ?? null;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

function riskLevel(score) {
  const s = Number(score || 0);
  if (s >= 75) return { label: "CRITICAL", cls: "warn" };
  if (s >= 50) return { label: "ELEVATED", cls: "warn" };
  if (s >= 25) return { label: "MODERATE", cls: "warn" };
  return { label: "STABLE", cls: "ok" };
}

/* ========================================================= */

export default function AdminOverview() {
  const {
    systemStatus,
    riskScore,
    assetExposure,
    integrityAlert,
    auditFeed,
  } = useSecurity();

  const [posture, setPosture] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [compliance, setCompliance] = useState(null);
  const [execRisk, setExecRisk] = useState(null);
  const [predictiveChurn, setPredictiveChurn] = useState(null);
  const [auditPreview, setAuditPreview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [riskHistory, setRiskHistory] = useState([]);
  const canvasRef = useRef(null);

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    const calls = [
      api.postureSummary(),
      api.adminMetrics(),
      api.adminCompliance(),
      api.adminExecutiveRisk(),
      api.adminAuditPreview?.() || Promise.resolve({ events: [] }),
    ];

    const results = await Promise.allSettled(calls);

    results.forEach((res, i) => {
      if (res.status !== "fulfilled") return;

      const data = res.value;

      switch (i) {
        case 0:
          setPosture(data || null);
          break;
        case 1:
          setMetrics(data?.metrics || null);
          break;
        case 2:
          setCompliance(data?.compliance || null);
          break;
        case 3:
          setExecRisk(data?.executiveRisk || null);
          break;
        case 4:
          setAuditPreview(Array.isArray(data?.events) ? data.events : []);
          break;
        default:
          break;
      }
    });

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  /* ================= RISK HISTORY ================= */

  useEffect(() => {
    if (typeof riskScore !== "number") return;

    setRiskHistory((prev) => {
      const updated = [...prev, riskScore];
      if (updated.length > 60) updated.shift();
      return updated;
    });
  }, [riskScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || riskHistory.length < 2) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    ctx.beginPath();
    ctx.strokeStyle = "#4f8cff";
    ctx.lineWidth = 2;

    riskHistory.forEach((value, index) => {
      const x = (index / (riskHistory.length - 1)) * width;
      const y = height - (value / 100) * height;

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [riskHistory]);

  /* ================= DERIVED METRICS ================= */

  const platformHealthIndex = useMemo(() => {
    const r = Number(riskScore || 0);
    const integrityPenalty = integrityAlert ? 20 : 0;
    const base = 100 - r - integrityPenalty;
    return Math.max(0, Math.min(100, base));
  }, [riskScore, integrityAlert]);

  const enforcementCount = useMemo(() => {
    return auditFeed?.length || 0;
  }, [auditFeed]);

  const healthBadge = riskLevel(platformHealthIndex);
  const riskBadge = riskLevel(riskScore);

  const exposureTop = useMemo(() => {
    const entries = Object.entries(assetExposure || {});
    entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    return entries.slice(0, 6);
  }, [assetExposure]);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">Executive Command Center</div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={`badge ${healthBadge.cls}`}>
            HEALTH {platformHealthIndex.toFixed(0)}
          </span>

          <button className="btn primary" onClick={load}>
            Refresh
          </button>

          {lastUpdated && (
            <small style={{ opacity: 0.7 }}>
              Updated {lastUpdated.toLocaleTimeString()}
            </small>
          )}
        </div>
      </div>

      {integrityAlert && (
        <div className="dashboard-warning">
          Integrity Alert Detected — Platform Status Elevated
        </div>
      )}

      <ExecutiveRiskBanner />

      {/* PLATFORM HEALTH PANEL */}
      <div className="postureCard executivePanel executiveGlow">
        <div className="executiveBlock">
          <h3>Platform Health Index</h3>
          <div className="executiveDivider" />
          <p>
            Score: <b>{platformHealthIndex.toFixed(0)}</b>
          </p>
        </div>

        <div className="executiveBlock">
          <h3>Live Risk Score</h3>
          <div className="executiveDivider" />
          <p>
            Risk: <b>{Number(riskScore || 0)}</b>{" "}
            <span className={`badge ${riskBadge.cls}`}>
              {riskBadge.label}
            </span>
          </p>
        </div>

        <div className="executiveBlock">
          <h3>Enforcement Activity</h3>
          <div className="executiveDivider" />
          <p>
            Recent Events: <b>{enforcementCount}</b>
          </p>
        </div>
      </div>

      {/* LIVE RISK TREND */}
      <div className="postureCard">
        <h3 style={{ marginBottom: 14 }}>Live Risk Drift</h3>
        <canvas
          ref={canvasRef}
          width={1000}
          height={240}
          style={{ width: "100%", height: 240 }}
        />
      </div>

      {/* KPI GRID */}
      <div className="kpiGrid">
        <div className="kpiCard executive">
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

      {/* EXPOSURE */}
      <div className="postureCard executivePanel">
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

      {/* SECURITY OPS */}
      <div className="sectionTitle">Security Operations</div>

      <SecurityPostureDashboard />
      <SecurityPipeline />
      <SecurityRadar />
      <IncidentBoard />
      <SecurityFeedPanel />

      {/* AUDIT PREVIEW */}
      <div className="postureCard">
        <h3>Recent Audit Events</h3>
        {auditPreview.length === 0 ? (
          <div className="muted">No recent events.</div>
        ) : (
          auditPreview.slice(0, 10).map((e) => (
            <div
              key={e.id || `${tsOf(e)}`}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,.06)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <small style={{ opacity: 0.75 }}>
                {new Date(tsOf(e)).toLocaleString()}
              </small>
              <div>
                <b>{e.action || "UNKNOWN"}</b>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
