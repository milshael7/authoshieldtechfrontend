import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { rebalancePortfolio } from "./engines/PortfolioAllocator";
import { evaluateGlobalRisk } from "./engines/RiskGovernor";
import { isTradingWindowOpen } from "./engines/TimeGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [systemLocked, setSystemLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [log, setLog] = useState([]);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
  });

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  function executeTrade() {
    if (!isTradingWindowOpen()) {
      pushLog("Blocked — Weekend protection active.");
      return;
    }

    if (systemLocked) {
      pushLog("Execution blocked — System locked.");
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

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct,
      leverage,
    });

    if (result.blocked) {
      pushLog("Trade blocked by engine safeguards.");
      return;
    }

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: result.newBalance }
        : { ...allocation, session: result.newBalance };

    const rebalanced = rebalancePortfolio(
      updatedAllocation,
      performance
    );

    setAllocation(rebalanced);

    setPerformance((prev) => {
      const isWin = result.isWin;
      const enginePerf = prev[engineType];

      return {
        ...prev,
        [engineType]: {
          wins: enginePerf.wins + (isWin ? 1 : 0),
          losses: enginePerf.losses + (!isWin ? 1 : 0),
          pnl: enginePerf.pnl + result.pnl,
        },
      };
    });

    setTradesUsed((v) => v + 1);

    pushLog(
      `${engineType.toUpperCase()} | PnL: ${result.pnl.toFixed(
        2
      )}`
    );

    /* ================= GLOBAL RISK CHECK ================= */

    const riskState = evaluateGlobalRisk({
      allocation: rebalanced,
      performance,
    });

    if (riskState.locked) {
      setSystemLocked(true);
      setLockReason(riskState.reason);
      pushLog(`SYSTEM LOCKED → ${riskState.reason}`);
    }
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Unified Trading Engine</h2>
            <small>Execution · Allocation · Governance</small>
          </div>

          <span
            className={`badge ${
              systemLocked
                ? "bad"
                : mode === "LIVE"
                ? "warn"
                : ""
            }`}
          >
            {systemLocked ? "LOCKED" : mode}
          </span>
        </div>

        {!isTradingWindowOpen() && (
          <div className="badge warn" style={{ marginTop: 10 }}>
            Weekend Lock — Learning Mode Active
          </div>
        )}

        {systemLocked && (
          <div className="badge bad" style={{ marginTop: 10 }}>
            {lockReason}
          </div>
        )}

        <div className="stats">
          <div>
            <b>Total:</b> ${allocation.total.toFixed(2)}
          </div>
          <div>
            <b>Scalp:</b> ${allocation.scalp.toFixed(2)}
          </div>
          <div>
            <b>Session:</b> ${allocation.session.toFixed(2)}
          </div>
          <div>
            <b>Trades:</b> {tradesUsed} / {dailyLimit}
          </div>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp
          </button>

          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session
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
            disabled={!isTradingWindowOpen() || systemLocked}
          >
            Execute Trade
          </button>
        </div>
      </section>

      <aside className="postureCard">
        <h3>System Log</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
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
