// frontend/src/components/AIBehaviorPanel.jsx
// ============================================================
// AI BEHAVIOR PANEL — AI PERFORMANCE INTELLIGENCE v2
// FIXED: trade accuracy + WAIT detection + learning metrics
// ============================================================

import React, { useMemo } from "react";

export default function AIBehaviorPanel({
  trades = [],
  decisions = [],
  memory = null
}) {

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

  /* ================= AI ACCURACY ================= */

  const accuracy = useMemo(() => {

    if (!trades.length) return 0;

    const wins =
      trades.filter(t => t.pnl > 0).length;

    return (wins / trades.length) * 100;

  }, [trades]);

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

      {/* ================= LEARNING ================= */}

      <div style={{marginTop:15}}>

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
