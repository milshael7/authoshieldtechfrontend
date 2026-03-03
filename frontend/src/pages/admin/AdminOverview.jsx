// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Stabilized Operator + Platform Integration

import React, { useEffect, useState } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

/* ================= UTILITIES ================= */

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

function priorityFromRisk(risk) {
  if (risk >= 75) return "P1";
  if (risk >= 60) return "P2";
  if (risk >= 40) return "P3";
  return "P4";
}

function bumpPriority(priority) {
  if (priority === "P4") return "P3";
  if (priority === "P3") return "P2";
  if (priority === "P2") return "P1";
  return "P1";
}

function slaDuration(priority) {
  switch (priority) {
    case "P1": return 5 * 60 * 1000;
    case "P2": return 15 * 60 * 1000;
    case "P3": return 30 * 60 * 1000;
    default: return 60 * 60 * 1000;
  }
}

function formatCountdown(ms) {
  if (ms <= 0) return "BREACHED";
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/* ================= COMPONENT ================= */

export default function AdminOverview() {

  const { integrityAlert } = useSecurity();

  const [mode, setMode] = useState("platform");
  const [tick, setTick] = useState(Date.now());

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    companies.forEach(c => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        containment: "STABLE"
      };
    });
    return initial;
  });

  const [globalQueue, setGlobalQueue] = useState([]);
  const [incidentRegistry, setIncidentRegistry] = useState([]);

  /* ================= GLOBAL CLOCK ================= */

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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
            const priority = priorityFromRisk(newRisk);

            updated[id] = { risk: newRisk, containment };

            const createdAt = Date.now();
            const deadline = createdAt + slaDuration(priority);

            newAlerts.push({
              id: `${id}-${Date.now()}`,
              companyId: id,
              risk: newRisk,
              containment,
              priority,
              createdAt,
              deadline,
              escalatedLocked: false,
              status: "NEW"
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prev => [...newAlerts, ...prev].slice(0, 100));
        }

        return updated;

      });

    }, 12000);

    return () => clearInterval(interval);

  }, []);

  /* ================= AUTO ESCALATION ================= */

  useEffect(() => {

    setGlobalQueue(prev =>
      prev.map(alert => {

        if (alert.status === "RESOLVED") return alert;

        const remaining = alert.deadline - tick;

        if (remaining <= 0 && !alert.escalatedLocked) {

          const newPriority = bumpPriority(alert.priority);
          const newDeadline = Date.now() + slaDuration(newPriority);

          const escalatedAlert = {
            ...alert,
            priority: newPriority,
            deadline: newDeadline,
            escalatedLocked: true,
            autoEscalated: true
          };

          setIncidentRegistry(prev =>
            [{ ...escalatedAlert, escalatedAt: new Date() }, ...prev]
          );

          return escalatedAlert;
        }

        return alert;
      })
    );

  }, [tick]);

  const resolveAlert = (alert) => {
    setGlobalQueue(prev =>
      prev.map(a =>
        a.id === alert.id ? { ...a, status: "RESOLVED" } : a
      )
    );
  };

  /* ================= RENDER ================= */

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console"}
        </div>

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="platform">Platform View</option>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {/* ================= OPERATOR MODE ================= */}
      {mode === "operator" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 30 }}>
            <div className="postureCard executivePanel">
              <h3>🔴 ACTIVE GLOBAL THREAT QUEUE</h3>
              <div style={{ height: 420, overflowY: "auto", marginTop: 15 }}>
                {globalQueue.map(alert => {
                  const companyName = companies.find(c => c.id === alert.companyId)?.name;
                  const remaining = alert.deadline - tick;
                  const breached = remaining <= 0;

                  return (
                    <div
                      key={alert.id}
                      style={{
                        padding: "12px 0",
                        borderBottom: "1px solid rgba(255,255,255,.06)",
                        display: "flex",
                        justifyContent: "space-between",
                        background: breached ? "rgba(255,0,0,.08)" : "transparent"
                      }}
                    >
                      <div>
                        <b>{companyName}</b>
                        <div style={{ fontSize: 12 }}>
                          Priority: <b>{alert.priority}</b> | SLA:{" "}
                          <b style={{ color: breached ? "#ff4d4f" : "#eaf1ff" }}>
                            {formatCountdown(remaining)}
                          </b>
                        </div>
                      </div>

                      <button className="btn primary" onClick={() => resolveAlert(alert)}>
                        Resolve
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="postureCard">
              <h3>🚨 ESCALATED INCIDENTS</h3>
              <div style={{ height: 420, overflowY: "auto", marginTop: 15 }}>
                {incidentRegistry.map(incident => (
                  <div key={incident.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <b>{companies.find(c => c.id === incident.companyId)?.name}</b>
                    <div style={{ fontSize: 12 }}>
                      Priority: {incident.priority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="postureCard">
            <h3>🏢 FLEET OVERVIEW</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginTop: 20 }}>
              {companies.map(c => {
                const state = companyState[c.id];
                const badge = riskLevel(state.risk);

                return (
                  <div key={c.id} className="postureCard">
                    <h4>{c.name}</h4>
                    <div>Risk: <span className={`badge ${badge.cls}`}>{state.risk}</span></div>
                    <div>Status: {state.containment}</div>
                  </div>
                );
              })}
            </div>
          </div>
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
