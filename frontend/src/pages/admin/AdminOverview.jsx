// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Platform + Operator Mode (Layer 1 Upgraded)

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { api } from "../../lib/api";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
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
    riskScore,
    integrityAlert,
    auditFeed,
  } = useSecurity();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const [mode, setMode] = useState("platform");
  const [selectedCompany, setSelectedCompany] = useState(null);

  const canvasRef = useRef(null);
  const [riskHistory, setRiskHistory] = useState([]);

  /* ================= LOAD ================= */

  const load = useCallback(async () => {
    const res = await api.adminMetrics().catch(() => null);
    setMetrics(res?.metrics || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
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

    ctx.beginPath();
    ctx.strokeStyle = "#4f8cff";
    ctx.lineWidth = 2;

    riskHistory.forEach((value, index) => {
      const x = (index / (riskHistory.length - 1)) * canvas.width;
      const y = canvas.height - (value / 100) * canvas.height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();
  }, [riskHistory]);

  const healthIndex = useMemo(() => {
    const penalty = integrityAlert ? 20 : 0;
    return Math.max(0, 100 - (riskScore || 0) - penalty);
  }, [riskScore, integrityAlert]);

  const healthBadge = riskLevel(healthIndex);

  /* ================= MOCK COMPANY DATA ================= */

  const mockCompanies = [
    { id: "c1", name: "Alpha Systems", risk: 22, alerts: 3 },
    { id: "c2", name: "Beta Holdings", risk: 61, alerts: 9 },
    { id: "c3", name: "Gamma Logistics", risk: 38, alerts: 4 },
    { id: "c4", name: "Delta Finance", risk: 12, alerts: 1 }
  ];

  const fleetRiskAverage = useMemo(() => {
    const total = mockCompanies.reduce((sum, c) => sum + c.risk, 0);
    return Math.round(total / mockCompanies.length);
  }, []);

  const fleetBadge = riskLevel(fleetRiskAverage);

  if (loading) {
    return <div className="dashboard-loading">Loading Executive Center…</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 40
      }}
    >

      {/* ================= HEADER ================= */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Fleet Command"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className={`badge ${healthBadge.cls}`}>
            HEALTH {healthIndex.toFixed(0)}
          </span>

          <select
            value={mode}
            onChange={(e) => {
              setSelectedCompany(null);
              setMode(e.target.value);
            }}
            style={{
              background: "rgba(255,255,255,.05)",
              color: "#eaf1ff",
              border: "1px solid rgba(255,255,255,.15)",
              padding: "6px 10px",
              borderRadius: 6
            }}
          >
            <option value="platform">Platform View</option>
            <option value="operator">Operator View</option>
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ================= OPERATOR MODE ========================= */}
      {/* ========================================================= */}

      {mode === "operator" && (

        <>
          {/* Fleet Summary Strip */}
          <div className="postureCard executivePanel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3>Fleet Overview</h3>
                <div className="muted">
                  {mockCompanies.length} Protected Companies
                </div>
              </div>

              <div>
                Fleet Risk:{" "}
                <span className={`badge ${fleetBadge.cls}`}>
                  {fleetRiskAverage}
                </span>
              </div>
            </div>
          </div>

          {/* Company Grid */}
          {!selectedCompany && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 24
              }}
            >
              {mockCompanies.map((c) => {
                const badge = riskLevel(c.risk);

                return (
                  <div
                    key={c.id}
                    className="postureCard"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCompany(c)}
                  >
                    <h4>{c.name}</h4>

                    <div style={{ marginTop: 14 }}>
                      Risk:{" "}
                      <span className={`badge ${badge.cls}`}>
                        {c.risk}
                      </span>
                    </div>

                    <div style={{ marginTop: 10 }}>
                      Active Alerts: <b>{c.alerts}</b>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Company Deep View */}
          {selectedCompany && (
            <>
              <button
                className="btn"
                onClick={() => setSelectedCompany(null)}
              >
                ← Back to Fleet
              </button>

              <div className="postureCard executivePanel">
                <h3>{selectedCompany.name} — Operational View</h3>

                <div style={{ marginTop: 12 }}>
                  Risk Score:{" "}
                  <span className={`badge ${riskLevel(selectedCompany.risk).cls}`}>
                    {selectedCompany.risk}
                  </span>
                </div>

                <div style={{ marginTop: 8 }}>
                  Active Alerts: <b>{selectedCompany.alerts}</b>
                </div>

                <div style={{ marginTop: 20 }} className="muted">
                  Company-specific SOC modules will render here in next layer.
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================= */}
      {/* ================= PLATFORM MODE ========================= */}
      {/* ========================================================= */}

      {mode === "platform" && (
        <>
          {integrityAlert && (
            <div className="dashboard-warning">
              Integrity Alert Detected — Elevated State
            </div>
          )}

          <ExecutiveRiskBanner />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28
            }}
          >
            <div className="postureCard executivePanel">
              <h3>Platform Health</h3>
              <p style={{ fontSize: 32, fontWeight: 700 }}>
                {healthIndex.toFixed(0)}
              </p>
            </div>

            <div className="postureCard">
              <h3>Live Risk Drift</h3>
              <canvas
                ref={canvasRef}
                width={800}
                height={200}
                style={{ width: "100%", height: 200 }}
              />
            </div>
          </div>

          <div className="sectionTitle">Security Operations</div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 28
            }}
          >
            <SecurityPostureDashboard />
            <IncidentBoard />
          </div>

          <SecurityPipeline />
          <SecurityRadar />
          <SecurityFeedPanel />

          <div className="postureCard">
            <h3>Recent Audit Events</h3>
            {(auditFeed || []).slice(0, 8).map((e, i) => (
              <div
                key={i}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid rgba(255,255,255,.06)",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <small style={{ opacity: 0.7 }}>
                  {new Date(e?.ts || Date.now()).toLocaleTimeString()}
                </small>
                <div><b>{e?.action || "UNKNOWN"}</b></div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
