import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "../../trading/engines/EngineController";

/**
 * TradingRoom.jsx — ENGINE CONNECTED
 * - Uses Scalp + Session engines
 * - Human execution only
 * - No automation
 */

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(5);
  const [engineType, setEngineType] = useState("scalp");
  const [balance, setBalance] = useState(1000);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  const pushLog = (message) => {
    setLog((prev) =>
      [{ t: new Date().toLocaleTimeString(), m: message }, ...prev].slice(0, 100)
    );
  };

  const stats = useMemo(() => {
    return {
      balance: balance.toFixed(2),
      tradesUsed,
    };
  }, [balance, tradesUsed]);

  function executeTrade() {
    if (tradesUsed >= dailyLimit) {
      pushLog("Daily limit reached.");
      return;
    }

    const result = executeEngine({
      engineType,
      balance,
      riskPct,
      leverage,
    });

    setBalance(result.newBalance);
    setTradesUsed((v) => v + 1);

    pushLog(
      `${result.style.toUpperCase()} trade | PnL: ${result.pnl.toFixed(
        2
      )} | New Balance: ${result.newBalance.toFixed(2)}`
    );
  }

  return (
    <div className="postureWrap">
      {/* LEFT PANEL */}
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Engine-based execution</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* ENGINE SELECT */}
        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp Engine
          </button>

          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session Engine
          </button>
        </div>

        {/* RISK */}
        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              value={riskPct}
              min="0.1"
              step="0.1"
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </label>

          <label>
            Leverage
            <input
              type="number"
              value={leverage}
              min="1"
              max="50"
              onChange={(e) => setLeverage(Number(e.target.value))}
            />
          </label>
        </div>

        {/* EXECUTION */}
        <div className="actions">
          <button
            className="btn ok"
            disabled={tradesUsed >= dailyLimit}
            onClick={executeTrade}
          >
            Execute Trade
          </button>
        </div>

        {tradesUsed >= dailyLimit && (
          <p className="muted">Daily trade limit reached.</p>
        )}

        {/* STATS */}
        <div style={{ marginTop: 20 }}>
          <b>Balance:</b> ${stats.balance}
          <br />
          <b>Trades Used:</b> {stats.tradesUsed} / {dailyLimit}
        </div>
      </section>

      {/* RIGHT PANEL */}
      <aside className="postureCard">
        <h3>Execution Log</h3>

        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
