import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import {
  allocateCapital,
  rebalanceCapital,
  calculateTotalCapital,
  rotateCapitalByPerformance,
} from "./engines/CapitalAllocator";
import {
  evaluateGlobalRisk,
  setManualLock,
} from "./engines/GlobalRiskGovernor";
import {
  updatePerformance,
  getPerformanceStats,
  getAllPerformanceStats,
  evaluatePerformance,
} from "./engines/PerformanceEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {

  /* ================= CORE STATE ================= */

  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType] = useState("scalp");

  const [baseRisk] = useState(1);
  const [leverage] = useState(1);
  const [humanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);
  const [systemLocked, setSystemLocked] = useState(false);

  const initialCapital = 1000;

  /* ================= CAPITAL INIT (SAFE) ================= */

  const initialDistribution = useMemo(() => {
    return allocateCapital({ totalCapital: initialCapital });
  }, []);

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] = useState(initialDistribution.allocation);

  const peakCapital = useRef(initialCapital);

  const totalCapital = useMemo(() => {
    return calculateTotalCapital(allocation, reserve);
  }, [allocation, reserve]);

  /* ================= MODE SYNC ================= */

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= PEAK UPDATE SAFE ================= */

  useEffect(() => {
    if (totalCapital > peakCapital.current) {
      peakCapital.current = totalCapital;
    }
  }, [totalCapital]);

  /* ================= GLOBAL RISK ================= */

  const globalRisk = useMemo(() => {
    return evaluateGlobalRisk({
      totalCapital,
      peakCapital: peakCapital.current,
      dailyPnL,
    });
  }, [totalCapital, dailyPnL]);

  /* ================= LOGGING ================= */

  const pushLog = useCallback((message, confidence) => {
    setLog((prev) => {
      const next = [
        {
          t: new Date().toLocaleTimeString(),
          m: message,
          confidence,
        },
        ...prev,
      ];
      return next.slice(0, 200); // limit memory
    });
  }, []);

  /* ================= LOCK CONTROL ================= */

  function handleLock() {
    setManualLock(true);
    setSystemLocked(true);
    pushLog("🚨 Manual system lock activated.");
  }

  function handleUnlock() {
    setManualLock(false);
    setSystemLocked(false);
    pushLog("✅ Manual system lock released.");
  }

  /* ================= EXECUTION ================= */

  function executeTrade() {

    if (systemLocked) {
      pushLog("System locked.");
      return;
    }

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
      allocation?.[engineType]?.[exchange] ?? 0;

    if (!engineCapital) {
      pushLog("No capital allocated to engine.");
      return;
    }

    const performanceStats = getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (!result || typeof result !== "object") {
      pushLog("Engine error.");
      return;
    }

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`, result.confidenceScore);
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

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(2)}`,
      result.confidenceScore
    );
  }

  /* ================= PERFORMANCE SUMMARY ================= */

  const allStats = useMemo(() => {
    return evaluatePerformance(
      Object.values(getAllPerformanceStats())
        .flatMap((e) => e.trades || [])
    );
  }, [tradesUsed]);

  function confidenceColor(score) {
    if (score === null || score === undefined) return "";
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
            <small>Adaptive AI + Capital Rotation</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* ===== KPIs ===== */}

        <div className="kpiGrid">
          <div className="kpiCard">
            <small>Win Rate</small>
            <b>{(allStats.winRate * 100).toFixed(1)}%</b>
          </div>

          <div className="kpiCard">
            <small>Profit Factor</small>
            <b>{allStats.profitFactor.toFixed(2)}</b>
          </div>

          <div className="kpiCard">
            <small>Expectancy</small>
            <b>{allStats.expectancy.toFixed(2)}</b>
          </div>

          <div className="kpiCard">
            <small>Sharpe Ratio</small>
            <b>{allStats.sharpe.toFixed(2)}</b>
          </div>

          <div className="kpiCard">
            <small>Max Drawdown</small>
            <b>{allStats.maxDrawdown.toFixed(2)}</b>
          </div>
        </div>

        {/* ===== CAPITAL ===== */}

        <div className="stats">
          <div><b>Total Capital:</b> ${totalCapital.toFixed(2)}</div>
          <div><b>Reserve:</b> ${reserve.toFixed(2)}</div>
          <div><b>Daily PnL:</b> ${dailyPnL.toFixed(2)}</div>
          <div><b>Trades Used:</b> {tradesUsed} / {dailyLimit}</div>

          {lastConfidence !== null && (
            <div>
              <b>Last Confidence:</b>{" "}
              <span
                style={{
                  color: confidenceColor(lastConfidence),
                  fontWeight: 700,
                }}
              >
                {lastConfidence}%
              </span>
            </div>
          )}
        </div>

        {/* ===== ACTIONS ===== */}

        <div className="actions" style={{ marginTop: 20 }}>
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={
              systemLocked ||
              !globalRisk.allowed ||
              tradesUsed >= dailyLimit
            }
          >
            Execute Trade
          </button>

          {!systemLocked ? (
            <button
              className="btn warn"
              onClick={handleLock}
              style={{ marginLeft: 12 }}
            >
              Emergency Lock
            </button>
          ) : (
            <button
              className="btn ok"
              onClick={handleUnlock}
              style={{ marginLeft: 12 }}
            >
              Unlock System
            </button>
          )}
        </div>

      </section>

      {/* ===== LOG PANEL ===== */}

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <small>{x.t}</small>
              <div>{x.m}</div>
              {x.confidence !== undefined && (
                <div
                  style={{
                    fontSize: 12,
                    color: confidenceColor(x.confidence),
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
