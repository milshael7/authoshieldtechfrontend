// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v3
// 1008 Safe • Backoff Controlled • Status Accurate • Blueprint Aligned

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { getToken } from "../lib/api.js";

const SecurityContext = createContext(null);

function now() {
  return Date.now();
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function SecurityProvider({ children }) {
  const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const [systemStatus, setSystemStatus] = useState("secure");
  const [integrityAlert, setIntegrityAlert] = useState(null);
  const [riskByCompany, setRiskByCompany] = useState({});
  const [exposureByCompany, setExposureByCompany] = useState({});
  const [auditFeed, setAuditFeed] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);
  const [wsStatus, setWsStatus] = useState("disconnected");

  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const backoffRef = useRef({
    attempt: 0,
    nextDelayMs: 1200,
  });

  const tokenRef = useRef(getToken() || null);
  const forceStopRef = useRef(false);

  /* ================= URL ================= */

  function buildWsUrl(token) {
    if (!API_BASE) return null;

    const httpUrl = new URL(API_BASE);
    const protocol = httpUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${httpUrl.host}/ws/market?token=${encodeURIComponent(
      token
    )}`;
  }

  /* ================= CLEANUP ================= */

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const closeSocket = useCallback(() => {
    clearReconnect();
    forceStopRef.current = true;

    if (socketRef.current) {
      try {
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }

    setWsStatus("disconnected");
  }, []);

  /* ================= BACKOFF ================= */

  const scheduleReconnect = useCallback(() => {
    if (forceStopRef.current) return;

    clearReconnect();

    backoffRef.current.attempt += 1;
    setWsStatus("reconnecting");

    const base = Math.min(15000, backoffRef.current.nextDelayMs);
    const jitter = Math.floor(Math.random() * 400);
    const delay = base + jitter;

    backoffRef.current.nextDelayMs = Math.min(
      20000,
      base * 1.4 + 300
    );

    reconnectTimer.current = setTimeout(() => {
      connectSocket();
    }, delay);
  }, []);

  /* ================= MESSAGE ================= */

  const handleMessage = useCallback((raw) => {
    const data = typeof raw === "string" ? safeJsonParse(raw) : raw;
    if (!data || !data.type) return;

    const companyId = String(data.companyId || "global");

    switch (data.type) {
      case "risk_update":
        setRiskByCompany((prev) => ({
          ...prev,
          [companyId]: {
            riskScore: Number(data.riskScore || 0),
            signals: data.signals || [],
            updatedAt: now(),
          },
        }));
        break;

      case "asset_exposure_update":
        setExposureByCompany((prev) => ({
          ...prev,
          [companyId]: {
            exposure:
              data.exposure && typeof data.exposure === "object"
                ? data.exposure
                : {},
            updatedAt: now(),
          },
        }));
        break;

      case "integrity_alert":
        setIntegrityAlert(data);
        setSystemStatus("compromised");

        setAuditFeed((prev) =>
          [
            {
              id: `integrity_${Date.now()}`,
              ts: new Date().toISOString(),
              action: "INTEGRITY_ALERT",
              detail: data,
            },
            ...prev,
          ].slice(0, 150)
        );
        break;

      default:
        break;
    }
  }, []);

  /* ================= CONNECT ================= */

  const connectSocket = useCallback(() => {
    const token = getToken();
    tokenRef.current = token || null;

    if (!token) {
      closeSocket();
      return;
    }

    if (socketRef.current && wsStatus === "connected") return;

    forceStopRef.current = false;

    const wsUrl = buildWsUrl(token);
    if (!wsUrl) return;

    setWsStatus("connecting");

    let socket;
    try {
      socket = new WebSocket(wsUrl);
    } catch {
      setWsStatus("disconnected");
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      setWsStatus("connected");
      backoffRef.current.attempt = 0;
      backoffRef.current.nextDelayMs = 1200;
    };

    socket.onmessage = (event) => {
      handleMessage(event.data);
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {}
    };

    socket.onclose = (event) => {
      socketRef.current = null;

      // 1008 = policy violation (auth/device/subscription)
      if (event.code === 1008) {
        forceStopRef.current = true;
        setWsStatus("disconnected");
        return;
      }

      setWsStatus("disconnected");
      scheduleReconnect();
    };

    socketRef.current = socket;
  }, [closeSocket, handleMessage, scheduleReconnect, wsStatus]);

  /* ================= BOOT ================= */

  useEffect(() => {
    connectSocket();
    return () => closeSocket();
  }, [connectSocket, closeSocket]);

  /* ================= TOKEN WATCHER ================= */

  useEffect(() => {
    const t = setInterval(() => {
      const latest = getToken() || null;
      if (latest !== tokenRef.current) {
        tokenRef.current = latest;
        closeSocket();
        if (latest) connectSocket();
      }
    }, 5000);

    return () => clearInterval(t);
  }, [closeSocket, connectSocket]);

  /* ================= HELPERS ================= */

  const pushAudit = useCallback((event) => {
    setAuditFeed((prev) => [event, ...prev].slice(0, 150));
  }, []);

  const pushDeviceAlert = useCallback((alert) => {
    setDeviceAlerts((prev) => [alert, ...prev].slice(0, 75));
  }, []);

  const globalRiskScore = riskByCompany?.global?.riskScore ?? 0;
  const globalExposure = exposureByCompany?.global?.exposure ?? {};

  const value = useMemo(
    () => ({
      wsStatus,
      reconnect: connectSocket,
      disconnect: closeSocket,

      systemStatus,
      integrityAlert,

      riskByCompany,
      exposureByCompany,

      riskScore: globalRiskScore,
      assetExposure: globalExposure,

      auditFeed,
      deviceAlerts,
      pushAudit,
      pushDeviceAlert,
    }),
    [
      wsStatus,
      connectSocket,
      closeSocket,
      systemStatus,
      integrityAlert,
      riskByCompany,
      exposureByCompany,
      globalRiskScore,
      globalExposure,
      auditFeed,
      deviceAlerts,
      pushAudit,
      pushDeviceAlert,
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
    throw new Error("useSecurity must be used inside <SecurityProvider />");
  return ctx;
}
