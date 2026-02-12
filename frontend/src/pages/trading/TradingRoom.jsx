import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import {
  allocateCapital,
  rebalanceCapital,
  calculateTotalCapital,
  rotateCapitalByPerformance,
} from "./engines/CapitalAllocator";
import { evaluateGlobalRisk } from "./engines/GlobalRiskGovernor";
import {
  updatePerformance,
  getPerformanceStats,
  getAllPerformanceStats,
} from "./engines/PerformanceEngine";
import {
  recordTrade,
  getEngineTrades,
} from "./engines/TradeLedger";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [humanMultiplier, setHumanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);

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

  /* ================= GLOBAL RISK ================= */

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  function pushLog(message, confidence) {
    setLog((prev) => [
      {
        t: new Date().toLocaleTimeString(),
        m: message,
        confidence,
      },
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

    const exchange = "coinbase";
    const engineCapital =
      allocation[engineType][exchange];

    const performanceStats =
      getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (result.blocked) {
      pushLog(
        `Blocked: ${result.reason}`,
        result.confidenceScore
      );
      return;
    }

    /* ===== Record Trade in Ledger ===== */
    recordTrade(engineType, {
      pnl: result.pnl,
      confidence: result.confidenceScore,
      positionSize: result.positionSize,
      effectiveRisk: result.effectiveRisk,
      win: result.isWin,
    });

    /* ===== Update Performance Memory ===== */
    updatePerformance(
      engineType,
      result.pnl,
      result.isWin
    );

    /* ===== Update Capital ===== */
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

    const rotated = rotateCapitalByPerformance({
      allocation: rebalanced.allocation,
      performanceStats: getAllPerformanceStats(),
    });

    setAllocation(rotated);
    setReserve(rebalanced.reserve);

    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);
    setLastConfidence(result.confidenceScore);

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(
        2
      )}`,
      result.confidenceScore
    );
  }

  function confidenceColor(score) {
    if (!score && score !== 0) return "";
    if (score < 50) return "#ff4d4d";
    if (score < 75) return "#f5b942";
    return "#5EC6FF";
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Institutional Trading Control</h2>
            <small>
              Adaptive AI + Capital Rotation +
              Institutional Ledger
            </small>
          </div>

          <span
            className={`badge ${
              mode === "LIVE" ? "warn" : ""
            }`}
          >
            {mode}
          </span>
        </div>

        {!globalRisk.allowed && (
          <div
            className="badge bad"
            style={{ marginTop: 10 }}
          >
            Trading Locked — {globalRisk.reason}
          </div>
        )}

        <div className="stats">
          <div>
            <b>Total Capital:</b> $
            {totalCapital.toFixed(2)}
          </div>
          <div>
            <b>Reserve:</b> ${reserve.toFixed(2)}
          </div>
          <div>
            <b>Daily PnL:</b> $
            {dailyPnL.toFixed(2)}
          </div>
          <div>
            <b>Trades Used:</b> {tradesUsed} /{" "}
            {dailyLimit}
          </div>

          {lastConfidence !== null && (
            <div>
              <b>Last Confidence:</b>{" "}
              <span
                style={{
                  color:
                    confidenceColor(lastConfidence),
                  fontWeight: 700,
                }}
              >
                {lastConfidence}%
              </span>
            </div>
          )}
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
        <div
          style={{
            maxHeight: 400,
            overflowY: "auto",
          }}
        >
          {log.map((x, i) => (
            <div
              key={i}
              style={{ marginBottom: 8 }}
            >
              <small>{x.t}</small>
              <div>{x.m}</div>
              {x.confidence !== undefined && (
                <div
                  style={{
                    fontSize: 12,
                    color:
                      confidenceColor(x.confidence),
                  }}
                >
                  Confidence: {x.confidence}%
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
