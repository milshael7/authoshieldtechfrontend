// frontend/src/pages/trading/Analytics.jsx
// ============================================================
// ANALYTICS ROOM — INSTITUTIONAL AI PERFORMANCE DASHBOARD
// ============================================================

import React, { useEffect, useState } from "react";
import { getToken } from "../../lib/api.js";
import EquityCurve from "../../components/EquityCurve.jsx";

const API_BASE = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

export default function Analytics() {

  const [stats, setStats] = useState({
    equity: 0,
    winRate: 0,
    trades: 0,
    pnl: 0,
    drawdown: 0,
    sharpe: 0,
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
    largestWin: 0,
    largestLoss: 0
  });

  const [equityHistory, setEquityHistory] = useState([]);
  const [tradeLog, setTradeLog] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {

    try {

      const res = await fetch(`${API_BASE}/api/paper/status`, {
        headers: authHeader()
      });

      const data = await res.json();
      if (!data?.ok) return;

      const snap = data.snapshot;
      const trades = snap.trades || [];

      const wins = trades.filter(t => t.profit > 0);
      const losses = trades.filter(t => t.profit <= 0);

      const winRate =
        trades.length ? (wins.length / trades.length) * 100 : 0;

      const pnl =
        trades.reduce((sum,t)=>sum+(t.profit||0),0);

      /* ================= PROFIT METRICS ================= */

      const grossProfit =
        wins.reduce((s,t)=>s+t.profit,0);

      const grossLoss =
        losses.reduce((s,t)=>s+Math.abs(t.profit||0),0);

      const profitFactor =
        grossLoss ? grossProfit / grossLoss : 0;

      const avgWin =
        wins.length ? grossProfit / wins.length : 0;

      const avgLoss =
        losses.length ? grossLoss / losses.length : 0;

      const largestWin =
        Math.max(...wins.map(t=>t.profit),0);

      const largestLoss =
        Math.min(...losses.map(t=>t.profit),0);

      /* ================= SHARPE ================= */

      const returns = trades.map(t => t.profit || 0);

      const avgReturn =
        returns.reduce((a,b)=>a+b,0) /
        (returns.length || 1);

      const variance =
        returns.reduce(
          (sum,r)=>sum+Math.pow(r-avgReturn,2),
          0
        ) / (returns.length || 1);

      const std = Math.sqrt(variance);

      const sharpe =
        std ? avgReturn / std : 0;

      /* ================= EQUITY CURVE ================= */

      let equity = 10000;
      let peak = equity;
      let maxDD = 0;

      const curve = [];

      trades.forEach(t => {

        equity += t.profit || 0;

        peak = Math.max(peak, equity);

        const dd = (peak - equity) / peak;

        maxDD = Math.max(maxDD, dd);

        curve.push(equity);

      });

      setStats({
        equity: snap.equity.toFixed(2),
        winRate: winRate.toFixed(1),
        trades: trades.length,
        pnl: pnl.toFixed(2),
        drawdown: (maxDD * 100).toFixed(2),
        sharpe: sharpe.toFixed(2),
        profitFactor: profitFactor.toFixed(2),
        avgWin: avgWin.toFixed(2),
        avgLoss: avgLoss.toFixed(2),
        largestWin: largestWin.toFixed(2),
        largestLoss: largestLoss.toFixed(2)
      });

      setTradeLog(trades.slice(-20).reverse());

      setEquityHistory(curve);

    } catch {}

  }

  return (

    <div style={{ padding: 24, color: "#fff" }}>

      <h2 style={{ marginBottom: 20 }}>
        AI Trading Analytics
      </h2>

      {/* ================= METRICS ================= */}

      <div style={{
        display:"flex",
        gap:20,
        marginBottom:30,
        flexWrap:"wrap"
      }}>

        <Metric title="Equity" value={`$${stats.equity}`} />
        <Metric title="Win Rate" value={`${stats.winRate}%`} />
        <Metric title="Trades" value={stats.trades} />
        <Metric title="PnL" value={`$${stats.pnl}`} />
        <Metric title="Max Drawdown" value={`${stats.drawdown}%`} />

        <Metric title="Sharpe Ratio" value={stats.sharpe} />
        <Metric title="Profit Factor" value={stats.profitFactor} />

        <Metric title="Avg Win" value={`$${stats.avgWin}`} />
        <Metric title="Avg Loss" value={`$${stats.avgLoss}`} />

        <Metric title="Largest Win" value={`$${stats.largestWin}`} />
        <Metric title="Largest Loss" value={`$${stats.largestLoss}`} />

      </div>

      {/* ================= EQUITY CURVE ================= */}

      <Panel title="Equity Curve">

        <EquityCurve
          scalpHistory={equityHistory}
        />

      </Panel>

      {/* ================= TRADE LOG ================= */}

      <Panel
        title="Recent Trades"
        style={{ marginTop:30 }}
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

  );

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
