// frontend/src/pages/trading/Analytics.jsx
// ============================================================
// ANALYTICS ROOM — INSTITUTIONAL AI PERFORMANCE DASHBOARD
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Analytics() {

  const [stats, setStats] = useState({});
  const [equityHistory, setEquityHistory] = useState([]);
  const [tradeLog, setTradeLog] = useState([]);
  const [behavior, setBehavior] = useState({
    buy:0,
    sell:0,
    accuracy:0
  });

  useEffect(()=>{ loadAnalytics(); },[]);

  async function loadAnalytics(){

    try{

      const res = await fetch(`${API_BASE}/api/paper/status`,{
        headers:authHeader()
      });

      const data = await res.json();
      if(!data?.ok) return;

      const snap = data.snapshot;
      const trades = snap.trades || [];

      const wins = trades.filter(t=>t.profit>0);
      const losses = trades.filter(t=>t.profit<=0);

      const winRate =
        trades.length ? (wins.length/trades.length)*100 : 0;

      const pnl =
        trades.reduce((s,t)=>s+(t.profit||0),0);

      /* PROFIT FACTOR */

      const grossProfit =
        wins.reduce((s,t)=>s+t.profit,0);

      const grossLoss =
        losses.reduce((s,t)=>s+Math.abs(t.profit||0),0);

      const profitFactor =
        grossLoss ? grossProfit/grossLoss : 0;

      /* SHARPE */

      const returns = trades.map(t=>t.profit||0);

      const avg =
        returns.reduce((a,b)=>a+b,0)/(returns.length||1);

      const variance =
        returns.reduce((s,r)=>s+Math.pow(r-avg,2),0)/(returns.length||1);

      const sharpe =
        variance ? avg/Math.sqrt(variance) : 0;

      /* EQUITY CURVE */

      let equity = 10000;
      let peak = equity;
      let maxDD = 0;

      const curve = [];

      trades.forEach(t=>{

        equity += t.profit||0;

        peak = Math.max(peak,equity);

        const dd = (peak-equity)/peak;

        maxDD = Math.max(maxDD,dd);

        curve.push(equity);

      });

      setEquityHistory(curve);
      setTradeLog(trades.slice(-20).reverse());

      setStats({
        equity:snap.equity?.toFixed(2),
        winRate:winRate.toFixed(1),
        trades:trades.length,
        pnl:pnl.toFixed(2),
        drawdown:(maxDD*100).toFixed(2),
        sharpe:sharpe.toFixed(2),
        profitFactor:profitFactor.toFixed(2)
      });

      /* AI BEHAVIOR */

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

    }catch{}

  }

  return(

    <div style={{padding:24,color:"#fff"}}>

      <h2 style={{marginBottom:20}}>
        AI Trading Analytics
      </h2>

      {/* METRICS */}

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
        <Metric title="Sharpe Ratio" value={stats.sharpe} />
        <Metric title="Profit Factor" value={stats.profitFactor} />

      </div>

      {/* EQUITY CURVE */}

      <Panel title="Equity Curve">

        <EquityCurve
          scalpHistory={equityHistory}
        />

      </Panel>

      {/* AI BEHAVIOR */}

      <Panel
        title="AI Behavior Intelligence"
        style={{marginTop:30}}
      >

        <div style={{marginBottom:10}}>
          <strong>AI Accuracy:</strong> {behavior.accuracy}%
        </div>

        <div>
          <strong>Decision Distribution</strong>

          <div style={{
            display:"flex",
            gap:20,
            marginTop:8
          }}>

            <span style={{color:"#22c55e"}}>
              BUY: {behavior.buy}
            </span>

            <span style={{color:"#ef4444"}}>
              SELL: {behavior.sell}
            </span>

          </div>

        </div>

      </Panel>

      {/* TRADE LOG */}

      <Panel
        title="Recent Trades"
        style={{marginTop:30}}
      >

        {tradeLog.map((t,i)=>(

          <div
            key={i}
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
              {t.profit?.toFixed(2)}
            </span>

          </div>

        ))}

      </Panel>

    </div>

  )

}

/* ================= METRIC ================= */

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

  )

}

/* ================= PANEL ================= */

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

  )

}

/* ================= AUTH ================= */

function authHeader(){

  const token = getToken();

  return token
    ? { Authorization:`Bearer ${token}` }
    : {};

}
