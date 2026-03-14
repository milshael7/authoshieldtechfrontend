// frontend/src/components/AIBehaviorPanel.jsx
// ============================================================
// AI BEHAVIOR PANEL — AI PERFORMANCE INTELLIGENCE v4
// ADDED: Daily performance tracking + buy/sell trade tracking
// ============================================================

import React, { useMemo } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null
}) {

  /* ================= CLOSED TRADES ================= */

  const closedTrades = useMemo(() => {
    return trades.filter(t => t.side === "CLOSE");
  }, [trades]);

  /* ================= WIN / LOSS ================= */

  const tradeStats = useMemo(() => {

    let wins = 0;
    let losses = 0;
    let pnl = 0;

    closedTrades.forEach(t => {

      const p = Number(t.pnl || 0);

      pnl += p;

      if (p > 0) wins++;
      else if (p < 0) losses++;

    });

    return {
      wins,
      losses,
      pnl,
      total: closedTrades.length
    };

  }, [closedTrades]);

  /* ================= DAILY PERFORMANCE ================= */

  const dailyStats = useMemo(() => {

    const today = new Date().toDateString();

    const todayTrades = trades.filter(t => {
      if (!t.time) return false;
      return new Date(t.time).toDateString() === today;
    });

    const todayClosed = todayTrades.filter(t => t.side === "CLOSE");

    let wins = 0;
    let losses = 0;
    let pnl = 0;

    todayClosed.forEach(t => {

      const p = Number(t.pnl || 0);

      pnl += p;

      if (p > 0) wins++;
      else if (p < 0) losses++;

    });

    const buyTrades =
      todayTrades.filter(t => t.side === "BUY").length;

    const sellTrades =
      todayTrades.filter(t => t.side === "SELL").length;

    return {
      trades: todayClosed.length,
      wins,
      losses,
      pnl,
      buyTrades,
      sellTrades
    };

  }, [trades]);

  /* ================= ACCURACY ================= */

  const accuracy = useMemo(() => {

    if (!tradeStats.total) return 0;

    return (tradeStats.wins / tradeStats.total) * 100;

  }, [tradeStats]);

  /* ================= AI CONFIDENCE ================= */

  const avgConfidence = useMemo(() => {

    if (!decisions.length) return 0;

    const total =
      decisions.reduce(
        (sum, d) => sum + (d.confidence || 0),
        0
      );

    return (total / decisions.length) * 100;

  }, [decisions]);

  /* ================= DECISION DISTRIBUTION ================= */

  const decisionStats = useMemo(() => {

    let buy = 0;
    let sell = 0;
    let wait = 0;

    decisions.forEach(d => {

      if (d.action === "BUY") buy++;
      else if (d.action === "SELL") sell++;
      else wait++;

    });

    return { buy, sell, wait };

  }, [decisions]);

  /* ================= AI LEARNING ================= */

  const learning = useMemo(() => {

    if (!memory) {

      return {
        signals: 0,
        trades: trades.length,
        market: 0
      };

    }

    return {
      signals: memory.signalsStored || 0,
      trades: memory.tradesStored || trades.length,
      market: memory.marketStatesStored || 0
    };

  }, [memory, trades]);

  /* ================= UI ================= */

  return (

    <div style={{
      background:"#111827",
      padding:20,
      borderRadius:12,
      border:"1px solid rgba(255,255,255,.08)"
    }}>

      <h3 style={{marginBottom:16}}>
        AI Behavior Intelligence
      </h3>

      {/* ================= CONFIDENCE ================= */}

      <div style={{marginBottom:10}}>
        <strong>Average AI Confidence:</strong>{" "}
        {avgConfidence.toFixed(1)}%
      </div>

      {/* ================= ACCURACY ================= */}

      <div style={{marginBottom:10}}>
        <strong>AI Accuracy:</strong>{" "}
        {accuracy.toFixed(1)}%
      </div>

      {/* ================= TRADE STATS ================= */}

      <div style={{marginTop:12}}>

        <strong>Trade Performance</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Trades Closed:</span>
          <span>{tradeStats.total}</span>

          <span>Wins:</span>
          <span style={{color:"#22c55e"}}>
            {tradeStats.wins}
          </span>

          <span>Losses:</span>
          <span style={{color:"#ef4444"}}>
            {tradeStats.losses}
          </span>

          <span>Total PnL:</span>
          <span style={{
            color: tradeStats.pnl >= 0 ? "#22c55e" : "#ef4444"
          }}>
            ${tradeStats.pnl.toFixed(2)}
          </span>

        </div>

      </div>

      {/* ================= DAILY PERFORMANCE ================= */}

      <div style={{marginTop:18}}>

        <strong>Daily Performance</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Trades Today:</span>
          <span>{dailyStats.trades}</span>

          <span>Wins Today:</span>
          <span style={{color:"#22c55e"}}>
            {dailyStats.wins}
          </span>

          <span>Losses Today:</span>
          <span style={{color:"#ef4444"}}>
            {dailyStats.losses}
          </span>

          <span>BUY Trades Today:</span>
          <span>{dailyStats.buyTrades}</span>

          <span>SELL Trades Today:</span>
          <span>{dailyStats.sellTrades}</span>

          <span>Daily PnL:</span>
          <span style={{
            color: dailyStats.pnl >= 0 ? "#22c55e" : "#ef4444"
          }}>
            ${dailyStats.pnl.toFixed(2)}
          </span>

        </div>

      </div>

      {/* ================= LEARNING ================= */}

      <div style={{marginTop:18}}>

        <strong>AI Learning Memory</strong>

        <div style={{
          display:"grid",
          gridTemplateColumns:"1fr 1fr",
          marginTop:8,
          gap:6
        }}>

          <span>Signals Learned:</span>
          <span>{learning.signals}</span>

          <span>Trades Learned:</span>
          <span>{learning.trades}</span>

          <span>Market States:</span>
          <span>{learning.market}</span>

        </div>

      </div>

      {/* ================= DECISION DISTRIBUTION ================= */}

      <div style={{marginTop:18}}>

        <strong>Decision Distribution</strong>

        <div style={{
          display:"flex",
          gap:20,
          marginTop:8
        }}>

          <span style={{color:"#22c55e"}}>
            BUY: {decisionStats.buy}
          </span>

          <span style={{color:"#ef4444"}}>
            SELL: {decisionStats.sell}
          </span>

          <span style={{color:"#f59e0b"}}>
            WAIT: {decisionStats.wait}
          </span>

        </div>

      </div>

    </div>

  );

}
