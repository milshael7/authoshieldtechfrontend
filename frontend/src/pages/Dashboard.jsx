// frontend/src/pages/Dashboard.jsx
// SOC Dashboard — Monetization Aware • Usage Integrated

import React, { useEffect, useMemo, useState } from "react";

export default function Dashboard() {
  const [usage, setUsage] = useState(null);

  /* ======================================================
     LOAD USAGE FROM BACKEND
  ====================================================== */

  useEffect(() => {
    async function loadUsage() {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("/api/me/usage", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.ok) {
          setUsage(data.usage);
        }
      } catch (e) {
        console.error("Failed to load usage", e);
      }
    }

    loadUsage();
  }, []);

  /* ======================================================
     STATIC KPI (UNCHANGED)
  ====================================================== */

  const kpis = useMemo(
    () => [
      { label: "Users", value: 108, trend: "▲ 7%" },
      { label: "Devices", value: 111, trend: "▲ 3%" },
      { label: "Mailboxes", value: 124, trend: "▲ 2%" },
      { label: "Cloud Drives", value: 62, trend: "▲ 1%" },
      { label: "Internet Assets", value: 38, trend: "▲ 2%" },
      { label: "Active Threats", value: 6, trend: "▲ 1" },
    ],
    []
  );

  const risks = [
    { label: "Critical", value: 1 },
    { label: "High", value: 3 },
    { label: "Medium", value: 7 },
    { label: "Low", value: 11 },
  ];

  /* ======================================================
     CALCULATIONS
  ====================================================== */

  const percentUsed =
    usage && usage.included !== Infinity
      ? Math.min(
          100,
          Math.round((usage.used / usage.included) * 100)
        )
      : 0;

  const showUpgrade =
    usage &&
    usage.included !== Infinity &&
    usage.remaining <= 1;

  return (
    <div className="postureWrap">

      {/* ================= PLAN + USAGE ================= */}
      {usage && (
        <div className="postureCard" style={{ marginBottom: 20 }}>
          <h3>{usage.planLabel}</h3>

          {usage.included === Infinity ? (
            <p className="muted">Unlimited scans available</p>
          ) : (
            <>
              <p className="muted">
                {usage.remaining} of {usage.included} scans remaining
              </p>

              <div className="meter">
                <div style={{ width: `${percentUsed}%` }} />
              </div>
            </>
          )}

          {showUpgrade && (
            <button
              style={{
                marginTop: 14,
                padding: "8px 14px",
                cursor: "pointer",
              }}
              onClick={() => (window.location.href = "/billing")}
            >
              Upgrade Plan
            </button>
          )}
        </div>
      )}

      {/* ================= KPI STRIP ================= */}
      <div className="kpiGrid">
        {kpis.map((k) => (
          <div key={k.label} className="kpiCard">
            <small>{k.label}</small>
            <b>{k.value}</b>
            <span className="trend">{k.trend}</span>
          </div>
        ))}
      </div>

      {/* ================= MAIN GRID ================= */}
      <div className="postureGrid">
        <section className="postureCard">
          <div className="postureTop">
            <div>
              <h2>Security Health Overview</h2>
              <small>Real-time snapshot of your environment</small>
            </div>
          </div>

          <div className="meter">
            <div style={{ width: "70%" }} />
          </div>

          <p className="muted">
            Overall posture is stable, but some areas require attention.
          </p>

          <h3 style={{ marginTop: 20 }}>Issues by Risk Level</h3>

          <ul className="list">
            {risks.map((r) => (
              <li key={r.label}>
                <span
                  className={`dot ${
                    r.label === "Critical"
                      ? "bad"
                      : r.label === "High"
                      ? "warn"
                      : "ok"
                  }`}
                />
                <div>
                  <b>{r.label}</b>
                  <small>{r.value} issues</small>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <aside className="postureCard">
          <h3>Executive Insights</h3>
          <p className="muted">
            Key observations from your security controls.
          </p>

          <ul className="list">
            <li>
              <span className="dot warn" />
              <div>
                <b>Identity Risk Increasing</b>
                <small>Multiple login anomalies detected</small>
              </div>
            </li>
            <li>
              <span className="dot bad" />
              <div>
                <b>Critical Endpoint Alert</b>
                <small>Immediate investigation required</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Email Protection Healthy</b>
                <small>No active phishing campaigns</small>
              </div>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
