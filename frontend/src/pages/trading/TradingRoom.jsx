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
  /* ================= CORE STATE ================= */

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
      `${engineType.toUpperCase()} | ${exchange} | PnL: ${result.pnl.toFixed(2)}`,
      result.confidenceScore
    );
  }

  function confidenceColor(score) {
    if (!score && score !== 0) return "";
    if (score < 50) return "#d64545";
    if (score < 75) return "#c89b3c";
    return "#2f80ed";
  }

  /* ================= UI ================= */

  return (
    <div style={{ display: "flex", gap: 20 }}>

      {/* ===== LEFT PANEL ===== */}
      <section
        style={{
          flex: 2,
          background: "#ffffff",
          padding: 25,
          borderRadius: 12,
          boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ marginBottom: 4 }}>Institutional Trading Control</h2>
          <div style={{ color: "#6b7280", fontSize: 14 }}>
            Adaptive AI • Capital Rotation • Global Risk Governance
          </div>
        </div>

        {!globalRisk.allowed && (
          <div
            style={{
              background: "#fdecea",
              color: "#b91c1c",
              padding: 12,
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            Trading Locked — {globalRisk.reason}
          </div>
        )}

        {/* ===== STATS GRID ===== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 15,
            marginBottom: 25,
          }}
        >
          <Stat label="Total Capital" value={`$${totalCapital.toFixed(2)}`} />
          <Stat label="Reserve" value={`$${reserve.toFixed(2)}`} />
          <Stat label="Daily PnL" value={`$${dailyPnL.toFixed(2)}`} />
          <Stat label="Trades Used" value={`${tradesUsed} / ${dailyLimit}`} />
        </div>

        {lastConfidence !== null && (
          <div style={{ marginBottom: 25 }}>
            <strong>Last Confidence:</strong>{" "}
            <span
              style={{
                color: confidenceColor(lastConfidence),
                fontWeight: 600,
              }}
            >
              {lastConfidence}%
            </span>
          </div>
        )}

        {/* ===== CONTROLS ===== */}
        <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
          <button
            onClick={() => setEngineType("scalp")}
            style={engineType === "scalp" ? activeBtn : btn}
          >
            Scalp Engine
          </button>
          <button
            onClick={() => setEngineType("session")}
            style={engineType === "session" ? activeBtn : btn}
          >
            Session Engine
          </button>
        </div>

        <div style={{ display: "grid", gap: 15, marginBottom: 20 }}>
          <Input
            label="Risk %"
            value={baseRisk}
            onChange={(v) => setBaseRisk(v)}
          />
          <Input
            label="Leverage"
            value={leverage}
            onChange={(v) => setLeverage(v)}
          />
        </div>

        <button
          onClick={executeTrade}
          disabled={!globalRisk.allowed}
          style={{
            background: "#2f80ed",
            color: "#fff",
            padding: "12px 20px",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Execute Trade
        </button>
      </section>

      {/* ===== RIGHT PANEL ===== */}
      <aside
        style={{
          flex: 1,
          background: "#f9fafb",
          padding: 20,
          borderRadius: 12,
          maxHeight: 600,
          overflowY: "auto",
        }}
      >
        <h3 style={{ marginBottom: 15 }}>Execution Log</h3>

        {log.map((x, i) => (
          <div
            key={i}
            style={{
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <small style={{ color: "#9ca3af" }}>{x.t}</small>
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
      </aside>
    </div>
  );
}

/* ===== UI COMPONENTS ===== */

function Stat({ label, value }) {
  return (
    <div
      style={{
        background: "#f3f4f6",
        padding: 15,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 5 }}>{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: "100%",
          padding: 8,
          borderRadius: 6,
          border: "1px solid #d1d5db",
        }}
      />
    </div>
  );
}

const btn = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
};

const activeBtn = {
  ...btn,
  background: "#2f80ed",
  color: "#fff",
  border: "none",
};
