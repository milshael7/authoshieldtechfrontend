// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — FULL MERGED MASTER (Menu + Automatic/Manual + Company Plug + Drill + Archive)

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
    case "P1":
      return 5 * 60 * 1000;
    case "P2":
      return 15 * 60 * 1000;
    case "P3":
      return 30 * 60 * 1000;
    default:
      return 60 * 60 * 1000;
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

/* ================= COMPONENT ================= */

export default function AdminOverview() {
  const { integrityAlert } = useSecurity();

  // Top-level view mode
  const [mode, setMode] = useState("platform"); // platform | operator

  // Operator split: automatic vs manual
  const [operatorMode, setOperatorMode] = useState("automatic"); // automatic | manual

  // Operator controls
  const [tick, setTick] = useState(Date.now());
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal"); // slow | normal | aggressive
  const [filter, setFilter] = useState("ALL"); // ALL | OPEN | BREACHED | P1
  const [workspace, setWorkspace] = useState("ALL"); // ALL or companyId
  const [role, setRole] = useState("Supervisor"); // Tier1 | Tier2 | Supervisor

  // UI drawers/panels
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // ---- CLIENTS (mock for now; later replace with API) ----
  const [companies, setCompanies] = useState([
    { id: "c1", name: "Alpha Systems" },
    { id: "c2", name: "Beta Holdings" },
    { id: "c3", name: "Gamma Logistics" },
    { id: "c4", name: "Delta Finance" },
  ]);

  // Onboarding form (Plug Company)
  const [plug, setPlug] = useState({
    name: "",
    domain: "",
    contactEmail: "",
    plan: "Standard",
    seats: 5,
    notes: "",
  });

  const speedMap = useMemo(
    () => ({
      slow: 20000,
      normal: 12000,
      aggressive: 6000,
    }),
    []
  );

  // Company live posture (fleet overview)
  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    (companies || []).forEach((c) => {
      initial[c.id] = {
        risk: Math.floor(Math.random() * 40),
        containment: "STABLE",
      };
    });
    return initial;
  });

  // Operator alert systems
  const [globalQueue, setGlobalQueue] = useState([]);
  const [incidentRegistry, setIncidentRegistry] = useState([]);
  const [archive, setArchive] = useState([]); // resolved/closed alerts moved here

  /* ================= GLOBAL CLOCK ================= */

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= THREAT ENGINE =================
     - Runs ONLY in operator view AND automatic mode
     - Pauses if enginePaused OR operatorMode === manual
  */

  useEffect(() => {
    const active =
      mode === "operator" && !enginePaused && operatorMode === "automatic";

    if (!active) return;

    const interval = setInterval(() => {
      setCompanyState((prev) => {
        const updated = { ...prev };
        const newAlerts = [];

        Object.keys(updated).forEach((id) => {
          // 40% chance spike
          if (Math.random() < 0.4) {
            const spike = Math.floor(Math.random() * 15);
            const newRisk = Math.min(100, (updated[id]?.risk || 0) + spike);
            const containment = containmentFromRisk(newRisk);
            const priority = priorityFromRisk(newRisk);

            updated[id] = { risk: newRisk, containment };

            const createdAt = nowTs();
            const deadline = createdAt + slaDuration(priority);

            newAlerts.push({
              id: `${id}-${createdAt}`,
              companyId: id,
              risk: newRisk,
              containment,
              priority,
              createdAt,
              deadline,
              status: "NEW", // NEW -> ACKNOWLEDGED -> INVESTIGATING -> RESOLVED
              assignedTo: null,
              locked: false,
              autoEscalated: false,
              activity: [{ time: new Date(), action: "CREATED" }],
              resolution: null,
            });
          }
        });

        if (newAlerts.length > 0) {
          setGlobalQueue((prevQ) => [...newAlerts, ...prevQ].slice(0, 200));
        }

        return updated;
      });
    }, speedMap[engineSpeed]);

    return () => clearInterval(interval);
  }, [mode, enginePaused, operatorMode, engineSpeed, speedMap]);

  /* ================= SLA AUTO ESCALATION =================
     - Runs in operator view for automatic mode (but can still display in manual)
     - Only auto-escalates once per alert
  */

  useEffect(() => {
    if (mode !== "operator") return;
    if (operatorMode === "manual") return;

    setGlobalQueue((prev) =>
      prev.map((alert) => {
        if (!alert || alert.status === "RESOLVED") return alert;

        const remaining = (alert.deadline || 0) - tick;

        if (remaining <= 0 && !alert.autoEscalated && !alert.locked) {
          const newPriority = bumpPriority(alert.priority);
          const newDeadline = nowTs() + slaDuration(newPriority);

          const escalated = {
            ...alert,
            priority: newPriority,
            deadline: newDeadline,
            autoEscalated: true,
            locked: true, // locked once breached/escalated
            activity: [
              { time: new Date(), action: "AUTO_ESCALATED_LOCKED" },
              ...(alert.activity || []),
            ],
          };

          setIncidentRegistry((prevInc) => [
            { ...escalated, escalatedAt: new Date() },
            ...prevInc,
          ]);

          return escalated;
        }

        return alert;
      })
    );
  }, [tick, mode, operatorMode]);

  /* ================= ACTION HELPERS ================= */

  const getCompanyName = (companyId) =>
    companies.find((c) => c.id === companyId)?.name || companyId;

  const logActivity = (alert, action) => ({
    ...alert,
    activity: [{ time: new Date(), action }, ...(alert.activity || [])],
  });

  const updateStatus = (id, status) => {
    setGlobalQueue((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return logActivity({ ...a, status }, `STATUS_${status}`);
      })
    );
  };

  const assignAlert = (id, who) => {
    setGlobalQueue((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        return logActivity({ ...a, assignedTo: who }, `ASSIGNED_${who}`);
      })
    );
  };

  const manualEscalate = (id) => {
    setGlobalQueue((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.locked) return a; // locked means no manual bump
        const newPriority = bumpPriority(a.priority);
        return logActivity(
          { ...a, priority: newPriority },
          "MANUAL_ESCALATE"
        );
      })
    );
  };

  const buildResolution = (alert, payload) => {
    setGlobalQueue((prev) =>
      prev.map((a) => {
        if (a.id !== alert.id) return a;
        return logActivity(
          { ...a, resolution: payload },
          "RESOLUTION_BUILT"
        );
      })
    );
  };

  const resolveAndArchive = (alert) => {
    // mark resolved
    setGlobalQueue((prev) =>
      prev.map((a) =>
        a.id === alert.id
          ? logActivity({ ...a, status: "RESOLVED", resolvedAt: new Date() }, "RESOLVED")
          : a
      )
    );

    // move to archive (kept separate)
    setArchive((prev) => {
      const snap = {
        ...alert,
        status: "RESOLVED",
        resolvedAt: new Date(),
      };
      return [snap, ...prev].slice(0, 300);
    });
  };

  /* ================= FILTERS / DERIVED ================= */

  const baseQueue = useMemo(() => {
    let q = globalQueue;

    // workspace filter
    if (workspace !== "ALL") {
      q = q.filter((a) => a.companyId === workspace);
    }

    // status/priority filter
    if (filter === "OPEN") q = q.filter((a) => a.status !== "RESOLVED");
    if (filter === "BREACHED") q = q.filter((a) => (a.deadline || 0) - tick <= 0);
    if (filter === "P1") q = q.filter((a) => a.priority === "P1");

    return q;
  }, [globalQueue, workspace, filter, tick]);

  const fleetStats = useMemo(() => {
    const open = globalQueue.filter((a) => a.status !== "RESOLVED").length;
    const p1 = globalQueue.filter((a) => a.priority === "P1").length;
    const breached = globalQueue.filter((a) => (a.deadline || 0) - tick <= 0).length;
    return { open, p1, breached };
  }, [globalQueue, tick]);

  const selectedAlert = useMemo(() => {
    if (!selectedAlertId) return null;
    return globalQueue.find((a) => a.id === selectedAlertId) || null;
  }, [selectedAlertId, globalQueue]);

  /* ================= ROLE RULES (simple gating) =================
     Tier1: can Ack/Investigate only, can't Resolve
     Tier2: can Resolve, can't Assign Auto
     Supervisor: everything
  */

  const canResolve = role !== "Tier1";
  const canAssignAuto = role === "Supervisor";
  const canManualEscalate = role !== "Tier1";

  /* ================= COMPANY PLUG (ONBOARDING) ================= */

  const plugCompany = () => {
    const name = safeStr(plug.name);
    if (!name) return;

    const id = `c${Math.floor(Math.random() * 99999)}`;

    setCompanies((prev) => [{ id, name }, ...prev]);

    setCompanyState((prev) => ({
      ...prev,
      [id]: {
        risk: Math.floor(Math.random() * 20),
        containment: "STABLE",
      },
    }));

    // log an onboarding audit-style record into archive (as an example)
    setArchive((prev) => [
      {
        id: `onboard-${id}-${nowTs()}`,
        companyId: id,
        risk: 0,
        containment: "STABLE",
        priority: "P4",
        createdAt: nowTs(),
        deadline: nowTs() + slaDuration("P4"),
        status: "RESOLVED",
        assignedTo: "System",
        locked: false,
        autoEscalated: false,
        activity: [
          { time: new Date(), action: "COMPANY_PLUGGED" },
          { time: new Date(), action: `DOMAIN_${safeStr(plug.domain) || "N/A"}` },
          { time: new Date(), action: `CONTACT_${safeStr(plug.contactEmail) || "N/A"}` },
          { time: new Date(), action: `PLAN_${safeStr(plug.plan) || "Standard"}` },
          { time: new Date(), action: `SEATS_${Number(plug.seats || 0)}` },
        ],
        resolution: {
          summary: "Client onboarded into Operator Console.",
          rootCause: "N/A",
          actions: ["Provisioned tenant shell", "Initialized baseline telemetry"],
          lessons: ["Validate DNS + contact email before activation."],
        },
        resolvedAt: new Date(),
      },
      ...prev,
    ]);

    // reset form
    setPlug({
      name: "",
      domain: "",
      contactEmail: "",
      plan: "Standard",
      seats: 5,
      notes: "",
    });

    setShowOnboarding(false);
  };

  /* ================= RENDER ================= */

  return (
    <div
      style={{
        maxWidth: 1500,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console (Side Hustle)"}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="platform">Platform View</option>
            <option value="operator">Operator View</option>
          </select>

          {mode === "operator" && (
            <>
              <button className="btn" onClick={() => setShowOnboarding(true)}>
                + Plug Company
              </button>

              <button className="btn" onClick={() => setShowArchive((v) => !v)}>
                {showArchive ? "Hide Archive" : "View Archive"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= OPERATOR VIEW ================= */}

      {mode === "operator" && (
        <>
          {/* SUMMARY STRIP */}
          <div className="postureCard">
            <b>P1:</b> {fleetStats.p1} | <b>Open:</b> {fleetStats.open} |{" "}
            <b>Breached:</b> {fleetStats.breached}
          </div>

          {/* CONTROLS */}
          <div className="postureCard" style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <select value={operatorMode} onChange={(e) => setOperatorMode(e.target.value)}>
              <option value="automatic">Automatic Mode</option>
              <option value="manual">Manual Mode</option>
            </select>

            <button className="btn" onClick={() => setEnginePaused((v) => !v)}>
              {enginePaused ? "Resume Engine" : "Pause Engine"}
            </button>

            <select value={engineSpeed} onChange={(e) => setEngineSpeed(e.target.value)}>
              <option value="slow">Slow</option>
              <option value="normal">Normal</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="BREACHED">Breached</option>
              <option value="P1">P1 Only</option>
            </select>

            <select value={workspace} onChange={(e) => setWorkspace(e.target.value)}>
              <option value="ALL">Workspace: All</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  Workspace: {c.name}
                </option>
              ))}
            </select>

            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="Tier1">Role: Tier1</option>
              <option value="Tier2">Role: Tier2</option>
              <option value="Supervisor">Role: Supervisor</option>
            </select>

            <div style={{ opacity: 0.75, fontSize: 12 }}>
              Mode: <b>{operatorMode.toUpperCase()}</b>{" "}
              {operatorMode === "manual" && <span>— engine injection disabled</span>}
            </div>
          </div>

          {/* OPERATOR LAYOUT: queue + drill */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
            {/* QUEUE */}
            <div className="postureCard executivePanel">
              <h3>🔴 Global Threat Queue</h3>

              <div style={{ height: 520, overflowY: "auto", marginTop: 10 }}>
                {baseQueue.length === 0 && (
                  <div className="muted">No alerts match this filter.</div>
                )}

                {baseQueue.map((alert) => {
                  const remaining = (alert.deadline || 0) - tick;
                  const breached = remaining <= 0;
                  const selected = alert.id === selectedAlertId;

                  return (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlertId(alert.id)}
                      style={{
                        padding: 12,
                        borderBottom: "1px solid rgba(255,255,255,.06)",
                        cursor: "pointer",
                        background: selected
                          ? "rgba(120,160,255,.10)"
                          : breached
                            ? "rgba(255,0,0,.08)"
                            : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div><b>{getCompanyName(alert.companyId)}</b></div>
                          <div style={{ fontSize: 12, opacity: 0.8 }}>
                            Priority: <b>{alert.priority}</b> • SLA:{" "}
                            <b style={{ color: breached ? "#ff4d4f" : "#eaf1ff" }}>
                              {formatCountdown(remaining)}
                            </b>{" "}
                            • Status: <b>{alert.status}</b>
                            {alert.locked && <span style={{ marginLeft: 8, color: "#ffb020" }}>LOCKED</span>}
                          </div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>
                            Assigned: <b>{alert.assignedTo || "Unassigned"}</b> • Risk {alert.risk} • {alert.containment}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(alert.id, "ACKNOWLEDGED");
                            }}
                          >
                            Ack
                          </button>

                          <button
                            className="btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(alert.id, "INVESTIGATING");
                            }}
                          >
                            Investigate
                          </button>

                          <button
                            className={`btn ${canResolve ? "primary" : ""}`}
                            disabled={!canResolve}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!canResolve) return;
                              resolveAndArchive(alert);
                            }}
                          >
                            Resolve
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            assignAlert(alert.id, "You");
                          }}
                        >
                          Assign Me
                        </button>

                        <button
                          className="btn"
                          disabled={!canAssignAuto}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canAssignAuto) return;
                            assignAlert(alert.id, "Auto");
                          }}
                        >
                          Assign Auto
                        </button>

                        <button
                          className="btn warn"
                          disabled={!canManualEscalate || alert.locked}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canManualEscalate) return;
                            manualEscalate(alert.id);
                          }}
                        >
                          Escalate
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DRILL PANEL */}
            <div className="postureCard">
              <h3>🧠 Investigation</h3>

              {!selectedAlert && (
                <div className="muted" style={{ marginTop: 10 }}>
                  Click an alert to open the drill-down.
                </div>
              )}

              {selectedAlert && (
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 10 }}>
                  <div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>Company</div>
                    <b>{getCompanyName(selectedAlert.companyId)}</b>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div className="postureCard">
                      <small>Priority</small>
                      <b>{selectedAlert.priority}</b>
                    </div>
                    <div className="postureCard">
                      <small>Status</small>
                      <b>{selectedAlert.status}</b>
                    </div>
                    <div className="postureCard">
                      <small>Risk</small>
                      <b>{selectedAlert.risk}</b>
                    </div>
                    <div className="postureCard">
                      <small>Containment</small>
                      <b>{selectedAlert.containment}</b>
                    </div>
                  </div>

                  <div className="postureCard">
                    <small>Recent Activity</small>
                    <div style={{ maxHeight: 180, overflowY: "auto", marginTop: 8 }}>
                      {(selectedAlert.activity || []).slice(0, 10).map((a, idx) => (
                        <div key={idx} style={{ padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                          <small style={{ opacity: 0.7 }}>
                            {new Date(a.time).toLocaleTimeString()}
                          </small>
                          <div><b>{a.action}</b></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="postureCard">
                    <small>Resolution Builder</small>

                    <ResolutionBuilder
                      disabled={!canResolve}
                      existing={selectedAlert.resolution}
                      onSave={(payload) => buildResolution(selectedAlert, payload)}
                    />

                    <div style={{ marginTop: 10, opacity: 0.8, fontSize: 12 }}>
                      {canResolve
                        ? "Supervisor/Tier2 can save resolutions."
                        : "Tier1 cannot save resolutions."}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* INCIDENT REGISTRY */}
          <div className="postureCard">
            <h3>🚨 Escalated Incidents</h3>
            <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 10 }}>
              {incidentRegistry.length === 0 ? (
                <div className="muted">No escalated incidents.</div>
              ) : (
                incidentRegistry.slice(0, 60).map((inc) => (
                  <div key={inc.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <b>{getCompanyName(inc.companyId)}</b>{" "}
                    <span style={{ opacity: 0.7 }}>• {inc.priority}</span>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Escalated at {new Date(inc.escalatedAt || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* FLEET OVERVIEW */}
          <div className="postureCard">
            <h3>🏢 Fleet Overview</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginTop: 14,
              }}
            >
              {companies.map((c) => (
                <div key={c.id} className="postureCard">
                  <b>{c.name}</b>
                  <div style={{ marginTop: 8 }}>
                    Risk: <b>{companyState[c.id]?.risk ?? 0}</b>
                  </div>
                  <div>Status: {companyState[c.id]?.containment ?? "STABLE"}</div>
                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      onClick={() => {
                        setWorkspace(c.id);
                        setMode("operator");
                      }}
                    >
                      Focus Workspace
                    </button>
                    <button
                      className="btn"
                      onClick={() => {
                        // create a manual alert in manual mode
                        const createdAt = nowTs();
                        const priority = "P3";
                        const deadline = createdAt + slaDuration(priority);
                        const alert = {
                          id: `${c.id}-${createdAt}`,
                          companyId: c.id,
                          risk: companyState[c.id]?.risk ?? 0,
                          containment: companyState[c.id]?.containment ?? "STABLE",
                          priority,
                          createdAt,
                          deadline,
                          status: "NEW",
                          assignedTo: null,
                          locked: false,
                          autoEscalated: false,
                          activity: [{ time: new Date(), action: "MANUAL_CREATED" }],
                          resolution: null,
                        };
                        setGlobalQueue((prev) => [alert, ...prev].slice(0, 200));
                        setMode("operator");
                        setOperatorMode("manual");
                      }}
                    >
                      Manual Inject Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ARCHIVE DRAWER */}
          {showArchive && (
            <div className="postureCard executivePanel">
              <h3>🗄️ Archive</h3>
              <div style={{ height: 320, overflowY: "auto", marginTop: 10 }}>
                {archive.length === 0 ? (
                  <div className="muted">Archive is empty.</div>
                ) : (
                  archive.slice(0, 120).map((a) => (
                    <div key={a.id} style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                      <b>{getCompanyName(a.companyId)}</b>{" "}
                      <span style={{ opacity: 0.7 }}>
                        • {a.priority} • {a.status}
                      </span>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        Resolved: {a.resolvedAt ? new Date(a.resolvedAt).toLocaleString() : "N/A"}
                      </div>
                      {a.resolution?.summary && (
                        <div style={{ marginTop: 6, opacity: 0.9 }}>
                          <small style={{ opacity: 0.7 }}>Summary:</small>{" "}
                          <b>{a.resolution.summary}</b>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ONBOARDING DRAWER */}
          {showOnboarding && (
            <div className="postureCard executivePanel">
              <h3>➕ Plug Company</h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                <div>
                  <small>Company Name</small>
                  <input
                    value={plug.name}
                    onChange={(e) => setPlug((p) => ({ ...p, name: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. Acme Corp"
                  />
                </div>

                <div>
                  <small>Domain</small>
                  <input
                    value={plug.domain}
                    onChange={(e) => setPlug((p) => ({ ...p, domain: e.target.value }))}
                    style={inputStyle}
                    placeholder="e.g. acme.com"
                  />
                </div>

                <div>
                  <small>Contact Email</small>
                  <input
                    value={plug.contactEmail}
                    onChange={(e) => setPlug((p) => ({ ...p, contactEmail: e.target.value }))}
                    style={inputStyle}
                    placeholder="security@acme.com"
                  />
                </div>

                <div>
                  <small>Plan</small>
                  <select
                    value={plug.plan}
                    onChange={(e) => setPlug((p) => ({ ...p, plan: e.target.value }))}
                    style={inputStyle}
                  >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Enterprise</option>
                  </select>
                </div>

                <div>
                  <small>Seats</small>
                  <input
                    type="number"
                    value={plug.seats}
                    onChange={(e) => setPlug((p) => ({ ...p, seats: Number(e.target.value || 0) }))}
                    style={inputStyle}
                    min={1}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <small>Notes</small>
                  <textarea
                    value={plug.notes}
                    onChange={(e) => setPlug((p) => ({ ...p, notes: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 80 }}
                    placeholder="Anything special about this customer..."
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className="btn primary" onClick={plugCompany}>
                  Plug Company
                </button>
                <button className="btn" onClick={() => setShowOnboarding(false)}>
                  Cancel
                </button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                Right now this is mocked. When we connect backend, this becomes: create tenant + store contact + plan + seats.
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= PLATFORM VIEW ================= */}

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

/* ================= SMALL INTERNAL COMPONENTS ================= */

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.04)",
  color: "#eaf1ff",
  outline: "none",
  marginTop: 6,
};

function ResolutionBuilder({ disabled, existing, onSave }) {
  const [summary, setSummary] = useState(existing?.summary || "");
  const [rootCause, setRootCause] = useState(existing?.rootCause || "");
  const [actions, setActions] = useState((existing?.actions || []).join("\n"));
  const [lessons, setLessons] = useState((existing?.lessons || []).join("\n"));

  useEffect(() => {
    setSummary(existing?.summary || "");
    setRootCause(existing?.rootCause || "");
    setActions((existing?.actions || []).join("\n"));
    setLessons((existing?.lessons || []).join("\n"));
  }, [existing?.summary]); // light reset when new alert selected

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
        <div>
          <small>Summary</small>
          <input
            disabled={disabled}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={inputStyle}
            placeholder="What happened / what we did"
          />
        </div>

        <div>
          <small>Root Cause</small>
          <input
            disabled={disabled}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            style={inputStyle}
            placeholder="Why it happened"
          />
        </div>

        <div>
          <small>Actions Taken (one per line)</small>
          <textarea
            disabled={disabled}
            value={actions}
            onChange={(e) => setActions(e.target.value)}
            style={{ ...inputStyle, minHeight: 70 }}
            placeholder="Isolated endpoint...\nReset credentials..."
          />
        </div>

        <div>
          <small>Lessons Learned (one per line)</small>
          <textarea
            disabled={disabled}
            value={lessons}
            onChange={(e) => setLessons(e.target.value)}
            style={{ ...inputStyle, minHeight: 70 }}
            placeholder="Add MFA...\nTighten IAM roles..."
          />
        </div>
      </div>

      <button
        className="btn primary"
        disabled={disabled}
        style={{ marginTop: 10 }}
        onClick={() =>
          onSave({
            summary: summary.trim(),
            rootCause: rootCause.trim(),
            actions: actions
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
            lessons: lessons
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
      >
        Save Resolution
      </button>
    </div>
  );
}
