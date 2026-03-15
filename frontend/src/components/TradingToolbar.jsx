// ==========================================================
// FILE: frontend/src/components/TradingToolbar.jsx
//
// MODULE: Trading Toolbar
//
// PURPOSE
// ----------------------------------------------------------
// Top bar for the Trading Room.
//
// Displays:
// • Market feed status
// • Last price
// • Paper engine status
// • AI confidence
// • Engine uptime
//
// DATA SOURCE
// ----------------------------------------------------------
// Telemetry comes from:
//
// GET /api/paper/status
//
// Fields used:
//   engine
//   brainState.smoothedConfidence
//   executionStats.ticks
//
// MAINTENANCE NOTES
// ----------------------------------------------------------
// - Do NOT change endpoint path unless backend route changes.
// - Engine polling interval is safe at 5 seconds.
// - Parent components control mode, symbol, and panel toggles.
// - This component is display-only for telemetry.
//
// ==========================================================

import React, { useEffect, useState } from "react";

/* =========================================================
CONFIG
========================================================= */

const POLL_INTERVAL = 5000;

/* =========================================================
COMPONENT
========================================================= */

export default function TradingToolbar({

  /* ===== Parent Controlled State ===== */

  mode = "Paper",
  setMode = () => {},

  symbol = "BTCUSDT",
  setSymbol = () => {},
  symbols = [],

  feedStatus = "UNKNOWN",
  lastText = "Loading",

  running = false,

  /* ===== Panel Toggles ===== */

  showMoney = false,
  setShowMoney = () => {},

  showTradeLog = false,
  setShowTradeLog = () => {},

  showHistory = false,
  setShowHistory = () => {},

  showControls = false,
  setShowControls = () => {},

  showAI = false,
  setShowAI = () => {},

  wideChart = false,
  setWideChart = () => {},

}) {

  /* ======================================================
  ENGINE TELEMETRY STATE
  ====================================================== */

  const [engine,setEngine] = useState("CHECKING");
  const [ai,setAI] = useState(0);
  const [uptime,setUptime] = useState("0s");

  const API_BASE =
    (import.meta.env.VITE_API_BASE || "").replace(/\/+$/,"");

  /* ======================================================
  LOAD ENGINE STATUS
  ====================================================== */

  useEffect(()=>{

    let mounted = true;

    async function loadStatus(){

      if(!API_BASE) return;

      try{

        const res =
          await fetch(`${API_BASE}/api/paper/status`);

        if(!res.ok) return;

        const data = await res.json();

        if(!mounted) return;

        const engineState =
          data?.engine || "OFFLINE";

        const confidence =
          data?.brainState?.smoothedConfidence || 0;

        const ticks =
          data?.executionStats?.ticks || 0;

        setEngine(engineState);
        setAI(Number(confidence).toFixed(2));

        /* Engine uptime approximation */

        setUptime(
          ticks
            ? `${Math.floor(ticks/60)}m`
            : "0s"
        );

      }catch{}

    }

    loadStatus();

    const timer =
      setInterval(loadStatus,POLL_INTERVAL);

    return ()=>{
      mounted = false;
      clearInterval(timer);
    };

  },[]);

  /* ======================================================
  SAFE NORMALIZATION
  ====================================================== */

  const safeSymbols =
    Array.isArray(symbols) && symbols.length
      ? symbols
      : ["BTCUSDT"];

  const normalizedMode =
    String(mode || "Paper").toLowerCase() === "live"
      ? "Live"
      : "Paper";

  const normalizedFeedStatus =
    String(feedStatus || "UNKNOWN").toUpperCase();

  const normalizedLastText =
    lastText ? String(lastText) : "Loading";

  const paperState =
    running ? "ON" : "OFF";

  /* ======================================================
  UI STYLES
  ====================================================== */

  const chip = {
    padding:"6px 10px",
    borderRadius:999,
    border:"1px solid rgba(255,255,255,0.14)",
    background:"rgba(0,0,0,0.18)",
    fontSize:12,
    opacity:0.95,
    whiteSpace:"nowrap"
  };

  const pill = {
    border:"1px solid rgba(255,255,255,0.10)",
    background:"rgba(0,0,0,0.18)",
    borderRadius:12,
    padding:10,
    minWidth:150
  };

  const btn = (active=false)=>({
    padding:"8px 10px",
    borderRadius:10,
    border:"1px solid rgba(255,255,255,0.18)",
    background:active
      ? "rgba(122,167,255,0.22)"
      : "rgba(255,255,255,0.06)",
    color:"white",
    cursor:"pointer",
    fontWeight:800
  });

  /* ======================================================
  RENDER
  ====================================================== */

  return (

    <div className="tpBar">

      {/* ================= LEFT SIDE ================= */}

      <div className="tpLeft">

        <div className="tpTitleRow">

          <h2 className="tpTitle">
            Trading Room
          </h2>

          <span style={chip}>
            Feed:
            <b style={{marginLeft:6}}>
              {normalizedFeedStatus}
            </b>
          </span>

          <span style={chip}>
            Last:
            <b style={{marginLeft:6}}>
              {normalizedLastText}
            </b>
          </span>

          <span style={chip}>
            Paper:
            <b style={{marginLeft:6}}>
              {paperState}
            </b>
          </span>

          <span style={chip}>
            Engine:
            <b style={{marginLeft:6}}>
              {engine}
            </b>
          </span>

          <span style={chip}>
            AI:
            <b style={{marginLeft:6}}>
              {ai}
            </b>
          </span>

          <span style={chip}>
            Uptime:
            <b style={{marginLeft:6}}>
              {uptime}
            </b>
          </span>

        </div>

        <div className="tpSub">
          Live feed + chart + paper trader + AI explanations
        </div>

      </div>

      {/* ================= RIGHT SIDE ================= */}

      <div className="tpRight">

        {/* MODE SWITCH */}

        <div style={pill}>

          <div className="tpPillLabel">
            Mode
          </div>

          <div className="tpRow">

            <button
              style={btn(normalizedMode==="Live")}
              onClick={()=>setMode("Live")}
            >
              Live
            </button>

            <button
              style={btn(normalizedMode==="Paper")}
              onClick={()=>setMode("Paper")}
            >
              Paper
            </button>

          </div>

        </div>

        {/* SYMBOL SELECTOR */}

        <div style={pill}>

          <div className="tpPillLabel">
            Symbol
          </div>

          <select
            value={
              safeSymbols.includes(symbol)
                ? symbol
                : safeSymbols[0]
            }
            onChange={(e)=>setSymbol(e.target.value)}
            className="tpSelect"
          >

            {safeSymbols.map((s)=>(
              <option key={s} value={s}>
                {s}
              </option>
            ))}

          </select>

        </div>

        {/* PANEL TOGGLES */}

        <div style={pill}>

          <div className="tpPillLabel">
            Panels
          </div>

          <div className="tpRow tpRowWrap">

            <button
              style={btn(showMoney)}
              onClick={()=>setShowMoney(v=>!v)}
            >
              Money
            </button>

            <button
              style={btn(showTradeLog)}
              onClick={()=>setShowTradeLog(v=>!v)}
            >
              Log
            </button>

            <button
              style={btn(showHistory)}
              onClick={()=>setShowHistory(v=>!v)}
            >
              History
            </button>

            <button
              style={btn(showControls)}
              onClick={()=>setShowControls(v=>!v)}
            >
              Controls
            </button>

            <button
              style={btn(showAI)}
              onClick={()=>setShowAI(v=>!v)}
            >
              AI
            </button>

            <button
              style={btn(wideChart)}
              onClick={()=>setWideChart(v=>!v)}
            >
              Wide
            </button>

          </div>

        </div>

      </div>

    </div>

  );

}
