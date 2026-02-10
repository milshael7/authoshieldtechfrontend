import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx — VISUALLY COORDINATED
 * SOC-aligned Trading Oversight Module
 *
 * PURPOSE:
 * - Single supervisory surface for trading
 * - Shared governance state
 * - Visual + logical consistency between Market & Trading Room
 *
 * HARD RULES:
 * - NO execution logic
 * - NO API keys
 * - NO automation
 * - NO AI control
 */

export default function Trading() {
  const [tab, setTab] = useState("market");

  /* ================= GOVERNANCE STATE (UI ONLY) ================= */
  const [mode, setMode] = useState("paper"); // paper | live
  const [dailyLimit, setDailyLimit] = useState(5);
  const [executionState, setExecutionState] = useState("idle"); // idle | armed | executing
  const [tradesUsed, setTradesUsed] = useState(1);

  return (
    <div className="postureWrap">
      {/* ================= HEADER ================= */}
      <section className="postureCard" style={{ marginBottom: 20 }}>
        <div className="postureTop">
          <div>
            <h2>Trading Oversight</h2>
            <small>
              Market supervision, execution governance, and operator control
            </small>
          </div>

          <span className={`badge ${mode === "live" ? "warn" : ""}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        {/* ================= GOVERNANCE STRIP ================= */}
        <div
          className="stats"
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 14,
          }}
        >
          {/* MODE */}
          <div>
            <b>Execution Mode</b>
            <div style={{ marginTop: 6 }}>
              <button
                className={mode === "paper" ? "pill active" : "pill"}
                onClick={() => setMode("paper")}
              >
                PAPER
              </button>
              <button
                className={mode === "live" ? "pill warn active" : "pill warn"}
                onClick={() => setMode("live")}
                style={{ marginLeft: 8 }}
              >
                LIVE
              </button>
            </div>
          </div>

          {/* DAILY LIMIT */}
          <div>
            <b>Daily Limit</b>
            <input
              type="number"
              min={1}
              max={50}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              style={{ marginTop: 6, width: "100%" }}
            />
          </div>

          {/* EXECUTION */}
          <div>
            <b>Execution Status</b>
            <div style={{ marginTop: 8 }}>
              <span
                className={`badge ${
                  executionState === "armed"
                    ? "warn"
                    : executionState === "executing"
                    ? "ok"
                    : ""
                }`}
              >
                {executionState.toUpperCase()}
              </span>
            </div>
          </div>

          {/* USAGE */}
          <div>
            <b>Trades Used</b>
            <div style={{ marginTop: 8, fontWeight: 700 }}>
              {tradesUsed} / {dailyLimit}
            </div>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>
          Live trading is never automatic. All actions require operator intent,
          are visually enforced, and logged.
        </p>
      </section>

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
        <section className="postureCard">
          <Market
            mode={mode}
            dailyLimit={dailyLimit}
            tradesUsed={tradesUsed}
          />
        </section>
      )}

      {tab === "room" && (
        <section className="postureCard">
          <TradingRoom
            mode={mode}
            dailyLimit={dailyLimit}
            executionState={executionState}
          />
        </section>
      )}

      {tab === "reports" && (
        <section className="postureCard">
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
                <b>Execution Notes</b>
                <small>Operator and system observations</small>
              </div>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
