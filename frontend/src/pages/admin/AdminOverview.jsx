// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — Lifecycle + Audit Upgrade Integrated

import React, { useEffect, useState, useMemo } from "react";
import { useSecurity } from "../../context/SecurityContext.jsx";

import ExecutiveRiskBanner from "../../components/ExecutiveRiskBanner";
import SecurityPostureDashboard from "../../components/SecurityPostureDashboard";
import SecurityFeedPanel from "../../components/SecurityFeedPanel";
import SecurityPipeline from "../../components/SecurityPipeline";
import SecurityRadar from "../../components/SecurityRadar";
import IncidentBoard from "../../components/IncidentBoard";

import "../../styles/platform.css";

/* ================= UTILITIES ================= */

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
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal");
  const [filter, setFilter] = useState("ALL");

  const companies = [
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" }
  ];

  const speedMap = {
    slow: 20000,
    normal: 12000,
    aggressive: 6000
  };

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

    if (enginePaused) return;

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
              status: "NEW",
              assignedTo: null,
              activity: [
                { time: new Date(), action: "CREATED" }
              ]
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prev => [...newAlerts, ...prev].slice(0, 100));
        }

        return updated;

      });

    }, speedMap[engineSpeed]);

    return () => clearInterval(interval);

  }, [enginePaused, engineSpeed]);

  /* ================= SLA ESCALATION ================= */

  useEffect(() => {

    setGlobalQueue(prev =>
      prev.map(alert => {

        if (alert.status === "RESOLVED") return alert;

        const remaining = alert.deadline - tick;

        if (remaining <= 0 && !alert.autoEscalated) {

          const newPriority = bumpPriority(alert.priority);
          const newDeadline = Date.now() + slaDuration(newPriority);

          const escalated = {
            ...alert,
            priority: newPriority,
            deadline: newDeadline,
            autoEscalated: true,
            activity: [
              { time: new Date(), action: "AUTO_ESCALATED" },
              ...alert.activity
            ]
          };

          setIncidentRegistry(prev =>
            [{ ...escalated, escalatedAt: new Date() }, ...prev]
          );

          return escalated;
        }

        return alert;
      })
    );

  }, [tick]);

  /* ================= ACTIONS ================= */

  const logActivity = (alert, action) => ({
    ...alert,
    activity: [
      { time: new Date(), action },
      ...alert.activity
    ]
  });

  const updateStatus = (id, status) => {
    setGlobalQueue(prev =>
      prev.map(a => {
        if (a.id !== id) return a;

        let updated = { ...a };

        if (status === "ACKNOWLEDGED" && a.status === "NEW") {
          updated = logActivity(a, "ACKNOWLEDGED");
          updated.status = "ACKNOWLEDGED";
        }

        if (status === "INVESTIGATING" && a.status === "ACKNOWLEDGED") {
          updated = logActivity(a, "INVESTIGATING");
          updated.status = "INVESTIGATING";
        }

        if (status === "RESOLVED") {
          updated = logActivity(a, "RESOLVED");
          updated.status = "RESOLVED";
          updated.resolvedAt = new Date();
        }

        return updated;
      })
    );
  };

  const assignAlert = (id, who) => {
    setGlobalQueue(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        return logActivity({ ...a, assignedTo: who }, `ASSIGNED_${who}`);
      })
    );
  };

  const manualEscalate = (id) => {
    setGlobalQueue(prev =>
      prev.map(a => {
        if (a.id !== id) return a;
        const newPriority = bumpPriority(a.priority);
        return logActivity({ ...a, priority: newPriority }, "MANUAL_ESCALATE");
      })
    );
  };

  const filteredQueue = useMemo(() => {
    if (filter === "OPEN") return globalQueue.filter(a => a.status !== "RESOLVED");
    if (filter === "BREACHED") return globalQueue.filter(a => a.deadline - tick <= 0);
    if (filter === "P1") return globalQueue.filter(a => a.priority === "P1");
    return globalQueue;
  }, [globalQueue, filter, tick]);

  /* ================= RENDER ================= */

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console"}
        </div>

        <select value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="platform">Platform View</option>
          <option value="operator">Operator View</option>
        </select>
      </div>

      {mode === "operator" && (
        <>
          <div className="postureCard executivePanel">
            <h3>🔴 GLOBAL THREAT QUEUE</h3>

            <div style={{ height: 500, overflowY: "auto" }}>
              {filteredQueue.map(alert => {

                const companyName = companies.find(c => c.id === alert.companyId)?.name;
                const remaining = alert.deadline - tick;

                return (
                  <div key={alert.id} style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <div><b>{companyName}</b></div>
                    <div>
                      Priority: {alert.priority} | 
                      SLA: {formatCountdown(remaining)} | 
                      Status: {alert.status} | 
                      Assigned: {alert.assignedTo || "Unassigned"}
                    </div>

                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <button className="btn" onClick={() => updateStatus(alert.id, "ACKNOWLEDGED")}>Ack</button>
                      <button className="btn" onClick={() => updateStatus(alert.id, "INVESTIGATING")}>Investigate</button>
                      <button className="btn primary" onClick={() => updateStatus(alert.id, "RESOLVED")}>Resolve</button>
                      <button className="btn" onClick={() => assignAlert(alert.id, "You")}>Assign Me</button>
                      <button className="btn warn" onClick={() => manualEscalate(alert.id)}>Escalate</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

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
