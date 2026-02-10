import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx
 * SOC-aligned Trading Oversight Module
 *
 * PURPOSE:
 * - Central trading governance view (Admin)
 * - Paper vs Live awareness (UI-only)
 * - Trade limits & execution state visibility
 * - Market + Trading Room supervision
 *
 * RULES:
 * - NO execution logic
 * - NO API keys
 * - NO AI control here
 * - Assistant handled ONLY by layout
 */

export default function Trading() {
  const [tab, setTab] = useState("market");

  // Oversight controls (UI only)
  const [mode, setMode] = useState("paper"); // paper | live
  const [dailyLimit, setDailyLimit] = useState(5);
  const [executionState, setExecutionState] = useState("idle"); // idle | armed | executing

  return (
    <div className="platformCard">
      {/* ================= HEADER ================= */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Trading Oversight</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Monitor markets, supervise AI-assisted execution, and enforce
          trading governance.
        </p>
      </div>

      {/* ================= GOVERNANCE PANEL ================= */}
      <div className="platformCard" style={{ marginBottom: 18 }}>
        <div className="grid" style={{ gap: 16 }}>
          {/* Mode */}
          <div>
            <small className="muted">Execution Mode</small>
            <div style={{ marginTop: 6 }}>
              <button
                className={mode === "paper" ? "ptab active" : "ptab"}
                onClick={() => setMode("paper")}
              >
                Paper Trading
              </button>
              <button
                className={mode === "live" ? "ptab active" : "ptab"}
                onClick={() => setMode("live")}
                style={{ marginLeft: 8 }}
              >
                Live Trading
              </button>
            </div>
          </div>

          {/* Daily Limit */}
          <div>
            <small className="muted">Trades per Day (Limit)</small>
            <input
              type="number"
              min={1}
              max={50}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              style={{ marginTop: 6 }}
            />
          </div>

          {/* Execution State */}
          <div>
            <small className="muted">Execution Status</small>
            <div style={{ marginTop: 6 }}>
              <span
                className={`badge ${
                  executionState === "idle"
                    ? ""
                    : executionState === "armed"
                    ? "warn"
                    : "ok"
                }`}
              >
                {executionState.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          Live trading requires additional authorization and is never enabled
          automatically. All controls are logged.
        </p>
      </div>

      {/* ================= TABS ================= */}
      <div className="platformTabs" style={{ marginBottom: 18 }}>
        <button
          className={tab === "market" ? "ptab active" : "ptab"}
          onClick={() => setTab("market")}
        >
          Market
        </button>

        <button
          className={tab === "room" ? "ptab active" : "ptab"}
          onClick={() => setTab("room")}
        >
          Trading Room
        </button>

        <button
          className={tab === "reports" ? "ptab active" : "ptab"}
          onClick={() => setTab("reports")}
        >
          Reports
        </button>
      </div>

      {/* ================= CONTENT ================= */}
      {tab === "market" && (
        <section className="platformCard">
          <Market />
        </section>
      )}

      {tab === "room" && (
        <section className="platformCard">
          <TradingRoom
            mode={mode}
            dailyLimit={dailyLimit}
            executionState={executionState}
          />
        </section>
      )}

      {tab === "reports" && (
        <section className="platformCard">
          <h3>Performance Reports</h3>
          <ul className="list">
            <li>
              <span className="dot ok" />
              <div>
                <b>P&amp;L Overview</b>
                <small>Profit and loss tracking</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>Win / Loss Ratio</b>
                <small>Trade outcome distribution</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Risk Exposure</b>
                <small>Position sizing &amp; drawdown analysis</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>AI Notes</b>
                <small>Execution rationale &amp; observations</small>
              </div>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
