// frontend/src/context/SecurityContext.jsx
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
  // Global system flag (secure/compromised)
  const [systemStatus, setSystemStatus] = useState("secure");

  // Global last-seen integrity alert (if any)
  const [integrityAlert, setIntegrityAlert] = useState(null);

  // Multi-tenant aware maps (companyId => data)
  const [riskByCompany, setRiskByCompany] = useState({});
  const [exposureByCompany, setExposureByCompany] = useState({});

  // Optional local feeds (UI-friendly)
  const [auditFeed, setAuditFeed] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);

  // Connection state
  const [wsStatus, setWsStatus] = useState("disconnected"); // connecting | connected | disconnected

  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const backoffRef = useRef({
    attempt: 0,
    nextDelayMs: 1200,
    lastConnectAt: 0,
  });

  const tokenRef = useRef(getToken() || null);

  const clearReconnect = () => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
  };

  const closeSocket = useCallback(() => {
    clearReconnect();
    if (socketRef.current) {
      try {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onerror = null;
        socketRef.current.onclose = null;
        socketRef.current.close();
      } catch {}
      socketRef.current = null;
    }
    setWsStatus("disconnected");
  }, []);

  const scheduleReconnect = useCallback(() => {
    clearReconnect();

    backoffRef.current.attempt += 1;

    // exponential-ish backoff with cap
    const base = Math.min(15000, Math.round(backoffRef.current.nextDelayMs));
    const jitter = Math.floor(Math.random() * 400);
    const delay = base + jitter;

    // grow delay for next time
    backoffRef.current.nextDelayMs = Math.min(20000, base * 1.35 + 250);

    reconnectTimer.current = setTimeout(() => {
      connectSocket();
    }, delay);
  }, []);

  const handleMessage = useCallback((raw) => {
    const data = typeof raw === "string" ? safeJsonParse(raw) : raw;
    if (!data || !data.type) return;

    // default bucket
    const companyId = String(data.companyId || "global");

    switch (data.type) {
      case "risk_update": {
        const score = Number(data.riskScore || 0);
        setRiskByCompany((prev) => ({
          ...prev,
          [companyId]: {
            riskScore: score,
            updatedAt: now(),
          },
        }));
        return;
      }

      case "asset_exposure_update": {
        const exposure = data.exposure && typeof data.exposure === "object" ? data.exposure : {};
        setExposureByCompany((prev) => ({
          ...prev,
          [companyId]: {
            exposure,
            updatedAt: now(),
          },
        }));
        return;
      }

      case "integrity_alert": {
        setIntegrityAlert(data);
        setSystemStatus("compromised");

        // also push into auditFeed for visibility
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
        return;
      }

      default:
        return;
    }
  }, []);

  const connectSocket = useCallback(() => {
    const token = getToken();
    tokenRef.current = token || null;

    if (!token) {
      closeSocket();
      return;
    }

    // If already connected/connecting, don’t duplicate
    if (socketRef.current && (wsStatus === "connected" || wsStatus === "connecting")) {
      return;
    }

    setWsStatus("connecting");

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/market?token=${encodeURIComponent(
      token
    )}`;

    backoffRef.current.lastConnectAt = now();

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
      console.log("[SECURITY SOCKET] Connected");
    };

    socket.onmessage = (event) => {
      handleMessage(event.data);
    };

    socket.onerror = () => {
      try {
        socket.close();
      } catch {}
    };

    socket.onclose = () => {
      setWsStatus("disconnected");
      socketRef.current = null;
      console.log("[SECURITY SOCKET] Disconnected. Reconnecting...");
      scheduleReconnect();
    };

    socketRef.current = socket;
  }, [closeSocket, handleMessage, scheduleReconnect, wsStatus]);

  // Boot connect
  useEffect(() => {
    connectSocket();
    return () => closeSocket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Token watcher (if user logs in/out or refresh changes token)
  useEffect(() => {
    const t = setInterval(() => {
      const latest = getToken() || null;
      if (latest !== tokenRef.current) {
        tokenRef.current = latest;
        closeSocket();
        if (latest) connectSocket();
      }
    }, 1500);

    return () => clearInterval(t);
  }, [closeSocket, connectSocket]);

  /* =============================
     FEED HELPERS (LOCAL UI)
  ============================== */

  const pushAudit = useCallback((event) => {
    setAuditFeed((prev) => [event, ...prev].slice(0, 150));
  }, []);

  const pushDeviceAlert = useCallback((alert) => {
    setDeviceAlerts((prev) => [alert, ...prev].slice(0, 75));
  }, []);

  /* =============================
     DERIVED (GLOBAL DEFAULTS)
  ============================== */

  const globalRiskScore = riskByCompany?.global?.riskScore ?? 0;
  const globalExposure = exposureByCompany?.global?.exposure ?? {};

  const value = useMemo(
    () => ({
      // connection
      wsStatus,
      reconnect: connectSocket,
      disconnect: closeSocket,

      // system
      systemStatus,
      integrityAlert,

      // multi-tenant maps
      riskByCompany,
      exposureByCompany,

      // common defaults (global bucket)
      riskScore: globalRiskScore,
      assetExposure: globalExposure,

      // local feeds
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

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
}

export function useSecurity() {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be used inside <SecurityProvider />");
  return ctx;
}
