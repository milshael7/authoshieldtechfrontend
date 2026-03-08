// ============================================================
// TRADING TERMINAL — ENTERPRISE TRADING MODULE v6
// Persistent engine mount • AI telemetry enabled
// ============================================================

import React, { useEffect, useState } from "react";
import { NavLink, useLocation, Navigate } from "react-router-dom";
import { getToken } from "../../lib/api.js";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function TradingLayout() {

  const location = useLocation();
  const token = getToken();

  const [engineStatus,setEngineStatus] = useState("CONNECTED");
  const [mode,setMode] = useState("PAPER");

  const [uptime,setUptime] = useState(0);
  const [aiRate,setAiRate] = useState(0);
  const [memory,setMemory] = useState(0);

  const page = location.pathname.split("/").pop();

  /* =========================================================
  TELEMETRY LOOP
  ========================================================= */

  useEffect(()=>{

    async function loadTelemetry(){

      try{

        const res = await fetch(
          `${API_BASE}/api/trading/ai/snapshot`,
          {
            headers:{
              Authorization:`Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        const tele = data?.snapshot?.telemetry || data?.telemetry;

        if(!tele) return;

        setUptime(tele.uptime || 0);
        setAiRate(tele.decisionsPerMinute || 0);

        const mem = tele.memoryUsage || 0;

        setMemory(Math.round(mem / 1024 / 1024));

      }catch{}

    }

    loadTelemetry();

    const interval = setInterval(loadTelemetry,4000);

    return ()=>clearInterval(interval);

  },[token]);

  /* =========================================================
  FORMAT TIME
  ========================================================= */

  function formatUptime(seconds){

    const h = Math.floor(seconds/3600);
    const m = Math.floor((seconds%3600)/60);
    const s = seconds%60;

    return `${h}h ${m}m ${s}s`;

  }

  const linkBase = {
    padding:"8px 18px",
    textDecoration:"none",
    color:"#9ca3af",
    borderRadius:8,
    fontWeight:600,
    fontSize:13,
    letterSpacing:".04em"
  };

  const linkActive = {
    background:"rgba(37,99,235,.15)",
    color:"#ffffff"
  };

  /* =========================================================
  UI
  ========================================================= */

  return(

    <div
      style={{
        display:"flex",
        flexDirection:"column",
        height:"100%",
        minHeight:0
      }}
    >

      {/* ================= HEADER ================= */}

      <div
        style={{
          padding:"18px 22px 14px",
          borderBottom:"1px solid rgba(255,255,255,.06)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,.02), transparent)"
        }}
      >

        <div style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center"
        }}>

          <div>

            <div style={{
              fontSize:18,
              fontWeight:700
            }}>
              Internal Trading Engine
            </div>

            <div style={{
              fontSize:11,
              opacity:0.6,
              letterSpacing:".08em",
              marginTop:4
            }}>
              AI-DRIVEN EXECUTION & RISK FRAMEWORK
            </div>

          </div>

          {/* ENGINE STATUS */}

          <div style={{
            display:"flex",
            gap:12,
            fontSize:12,
            alignItems:"center"
          }}>

            <div style={{
              padding:"4px 8px",
              borderRadius:6,
              background:
                engineStatus==="CONNECTED"
                ? "rgba(34,197,94,.15)"
                : "rgba(239,68,68,.15)"
            }}>
              {engineStatus}
            </div>

            <div style={{
              padding:"4px 8px",
              borderRadius:6,
              background:"rgba(59,130,246,.15)"
            }}>
              {mode}
            </div>

            <div style={{
              padding:"4px 8px",
              borderRadius:6,
              background:"rgba(168,85,247,.15)"
            }}>
              UPTIME {formatUptime(uptime)}
            </div>

            <div style={{
              padding:"4px 8px",
              borderRadius:6,
              background:"rgba(251,191,36,.15)"
            }}>
              AI {aiRate.toFixed(2)}/min
            </div>

            <div style={{
              padding:"4px 8px",
              borderRadius:6,
              background:"rgba(16,185,129,.15)"
            }}>
              MEM {memory}MB
            </div>

          </div>

        </div>

      </div>

      {/* ================= NAV ================= */}

      <div
        style={{
          display:"flex",
          gap:10,
          padding:"12px 22px",
          borderBottom:"1px solid rgba(255,255,255,.05)",
          background:"rgba(255,255,255,.01)"
        }}
      >

        <NavLink
          to="live"
          style={({isActive}) =>
            isActive ? {...linkBase,...linkActive} : linkBase
          }
        >
          Live Trading
        </NavLink>

        <NavLink
          to="market"
          style={({isActive}) =>
            isActive ? {...linkBase,...linkActive} : linkBase
          }
        >
          Market
        </NavLink>

        <NavLink
          to="control"
          style={({isActive}) =>
            isActive ? {...linkBase,...linkActive} : linkBase
          }
        >
          AI Control
        </NavLink>

        <NavLink
          to="analytics"
          style={({isActive}) =>
            isActive ? {...linkBase,...linkActive} : linkBase
          }
        >
          Analytics
        </NavLink>

      </div>

      {/* ================= CONTENT ================= */}

      <div
        style={{
          flex:1,
          minHeight:0,
          position:"relative"
        }}
      >

        <div
          style={{
            display: page==="live" ? "block" : "none",
            height:"100%"
          }}
        >
          <TradingRoom />
        </div>

        {page==="market" && <Market />}
        {page==="control" && <AIControl />}
        {page==="analytics" && <Analytics />}

        {page==="" && <Navigate to="live" replace />}

      </div>

    </div>

  );

}
