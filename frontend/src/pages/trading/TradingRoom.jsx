import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import { applyGovernance } from "./engines/GovernanceEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [learningCycles, setLearningCycles] = useState(0);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [equityHistory, setEquityHistory] = useState([1000]);
  const [peakEquity, setPeakEquity] = useState(1000);

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
  });

  const humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 15,
    maxConsecutiveLosses: 3,
  };

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  function calculateDrawdown(currentEquity) {
    const newPeak = Math.max(peakEquity, currentEquity);
    setPeakEquity(newPeak);

    const drawdownPct =
      ((newPeak - currentEquity) / newPeak) * 100;

    return drawdownPct;
  }

  function executeTrade() {
    if (!isTradingWindowOpen()) {
      pushLog("Execution blocked — Weekend protection active.");
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const engineCapital =
      engineType === "scalp"
        ? allocation.scalp
        : allocation.session;

    const governance = applyGovernance({
      engineType,
      balance: engineCapital,
      requestedRisk: riskPct,
      requestedLeverage: leverage,
      performance,
      humanCaps,
    });

    if (!governance.approved) {
      pushLog(`Execution blocked — ${governance.reason}`);
      return;
    }

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: governance.effectiveRisk,
      leverage: governance.effectiveLeverage,
    });

    const updatedCapital = result.newBalance;
    const pnl = result.pnl;

    const updatedAllocation =
      engineType === "scalp"
        ? {
            ...allocation,
            scalp: updatedCapital,
          }
        : {
            ...allocation,
            session: updatedCapital,
          };

    const newTotal =
      updatedAllocation.scalp +
      updatedAllocation.session;

    const drawdown = calculateDrawdown(newTotal);

    if (drawdown > humanCaps.maxDrawdownPct) {
      pushLog("⚠ Drawdown limit breached — Defensive Mode Activated");
    }

    setAllocation({
      ...updatedAllocation,
      total: newTotal,
    });

    setEquityHistory((prev) => [...prev, newTotal]);

    setTradesUsed((v) => v + 1);

    setPerformance((prev) => {
      const enginePerf = prev[engineType];
      const isWin = pnl > 0;

      return {
        ...prev,
        [engineType]: {
          wins: enginePerf.wins + (isWin ? 1 : 0),
          losses: enginePerf.losses + (!isWin ? 1 : 0),
          pnl: enginePerf.pnl + pnl,
        },
      };
    });

    pushLog(
      `${engineType.toUpperCase()} trade | PnL: ${pnl.toFixed(
        2
      )} | Equity: ${newTotal.toFixed(2)}`
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setLearningCycles((v) => v + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const drawdownPct =
    ((peakEquity - allocation.total) / peakEquity) * 100;

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Dual Engine + Governance + Equity Monitor</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        <div className="stats">
          <div><b>Total Capital:</b> ${allocation.total.toFixed(2)}</div>
          <div><b>Peak Equity:</b> ${peakEquity.toFixed(2)}</div>
          <div style={{ color: drawdownPct > 10 ? "red" : "inherit" }}>
            <b>Drawdown:</b> {drawdownPct.toFixed(2)}%
          </div>
          <div><b>Trades Used:</b> {tradesUsed} / {dailyLimit}</div>
        </div>

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
              max="20"
              onChange={(e) => setLeverage(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn ok" onClick={executeTrade}>
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 15, fontSize: 12, opacity: 0.7 }}>
          Learning Cycles: {learningCycles}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Equity Curve</h3>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {equityHistory.map((e, i) => (
            <div key={i}>
              {i}: ${e.toFixed(2)}
            </div>
          ))}
        </div>

        <h3 style={{ marginTop: 20 }}>Execution Log</h3>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
