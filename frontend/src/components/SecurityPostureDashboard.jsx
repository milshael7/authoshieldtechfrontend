import React, { useMemo } from "react";

/**
 * SecurityPostureDashboard — Enterprise SOC Edition
 * Clean executive-grade posture overview
 */

export default function SecurityPostureDashboard({
  score = 82,
  coverage = {
    phishing: 88,
    malware: 76,
    accountTakeover: 91,
    fraud: 69,
  },
  incidents = 4,
  criticalAlerts = 1,
  subtitle = "Live Security Command Overview",
}) {
  const s = clampNum(score, 0, 100);

  const cov = useMemo(() => {
    const c = coverage || {};
    return {
      phishing: clampNum(c.phishing ?? 0, 0, 100),
      malware: clampNum(c.malware ?? 0, 0, 100),
      accountTakeover: clampNum(c.accountTakeover ?? 0, 0, 100),
      fraud: clampNum(c.fraud ?? 0, 0, 100),
    };
  }, [coverage]);

  const grade =
    s >= 90
      ? { label: "Excellent", level: "ok" }
      : s >= 80
      ? { label: "Strong", level: "ok" }
      : s >= 65
      ? { label: "Moderate", level: "warn" }
      : { label: "Critical", level: "bad" };

  return (
    <div className="postureWrap">
      {/* ================= LEFT: SCORE + METRICS ================= */}
      <div className="postureCard">

        {/* Header */}
        <div className="postureTop">
          <div>
            <b>Security Posture</b>
            <small className="muted">{subtitle}</small>
          </div>

          <div className="postureScore">
            <div
              className="scoreRing"
              style={{ "--val": s }}
              title={`Overall Score: ${s}/100`}
            >
              {s}
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

        {/* KPI Strip */}
        <div className="kpiGrid" style={{ marginTop: 24 }}>
          <KPI label="Active Incidents" value={incidents} />
          <KPI label="Critical Alerts" value={criticalAlerts} />
          <KPI label="Threat Coverage Avg"
               value={Math.round(
                 (cov.phishing +
                   cov.malware +
                   cov.accountTakeover +
                   cov.fraud) / 4
               ) + "%"}
          />
          <KPI label="Posture Grade" value={grade.label} />
        </div>

        {/* Score Meter */}
        <div className="meter" aria-hidden="true">
          <div style={{ width: `${s}%` }} />
        </div>

        {/* Coverage Breakdown */}
        <div className="coverGrid" style={{ marginTop: 20 }}>
          <CoverageItem label="Phishing Protection" value={cov.phishing} />
          <CoverageItem label="Malware Defense" value={cov.malware} />
          <CoverageItem label="Account Takeover" value={cov.accountTakeover} />
          <CoverageItem label="Fraud Detection" value={cov.fraud} />
        </div>
      </div>

      {/* ================= RIGHT: RADAR ================= */}
      <div className="postureCard">

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <b>Threat Surface Map</b>
          <small className="muted">Live Coverage Distribution</small>
        </div>

        <div style={{ height: 18 }} />

        <div className="radar" />

        <div style={{ marginTop: 16 }}>
          <small className="muted">
            Radar visualization reflects weighted detection surface across active protection layers.
          </small>
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENTS ================= */

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
      <div className="coverBar" aria-hidden="true">
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
