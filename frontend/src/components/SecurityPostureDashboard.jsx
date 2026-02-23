// frontend/src/components/SecurityPostureDashboard.jsx
// Enterprise SecurityPostureDashboard — Live Intelligence Version (Hardened)
// Fixes:
// 1) Uses correct api import "../lib/api.js"
// 2) Normalizes backend payload so UI doesn't break when fields differ

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api.js";

export default function SecurityPostureDashboard() {
  const [posture, setPosture] = useState(null);
  const [status, setStatus] = useState("Loading…");

  function normalizePosture(data) {
    // Works with different backend shapes:
    // - { score, domains, incidents, criticalAlerts }
    // - or { totals: {...}, checks: [...], time }
    const totals = data?.totals || {};
    const domains = Array.isArray(data?.domains) ? data.domains : [];

    // Prefer explicit score, otherwise derive a simple score from checks if present
    const checks = Array.isArray(data?.checks) ? data.checks : [];
    const derivedScore = checks.length
      ? clampNum(
          100 -
            checks.reduce((acc, c) => {
              const st = String(c?.status || "").toLowerCase();
              if (st === "warn") return acc + 10;
              if (st === "danger") return acc + 25;
              return acc;
            }, 0),
          0,
          100
        )
      : 0;

    const score = clampNum(
      data?.score ?? totals?.score ?? derivedScore ?? 0,
      0,
      100
    );

    return {
      score,
      domains,
      incidents: Number(data?.incidents ?? totals?.incidents ?? 0) || 0,
      criticalAlerts:
        Number(data?.criticalAlerts ?? totals?.criticalAlerts ?? 0) || 0,
      time: data?.time || totals?.time || null,
      raw: data || null,
    };
  }

  async function load() {
    try {
      const data = await api.postureSummary();
      setPosture(normalizePosture(data));
      setStatus("LIVE");
    } catch (e) {
      console.error("SecurityPostureDashboard error:", e);
      setStatus("ERROR");
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const score = clampNum(posture?.score ?? 0, 0, 100);

  const domains = useMemo(() => {
    const d = posture?.domains;
    return Array.isArray(d) ? d : [];
  }, [posture]);

  const incidents = posture?.incidents ?? 0;
  const criticalAlerts = posture?.criticalAlerts ?? 0;

  const avgCoverage = useMemo(() => {
    if (!domains.length) return 0;
    const total = domains.reduce(
      (sum, d) => sum + clampNum(d?.coverage ?? 0, 0, 100),
      0
    );
    return Math.round(total / domains.length);
  }, [domains]);

  const grade =
    score >= 90
      ? { label: "Excellent", level: "ok" }
      : score >= 80
      ? { label: "Strong", level: "ok" }
      : score >= 65
      ? { label: "Moderate", level: "warn" }
      : { label: "Critical", level: "bad" };

  return (
    <div className="postureWrap">
      {/* ================= LEFT PANEL ================= */}
      <div className="postureCard">
        <div className="postureTop">
          <div>
            <b>Security Posture</b>
            <small className="muted">
              Live Security Command Overview
              {posture?.time ? (
                <span> • Updated {new Date(posture.time).toLocaleString()}</span>
              ) : null}
            </small>
          </div>

          <div className="postureScore">
            <div
              className="scoreRing"
              style={{ "--val": score }}
              title={`Overall Score: ${score}/100`}
            >
              {status === "Loading…" ? "…" : score}
            </div>

            <div className="scoreMeta">
              <b>{grade.label}</b>
              <span>
                {grade.level === "ok" && "Systems operating within tolerance"}
                {grade.level === "warn" && "Some risk indicators detected"}
                {grade.level === "bad" && "Immediate remediation required"}
              </span>
            </div>
          </div>
        </div>

        <div className="kpiGrid" style={{ marginTop: 24 }}>
          <KPI label="Active Incidents" value={incidents} />
          <KPI label="Critical Alerts" value={criticalAlerts} />
          <KPI label="Threat Coverage Avg" value={avgCoverage + "%"} />
          <KPI label="Posture Grade" value={grade.label} />
        </div>

        <div className="meter" aria-hidden="true">
          <div style={{ width: `${score}%` }} />
        </div>

        <div className="coverGrid" style={{ marginTop: 20 }}>
          {domains.length ? (
            domains.map((d) => (
              <CoverageItem
                key={d?.key || d?.label || Math.random()}
                label={d?.label || d?.key || "Domain"}
                value={d?.coverage ?? 0}
              />
            ))
          ) : (
            <small className="muted">No domain coverage returned yet.</small>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <span className={`badge ${status === "LIVE" ? "ok" : ""}`}>
            {status}
          </span>
        </div>
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="postureCard">
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>Threat Surface Map</b>
          <small className="muted">Live Coverage Distribution</small>
        </div>

        <div style={{ height: 18 }} />

        <div className="radar" />

        <div style={{ marginTop: 16 }}>
          <small className="muted">
            Radar visualization reflects weighted detection surface across active
            protection layers.
          </small>
        </div>
      </div>
    </div>
  );
}

/* ================= SUB COMPONENTS ================= */

function KPI({ label, value }) {
  return (
    <div className="kpiCard">
      <small>{label}</small>
      <b>{value}</b>
    </div>
  );
}

function CoverageItem({ label, value }) {
  const v = clampNum(value, 0, 100);
  return (
    <div>
      <div className="coverItemTop">
        <b>{label}</b>
        <small className="muted">{v}%</small>
      </div>
      <div className="coverBar">
        <div style={{ width: `${v}%` }} />
      </div>
    </div>
  );
}

function clampNum(n, a, b) {
  const x = Number(n);
  if (!Number.isFinite(x)) return a;
  return Math.max(a, Math.min(b, x));
}
