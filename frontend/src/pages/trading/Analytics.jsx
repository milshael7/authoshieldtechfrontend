// ============================================================
// FILE: frontend/src/pages/trading/Analytics.jsx
// ANALYTICS ROOM — INSTITUTIONAL AI PERFORMANCE DASHBOARD v6
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";
import PortfolioAllocation from "../../components/PortfolioAllocation.jsx";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Analytics(){

  const [stats,setStats] = useState({
    equity:0,
    winRate:0,
    trades:0,
    pnl:0,
    drawdown:0
  });

  const [equityHistory,setEquityHistory] = useState([]);
  const [tradeLog,setTradeLog] = useState([]);

  const [behavior,setBehavior] = useState({});
  const [risk,setRisk] = useState({});
  const [brain,setBrain] = useState({});
  const [engine,setEngine] = useState({});
  const [config,setConfig] = useState({});

  useEffect(()=>{
    loadAnalytics();
    const loop=setInterval(loadAnalytics,3000);
    return ()=>clearInterval(loop);
  },[]);

  async function loadAnalytics(){

    try{

      const token=getToken();
      if(!token) return;

      const headers={Authorization:`Bearer ${token}`};

      const paperRes=await fetch(
        `${API_BASE}/api/paper/status`,
        {headers}
      );

      const paperData=await paperRes.json();
      if(!paperData?.ok) return;

      const snap=paperData.snapshot||{};
      const trades=Array.isArray(snap.trades)?snap.trades:[];

      /* ================= AI ANALYTICS ================= */

      const aiRes=await fetch(
        `${API_BASE}/api/ai/analytics`,
        {headers}
      );

      const aiData=await aiRes.json();

      /* ================= PERFORMANCE ================= */

      const wins=trades.filter(t=>Number(t.pnl)>0);

      const winRate=
        trades.length
          ? (wins.length/trades.length)*100
          : 0;

      const pnl=
        trades.reduce(
          (s,t)=>s+(Number(t.pnl)||0),
          0
        );

      /* ================= EQUITY CURVE ================= */

      let equity=Number(snap.equity || snap.cashBalance || 0);
      let peak=equity;
      let maxDD=0;

      const curve=[];

      trades.forEach(t=>{

        const tradePnl=Number(t.pnl)||0;

        equity+=tradePnl;

        peak=Math.max(peak,equity);

        const dd=
          peak>0
            ? (peak-equity)/peak
            : 0;

        maxDD=Math.max(maxDD,dd);

        curve.push(equity);

      });

      setEquityHistory(curve);

      setTradeLog(
        trades.slice(-20).reverse()
      );

      setStats({

        equity:Number(snap.equity||0).toFixed(2),
        winRate:winRate.toFixed(1),
        trades:trades.length,
        pnl:pnl.toFixed(2),
        drawdown:(maxDD*100).toFixed(2)

      });

      /* ================= ENGINE STATS ================= */

      const execStats =
        snap.executionStats || {};

      setEngine({

        ticks:execStats.ticks || 0,
        decisions:execStats.decisions || 0,
        trades:execStats.trades || 0

      });

      /* ================= AI BRAIN ================= */

      if(aiData?.ok){

        setBrain(aiData.brain||{});
        setConfig(aiData.config||{});

      }

      /* ================= BEHAVIOR ================= */

      let buy=0;
      let sell=0;

      trades.forEach(t=>{
        if(t.side==="BUY") buy++;
        if(t.side==="SELL") sell++;
      });

      setBehavior({

        buy,
        sell,
        accuracy:winRate.toFixed(1)

      });

      /* ================= RISK ================= */

      const exposure=
        snap.position
          ? Math.abs(
              Number(snap.position.qty)*
              Number(snap.lastPrice)
            )
          : 0;

      setRisk({

        exposure:exposure.toFixed(2),
        riskPercent:config.riskPercent || 0,
        maxTrades:config.maxTrades || 0,
        mode:config.tradingMode || "paper"

      });

    }
    catch(e){

      console.error(
        "Analytics load failed",
        e
      );

    }

  }

  return(

    <div style={{padding:24,color:"#fff"}}>

      <h2 style={{marginBottom:20}}>
        AI Trading Analytics
      </h2>

      <div style={{
        display:"flex",
        gap:20,
        flexWrap:"wrap",
        marginBottom:30
      }}>

        <Metric title="Equity" value={`$${stats.equity}`} />
        <Metric title="Win Rate" value={`${stats.winRate}%`} />
        <Metric title="Trades" value={stats.trades} />
        <Metric title="PnL" value={`$${stats.pnl}`} />
        <Metric title="Drawdown" value={`${stats.drawdown}%`} />

      </div>

      <Panel title="AI Engine State">

        <div>Mode: {risk.mode}</div>
        <div>Risk %: {risk.riskPercent}%</div>
        <div>Max Trades/Day: {risk.maxTrades}</div>
        <div>Ticks Processed: {engine.ticks}</div>
        <div>Total Decisions: {engine.decisions}</div>
        <div>Total Executions: {engine.trades}</div>

      </Panel>

      <Panel title="AI Brain Intelligence" style={{marginTop:30}}>

        <div>Last Action: {brain.lastAction}</div>

        <div>
          Smoothed Confidence:
          {(brain.smoothedConfidence||0).toFixed(3)}
        </div>

        <div>
          Edge Momentum:
          {(brain.edgeMomentum||0).toFixed(4)}
        </div>

        <div>Win Streak: {brain.winStreak}</div>
        <div>Loss Streak: {brain.lossStreak}</div>

      </Panel>

      <Panel title="Equity Curve" style={{marginTop:30}}>

        <EquityCurve equityHistory={equityHistory} />

      </Panel>

      <Panel title="AI Behavior Intelligence" style={{marginTop:30}}>

        <div>BUY: {behavior.buy}</div>
        <div>SELL: {behavior.sell}</div>
        <div>Accuracy: {behavior.accuracy}%</div>

      </Panel>

      <Panel title="Portfolio Allocation" style={{marginTop:30}}>

        <PortfolioAllocation trades={tradeLog} />

      </Panel>

    </div>

  );

}

/* ================= UI HELPERS ================= */

function Metric({title,value}){

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:10,
      minWidth:140
    }}>

      <div style={{opacity:.6}}>
        {title}
      </div>

      <div style={{
        fontSize:24,
        fontWeight:700
      }}>
        {value}
      </div>

    </div>

  );

}

function Panel({title,children,style={}}){

  return(

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)",
      ...style
    }}>

      <h3 style={{marginBottom:12}}>
        {title}
      </h3>

      {children}

    </div>

  );

}
