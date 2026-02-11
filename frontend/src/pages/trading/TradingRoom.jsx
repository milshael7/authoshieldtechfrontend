import React, { useState, useEffect } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { isTradingWindowOpen } from "./engines/TimeGovernor";
import { applyGovernance } from "./engines/GovernanceEngine";
import { checkVolatility } from "./engines/VolatilityGovernor";
import { evaluateConfidence } from "./engines/ConfidenceEngine";
import { evaluateDrawdown } from "./engines/DrawdownEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [equityHistory, setEquityHistory] = useState([1000]);
  const [currentEquity, setCurrentEquity] = useState(1000);

  const humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
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

  function executeTrade() {
    if (!isTradingWindowOpen()) {
      pushLog("Weekend lock active.");
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily limit reached.");
      return;
    }

    const volatilityCheck = checkVolatility();
    if (!volatilityCheck.approved) {
      pushLog(volatilityCheck.reason);
      return;
    }

    const confidenceCheck = evaluateConfidence(engineType);
    if (!confidenceCheck.approved) {
      pushLog(`Blocked — Confidence ${confidenceCheck.score}%`);
      return;
    }

    const drawdownCheck = evaluateDrawdown({
      equityHistory,
      currentEquity,
      maxDrawdownPct: humanCaps.maxDrawdownPct,
    });

    if (!drawdownCheck.approved) {
      pushLog(drawdownCheck.reason);
      return;
    }

    const governance = applyGovernance({
      engineType,
      balance: currentEquity,
      requestedRisk:
        baseRisk *
        volatilityCheck.riskModifier *
        confidenceCheck.modifier *
        drawdownCheck.riskModifier,
      requestedLeverage: leverage,
      humanCaps,
    });

    if (!governance.approved) {
      pushLog(governance.reason);
      return;
    }

    const result = executeEngine({
      engineType,
      balance: currentEquity,
      riskPct: governance.effectiveRisk,
      leverage: governance.effectiveLeverage,
    });

    const newEquity = result.newBalance;

    setCurrentEquity(newEquity);
    setEquityHistory((prev) => [...prev, newEquity]);
    setTradesUsed((v) => v + 1);

    pushLog(
      `${engineType.toUpperCase()} | PnL: ${result.pnl.toFixed(
        2
      )} | Equity: ${newEquity.toFixed(2)}`
    );
  }

  const peak = Math.max(...equityHistory);
  const drawdown =
    peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Equity + Drawdown Protection Active</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        <div className="stats">
          <div><b>Equity:</b> ${currentEquity.toFixed(2)}</div>
          <div><b>Peak:</b> ${peak.toFixed(2)}</div>
          <div>
            <b>Drawdown:</b>{" "}
            <span style={{ color: drawdown > 10 ? "#ff6b6b" : "" }}>
              {drawdown.toFixed(2)}%
            </span>
          </div>
          <div><b>Trades:</b> {tradesUsed}/{dailyLimit}</div>
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
            Base Risk %
            <input
              type="number"
              value={baseRisk}
              min="0.1"
              step="0.1"
              onChange={(e) => setBaseRisk(Number(e.target.value))}
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
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
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
