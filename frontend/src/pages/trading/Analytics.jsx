// ============================================================
// ANALYTICS ROOM — INSTITUTIONAL AI PERFORMANCE DASHBOARD v2
// FULL ENGINE INTELLIGENCE CONNECTED
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";
import PortfolioAllocation from "../../components/PortfolioAllocation.jsx";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Analytics(){

  const [stats,setStats] = useState({});
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

      const token = getToken();
      if(!token) return;

      const headers = {Authorization:`Bearer ${token}`};

      // 1️⃣ Paper Snapshot
      const paperRes = await fetch(
        `${API_BASE}/api/paper/status`,
        {headers}
      );

      const paperData = await paperRes.json();
      if(!paperData?.ok) return;

      const snap = paperData.snapshot || {};
      const trades = snap.trades || [];

      // 2️⃣ AI Analytics (Brain + Config + Engine)
      const aiRes = await fetch(
        `${API_BASE}/api/ai/analytics`,
        {headers}
      );

      const aiData = await aiRes.json();

      /* ================= PERFORMANCE ================= */

      const wins = trades.filter(t=>t.profit>0);
      const losses = trades.filter(t=>t.profit<=0);

      const winRate =
        trades.length ? (wins.length/trades.length)*100 : 0;

      const pnl =
        trades.reduce((s,t)=>s+(Number(t.profit)||0),0);

      let equity = Number(snap.cashBalance || 0);
      let peak = equity;
      let maxDD = 0;
      const curve = [];

      trades.forEach(t=>{
        equity += Number(t.profit)||0;
        peak = Math.max(peak,equity);
        const dd = (peak-equity)/peak;
        maxDD = Math.max(maxDD,dd);
        curve.push(equity);
      });

      setEquityHistory(curve);
      setTradeLog(trades.slice(-20).reverse());

      setStats({
        equity:Number(snap.equity||0).toFixed(2),
        winRate:winRate.toFixed(1),
        trades:trades.length,
        pnl:pnl.toFixed(2),
        drawdown:(maxDD*100).toFixed(2)
      });

      /* ================= AI BRAIN ================= */

      if(aiData?.ok){

        setBrain(aiData.brain || {});
        setConfig(aiData.config || {});
        setEngine(aiData.execution || {});

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

      const exposure =
        snap.position
          ? Math.abs(
              Number(snap.position.qty) *
              Number(snap.lastPrice)
            )
          : 0;

      setRisk({
        exposure:exposure.toFixed(2),
        riskPercent:config.riskPercent,
        maxTrades:config.maxTrades,
        mode:config.tradingMode
      });

    }catch(e){
      console.error("Analytics load failed",e);
    }

  }

  return(

    <div style={{padding:24,color:"#fff"}}>

      <h2 style={{marginBottom:20}}>
        AI Trading Analytics
      </h2>

      {/* PERFORMANCE METRICS */}

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

      {/* ENGINE STATE */}

      <Panel title="AI Engine State">

        <div>Mode: {risk.mode}</div>
        <div>Risk %: {risk.riskPercent}%</div>
        <div>Max Trades/Day: {risk.maxTrades}</div>
        <div>Ticks Processed: {engine.ticks}</div>
        <div>Total Decisions: {engine.decisions}</div>
        <div>Total Executions: {engine.trades}</div>

      </Panel>

      {/* BRAIN INTELLIGENCE */}

      <Panel title="AI Brain Intelligence" style={{marginTop:30}}>

        <div>Last Action: {brain.lastAction}</div>
        <div>Smoothed Confidence: {(brain.smoothedConfidence||0).toFixed(3)}</div>
        <div>Edge Momentum: {(brain.edgeMomentum||0).toFixed(4)}</div>
        <div>Win Streak: {brain.winStreak}</div>
        <div>Loss Streak: {brain.lossStreak}</div>
        <div>Aggression Factor: {(brain.aggressionFactor||1).toFixed(2)}</div>

      </Panel>

      {/* EQUITY CURVE */}

      <Panel title="Equity Curve" style={{marginTop:30}}>

        <EquityCurve scalpHistory={equityHistory} />

      </Panel>

      {/* BEHAVIOR */}

      <Panel title="AI Behavior Intelligence" style={{marginTop:30}}>

        <div>BUY: {behavior.buy}</div>
        <div>SELL: {behavior.sell}</div>
        <div>Accuracy: {behavior.accuracy}%</div>

      </Panel>

      {/* PORTFOLIO */}

      <Panel title="Portfolio Allocation" style={{marginTop:30}}>

        <PortfolioAllocation trades={tradeLog} />

      </Panel>

      {/* RECENT TRADES */}

      <Panel title="Recent Trades" style={{marginTop:30}}>

        {tradeLog.map((t,i)=>(

          <div key={i}
            style={{
              display:"flex",
              justifyContent:"space-between",
              borderBottom:"1px solid rgba(255,255,255,.05)",
              padding:"6px 0"
            }}
          >
            <span>{t.side}</span>
            <span>{t.qty}</span>
            <span>@ {t.price}</span>
            <span style={{
              color:t.profit>0?"#22c55e":"#ef4444"
            }}>
              {Number(t.profit||0).toFixed(2)}
            </span>
          </div>

        ))}

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
      <div style={{opacity:.6}}>{title}</div>
      <div style={{fontSize:24,fontWeight:700}}>
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
