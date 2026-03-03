// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Platform + Operator (Restored Separation + Fixed Global Queue)

import React, { useEffect, useState } from "react";
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
  if (score >= 75) return { label: "CRITICAL", cls: "warn" };
  if (score >= 50) return { label: "ELEVATED", cls: "warn" };
  if (score >= 25) return { label: "MODERATE", cls: "warn" };
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

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  /* ================= COMPANY STATE ================= */

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    companies.forEach(c => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        containment: "STABLE",
        log: []
      };
    });
    return initial;
  });

  const [globalQueue, setGlobalQueue] = useState([]);

  /* ================= THREAT ENGINE ================= */

  useEffect(() => {

    const interval = setInterval(() => {

      setCompanyState(prev => {
        const updated = { ...prev };
        const newAlerts = [];

        Object.keys(updated).forEach(id => {

          if (Math.random() < 0.4) {

            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, updated[id].risk + spike);
            const containment = containmentFromRisk(newRisk);

            updated[id] = {
              ...updated[id],
              risk: newRisk,
              containment,
              log: [
                { time: new Date(), msg: `Threat spike detected (+${spike})` },
                ...updated[id].log
              ]
            };

            newAlerts.push({
              id: `${id}-${Date.now()}`,
              companyId: id,
              risk: newRisk,
              containment,
              time: new Date()
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prevQueue =>
            [...newAlerts, ...prevQueue].slice(0, 50)
          );
        }

        return updated;

      });

    }, 12000);

    return () => clearInterval(interval);

  }, []);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const current = selectedCompany ? companyState[selectedCompany.id] : null;

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

          {/* GLOBAL QUEUE — FIXED HEIGHT */}
          <div className="postureCard executivePanel">
            <h3>🔴 ACTIVE GLOBAL THREAT QUEUE</h3>

            <div style={{
              height: 320,
              overflowY: "auto",
              marginTop: 15,
              borderTop: "1px solid rgba(255,255,255,.05)"
            }}>
              {globalQueue.length === 0 && (
                <div className="muted">No active threats.</div>
              )}

              {globalQueue.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    padding: "8px 0",
                    borderBottom: "1px solid rgba(255,255,255,.06)",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    <b>{companies.find(c => c.id === alert.companyId)?.name}</b>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>
                      {alert.containment} — Risk {alert.risk}
                    </div>
                  </div>

                  <button
                    className="btn"
                    onClick={() => setSelectedCompanyId(alert.companyId)}
                  >
                    Enter
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* FLEET GRID */}
          {!selectedCompany && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
              {companies.map(c => {
                const state = companyState[c.id];
                const badge = riskLevel(state.risk);

                return (
                  <div
                    key={c.id}
                    className="postureCard"
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedCompanyId(c.id)}
                  >
                    <h4>{c.name}</h4>
                    <div>Risk: <span className={`badge ${badge.cls}`}>{state.risk}</span></div>
                    <div>Status: {state.containment}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* COMPANY CONSOLE */}
          {selectedCompany && current && (
            <>
              <button className="btn" onClick={() => setSelectedCompanyId(null)}>
                ← Back to Fleet
              </button>

              <div className="postureCard executivePanel">
                <h3>{selectedCompany.name}</h3>
                <div>Risk: {current.risk}</div>
                <div>Status: {current.containment}</div>
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
