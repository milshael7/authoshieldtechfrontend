// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v16
// QUIET-BY-DEFAULT • WS-AWARE • REST-FIRST • NO SELF-NOISE • PLATFORM-SAFE
// WS exists but is ADVISORY, never blocking

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

const SecurityContext = createContext(null);

/* ================= PROVIDER ================= */

export function SecurityProvider({ children }) {
  const bus = useEventBus();

  /* ================= STATE ================= */

  const [systemStatus, setSystemStatus] = useState("secure");
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);
  const [wsStatus, setWsStatus] = useState("idle"); // idle | connected | quiet

  /* ================= REFS ================= */

  const mountedRef = useRef(true);
  const quietRef = useRef(true); // 🔇 default quiet
  const lastAlertRef = useRef(0);
  const socketRef = useRef(null);
  const reconnectRef = useRef(0);

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
     - Never blocks platform
     - Never retries aggressively
     - Exists only to receive REAL alerts
  ======================================================== */

  const connectWS = useCallback(() => {
    if (!mountedRef.current) return;
    if (quietRef.current) return;
    if (socketRef.current) return;

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
      reconnectRef.current = 0;
      setWsStatus("connected");
    };

    ws.onmessage = (e) => {
      let data;
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }

      if (data?.type === "integrity_alert") {
        quietRef.current = false;
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

      if (!mountedRef.current) return;
      if (quietRef.current) return;
      if (reconnectRef.current >= 1) return; // 🔇 single retry max

      reconnectRef.current += 1;
      setTimeout(connectWS, 5000);
    };

    ws.onerror = () => {
      try {
        ws.close();
      } catch {}
    };

    socketRef.current = ws;
  }, [bus]);

  /* ================= REST SECURITY TELEMETRY =================
     - Single source of truth
     - Slow cadence
     - Silent on failure
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

        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        // 🔔 Escalate ONLY on real danger
        if (score >= 75) {
          quietRef.current = false;

          const now = Date.now();
          if (now - lastAlertRef.current > 30000) {
            lastAlertRef.current = now;

            setIntegrityAlert({
              type: "risk_threshold",
              score,
              ts: now,
            });

            setSystemStatus("compromised");
            bus.emit("security_threat_detected", { score });

            // advisory WS connect
            connectWS();
          }
        } else {
          quietRef.current = true;
          setIntegrityAlert(null);
          setSystemStatus("secure");
          setWsStatus("quiet");
        }
      } catch {
        // 🔇 intentional silence
      }
    }

    const boot = setTimeout(load, 4000);
    const interval = setInterval(load, 120000);

    return () => {
      active = false;
      clearTimeout(boot);
      clearInterval(interval);
    };
  }, [bus, connectWS]);

  /* ================= CONTEXT ================= */

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
