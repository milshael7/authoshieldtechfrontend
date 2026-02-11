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
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

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

  const totalCapital = calculateTotalCapital(
    allocation,
    reserve
  );

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

  /* ================= EXECUTION ================= */

  function executeTrade() {
    if (!globalRisk.allowed) {
      pushLog(`Blocked: ${globalRisk.reason}`);
      return;
    }

    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade count limit reached.");
      return;
    }

    // We trade from Coinbase only (can expand later)
    const exchange = "coinbase";

    const engineCapital =
      allocation[engineType][exchange];

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
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

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(
        2
      )}`
    );
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Trading Control</h2>
            <small>Allocator + Global Risk Governed</small>
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

        <div className="stats">
          <div>
            <b>Total Capital:</b> ${totalCapital.toFixed(2)}
          </div>
          <div>
            <b>Reserve:</b> ${reserve.toFixed(2)}
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
