// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Operator Autonomous Threat Engine (Layer 4)

import React, { useEffect, useMemo, useState, useCallback } from "react";
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

function riskLevel(score) {
  const s = Number(score || 0);
  if (s >= 75) return { label: "CRITICAL", cls: "warn" };
  if (s >= 50) return { label: "ELEVATED", cls: "warn" };
  if (s >= 25) return { label: "MODERATE", cls: "warn" };
  return { label: "STABLE", cls: "ok" };
}

function containmentFromRisk(risk) {
  if (risk >= 75) return "LOCKDOWN";
  if (risk >= 50) return "MONITORING";
  if (risk >= 25) return "CONTAINED";
  return "STABLE";
}

/* ========================================================= */

export default function AdminOverview() {

  const { integrityAlert } = useSecurity();

  const [mode, setMode] = useState("platform");
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const mockCompanies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  /* ================= STATE ================= */

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    mockCompanies.forEach(c => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        isolated: 0,
        locked: 0,
        log: []
      };
    });
    return initial;
  });

  const selectedCompany = mockCompanies.find(c => c.id === selectedCompanyId);
  const current = selectedCompany ? companyState[selectedCompany.id] : null;

  /* ========================================================= */
  /* ================= THREAT ENGINE ========================= */
  /* ========================================================= */

  useEffect(() => {

    const interval = setInterval(() => {

      setCompanyState(prev => {
        const updated = { ...prev };

        Object.keys(updated).forEach(id => {

          // 40% chance of threat injection
          if (Math.random() < 0.4) {
            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, updated[id].risk + spike);

            updated[id] = {
              ...updated[id],
              risk: newRisk,
              log: [
                { time: new Date(), msg: `Threat spike detected (+${spike})` },
                ...updated[id].log
              ]
            };
          }

          // Auto containment adjustment
          updated[id].containment = containmentFromRisk(updated[id].risk);

        });

        return updated;
      });

    }, 12000); // 12 seconds enterprise pacing

    return () => clearInterval(interval);

  }, []);

  /* ========================================================= */
  /* ================= ACTION ENGINE ========================= */
  /* ========================================================= */

  const reduceRisk = (companyId, amount, msg) => {
    setCompanyState(prev => ({
      ...prev,
      [companyId]: {
        ...prev[companyId],
        risk: Math.max(0, prev[companyId].risk - amount),
        log: [
          { time: new Date(), msg },
          ...prev[companyId].log
        ]
      }
    }));
  };

  /* ========================================================= */

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform"
            ? "Platform Command Center"
            : selectedCompany
              ? `${selectedCompany.name} — Operator Console`
              : "Operator Fleet"}
        </div>

        <select
          value={mode}
          onChange={(e) => {
            setSelectedCompanyId(null);
            setMode(e.target.value);
          }}
        >
          <option value="platform">Platform View</option>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {/* ================= OPERATOR MODE ================= */}

      {mode === "operator" && (
        <>
          {!selectedCompany && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {mockCompanies.map(c => {
                const state = companyState[c.id];
                const badge = riskLevel(state.risk);
                return (
                  <div key={c.id} className="postureCard" style={{ cursor: "pointer" }}
                       onClick={() => setSelectedCompanyId(c.id)}>
                    <h4>{c.name}</h4>
                    <div>Risk: <span className={`badge ${badge.cls}`}>{state.risk}</span></div>
                    <div>Status: {containmentFromRisk(state.risk)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {selectedCompany && current && (
            <>
              <button className="btn" onClick={() => setSelectedCompanyId(null)}>
                ← Exit Console
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 20 }}>
                <div className="kpiCard">
                  <small>Risk</small>
                  <b className={`badge ${riskLevel(current.risk).cls}`}>
                    {current.risk}
                  </b>
                </div>

                <div className="kpiCard">
                  <small>Status</small>
                  <b>{containmentFromRisk(current.risk)}</b>
                </div>

                <div className="kpiCard">
                  <small>Isolated</small>
                  <b>{current.isolated}</b>
                </div>

                <div className="kpiCard">
                  <small>Locked</small>
                  <b>{current.locked}</b>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="postureCard executivePanel">
                <h3>Operator Actions</h3>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                  <button className="btn warn"
                    onClick={() => reduceRisk(selectedCompany.id, 15, "Endpoint isolated")}>
                    Force Endpoint Isolation
                  </button>

                  <button className="btn warn"
                    onClick={() => reduceRisk(selectedCompany.id, 10, "Suspicious account locked")}>
                    Lock Suspicious Account
                  </button>

                  <button className="btn primary"
                    onClick={() => reduceRisk(selectedCompany.id, 20, "Incident escalated and contained")}>
                    Escalate Incident
                  </button>

                  <button className="btn"
                    onClick={() => reduceRisk(selectedCompany.id, 8, "Deep scan completed")}>
                    Trigger Deep Scan
                  </button>
                </div>
              </div>

              {/* LOG */}
              <div className="postureCard">
                <h3>Live Threat Log</h3>

                {current.log.length === 0 && (
                  <div className="muted">No recent activity.</div>
                )}

                {current.log.map((entry, i) => (
                  <div key={i} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <small>{entry.time.toLocaleTimeString()}</small>
                    <div><b>{entry.msg}</b></div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ================= PLATFORM MODE ================= */}

      {mode === "platform" && (
        <>
          {integrityAlert && (
            <div className="dashboard-warning">
              Integrity Alert Detected — Elevated State
            </div>
          )}

          <ExecutiveRiskBanner />
          <SecurityPostureDashboard />
          <IncidentBoard />
          <SecurityPipeline />
          <SecurityRadar />
          <SecurityFeedPanel />
        </>
      )}

    </div>
  );
}
