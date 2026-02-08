// frontend/src/pages/Trading.jsx
import React, { useState } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx
 * SOC-aligned Trading Module
 *
 * - No standalone header (uses layout topbar)
 * - Card-based navigation
 * - Matches Security Posture visual language
 * - AI assistant handled ONLY by layout
 */

export default function Trading() {
  const [tab, setTab] = useState("market");

  return (
    <div className="platformCard">
      {/* ================= HEADER ================= */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Trading Oversight</h2>
        <p className="muted" style={{ marginTop: 6 }}>
          Monitor markets, review AI-assisted execution, and analyze performance.
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
          <TradingRoom />
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
                <small>Position sizing & drawdown analysis</small>
              </div>
            </li>
            <li>
              <span className="dot ok" />
              <div>
                <b>AI Notes</b>
                <small>Execution rationale & observations</small>
              </div>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}
