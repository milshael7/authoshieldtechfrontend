// frontend/src/pages/Dashboard.jsx
// Enterprise Admin Executive Dashboard — Phase 1 Core

import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [metricsRes, riskRes] = await Promise.all([
          api.adminMetrics(),
          api.adminExecutiveRisk(),
        ]);

        setMetrics(metricsRes?.metrics || null);
        setRisk(riskRes?.executiveRisk || null);

      } catch (err) {
        console.error("Admin dashboard load failed:", err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return <div style={{ padding: 28 }}>Loading platform intelligence…</div>;
  }

  if (!metrics) {
    return <div style={{ padding: 28 }}>Unable to load platform data.</div>;
  }

  return (
    <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ================= TOP KPI STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <Card title="Total Users" value={metrics.totalUsers} />
        <Card title="Active Subscribers" value={metrics.activeSubscribers} />
        <Card title="Trial Users" value={metrics.trialUsers} />
        <Card title="Locked Users" value={metrics.lockedUsers} />
      </div>

      {/* ================= REVENUE STRIP ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: 20,
        }}
      >
        <Card title="Monthly Recurring Revenue" value={`$${metrics.MRR}`} />
        <Card title="Total Revenue" value={`$${metrics.totalRevenue}`} />
        <Card
          title="Churn Rate"
          value={`${(metrics.churnRate * 100).toFixed(2)}%`}
        />
      </div>

      {/* ================= EXECUTIVE RISK ================= */}
      {risk && (
        <div className="card" style={{ padding: 24 }}>
          <h3>Executive Risk Index</h3>

          <div style={{ marginTop: 18 }}>
            <div className="meter">
              <div
                style={{
                  width: `${risk.riskIndex}%`,
                  background:
                    risk.level === "CRITICAL"
                      ? "#ff3b30"
                      : risk.level === "ELEVATED"
                      ? "#f5b400"
                      : risk.level === "MODERATE"
                      ? "#ff9500"
                      : "#16c784",
                }}
              />
            </div>

            <div style={{ marginTop: 12 }}>
              <strong>{risk.riskIndex}%</strong> — {risk.level}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div>
    </div>
  );
}
