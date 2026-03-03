// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — FULL MERGED MASTER + Work Policy Gating Integrated

import React, { useEffect, useMemo, useState } from "react";
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

function nowTs() {
  return Date.now();
}

function safeStr(v) {
  return String(v ?? "").trim();
}

/* ================= WORK POLICY CHECK ================= */

function isWithinWorkWindow(company) {
  if (!company?.policy) return true;

  const { vacationMode, workDays, startHour, endHour } = company.policy;

  if (vacationMode) return false;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (!workDays.includes(day)) return false;
  if (hour < startHour || hour >= endHour) return false;

  return true;
}

/* ================= COMPONENT ================= */

export default function AdminOverview() {
  const { integrityAlert } = useSecurity();

  const [mode, setMode] = useState("platform");
  const [operatorMode, setOperatorMode] = useState("automatic");
  const [tick, setTick] = useState(Date.now());
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal");
  const [filter, setFilter] = useState("ALL");
  const [workspace, setWorkspace] = useState("ALL");
  const [role, setRole] = useState("Supervisor");

  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  /* ================= COMPANIES WITH POLICY ================= */

  const [companies, setCompanies] = useState([
    {
      id: "c1",
      name: "Alpha Systems",
      policy: {
        timezone: "Local",
        workDays: [1,2,3,4,5],
        startHour: 9,
        endHour: 17,
        vacationMode: false
      }
    },
    {
      id: "c2",
      name: "Beta Holdings",
      policy: {
        timezone: "Local",
        workDays: [1,2,3,4,5],
        startHour: 8,
        endHour: 16,
        vacationMode: false
      }
    },
    {
      id: "c3",
      name: "Gamma Logistics",
      policy: {
        timezone: "Local",
        workDays: [1,2,3,4,5],
        startHour: 9,
        endHour: 18,
        vacationMode: false
      }
    },
    {
      id: "c4",
      name: "Delta Finance",
      policy: {
        timezone: "Local",
        workDays: [1,2,3,4,5],
        startHour: 9,
        endHour: 17,
        vacationMode: false
      }
    }
  ]);

  /* ================= COMPANY STATE ================= */

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
  const [archive, setArchive] = useState([]);

  /* ================= CLOCK ================= */

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= THREAT ENGINE WITH POLICY ================= */

  useEffect(() => {
    const active = mode === "operator" && !enginePaused && operatorMode === "automatic";
    if (!active) return;

    const interval = setInterval(() => {
      setCompanyState(prev => {
        const updated = { ...prev };
        const newAlerts = [];

        companies.forEach(company => {

          if (!isWithinWorkWindow(company)) return;

          if (Math.random() < 0.4) {

            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, (updated[company.id]?.risk || 0) + spike);
            const containment = containmentFromRisk(newRisk);
            const priority = priorityFromRisk(newRisk);

            updated[company.id] = { risk: newRisk, containment };

            const createdAt = nowTs();
            const deadline = createdAt + slaDuration(priority);

            newAlerts.push({
              id: `${company.id}-${createdAt}`,
              companyId: company.id,
              risk: newRisk,
              containment,
              priority,
              createdAt,
              deadline,
              status: "NEW",
              assignedTo: null,
              locked: false,
              autoEscalated: false,
              activity: [{ time: new Date(), action: "CREATED" }],
              resolution: null,
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue(prevQ => [...newAlerts, ...prevQ].slice(0, 200));
        }

        return updated;
      });
    }, 12000);

    return () => clearInterval(interval);

  }, [mode, enginePaused, operatorMode, companies]);

  /* ================= RENDER (ONLY FLEET CHANGED BELOW) ================= */

  return (
    <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>
      
      {/* FLEET OVERVIEW */}
      {mode === "operator" && (
        <div className="postureCard">
          <h3>🏢 Fleet Overview</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {companies.map(c => {

              const active = isWithinWorkWindow(c);
              const badge = c.policy.vacationMode
                ? "🟡 VACATION MODE"
                : active
                  ? "🟢 ACTIVE WINDOW"
                  : "🔴 OUTSIDE HOURS";

              return (
                <div key={c.id} className="postureCard">
                  <b>{c.name}</b>
                  <div style={{ marginTop: 6 }}>
                    Risk: <b>{companyState[c.id]?.risk ?? 0}</b>
                  </div>
                  <div>Status: {companyState[c.id]?.containment ?? "STABLE"}</div>
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {badge}
                  </div>
                  <div style={{ fontSize: 12, opacity: .7 }}>
                    {c.policy.startHour}:00 - {c.policy.endHour}:00
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Platform view unchanged */}
      {mode === "platform" && (
        <>
          {integrityAlert && <div className="dashboard-warning">Integrity Alert Detected — Elevated State</div>}
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
