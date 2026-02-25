import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getToken } from "../lib/api";

const SecurityContext = createContext();

export function SecurityProvider({ children }) {

  const [systemStatus, setSystemStatus] = useState("secure");
  const [riskScore, setRiskScore] = useState(0);
  const [assetExposure, setAssetExposure] = useState({});
  const [auditFeed, setAuditFeed] = useState([]);
  const [deviceAlerts, setDeviceAlerts] = useState([]);
  const [integrityAlert, setIntegrityAlert] = useState(null);

  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  /* =============================
     CONNECT WEBSOCKET
  ============================== */

  function connectSocket() {
    const token = getToken();
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = `${protocol}://${window.location.host}/ws/market?token=${token}`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("[SECURITY SOCKET] Connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {

          case "risk_update":
            setRiskScore(data.riskScore || 0);
            break;

          case "asset_exposure_update":
            setAssetExposure(data.exposure || {});
            break;

          case "integrity_alert":
            setIntegrityAlert(data);
            setSystemStatus("compromised");
            break;

          default:
            break;
        }

      } catch {}
    };

    socket.onclose = () => {
      console.log("[SECURITY SOCKET] Disconnected. Reconnecting...");
      reconnectTimer.current = setTimeout(connectSocket, 3000);
    };

    socket.onerror = () => {
      socket.close();
    };

    socketRef.current = socket;
  }

  useEffect(() => {
    connectSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, []);

  /* =============================
     PUSH AUDIT EVENT (LOCAL)
  ============================== */

  function pushAudit(event) {
    setAuditFeed(prev => [event, ...prev].slice(0, 100));
  }

  function pushDeviceAlert(alert) {
    setDeviceAlerts(prev => [alert, ...prev].slice(0, 50));
  }

  return (
    <SecurityContext.Provider
      value={{
        systemStatus,
        riskScore,
        assetExposure,
        auditFeed,
        deviceAlerts,
        integrityAlert,
        pushAudit,
        pushDeviceAlert
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  return useContext(SecurityContext);
}
