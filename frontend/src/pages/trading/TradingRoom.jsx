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

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
  });

  /* ================= HUMAN CAPS ================= */
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

  function rebalanceCapital(updated) {
    const floor = 100;

    let { scalp, session } = updated;

    if (scalp < floor && session > floor * 2) {
      const transfer = floor;
      scalp += transfer;
      session -= transfer;
      pushLog("Capital rebalanced → Session → Scalp");
    }

    if (session < floor && scalp > floor * 2) {
      const transfer = floor;
      session += transfer;
      scalp -= transfer;
      pushLog("Capital rebalanced → Scalp → Session");
    }

    return {
      scalp,
      session,
      total: scalp + session,
    };
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

    /* ================= GOVERNANCE CHECK ================= */
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

    /* ================= EXECUTION ================= */
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

    const rebalanced = rebalanceCapital(updatedAllocation);

    setAllocation(rebalanced);
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
      )} | Risk Used: ${governance.effectiveRisk}%`
    );
  }

  /* ================= CONTINUOUS LEARNING ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setLearningCycles((v) => v + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Dual Engine + Governance Layer</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {!isTradingWindowOpen() && (
          <div className="badge warn" style={{ marginTop: 10 }}>
            Weekend Lock Active — Learning Mode Only
          </div>
        )}

        <div className="stats">
          <div>
            <b>Total Capital:</b> ${allocation.total.toFixed(2)}
          </div>
          <div style={{ color: "#5EC6FF" }}>
            <b>Scalp Engine:</b> ${allocation.scalp.toFixed(2)}
          </div>
          <div>
            <b>Session Engine:</b> ${allocation.session.toFixed(2)}
          </div>
          <div>
            <b>Trades Used:</b> {tradesUsed} / {dailyLimit}
          </div>
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
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={!isTradingWindowOpen()}
          >
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 15, fontSize: 12, opacity: 0.7 }}>
          Continuous Learning Cycles: {learningCycles}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Engine Performance</h3>

        <div style={{ marginBottom: 15 }}>
          <b>Scalp:</b> Wins {performance.scalp.wins} | Losses{" "}
          {performance.scalp.losses} | PnL{" "}
          {performance.scalp.pnl.toFixed(2)}
        </div>

        <div style={{ marginBottom: 20 }}>
          <b>Session:</b> Wins {performance.session.wins} | Losses{" "}
          {performance.session.losses} | PnL{" "}
          {performance.session.pnl.toFixed(2)}
        </div>

        <h3>Execution Log</h3>
        <div style={{ maxHeight: 350, overflowY: "auto" }}>
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
