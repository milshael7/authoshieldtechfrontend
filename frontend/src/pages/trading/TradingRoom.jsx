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
  const [lastRegime, setLastRegime] = useState(null);

  const initialCapital = 1000;

  const initialDistribution = allocateCapital({
    totalCapital: initialCapital,
  });

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] =
    useState(initialDistribution.allocation);

  const peakCapital = useRef(initialCapital);

  const totalCapital = calculateTotalCapital(allocation, reserve);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  function pushLog(message, confidence, regime) {
    setLog((prev) => [
      {
        t: new Date().toLocaleTimeString(),
        m: message,
        confidence,
        regime,
      },
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

    const exchange = "coinbase";
    const engineCapital = allocation[engineType][exchange];

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
        result.confidenceScore,
        result.regime
      );
      return;
    }

    updatePerformance(engineType, result.pnl, result.isWin);

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
    setLastRegime(result.regime);

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(2)}`,
      result.confidenceScore,
      result.regime
    );
  }

  function heatColor(value) {
    if (value > 0.6) return "#5EC6FF";
    if (value > 0.4) return "#f5b942";
    return "#ff4d4d";
  }

  const allStats = getAllPerformanceStats();

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Quant Command Center</h2>
            <small>
              Adaptive AI | Capital Rotation | Regime Aware
            </small>
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
          <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
          <div><b>Reserve:</b> ${reserve.toFixed(2)}</div>
          <div><b>Daily PnL:</b> ${dailyPnL.toFixed(2)}</div>
          <div><b>Trades Used:</b> {tradesUsed} / {dailyLimit}</div>

          {lastConfidence !== null && (
            <div>
              <b>Confidence:</b>{" "}
              <span style={{
                color: heatColor(lastConfidence / 100),
                fontWeight: 700
              }}>
                {lastConfidence}%
              </span>
            </div>
          )}

          {lastRegime && (
            <div>
              <b>Market Regime:</b>{" "}
              <span style={{ color: "#7ec8ff" }}>
                {lastRegime}
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
        <h3>Engine Heat Map</h3>

        {Object.keys(allStats).map((engine) => {
          const stats = allStats[engine];
          return (
            <div
              key={engine}
              style={{
                marginBottom: 14,
                padding: 10,
                borderLeft: `4px solid ${heatColor(stats.winRate)}`,
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <b>{engine.toUpperCase()}</b>
              <div>Win Rate: {(stats.winRate * 100).toFixed(1)}%</div>
              <div>Profit Factor: {stats.profitFactor.toFixed(2)}</div>
              <div>Sharpe: {stats.sharpe.toFixed(2)}</div>
            </div>
          );
        })}

        <h3 style={{ marginTop: 20 }}>Execution Log</h3>
        <div style={{ maxHeight: 350, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
