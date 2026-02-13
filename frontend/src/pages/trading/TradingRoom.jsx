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

  const initialDistribution = useMemo(() => {
    return allocateCapital({ totalCapital: initialCapital });
  }, []);

  const [reserve, setReserve] = useState(initialDistribution.reserve);
  const [allocation, setAllocation] = useState(initialDistribution.allocation);

  const peakCapital = useRef(initialCapital);

  const totalCapital = useMemo(() => {
    return calculateTotalCapital(allocation, reserve);
  }, [allocation, reserve]);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  useEffect(() => {
    if (totalCapital > peakCapital.current) {
      peakCapital.current = totalCapital;
    }
  }, [totalCapital]);

  const globalRisk = useMemo(() => {
    return evaluateGlobalRisk({
      totalCapital,
      peakCapital: peakCapital.current,
      dailyPnL,
    });
  }, [totalCapital, dailyPnL]);

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
      return next.slice(0, 200);
    });
  }, []);

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

  function executeTrade() {

    if (systemLocked) return pushLog("System locked.");
    if (!globalRisk.allowed) return pushLog(`Blocked: ${globalRisk.reason}`);
    if (tradesUsed >= dailyLimit) return pushLog("Daily trade count limit reached.");

    const exchange = "coinbase";
    const engineCapital = allocation?.[engineType]?.[exchange] ?? 0;

    if (!engineCapital) return pushLog("No capital allocated to engine.");

    const performanceStats = getPerformanceStats(engineType);

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct: baseRisk,
      leverage,
      humanMultiplier,
      recentPerformance: performanceStats,
    });

    if (!result || result.blocked) {
      return pushLog(`Blocked: ${result?.reason || "Engine error"}`, result?.confidenceScore);
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

  const allStats = useMemo(() => {
    const allTrades = Object.values(getAllPerformanceStats())
      .flatMap((e) => e.trades || []);
    return evaluatePerformance(allTrades);
  }, [tradesUsed]);

  function confidenceColor(score) {
    if (score == null) return "";
    if (score < 50) return "#ff4d4d";
    if (score < 75) return "#f5b942";
    return "#5EC6FF";
  }

  return (
    <div className="postureWrap">
      {/* UI remains unchanged */}
    </div>
  );
}
