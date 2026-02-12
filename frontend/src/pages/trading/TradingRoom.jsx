import React, { useState, useEffect, useRef } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { getMarketSnapshot } from "./engines/MarketFeedEngine";
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

  /* ================= LIVE MARKET ================= */

  const [market, setMarket] = useState({
    price: 100,
    volatility: 0.5,
    regime: "neutral",
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMarket(getMarketSnapshot());
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  /* ================= CAPITAL ================= */

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
    const engineCapital = allocation[engineType][exchange];

    const performanceStats = getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

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

  function regimeColor(r) {
    if (r.includes("up")) return "#2bd576";
    if (r.includes("down")) return "#ff5a5f";
    if (r.includes("volatile")) return "#ffd166";
    return "#5EC6FF";
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">

        <div className="postureTop">
          <div>
            <h2>Institutional Trading Terminal</h2>
            <small>Live Market + Adaptive AI</small>
          </div>

          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* ================= LIVE MARKET PANEL ================= */}

        <div className="stats" style={{ marginTop: 16 }}>
          <div>
            <b>Live Price:</b> ${market.price}
          </div>
          <div>
            <b>Volatility:</b> {market.volatility.toFixed(2)}
          </div>
          <div>
            <b>Regime:</b>{" "}
            <span
              style={{
                color: regimeColor(market.regime),
                fontWeight: 700,
              }}
            >
              {market.regime.replace("_", " ").toUpperCase()}
            </span>
          </div>
        </div>

        {/* ================= CAPITAL ================= */}

        <div className="stats" style={{ marginTop: 20 }}>
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

        <div className="actions" style={{ marginTop: 20 }}>
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
