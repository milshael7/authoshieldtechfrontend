import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import {
  allocateCapital,
  rebalanceCapital,
  calculateTotalCapital,
} from "./engines/CapitalAllocator";
import { evaluateGlobalRisk } from "./engines/GlobalRiskGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [exchange, setExchange] = useState("coinbase");

  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);

  /* ================= AI CONTROL LAYER ================= */

  const [aiConfidence, setAiConfidence] = useState(0.8); // 80% default
  const [humanOverride, setHumanOverride] = useState(1); // 1 = neutral

  /* ================= PERFORMANCE ================= */

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  const [performance, setPerformance] = useState({
    scalp: { wins: 0, losses: 0, pnl: 0 },
    session: { wins: 0, losses: 0, pnl: 0 },
  });

  /* ================= INITIAL CAPITAL ================= */

  const initialCapital = 1000;

  const initialDistribution = allocateCapital({
    totalCapital: initialCapital,
  });

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] = useState(
    initialDistribution.allocation
  );

  const peakCapital = useRef(initialCapital);

  const totalCapital = calculateTotalCapital(allocation, reserve);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= GLOBAL RISK ================= */

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

  /* ================= EXECUTION ================= */

  function executeTrade() {
    if (!globalRisk.allowed) {
      pushLog(`Blocked: ${globalRisk.reason}`);
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const engineCapital =
      allocation[engineType][exchange];

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      confidence: aiConfidence,
      humanMultiplier: humanOverride,
    });

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`);
      return;
    }

    const updatedAllocation = {
      ...allocation,
      [engineType]: {
        ...allocation[engineType],
        [exchange]: result.newBalance,
      },
    };

    const rebalanced = rebalanceCapital({
      allocation: updatedAllocation,
      reserve,
    });

    setAllocation(rebalanced.allocation);
    setReserve(rebalanced.reserve);

    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);

    setPerformance((prev) => {
      const isWin = result.pnl > 0;
      return {
        ...prev,
        [engineType]: {
          wins: prev[engineType].wins + (isWin ? 1 : 0),
          losses: prev[engineType].losses + (!isWin ? 1 : 0),
          pnl: prev[engineType].pnl + result.pnl,
        },
      };
    });

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(
        2
      )} | Risk: ${result.effectiveRisk?.toFixed(2)}%`
    );
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Trading Control</h2>
            <small>AI Governed — Human Override Layer</small>
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

        {/* ================= STATS ================= */}

        <div className="stats">
          <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
          <div><b>Reserve:</b> ${reserve.toFixed(2)}</div>
          <div><b>Peak:</b> ${peakCapital.current.toFixed(2)}</div>
          <div><b>Daily PnL:</b> ${dailyPnL.toFixed(2)}</div>
          <div><b>Trades:</b> {tradesUsed} / {dailyLimit}</div>
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

        {/* ================= EXCHANGE ================= */}

        <div className="ctrlRow">
          <button
            className={`pill ${exchange === "coinbase" ? "active" : ""}`}
            onClick={() => setExchange("coinbase")}
          >
            Coinbase
          </button>
          <button
            className={`pill ${exchange === "kraken" ? "active" : ""}`}
            onClick={() => setExchange("kraken")}
          >
            Kraken
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

          <label>
            AI Confidence
            <input
              type="number"
              value={aiConfidence}
              min="0.1"
              max="1"
              step="0.05"
              onChange={(e) =>
                setAiConfidence(Number(e.target.value))
              }
            />
          </label>

          <label>
            Human Override
            <input
              type="number"
              value={humanOverride}
              min="0.5"
              max="2"
              step="0.1"
              onChange={(e) =>
                setHumanOverride(Number(e.target.value))
              }
            />
          </label>
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

      {/* ================= PERFORMANCE ================= */}

      <aside className="postureCard">
        <h3>Engine Performance</h3>

        <div>
          <b>Scalp:</b> Wins {performance.scalp.wins} | Losses{" "}
          {performance.scalp.losses} | PnL{" "}
          {performance.scalp.pnl.toFixed(2)}
        </div>

        <div style={{ marginBottom: 16 }}>
          <b>Session:</b> Wins {performance.session.wins} |
          Losses {performance.session.losses} | PnL{" "}
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
