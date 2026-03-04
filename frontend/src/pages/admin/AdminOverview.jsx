// frontend/src/pages/admin/AdminOverview.jsx
// Executive Command Center — SAFE REBUILD (FIXED + ENHANCED)
//
// Includes:
// - Platform View + Operator View
// - Operator Panels (Queue/Fleet/Notifications/Email/Archive)
// - Work Policy Gating (Option B: NO auto alerts outside hours)
// - Company signals (Green/Yellow/Red) + overload ring
// - Notifications board + Email cabinet (per company)
// - Archive + Incident registry
// - Branch selector (per company) + "Seat/Branch" clarity
// - Auto-hide temporary tools (Plug Company auto-closes when leaving Operator View)
// NOTE: Self-contained in this file (no new pages)

import React, { useEffect, useMemo, useRef, useState } from "react";
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

function makeId(prefix = "id") {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${nowTs()}`;
}

function dayLabel(d) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d] || String(d);
}

/* ================= BRANCHES (Job/Seat types) ================= */

const BRANCHES = [
  "Threat Response",
  "Security Analysis",
  "SOC Operator",
  "Incident Management",
  "Client Communications",
];

function normalizeBranches(arr) {
  const a = Array.isArray(arr) ? arr.map(safeStr).filter(Boolean) : [];
  const uniq = Array.from(new Set(a));
  return uniq.length ? uniq : ["Threat Response"];
}

/* ================= WORK POLICY (Option B) ================= */

const DEFAULT_POLICY = {
  timezone: "Local",
  workDays: [1, 2, 3, 4, 5],
  startHour: 9,
  endHour: 17, // exclusive
  vacationMode: false,
};

function normalizePolicy(policy) {
  const p = policy || {};
  const startHour = Number.isFinite(Number(p.startHour)) ? Number(p.startHour) : 9;
  const endHour = Number.isFinite(Number(p.endHour)) ? Number(p.endHour) : 17;

  return {
    timezone: safeStr(p.timezone) || "Local",
    workDays: Array.isArray(p.workDays) && p.workDays.length ? p.workDays : [1, 2, 3, 4, 5],
    startHour,
    endHour,
    vacationMode: Boolean(p.vacationMode),
  };
}

function isWithinWorkWindow(company) {
  const policy = normalizePolicy(company?.policy);
  if (policy.vacationMode) return false;

  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (!policy.workDays.includes(day)) return false;
  if (hour < policy.startHour || hour >= policy.endHour) return false;

  return true;
}

function policyBadge(company) {
  const policy = normalizePolicy(company?.policy);
  if (policy.vacationMode) return { label: "VACATION MODE", tone: "warn" };
  return isWithinWorkWindow(company)
    ? { label: "ACTIVE WINDOW", tone: "ok" }
    : { label: "OUTSIDE HOURS", tone: "muted" };
}

/* ================= SIGNALS (Green/Yellow/Red) =================
   - Red: overload (too many threats)
   - Yellow: pending email draft exists
   - Green: controlled
*/

function dotStyle(level) {
  const base = {
    width: 10,
    height: 10,
    borderRadius: 999,
    display: "inline-block",
    marginRight: 8,
    border: "1px solid rgba(255,255,255,.25)",
    background: "rgba(255,255,255,.18)",
  };
  if (level === "GREEN") return { ...base, background: "rgba(60,255,150,.65)" };
  if (level === "YELLOW") return { ...base, background: "rgba(255,210,60,.75)" };
  return { ...base, background: "rgba(255,70,70,.75)" };
}

/* ================= COMPONENT ================= */

export default function AdminOverview() {
  const { integrityAlert } = useSecurity();

  // platform | operator
  const [mode, setMode] = useState("platform");

  // operator panels
  const [operatorPanel, setOperatorPanel] = useState("queue"); // queue | fleet | notifications | email | archive

  // automatic | manual
  const [operatorMode, setOperatorMode] = useState("automatic");

  // controls
  const [tick, setTick] = useState(Date.now());
  const [enginePaused, setEnginePaused] = useState(false);
  const [engineSpeed, setEngineSpeed] = useState("normal"); // slow | normal | aggressive
  const [filter, setFilter] = useState("ALL"); // ALL | OPEN | BREACHED | P1
  const [workspace, setWorkspace] = useState("ALL");
  const [role, setRole] = useState("Supervisor"); // Tier1 | Tier2 | Supervisor

  // UI
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // comms selection
  const [selectedCompanyForComms, setSelectedCompanyForComms] = useState("ALL");
  const [selectedEmailId, setSelectedEmailId] = useState(null);

  // per-company selected branch (job seat)
  const [activeBranchByCompany, setActiveBranchByCompany] = useState({});

  // companies
  const [companies, setCompanies] = useState([
    {
      id: "c1",
      name: "Alpha Systems",
      policy: { ...DEFAULT_POLICY, startHour: 9, endHour: 17 },
      meta: {
        contactEmail: "security@alpha.com",
        companyNumber: 100001,
        engagement: "Standard",
        seats: 1,
        branches: ["Threat Response", "Security Analysis"],
      },
    },
    {
      id: "c2",
      name: "Beta Holdings",
      policy: { ...DEFAULT_POLICY, startHour: 8, endHour: 16 },
      meta: {
        contactEmail: "security@beta.com",
        companyNumber: 100002,
        engagement: "Standard",
        seats: 1,
        branches: ["Threat Response"],
      },
    },
    {
      id: "c3",
      name: "Gamma Logistics",
      policy: { ...DEFAULT_POLICY, startHour: 9, endHour: 18 },
      meta: {
        contactEmail: "security@gamma.com",
        companyNumber: 100003,
        engagement: "Premium",
        seats: 2,
        branches: ["SOC Operator", "Incident Management"],
      },
    },
    {
      id: "c4",
      name: "Delta Finance",
      policy: { ...DEFAULT_POLICY, startHour: 9, endHour: 17 },
      meta: {
        contactEmail: "security@delta.com",
        companyNumber: 100004,
        engagement: "Enterprise",
        seats: 3,
        branches: ["Threat Response", "Client Communications"],
      },
    },
  ]);

  // onboarding form
  const [plug, setPlug] = useState({
    name: "",
    domain: "",
    contactEmail: "",
    engagement: "Standard", // renamed from plan (same dropdown, clearer meaning)
    seats: 1,
    notes: "",

    // branches
    branches: ["Threat Response"],

    // policy
    timezone: "Local",
    startHour: 9,
    endHour: 17,
    workDays: [1, 2, 3, 4, 5],
    vacationMode: false,
  });

  const speedMap = useMemo(
    () => ({
      slow: 20000,
      normal: 12000,
      aggressive: 6000,
    }),
    []
  );

  // posture per company
  const [companyState, setCompanyState] = useState(() => {
    const initial = {};
    (companies || []).forEach((c) => {
      initial[c.id] = { risk: Math.floor(Math.random() * 40), containment: "STABLE" };
    });
    return initial;
  });

  // queues + records
  const [globalQueue, setGlobalQueue] = useState([]);
  const [incidentRegistry, setIncidentRegistry] = useState([]);
  const [archive, setArchive] = useState([]);

  // comms storage (per company)
  // { [companyId]: { notifications: [], emails: [] } }
  const [companyComms, setCompanyComms] = useState({});

  // overload edge memory
  const overloadRef = useRef({}); // { [companyId]: boolean }

  /* ================= AUTO-HIDE TEMP TOOLS ================= */
  useEffect(() => {
    // leaving operator view? hide onboarding + close email selection
    if (mode !== "operator") {
      setShowOnboarding(false);
      setSelectedEmailId(null);
      setSelectedCompanyForComms("ALL");
    }
  }, [mode]);

  /* ================= KEEP COMMS KEYS IN SYNC ================= */
  useEffect(() => {
    setCompanyComms((prev) => {
      const next = { ...prev };
      (companies || []).forEach((c) => {
        if (!next[c.id]) next[c.id] = { notifications: [], emails: [] };
      });
      return next;
    });

    // set default active branch per company if missing
    setActiveBranchByCompany((prev) => {
      const next = { ...prev };
      (companies || []).forEach((c) => {
        const branches = normalizeBranches(c?.meta?.branches);
        if (!next[c.id]) next[c.id] = branches[0];
      });
      return next;
    });
  }, [companies]);

  /* ================= GLOBAL CLOCK ================= */

  useEffect(() => {
    const timer = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ================= THREAT ENGINE =================
     - Operator view + automatic mode only
     - Option B: per-company gating (hours/days/vacation)
  */

  useEffect(() => {
    const active = mode === "operator" && !enginePaused && operatorMode === "automatic";
    if (!active) return;

    const interval = setInterval(() => {
      setCompanyState((prev) => {
        const updated = { ...prev };
        const newAlerts = [];

        (companies || []).forEach((company) => {
          const id = company.id;

          // Option B: do NOT generate outside window
          if (!isWithinWorkWindow(company)) return;

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
              status: "NEW",
              assignedTo: null,
              locked: false,
              autoEscalated: false,
              activity: [{ time: new Date(), action: "CREATED" }],
              resolution: null,
            });
          }
        });

        if (newAlerts.length) {
          setGlobalQueue((prevQ) => [...newAlerts, ...prevQ].slice(0, 200));
        }

        return updated;
      });
    }, speedMap[engineSpeed]);

    return () => clearInterval(interval);
  }, [mode, enginePaused, operatorMode, engineSpeed, speedMap, companies]);

  /* ================= SLA AUTO ESCALATION ================= */

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
            locked: true,
            activity: [{ time: new Date(), action: "AUTO_ESCALATED_LOCKED" }, ...(alert.activity || [])],
          };

          setIncidentRegistry((prevInc) => [{ ...escalated, escalatedAt: new Date() }, ...prevInc]);
          return escalated;
        }

        return alert;
      })
    );
  }, [tick, mode, operatorMode]);

  /* ================= HELPERS ================= */

  const getCompany = (companyId) => companies.find((c) => c.id === companyId) || null;
  const getCompanyName = (companyId) => getCompany(companyId)?.name || companyId;

  const logActivity = (alert, action) => ({
    ...alert,
    activity: [{ time: new Date(), action }, ...(alert.activity || [])],
  });

  const updateStatus = (id, status) => {
    setGlobalQueue((prev) =>
      prev.map((a) => (a.id !== id ? a : logActivity({ ...a, status }, `STATUS_${status}`)))
    );
  };

  const assignAlert = (id, who) => {
    setGlobalQueue((prev) =>
      prev.map((a) => (a.id !== id ? a : logActivity({ ...a, assignedTo: who }, `ASSIGNED_${who}`)))
    );
  };

  const manualEscalate = (id) => {
    setGlobalQueue((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        if (a.locked) return a;
        const newPriority = bumpPriority(a.priority);
        return logActivity({ ...a, priority: newPriority }, "MANUAL_ESCALATE");
      })
    );
  };

  const buildResolution = (alert, payload) => {
    setGlobalQueue((prev) =>
      prev.map((a) => (a.id !== alert.id ? a : logActivity({ ...a, resolution: payload }, "RESOLUTION_BUILT")))
    );
  };

  const resolveAndArchive = (alert) => {
    setGlobalQueue((prev) =>
      prev.map((a) =>
        a.id === alert.id ? logActivity({ ...a, status: "RESOLVED", resolvedAt: new Date() }, "RESOLVED") : a
      )
    );
    setArchive((prev) => [{ ...alert, status: "RESOLVED", resolvedAt: new Date() }, ...prev].slice(0, 300));
  };

  const ensureComms = (companyId) => {
    setCompanyComms((prev) => {
      if (prev[companyId]) return prev;
      return { ...prev, [companyId]: { notifications: [], emails: [] } };
    });
  };

  const addNotification = (companyId, note) => {
    ensureComms(companyId);
    setCompanyComms((prev) => {
      const cur = prev[companyId] || { notifications: [], emails: [] };
      return {
        ...prev,
        [companyId]: { ...cur, notifications: [note, ...(cur.notifications || [])].slice(0, 300) },
      };
    });
  };

  const addEmail = (companyId, email) => {
    ensureComms(companyId);
    setCompanyComms((prev) => {
      const cur = prev[companyId] || { notifications: [], emails: [] };
      return { ...prev, [companyId]: { ...cur, emails: [email, ...(cur.emails || [])].slice(0, 300) } };
    });
  };

  const updateEmail = (companyId, emailId, patch) => {
    setCompanyComms((prev) => {
      const cur = prev[companyId];
      if (!cur) return prev;
      return {
        ...prev,
        [companyId]: {
          ...cur,
          emails: (cur.emails || []).map((e) => (e.id === emailId ? { ...e, ...patch } : e)),
        },
      };
    });
  };

  const markNotificationRead = (companyId, noteId) => {
    setCompanyComms((prev) => {
      const cur = prev[companyId];
      if (!cur) return prev;
      return {
        ...prev,
        [companyId]: {
          ...cur,
          notifications: (cur.notifications || []).map((n) => (n.id === noteId ? { ...n, read: true } : n)),
        },
      };
    });
  };

  const sendEmail = (companyId, emailId) => {
    updateEmail(companyId, emailId, { status: "SENT", sentAt: nowTs() });
    addNotification(companyId, {
      id: makeId("note"),
      createdAt: nowTs(),
      severity: "GREEN",
      title: "Email sent",
      message: `Email ${emailId} marked as SENT.`,
      linkedEmailId: emailId,
      read: false,
    });
  };

  const cancelEmail = (companyId, emailId) => {
    updateEmail(companyId, emailId, { status: "CANCELLED", cancelledAt: nowTs() });
    addNotification(companyId, {
      id: makeId("note"),
      createdAt: nowTs(),
      severity: "YELLOW",
      title: "Email cancelled",
      message: `Draft ${emailId} cancelled.`,
      linkedEmailId: emailId,
      read: false,
    });
  };

  /* ================= DERIVED FILTERS ================= */

  const baseQueue = useMemo(() => {
    let q = globalQueue;
    if (workspace !== "ALL") q = q.filter((a) => a.companyId === workspace);
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

  /* ================= COMPANY METRICS + SIGNALS ================= */

  const companyMetrics = useMemo(() => {
    const map = {};
    (companies || []).forEach((c) => (map[c.id] = { open: 0, p1: 0, breached: 0 }));
    (globalQueue || []).forEach((a) => {
      if (!a?.companyId) return;
      if (!map[a.companyId]) map[a.companyId] = { open: 0, p1: 0, breached: 0 };
      if (a.status !== "RESOLVED") map[a.companyId].open += 1;
      if (a.priority === "P1") map[a.companyId].p1 += 1;
      if ((a.deadline || 0) - tick <= 0) map[a.companyId].breached += 1;
    });
    return map;
  }, [companies, globalQueue, tick]);

  const companySignals = useMemo(() => {
    const sig = {};
    (companies || []).forEach((c) => {
      const m = companyMetrics[c.id] || { open: 0, p1: 0, breached: 0 };
      const overload = m.p1 >= 2 || m.open >= 10;
      const comms = companyComms[c.id] || { notifications: [], emails: [] };
      const hasDraft = (comms.emails || []).some((e) => e.status === "DRAFT");

      let level = "GREEN";
      if (overload) level = "RED";
      else if (hasDraft) level = "YELLOW";

      sig[c.id] = { level, overload, metrics: m, hasDraft };
    });
    return sig;
  }, [companies, companyMetrics, companyComms]);

  /* ================= OVERLOAD AUTO DRAFT (EDGE TRIGGER) ================= */

  useEffect(() => {
    (companies || []).forEach((c) => {
      const cs = companySignals[c.id];
      if (!cs) return;

      const prevOver = Boolean(overloadRef.current[c.id]);
      const nowOver = Boolean(cs.overload);

      if (!prevOver && nowOver) {
        const companyId = c.id;
        const companyName = getCompanyName(companyId);

        const comms = companyComms[companyId] || { emails: [], notifications: [] };
        const alreadyDraft = (comms.emails || []).some((e) => e.status === "DRAFT" && e.kind === "OVERLOAD");

        if (!alreadyDraft) {
          const emailId = makeId("email");
          addEmail(companyId, {
            id: emailId,
            kind: "OVERLOAD",
            status: "DRAFT",
            createdAt: nowTs(),
            to: safeStr(c?.meta?.contactEmail),
            subject: `[URGENT] Elevated Threat Volume Detected — ${companyName}`,
            body: [
              `Hello ${companyName} Security Team,`,
              ``,
              `AutoProtect detected elevated threat volume for your environment.`,
              ``,
              `Snapshot:`,
              `- Open items: ${cs.metrics.open}`,
              `- P1 items: ${cs.metrics.p1}`,
              `- SLA breached: ${cs.metrics.breached}`,
              ``,
              `Recommended immediate actions:`,
              `1) Review recent authentication + privilege changes`,
              `2) Validate suspicious IPs / geos and block where appropriate`,
              `3) Rotate credentials if any compromise suspected`,
              `4) Confirm MFA enforcement and monitor admin endpoints`,
              ``,
              `This message is drafted by AutoProtect and awaiting approval.`,
              ``,
              `— Admin Operator Console`,
            ].join("\n"),
          });

          addNotification(companyId, {
            id: makeId("note"),
            createdAt: nowTs(),
            severity: "RED",
            title: "Overload detected",
            message: `High threat volume detected. AutoProtect drafted an urgent email (approval required).`,
            linkedEmailId: emailId,
            read: false,
          });
        }
      }

      overloadRef.current[c.id] = nowOver;
    });
  }, [companies, companySignals, companyComms]); // safe deps

  /* ================= ROLE RULES ================= */

  const canResolve = role !== "Tier1";
  const canAssignAuto = role === "Supervisor";
  const canManualEscalate = role !== "Tier1";

  /* ================= ONBOARDING ================= */

  const toggleWorkDay = (day) => {
    setPlug((p) => {
      const set = new Set(p.workDays || []);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...p, workDays: Array.from(set).sort((a, b) => a - b) };
    });
  };

  const toggleBranch = (branchName) => {
    setPlug((p) => {
      const set = new Set(normalizeBranches(p.branches));
      if (set.has(branchName)) set.delete(branchName);
      else set.add(branchName);
      const next = normalizeBranches(Array.from(set));
      return { ...p, branches: next };
    });
  };

  const plugCompany = () => {
    const name = safeStr(plug.name);
    if (!name) return;

    const id = `c${Math.floor(Math.random() * 99999)}`;
    const companyNumber = Math.floor(Math.random() * 900000 + 100000);

    const branches = normalizeBranches(plug.branches);

    const newCompany = {
      id,
      name,
      policy: normalizePolicy({
        timezone: plug.timezone,
        startHour: Number(plug.startHour),
        endHour: Number(plug.endHour),
        workDays: plug.workDays,
        vacationMode: plug.vacationMode,
      }),
      meta: {
        contactEmail: safeStr(plug.contactEmail),
        domain: safeStr(plug.domain),
        engagement: safeStr(plug.engagement) || "Standard",
        seats: Number(plug.seats || 1),
        notes: safeStr(plug.notes),
        companyNumber,
        branches,
      },
    };

    setCompanies((prev) => [newCompany, ...prev]);

    setCompanyState((prev) => ({
      ...prev,
      [id]: { risk: Math.floor(Math.random() * 20), containment: "STABLE" },
    }));

    setCompanyComms((prev) => ({
      ...prev,
      [id]: { notifications: [], emails: [] },
    }));

    setActiveBranchByCompany((prev) => ({
      ...prev,
      [id]: branches[0],
    }));

    // audit record into archive
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
          { time: new Date(), action: `ENGAGEMENT_${safeStr(plug.engagement) || "Standard"}` },
          { time: new Date(), action: `SEATS_${Number(plug.seats || 1)}` },
          { time: new Date(), action: `BRANCHES_${branches.join("_")}` },
          { time: new Date(), action: `WORKDAYS_${(plug.workDays || []).map(dayLabel).join("_")}` },
          { time: new Date(), action: `WORKHOURS_${Number(plug.startHour)}-${Number(plug.endHour)}` },
          { time: new Date(), action: plug.vacationMode ? "VACATION_ON" : "VACATION_OFF" },
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

    // reset
    setPlug({
      name: "",
      domain: "",
      contactEmail: "",
      engagement: "Standard",
      seats: 1,
      notes: "",
      branches: ["Threat Response"],
      timezone: "Local",
      startHour: 9,
      endHour: 17,
      workDays: [1, 2, 3, 4, 5],
      vacationMode: false,
    });

    setShowOnboarding(false);

    // jump to fleet so you see the new card
    setMode("operator");
    setOperatorPanel("fleet");
  };

  /* ================= BRANCH SELECTOR (Operator) ================= */
  const activeCompany = workspace !== "ALL" ? getCompany(workspace) : null;
  const activeCompanyBranches = normalizeBranches(activeCompany?.meta?.branches);
  const activeBranch = activeCompany ? (activeBranchByCompany[activeCompany.id] || activeCompanyBranches[0]) : "";

  const setActiveBranch = (companyId, branchName) => {
    const b = safeStr(branchName);
    if (!b) return;
    setActiveBranchByCompany((prev) => ({ ...prev, [companyId]: b }));
  };

  /* ================= RENDER ================= */

  return (
    <div
      style={{
        maxWidth: 1500,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div className="sectionTitle">
          {mode === "platform" ? "Platform Command Center" : "Operator Console (Side Hustle)"}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="platform">Platform View</option>
            <option value="operator">Operator View</option>
          </select>

          {mode === "operator" && (
            <>
              <button className="btn" onClick={() => setShowOnboarding(true)}>
                + Plug Company
              </button>

              <select value={operatorPanel} onChange={(e) => setOperatorPanel(e.target.value)}>
                <option value="queue">Panel: Queue</option>
                <option value="fleet">Panel: Fleet</option>
                <option value="notifications">Panel: Notifications</option>
                <option value="email">Panel: Email Cabinet</option>
                <option value="archive">Panel: Archive</option>
              </select>

              {/* Branch selector appears when you focus a company */}
              {activeCompany && (
                <select
                  value={activeBranch}
                  onChange={(e) => setActiveBranch(activeCompany.id, e.target.value)}
                  title="Which job/branch you are working for this company"
                >
                  {activeCompanyBranches.map((b) => (
                    <option key={b} value={b}>
                      Branch: {b}
                    </option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      </div>

      {/* ================= OPERATOR VIEW ================= */}
      {mode === "operator" && (
        <>
          {/* Summary Strip */}
          <div className="postureCard">
            <b>P1:</b> {fleetStats.p1} | <b>Open:</b> {fleetStats.open} | <b>Breached:</b> {fleetStats.breached}
          </div>

          {/* Controls */}
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

            <select
              value={workspace}
              onChange={(e) => {
                const next = e.target.value;
                setWorkspace(next);
                // If they change workspace away from a company, keep branch selector clean
                if (next === "ALL") setSelectedAlertId(null);
              }}
            >
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
              {activeCompany && (
                <>
                  {" "}
                  • Active Branch: <b>{activeBranch}</b>
                </>
              )}
            </div>
          </div>

          {/* ===== QUEUE PANEL ===== */}
          {operatorPanel === "queue" && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
              {/* Queue */}
              <div className="postureCard executivePanel">
                <h3>🔴 Global Threat Queue</h3>

                <div style={{ height: 520, overflowY: "auto", marginTop: 10 }}>
                  {baseQueue.length === 0 && <div className="muted">No alerts match this filter.</div>}

                  {baseQueue.map((alert) => {
                    const remaining = (alert.deadline || 0) - tick;
                    const breached = remaining <= 0;
                    const selected = alert.id === selectedAlertId;
                    const sig = companySignals[alert.companyId]?.level || "GREEN";

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
                            <div style={{ display: "flex", alignItems: "center" }}>
                              <span style={dotStyle(sig)} />
                              <b>{getCompanyName(alert.companyId)}</b>
                            </div>

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

                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
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

              {/* Drill */}
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
                            <small style={{ opacity: 0.7 }}>{new Date(a.time).toLocaleTimeString()}</small>
                            <div>
                              <b>{a.action}</b>
                            </div>
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
                        {canResolve ? "Supervisor/Tier2 can save resolutions." : "Tier1 cannot save resolutions."}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== INCIDENT REGISTRY ===== */}
          <div className="postureCard">
            <h3>🚨 Escalated Incidents</h3>
            <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 10 }}>
              {incidentRegistry.length === 0 ? (
                <div className="muted">No escalated incidents.</div>
              ) : (
                incidentRegistry.slice(0, 60).map((inc) => (
                  <div key={inc.id} style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                    <b>{getCompanyName(inc.companyId)}</b> <span style={{ opacity: 0.7 }}>• {inc.priority}</span>
                    <div style={{ fontSize: 12, opacity: 0.75 }}>
                      Escalated at {new Date(inc.escalatedAt || Date.now()).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ===== FLEET PANEL ===== */}
          {operatorPanel === "fleet" && (
            <div className="postureCard">
              <h3>🏢 Fleet Overview</h3>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                  marginTop: 14,
                }}
              >
                {companies.map((c) => {
                  const badge = policyBadge(c);
                  const pol = normalizePolicy(c.policy);

                  const sig = companySignals[c.id] || {
                    level: "GREEN",
                    overload: false,
                    metrics: { open: 0, p1: 0, breached: 0 },
                  };

                  const branches = normalizeBranches(c?.meta?.branches);
                  const active = activeBranchByCompany[c.id] || branches[0];

                  return (
                    <div
                      key={c.id}
                      className="postureCard"
                      style={{
                        outline: sig.overload ? "2px solid rgba(255,70,70,.75)" : "none",
                        boxShadow: sig.overload ? "0 0 0 4px rgba(255,70,70,.10)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={dotStyle(sig.level)} />
                          <b>{c.name}</b>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>#{safeStr(c?.meta?.companyNumber || "—")}</div>
                      </div>

                      <div style={{ marginTop: 8 }}>
                        Risk: <b>{companyState[c.id]?.risk ?? 0}</b>
                      </div>
                      <div>Status: {companyState[c.id]?.containment ?? "STABLE"}</div>

                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                        Policy:{" "}
                        <b className={badge.tone === "warn" ? "badge warn" : badge.tone === "ok" ? "badge ok" : "muted"}>
                          {badge.label}
                        </b>
                      </div>

                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                        Hours: {pol.startHour}:00–{pol.endHour}:00 • Days: {pol.workDays.map(dayLabel).join(", ")}
                      </div>

                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.85 }}>
                        Branch Seat: <b>{active}</b> • Seats: <b>{Number(c?.meta?.seats || 1)}</b> • Engagement:{" "}
                        <b>{safeStr(c?.meta?.engagement || "Standard")}</b>
                      </div>

                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85 }}>
                        Threat Snapshot: <b>Open</b> {sig.metrics.open} • <b>P1</b> {sig.metrics.p1} •{" "}
                        <b>Breached</b> {sig.metrics.breached}
                      </div>

                      <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="btn"
                          onClick={() => {
                            setWorkspace(c.id);
                            setOperatorPanel("queue");
                          }}
                        >
                          Focus Workspace
                        </button>

                        <button
                          className="btn"
                          onClick={() => {
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
                            setOperatorMode("manual");
                            setOperatorPanel("queue");
                          }}
                        >
                          Manual Inject Alert
                        </button>

                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedCompanyForComms(c.id);
                            setOperatorPanel("notifications");
                          }}
                        >
                          Notifications
                        </button>

                        <button
                          className="btn"
                          onClick={() => {
                            setSelectedCompanyForComms(c.id);
                            setOperatorPanel("email");
                          }}
                        >
                          Email Cabinet
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== NOTIFICATIONS PANEL ===== */}
          {operatorPanel === "notifications" && (
            <NotificationBoard
              companies={companies}
              comms={companyComms}
              selectedCompany={selectedCompanyForComms}
              setSelectedCompany={setSelectedCompanyForComms}
              getCompanyName={getCompanyName}
              signals={companySignals}
              onOpenEmail={(companyId, emailId) => {
                setSelectedCompanyForComms(companyId);
                setSelectedEmailId(emailId);
                setOperatorPanel("email");
              }}
              onMarkRead={markNotificationRead}
            />
          )}

          {/* ===== EMAIL PANEL ===== */}
          {operatorPanel === "email" && (
            <EmailCabinet
              companies={companies}
              comms={companyComms}
              selectedCompany={selectedCompanyForComms}
              setSelectedCompany={setSelectedCompanyForComms}
              selectedEmailId={selectedEmailId}
              setSelectedEmailId={setSelectedEmailId}
              getCompanyName={getCompanyName}
              onUpdateEmail={updateEmail}
              onSend={sendEmail}
              onCancel={cancelEmail}
              onNewDraft={(companyId) => {
                const c = getCompany(companyId);
                if (!c) return;

                const emailId = makeId("email");
                addEmail(companyId, {
                  id: emailId,
                  kind: "MANUAL",
                  status: "DRAFT",
                  createdAt: nowTs(),
                  to: safeStr(c?.meta?.contactEmail),
                  subject: `Update from AutoProtect — ${c.name}`,
                  body:
                    `Hello ${c.name} Security Team,\n\n` +
                    `AutoProtect drafted an update for your review.\n\n` +
                    `Summary:\n- \n\n` +
                    `Actions recommended:\n- \n\n` +
                    `— Admin Operator Console`,
                });

                addNotification(companyId, {
                  id: makeId("note"),
                  createdAt: nowTs(),
                  severity: "YELLOW",
                  title: "Manual draft created",
                  message: `A manual email draft was created.`,
                  linkedEmailId: emailId,
                  read: false,
                });

                setSelectedCompanyForComms(companyId);
                setSelectedEmailId(emailId);
              }}
            />
          )}

          {/* ===== ARCHIVE PANEL ===== */}
          {operatorPanel === "archive" && (
            <div className="postureCard executivePanel">
              <h3>🗄️ Archive</h3>
              <div style={{ height: 420, overflowY: "auto", marginTop: 10 }}>
                {archive.length === 0 ? (
                  <div className="muted">Archive is empty.</div>
                ) : (
                  archive.slice(0, 200).map((a) => (
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
                          <small style={{ opacity: 0.7 }}>Summary:</small> <b>{a.resolution.summary}</b>
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
                  <small>Engagement Level</small>
                  <select
                    value={plug.engagement}
                    onChange={(e) => setPlug((p) => ({ ...p, engagement: e.target.value }))}
                    style={inputStyle}
                    title="Not selling a product — this is how heavy the contract/coverage is for this company"
                  >
                    <option>Standard</option>
                    <option>Premium</option>
                    <option>Enterprise</option>
                  </select>
                </div>

                <div>
                  <small>Seats (how many roles you cover)</small>
                  <input
                    type="number"
                    value={plug.seats}
                    onChange={(e) => setPlug((p) => ({ ...p, seats: Number(e.target.value || 1) }))}
                    style={inputStyle}
                    min={1}
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <small>Branches (which job dashboards this company hired you for)</small>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                    {BRANCHES.map((b) => {
                      const active = normalizeBranches(plug.branches).includes(b);
                      return (
                        <button
                          key={b}
                          type="button"
                          className={`btn ${active ? "primary" : ""}`}
                          onClick={() => toggleBranch(b)}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
                    Selected: <b>{normalizeBranches(plug.branches).join(", ")}</b>
                  </div>
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

                {/* POLICY */}
                <div>
                  <small>Timezone</small>
                  <input
                    value={plug.timezone}
                    onChange={(e) => setPlug((p) => ({ ...p, timezone: e.target.value }))}
                    style={inputStyle}
                    placeholder="Local (later: America/New_York)"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <small>Start Hour (0-23)</small>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={plug.startHour}
                      onChange={(e) => setPlug((p) => ({ ...p, startHour: Number(e.target.value || 0) }))}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <small>End Hour (1-24)</small>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={plug.endHour}
                      onChange={(e) => setPlug((p) => ({ ...p, endHour: Number(e.target.value || 0) }))}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <small>Work Days</small>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                      const active = (plug.workDays || []).includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          className={`btn ${active ? "primary" : ""}`}
                          onClick={() => toggleWorkDay(d)}
                        >
                          {dayLabel(d)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={plug.vacationMode}
                    onChange={(e) => setPlug((p) => ({ ...p, vacationMode: e.target.checked }))}
                  />
                  <small>Vacation Mode (no alerts generated)</small>
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
                Policy is enforced in Automatic Mode: alerts only generate during the company’s active work window.
              </div>
            </div>
          )}
        </>
      )}

      {/* ================= PLATFORM VIEW ================= */}
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

/* ================= STYLES ================= */

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

/* ================= RESOLUTION BUILDER ================= */

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
  }, [existing?.summary, existing?.rootCause]);

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
            actions: actions.split("\n").map((s) => s.trim()).filter(Boolean),
            lessons: lessons.split("\n").map((s) => s.trim()).filter(Boolean),
          })
        }
      >
        Save Resolution
      </button>
    </div>
  );
}

/* ================= NOTIFICATION BOARD ================= */

function NotificationBoard({
  companies,
  comms,
  selectedCompany,
  setSelectedCompany,
  getCompanyName,
  signals,
  onOpenEmail,
  onMarkRead,
}) {
  const companyIds = (companies || []).map((c) => c.id);
  const scopeIds = selectedCompany === "ALL" ? companyIds : [selectedCompany];

  const rows = useMemo(() => {
    const out = [];
    scopeIds.forEach((cid) => {
      const notes = comms[cid]?.notifications || [];
      notes.forEach((n) => out.push({ companyId: cid, ...n }));
    });
    out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return out.slice(0, 400);
  }, [scopeIds, comms]);

  return (
    <div className="postureCard executivePanel">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>🔔 Notifications</h3>

        <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
          <option value="ALL">All Companies</option>
          {(companies || []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 12, height: 520, overflowY: "auto" }}>
        {rows.length === 0 ? (
          <div className="muted">No notifications.</div>
        ) : (
          rows.map((n) => {
            const sig = signals?.[n.companyId]?.level || "GREEN";
            return (
              <div key={n.id} style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {new Date(n.createdAt || Date.now()).toLocaleString()}
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <span style={dotStyle(sig)} />
                      <b>{getCompanyName(n.companyId)}</b>
                      {!n.read && (
                        <span style={{ marginLeft: 8 }}>
                          <b>NEW</b>
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <b>{n.title}</b>
                    </div>
                    <div style={{ opacity: 0.85, marginTop: 4 }}>{n.message}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {n.linkedEmailId && (
                      <button className="btn" onClick={() => onOpenEmail(n.companyId, n.linkedEmailId)}>
                        Open Draft
                      </button>
                    )}
                    <button className="btn" onClick={() => onMarkRead(n.companyId, n.id)} disabled={Boolean(n.read)}>
                      {n.read ? "Read" : "Mark Read"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
