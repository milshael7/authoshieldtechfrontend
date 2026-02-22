// frontend/src/components/SecurityPostureDashboard.jsx
// Enterprise SecurityPostureDashboard — Live Intelligence Version

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

export default function SecurityPostureDashboard() {
  const [posture, setPosture] = useState(null);
  const [status, setStatus] = useState("Loading…");

  async function load() {
    try {
      const data = await api.postureSummary();
      setPosture(data);
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
  const domains = Array.isArray(posture?.domains)
    ? posture.domains
    : [];

  const incidents = posture?.incidents ?? 0;
  const criticalAlerts = posture?.criticalAlerts ?? 0;

  const avgCoverage = useMemo(() => {
    if (!domains.length) return 0;
    const total = domains.reduce(
      (sum, d) => sum + clampNum(d.coverage ?? 0, 0, 100),
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
            </small>
          </div>

          <div className="postureScore">
            <div
              className="scoreRing"
              style={{ "--val": score }}
              title={`Overall Score: ${score}/100`}
            >
              {score}
            </div>

            <div className="scoreMeta">
              <b>{grade.label}</b>
              <span>
                {grade.level === "ok" &&
                  "Systems operating within tolerance"}
                {grade.level === "warn" &&
                  "Some risk indicators detected"}
                {grade.level === "bad" &&
                  "Immediate remediation required"}
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
          {domains.map((d) => (
            <CoverageItem
              key={d.key || d.label}
              label={d.label || d.key}
              value={d.coverage}
            />
          ))}
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
          <small className="muted">
            Live Coverage Distribution
          </small>
        </div>

        <div style={{ height: 18 }} />

        <div className="radar" />

        <div style={{ marginTop: 16 }}>
          <small className="muted">
            Radar visualization reflects weighted detection surface
            across active protection layers.
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
