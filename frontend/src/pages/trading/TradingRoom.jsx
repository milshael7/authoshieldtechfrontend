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
import { detectMarketRegime } from "./engines/MarketRegimeEngine";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  /* ================= STATE ================= */

  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [engineType, setEngineType] = useState("scalp");
  const [baseRisk, setBaseRisk] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [humanMultiplier, setHumanMultiplier] = useState(1);

  const [dailyPnL, setDailyPnL] = useState(0);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);
  const [lastConfidence, setLastConfidence] = useState(null);
  const [cooldown, setCooldown] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date().toDateString());
  const [regime, setRegime] = useState("neutral");

  /* ================= INITIAL CAPITAL ================= */

  const initialCapital = 1000;

  const initialDistribution = allocateCapital({
    totalCapital: initialCapital,
  });

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] = useState(initialDistribution.allocation);

  const peakCapital = useRef(initialCapital);

  const totalCapital = calculateTotalCapital(allocation, reserve);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  /* ================= DAILY RESET ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      const today = new Date().toDateString();
      if (today !== currentDate) {
        setTradesUsed(0);
        setDailyPnL(0);
        setCurrentDate(today);
        pushLog("🔄 Daily reset executed.");
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [currentDate]);

  /* ================= MARKET REGIME ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setRegime(detectMarketRegime());
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  /* ================= GLOBAL RISK ================= */

  const globalRisk = evaluateGlobalRisk({
    totalCapital,
    peakCapital: peakCapital.current,
    dailyPnL,
  });

  if (totalCapital > peakCapital.current) {
    peakCapital.current = totalCapital;
  }

  function pushLog(message, confidence, metadata) {
    setLog((prev) => [
      {
        t: new Date().toLocaleTimeString(),
        m: message,
        confidence,
        metadata,
      },
      ...prev,
    ]);
  }

  /* ================= EXECUTION ================= */

  function executeTrade() {
    if (cooldown) {
      pushLog("Cooldown active after loss streak.");
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
    const engineCapital = allocation[engineType][exchange];

    const performanceStats = getPerformanceStats(engineType);

    /* ==== Volatility Adaptive Leverage ==== */
    const volatilityAdjustedLeverage =
      regime === "high_volatility"
        ? leverage * 0.6
        : regime === "trending"
        ? leverage * 1.1
        : leverage;

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage: volatilityAdjustedLeverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (result.blocked) {
      pushLog(`Blocked: ${result.reason}`, result.confidenceScore);
      return;
    }

    /* ==== Update Performance ==== */
    updatePerformance(engineType, result.pnl, result.isWin);

    if (!result.isWin && performanceStats.losses >= 2) {
      setCooldown(true);
      setTimeout(() => setCooldown(false), 10000);
      pushLog("⚠ Cooldown triggered after loss streak.");
    }

    /* ==== Capital Update ==== */
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

    /* ==== Reserve Auto Deployment ==== */
    let updatedReserve = rebalanced.reserve;
    if (updatedReserve > 300 && dailyPnL > 50) {
      rotated[engineType][exchange] += 50;
      updatedReserve -= 50;
      pushLog("💰 Reserve deployed to performing engine.");
    }

    /* ==== Hedge Logic ==== */
    if (regime === "high_volatility" && engineType === "session") {
      rotated["scalp"][exchange] += 20;
      pushLog("🛡 Hedge capital rotated to scalp engine.");
    }

    setAllocation(rotated);
    setReserve(updatedReserve);

    setTradesUsed((v) => v + 1);
    setDailyPnL((v) => v + result.pnl);
    setLastConfidence(result.confidenceScore);

    pushLog(
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(
        2
      )}`,
      result.confidenceScore,
      result.metadata
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
            <small>Full Adaptive AI + Capital Intelligence</small>
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

        {cooldown && (
          <div className="badge warn" style={{ marginTop: 10 }}>
            Cooldown Active
          </div>
        )}

        <div className="stats">
          <div><b>Total:</b> ${totalCapital.toFixed(2)}</div>
          <div><b>Reserve:</b> ${reserve.toFixed(2)}</div>
          <div><b>Daily PnL:</b> ${dailyPnL.toFixed(2)}</div>
          <div><b>Trades:</b> {tradesUsed} / {dailyLimit}</div>
          <div><b>Regime:</b> {regime}</div>

          {lastConfidence !== null && (
            <div>
              <b>Confidence:</b>{" "}
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

        <div className="actions">
          <button
            className="btn ok"
            onClick={executeTrade}
            disabled={!globalRisk.allowed || cooldown}
          >
            Execute Trade
          </button>
        </div>
      </section>

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
