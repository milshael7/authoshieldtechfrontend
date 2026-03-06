// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v12
// SECURITY-ONLY • ROUTE-STABLE • TRADING-SAFE • NO MARKET SOCKETS

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

function safeJsonParse(v) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return null;
  }
}

export function SecurityProvider({ children }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");
  const bus = useEventBus();

  /* ================= STATE ================= */

  const [systemStatus, setSystemStatus] = useState("secure");
  const [integrityAlert, setIntegrityAlert] = useState(null);

  const [riskScore, setRiskScore] = useState(0);
  const [domains, setDomains] = useState([]);

  const [auditFeed, setAuditFeed] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);

  const [wsStatus, setWsStatus] = useState("idle");

  /* ================= REFS ================= */

  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const tokenRef = useRef(null);
  const mountedRef = useRef(true);

  /* ================= HELPERS ================= */

  function buildSecurityWsUrl(token) {
    if (!API_BASE || !token) return null;
    try {
      const url = new URL(API_BASE);
      const protocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${url.host}/ws/security?token=${encodeURIComponent(
        token
      )}`;
    } catch {
      return null;
    }
  }

  /* ================= SOCKET CLEANUP ================= */

  const closeSocket = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
    setWsStatus("disconnected");
  }, []);

  /* ================= CONNECT ================= */

  const connectSocket = useCallback(() => {
    const token = getToken();
    tokenRef.current = token || null;

    if (!token || !mountedRef.current) return;
    if (socketRef.current?.readyState === 1) return;

    const wsUrl = buildSecurityWsUrl(token);
    if (!wsUrl) return;

    let socket;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      return;
    }

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setWsStatus("connected");
      bus.emit("security_ws_connected");
    };

    socket.onmessage = (event) => {
      const data = safeJsonParse(event.data);
      if (!data?.type) return;

      if (data.type === "integrity_alert") {
        setIntegrityAlert(data);
        setSystemStatus("compromised");
      }

      if (data.type === "integrity_clear") {
        setIntegrityAlert(null);
        setSystemStatus("secure");
      }
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {}
    };

    socket.onclose = () => {
      socketRef.current = null;
      setWsStatus("disconnected");

      if (!mountedRef.current) return;
      if (!getToken()) return;
      if (reconnectAttemptsRef.current >= 5) return;

      reconnectAttemptsRef.current += 1;

      reconnectTimerRef.current = setTimeout(() => {
        connectSocket();
      }, 5000);
    };

    socketRef.current = socket;
  }, [bus, closeSocket]);

  /* ================= BOOT / UNMOUNT ================= */

  useEffect(() => {
    mountedRef.current = true;

    const token = getToken();
    if (token) connectSocket();

    return () => {
      mountedRef.current = false;
      closeSocket();
    };
  }, [connectSocket, closeSocket]);

  /* ================= TOKEN WATCH ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      const latest = getToken() || null;

      if (latest !== tokenRef.current) {
        tokenRef.current = latest;
        closeSocket();
        if (latest) connectSocket();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [connectSocket, closeSocket]);

  /* ================= REST TELEMETRY ================= */

  useEffect(() => {
    let active = true;

    async function load() {
      if (!getToken()) return;

      try {
        const summary = await api.postureSummary();
        if (!active || !summary?.ok) return;

        const score = Number(summary.score || 0);
        setRiskScore(score);
        setDomains(Array.isArray(summary.domains) ? summary.domains : []);

        if (score < 30 && !integrityAlert) {
          setSystemStatus("secure");
        }
      } catch {
        /* silent by design */
      }
    }

    load();
    const interval = setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [integrityAlert]);

  /* ================= CONTEXT ================= */

  const value = useMemo(
    () => ({
      wsStatus,
      reconnect: connectSocket,
      disconnect: closeSocket,

      systemStatus,
      integrityAlert,

      riskScore,
      domains,

      auditFeed,
      deviceAlerts,

      pushAudit: (e) =>
        setAuditFeed((p) => [e, ...p].slice(0, 150)),

      pushDeviceAlert: (a) =>
        setDeviceAlerts((p) => [a, ...p].slice(0, 75)),
    }),
    [
      wsStatus,
      connectSocket,
      closeSocket,
      systemStatus,
      integrityAlert,
      riskScore,
      domains,
      auditFeed,
      deviceAlerts,
    ]
  );

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx)
    throw new Error(
      "useSecurity must be used inside <SecurityProvider />"
    );
  return ctx;
}
