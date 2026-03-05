// frontend/src/context/SecurityContext.jsx
// Security Context — Enterprise Hardened v8
// FIXED RISK SCORE • NO FALSE ERRORS • UI SAFE

import React,{
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from "react";

import { getToken, api, getSavedUser } from "../lib/api.js";
import { useEventBus } from "../core/EventBus.jsx";

const SecurityContext = createContext(null);

function safeJsonParse(v){
  try{
    return typeof v==="string"?JSON.parse(v):v;
  }catch{
    return null;
  }
}

export function SecurityProvider({children}){

  const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/,"");
  const bus = useEventBus();
  const user = getSavedUser();

  /* ================= STATE ================= */

  const [systemStatus,setSystemStatus] = useState("secure");
  const [integrityAlert,setIntegrityAlert] = useState(null);

  const [riskByCompany,setRiskByCompany] = useState({});
  const [exposureByCompany,setExposureByCompany] = useState({});

  const [auditFeed,setAuditFeed] = useState([]);
  const [deviceAlerts,setDeviceAlerts] = useState([]);

  const [wsStatus,setWsStatus] = useState("disconnected");

  /* ================= REFS ================= */

  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);
  const tokenRef = useRef(getToken() || null);

  /* ================= DERIVED GLOBAL RISK ================= */

  const activeCompanyId =
    user?.companyId || user?.company || "global";

  const riskScore =
    riskByCompany?.[activeCompanyId]?.riskScore ??
    riskByCompany?.global?.riskScore ??
    0;

  /* ================= WS URL ================= */

  function buildWsUrl(token){
    if(!API_BASE) return null;

    try{
      const url = new URL(API_BASE);
      const protocol = url.protocol==="https:"?"wss:":"ws:";
      return `${protocol}//${url.host}/ws/market?token=${encodeURIComponent(token)}`;
    }catch{
      return null;
    }
  }

  /* ================= SOCKET CLEANUP ================= */

  const closeSocket = useCallback(()=>{
    if(socketRef.current){
      try{ socketRef.current.close(); }catch{}
      socketRef.current=null;
    }
    setWsStatus("disconnected");
  },[]);

  /* ================= CONNECT ================= */

  const connectSocket = useCallback(()=>{

    const token = getToken();
    tokenRef.current = token || null;
    if(!token) return;

    if(socketRef.current?.readyState===1) return;

    const wsUrl = buildWsUrl(token);
    if(!wsUrl) return;

    let socket;
    try{
      socket = new WebSocket(wsUrl);
    }catch{
      return;
    }

    socket.onopen=()=>{
      setWsStatus("connected");
      bus.emit("security_ws_connected");
    };

    socket.onmessage=(event)=>{
      const data = safeJsonParse(event.data);
      if(!data?.type) return;

      switch(data.type){

        case "risk_update":
          setRiskByCompany(prev=>({
            ...prev,
            [String(data.companyId||"global")]:{
              riskScore:Number(data.riskScore||0),
              signals:data.signals||[]
            }
          }));
          break;

        case "asset_exposure_update":
          setExposureByCompany(prev=>({
            ...prev,
            [String(data.companyId||"global")]:{
              exposure:data.exposure||{}
            }
          }));
          break;

        case "integrity_alert":
          setIntegrityAlert(data);
          setSystemStatus("compromised");
          break;

        default:
          break;
      }
    };

    socket.onerror=()=>{ try{socket.close();}catch{} };

    socket.onclose=()=>{
      socketRef.current=null;
      setWsStatus("disconnected");

      if(reconnectTimer.current)
        clearTimeout(reconnectTimer.current);

      reconnectTimer.current=setTimeout(()=>{
        connectSocket();
      },5000);
    };

    socketRef.current = socket;

  },[bus]);

  /* ================= BOOT ================= */

  useEffect(()=>{
    connectSocket();
    return ()=>closeSocket();
  },[connectSocket,closeSocket]);

  /* ================= TOKEN WATCH ================= */

  useEffect(()=>{
    const t = setInterval(()=>{
      const latest = getToken() || null;
      if(latest!==tokenRef.current){
        tokenRef.current = latest;
        closeSocket();
        if(latest) connectSocket();
      }
    },5000);
    return ()=>clearInterval(t);
  },[closeSocket,connectSocket]);

  /* ================= REST TELEMETRY ================= */

  useEffect(()=>{
    async function load(){
      try{
        const summary = await api.postureSummary();
        if(summary?.riskByCompany)
          setRiskByCompany(summary.riskByCompany);
        if(summary?.exposureByCompany)
          setExposureByCompany(summary.exposureByCompany);
      }catch{}
    }
    load();
    const interval=setInterval(load,30000);
    return ()=>clearInterval(interval);
  },[]);

  /* ================= CONTEXT ================= */

  const value = useMemo(()=>({

    wsStatus,
    reconnect:connectSocket,
    disconnect:closeSocket,

    systemStatus,
    integrityAlert,

    riskScore,
    riskByCompany,
    exposureByCompany,

    auditFeed,
    deviceAlerts,

    pushAudit:(e)=>setAuditFeed(p=>[e,...p].slice(0,150)),
    pushDeviceAlert:(a)=>setDeviceAlerts(p=>[a,...p].slice(0,75))

  }),[
    wsStatus,
    connectSocket,
    closeSocket,
    systemStatus,
    integrityAlert,
    riskScore,
    riskByCompany,
    exposureByCompany,
    auditFeed,
    deviceAlerts
  ]);

  return(
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity(){
  const ctx = useContext(SecurityContext);
  if(!ctx)
    throw new Error("useSecurity must be used inside <SecurityProvider />");
  return ctx;
}
