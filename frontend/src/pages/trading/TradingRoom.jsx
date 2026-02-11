import React, { useMemo, useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import PerformanceChart from "./PerformanceChart";

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

  const MIN_RISK = 0.3;
  const MAX_RISK = 3;

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
    total: 1000,
  });

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0, streak: 0 },
    session: { wins: 0, losses: 0, pnl: 0, streak: 0 },
  });

  const [history, setHistory] = useState({
    scalp: [500],
    session: [500],
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

  function rebalanceCapital(updated) {
    const floor = 100;
    let { scalp, session } = updated;

    if (scalp < floor && session > floor * 2) {
      scalp += floor;
      session -= floor;
      pushLog("Capital rebalanced → Session → Scalp");
    }

    if (session < floor && scalp > floor * 2) {
      session += floor;
      scalp -= floor;
      pushLog("Capital rebalanced → Scalp → Session");
    }

    return {
      scalp,
      session,
      total: scalp + session,
    };
  }

  function adjustRisk(engine, pnl) {
    setPerformance((prev) => {
      const data = prev[engine];
      const newStreak =
        pnl > 0
          ? Math.max(1, data.streak + 1)
          : Math.min(-1, data.streak - 1);

      let newRisk = riskPct;

      if (newStreak <= -3) {
        newRisk = Math.max(MIN_RISK, riskPct * 0.6);
        pushLog("Drawdown protection activated — Risk reduced.");
      }

      if (newStreak >= 3) {
        newRisk = Math.min(MAX_RISK, riskPct * 1.2);
        pushLog("Positive streak — Risk gradually increased.");
      }

      setRiskPct(Number(newRisk.toFixed(2)));

      return {
        ...prev,
        [engine]: {
          ...data,
          streak: newStreak,
        },
      };
    });
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

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct,
      leverage,
    });

    const pnl = result.pnl;
    const updatedCapital = result.newBalance;

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: updatedCapital }
        : { ...allocation, session: updatedCapital };

    const rebalanced = rebalanceCapital(updatedAllocation);

    setAllocation(rebalanced);
    setTradesUsed((v) => v + 1);

    setHistory((prev) => ({
      scalp:
        engineType === "scalp"
          ? [...prev.scalp, rebalanced.scalp]
          : prev.scalp,
      session:
        engineType === "session"
          ? [...prev.session, rebalanced.session]
          : prev.session,
    }));

    adjustRisk(engineType, pnl);

    pushLog(
      `${engineType.toUpperCase()} trade | PnL: ${pnl.toFixed(
        2
      )} | Balance: ${updatedCapital.toFixed(2)}`
    );
  }

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
            <small>Adaptive Dual Engine Governance</small>
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
          <div><b>Total Capital:</b> ${allocation.total.toFixed(2)}</div>
          <div style={{ color: "#5EC6FF" }}>
            <b>Scalp:</b> ${allocation.scalp.toFixed(2)}
          </div>
          <div style={{ color: "#9B7CFF" }}>
            <b>Session:</b> ${allocation.session.toFixed(2)}
          </div>
          <div><b>Risk:</b> {riskPct}%</div>
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
              onChange={(e) =>
                setRiskPct(
                  Math.max(
                    MIN_RISK,
                    Math.min(MAX_RISK, Number(e.target.value))
                  )
                )
              }
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

        <div style={{ marginTop: 20 }}>
          <h3>Equity Curve</h3>
          <PerformanceChart
            scalpHistory={history.scalp}
            sessionHistory={history.session}
          />
        </div>

        <div style={{ marginTop: 15, fontSize: 12, opacity: 0.7 }}>
          Continuous Learning Cycles: {learningCycles}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
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
