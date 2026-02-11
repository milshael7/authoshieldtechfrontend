import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { evaluateGlobalRisk } from "./engines/GlobalRiskGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");

  /* ================= AI + HUMAN GOVERNANCE ================= */

  const AI_CONFIDENCE = 1; // AI always 100%
  const [humanMultiplier, setHumanMultiplier] = useState(1); 
  // 1 = normal
  // 0.8 = reduce exposure
  // 1.2 = increase exposure

  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);

  const [allocation, setAllocation] = useState({
    scalp: 500,
    session: 500,
  });

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  const peakCapital = useRef(1000);
  const totalCapital = allocation.scalp + allocation.session;

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= GLOBAL RISK CHECK ================= */

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  function executeTrade() {
    if (!globalRisk.allowed) {
      pushLog(`Blocked: ${globalRisk.reason}`);
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade count limit reached.");
      return;
    }

    const engineCapital =
      engineType === "scalp"
        ? allocation.scalp
        : allocation.session;

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      confidence: AI_CONFIDENCE,
      humanMultiplier,
    });

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`);
      return;
    }

    const updatedCapital = result.newBalance;

    const updatedAllocation =
      engineType === "scalp"
        ? { ...allocation, scalp: updatedCapital }
        : { ...allocation, session: updatedCapital };

    setAllocation(updatedAllocation);
    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);

    pushLog(
      `${engineType.toUpperCase()} trade | PnL: ${result.pnl.toFixed(
        2
      )} | AI 100% | Human Override x${humanMultiplier}`
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Trading Control</h2>
            <small>AI Dominant • Human Override Enabled</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {!globalRisk.allowed && (
          <div className="badge bad" style={{ marginTop: 10 }}>
            Trading Locked — {globalRisk.reason}
          </div>
        )}

        {/* ================= CAPITAL ================= */}

        <div className="stats">
          <div>
            <b>Total Capital:</b> ${totalCapital.toFixed(2)}
          </div>
          <div>
            <b>Peak Capital:</b> ${peakCapital.current.toFixed(2)}
          </div>
          <div>
            <b>Daily PnL:</b> ${dailyPnL.toFixed(2)}
          </div>
          <div>
            <b>Trades Used:</b> {tradesUsed} / {dailyLimit}
          </div>
        </div>

        {/* ================= ENGINE SELECT ================= */}

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

        {/* ================= RISK CONTROLS ================= */}

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

        {/* ================= HUMAN OVERRIDE ================= */}

        <div className="ctrl" style={{ marginTop: 15 }}>
          <label>
            Human Override Multiplier
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={humanMultiplier}
              onChange={(e) =>
                setHumanMultiplier(Number(e.target.value))
              }
            />
          </label>

          <div style={{ marginTop: 6, fontSize: 13 }}>
            Current Override: x{humanMultiplier}
          </div>
        </div>

        {/* ================= EXECUTE ================= */}

        <div className="actions">
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={!globalRisk.allowed}
          >
            Execute Trade
          </button>
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
