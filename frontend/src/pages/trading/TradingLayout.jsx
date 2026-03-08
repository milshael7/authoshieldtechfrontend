// ============================================================
// TRADING TERMINAL — ENTERPRISE TRADING MODULE v5
// Persistent engine mount • zero reset switching
// ============================================================

import React, { useEffect, useState } from "react";
import { NavLink, useLocation, Navigate } from "react-router-dom";

import TradingRoom from "../TradingRoom";
import Market from "./Market";
import AIControl from "./AIControl";
import Analytics from "./Analytics";

export default function TradingLayout() {

  const location = useLocation();

  const [engineStatus,setEngineStatus] = useState("CONNECTED");
  const [mode,setMode] = useState("PAPER");

  const page = location.pathname.split("/").pop();

  /* =========================================================
  ENGINE HEARTBEAT
  ========================================================= */

  useEffect(()=>{

    const interval = setInterval(()=>{
      setEngineStatus(prev=>prev);
    },5000);

    return ()=>clearInterval(interval);

  },[]);

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

          <div style={{
            display:"flex",
            gap:12,
            fontSize:12
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

        {/* TRADING ROOM (ALWAYS MOUNTED) */}
        <div
          style={{
            display: page==="live" ? "block" : "none",
            height:"100%"
          }}
        >
          <TradingRoom />
        </div>

        {/* MARKET */}
        {page==="market" && <Market />}

        {/* AI CONTROL */}
        {page==="control" && <AIControl />}

        {/* ANALYTICS */}
        {page==="analytics" && <Analytics />}

        {/* DEFAULT */}
        {page==="" && <Navigate to="live" replace />}

      </div>

    </div>

  );

}
