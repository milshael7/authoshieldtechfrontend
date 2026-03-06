// frontend/src/context/SecurityContext.jsx
// ==========================================================
// SECURITY CONTEXT — ENTERPRISE HARDENED v18 (SEALED)
// QUIET-BY-DEFAULT • REST-PRIMARY • WS-ADVISORY ONLY
// SINGLE SOURCE OF TRUTH • NO ESCALATION LOOPS
// NO SELF-NOISE • PLATFORM-SAFE • DETERMINISTIC
// ==========================================================

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";

import { getToken, api } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

/* ================= CONTEXT ================= */

const SecurityContext = createContext(null);

/* ================= CONFIG ================= */

// escalation rules
const RISK_THRESHOLD = 75;
const ALERT_COOLDOWN = 30000; // 30s minimum between alerts

// advisory WS rules (never persistent)
const WS_MAX_RETRY = 1;

/* ================= PROVIDER ================= */

export function SecurityProvider({ children }) {
  const bus = useEventBus();

  /* ================= STATE ================= */

  const [systemStatus, setSystemStatus] = useState("secure"); // secure | compromised
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);
  const [wsStatus, setWsStatus] = useState("idle"); // idle | connected | quiet

  /* ================= REFS ================= */

  const mountedRef = useRef(true);
  const quietRef = useRef(true); // global noise gate
  const lastAlertRef = useRef(0);

  const socketRef = useRef(null);
  const wsRetryRef = useRef(0);

  /* ================= LIFECYCLE ================= */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      try {
        socketRef.current?.close();
      } catch {}
    };
  }, []);

  /* ================= WS (ADVISORY ONLY) =================
     - NEVER required for correctness
     - NEVER blocks UI
     - NEVER retries aggressively
     - CONFIRMATION channel only
  ======================================================== */

  const connectWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (quietRef.current) return;
    if (socketRef.current) return;
    if (wsRetryRef.current >= WS_MAX_RETRY) return;

    const token = getToken();
    if (!token) return;

    let ws;

    try {
      const base = import.meta.env.VITE_API_BASE;
      if (!base) return;

      const u = new URL(base);
      const proto = u.protocol === "https:" ? "wss:" : "ws:";
      const url = `${proto}//${u.host}/ws/security?token=${encodeURIComponent(
        token
      )}`;

      ws = new WebSocket(url);
    } catch {
      return;
    }

    ws.onopen = () => {
      wsRetryRef.current = 0;
      setWsStatus("connected");
    };

    ws.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      // advisory confirmation only
      if (data?.type === "integrity_alert") {
        setIntegrityAlert(data);
        setSystemStatus("compromised");
        bus.emit("security_threat_detected", data);
      }

      if (data?.type === "integrity_clear") {
        quietRef.current = true;
        setIntegrityAlert(null);
        setSystemStatus("secure");
        setWsStatus("quiet");
        ws.close();
      }
    };

    ws.onclose = () => {
      socketRef.current = null;
      setWsStatus("quiet");
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };

    socketRef.current = ws;
    wsRetryRef.current += 1;
  }, [bus]);

  /* ================= REST SECURITY TELEMETRY =================
     SINGLE SOURCE OF TRUTH
     SLOW CADENCE
     SILENT ON FAILURE
  ============================================================ */

  useEffect(() => {
    let active = true;

    async function load() {
      if (!active) return;
      if (!getToken()) return;

      try {
        const summary = await api.postureSummary();
        if (!summary?.ok) return;

        const score = Number(summary.score || 0);
        const now = Date.now();

        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        // ================= SECURE STATE =================
        if (score < RISK_THRESHOLD) {
          quietRef.current = true;
          setIntegrityAlert(null);
          setSystemStatus("secure");
          setWsStatus("quiet");
          return;
        }

        // ================= COMPROMISED STATE =================
        quietRef.current = false;

        if (now - lastAlertRef.current < ALERT_COOLDOWN) {
          return; // hard cooldown — prevents oscillation
        }

        lastAlertRef.current = now;

        const alert = {
          type: "risk_threshold",
          score,
          ts: now,
        };

        setIntegrityAlert(alert);
        setSystemStatus("compromised");

        // single, controlled broadcast
        bus.emit("security_threat_detected", alert);

        // optional advisory confirmation
        connectWS();
      } catch {
        // 🔇 intentional silence
      }
    }

    // delayed boot to avoid startup noise
    const boot = setTimeout(load, 4000);
    const interval = setInterval(load, 120000); // 2 min cadence

    return () => {
      active = false;
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, [bus, connectWS]);

  /* ================= CONTEXT VALUE ================= */

  const value = useMemo(
    () => ({
      systemStatus,
      integrityAlert,
      riskScore,
      domains,
      wsStatus,
    }),
    [systemStatus, integrityAlert, riskScore, domains, wsStatus]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) {
    throw new Error(
      "useSecurity must be used inside <SecurityProvider />"
    );
  }
  return ctx;
}
