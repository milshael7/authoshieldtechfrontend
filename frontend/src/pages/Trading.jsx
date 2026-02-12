import React, { useState, useMemo, useEffect } from "react";
import Market from "./trading/Market.jsx";
import TradingRoom from "./trading/TradingRoom.jsx";
import "../styles/platform.css";

/**
 * Trading.jsx — DUAL ENGINE GOVERNANCE (STABLE BUILD)
 */

export default function Trading() {

  const [tab, setTab] = useState("market");

  /* ================= EXECUTION ENGINE ================= */

  const [mode, setMode] = useState("paper");
  const [dailyLimit] = useState(5);
  const [tradesUsed, setTradesUsed] = useState(1);

  /* ================= HUMAN OVERRIDE CONTROL ================= */

  const [overrideRiskPct, setOverrideRiskPct] = useState(20);
  const [overrideActive, setOverrideActive] = useState(false);

  /* ================= LEARNING ENGINE ================= */

  const [learningStatus] = useState("active");
  const [simulatedTrades] = useState(143);
  const [accuracy] = useState(67.4);

  /* ================= TRADING WINDOW (AUTO REFRESH) ================= */

  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60 * 60 * 1000); // refresh hourly
    return () => clearInterval(timer);
  }, []);

  const tradingAllowed = useMemo(() => {
    const current = new Date(now);
    const day = current.getDay();
    const hour = current.getHours();

    if (day === 5 && hour >= 21) return false;
    if (day === 6 && hour < 21) return false;

    return true;
  }, [now]);

  /* ================= CAPITAL (STABLE OBJECT) ================= */

  const capital = useMemo(() => ({
    total: 100000,
    execution: 80000,
    reserve: 20000,
  }), []);

  /* ================= SAFE OVERRIDE HANDLER ================= */

  function handleRiskChange(value) {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    const clamped = Math.max(1, Math.min(50, num));
    setOverrideRiskPct(clamped);
  }

  /* ================= UI ================= */

  return (
    <div className="postureWrap">

      {/* ================= HEADER ================= */}
      <section className="postureCard" style={{ marginBottom: 20 }}>
        <div className="postureTop">
          <div>
            <h2 style={{ color: "#7ec8ff" }}>
              Quant Trading Oversight
            </h2>
            <small>
              AI-driven execution with human override governance
            </small>
          </div>

          <span className={`badge ${mode === "live" ? "warn" : ""}`}>
            {mode.toUpperCase()}
          </span>
        </div>

        {/* ================= STATUS GRID ================= */}
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {/* EXECUTION ENGINE */}
          <div>
            <b>Execution Engine (AI)</b>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${tradingAllowed ? "ok" : "bad"}`}>
                {tradingAllowed ? "Window Open" : "Trading Paused"}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              Trades: {tradesUsed} / {dailyLimit}
            </div>
            <small>AI controls 100% of strategy logic</small>
          </div>

          {/* HUMAN OVERRIDE */}
          <div>
            <b>Human Override</b>
            <div style={{ marginTop: 8 }}>
              <span className={`badge ${overrideActive ? "warn" : ""}`}>
                {overrideActive ? "ACTIVE" : "Monitoring"}
              </span>
            </div>

            <div style={{ marginTop: 8 }}>
              Risk Override %
              <input
                type="number"
                min="1"
                max="50"
                value={overrideRiskPct}
                onChange={(e) => handleRiskChange(e.target.value)}
                style={{ width: "100%", marginTop: 6 }}
              />
            </div>

            <button
              className="pill warn"
              style={{ marginTop: 8 }}
              onClick={() => setOverrideActive(prev => !prev)}
            >
              {overrideActive ? "Disable Override" : "Enable Override"}
            </button>
          </div>

          {/* LEARNING ENGINE */}
          <div>
            <b>Learning Engine</b>
            <div style={{ marginTop: 8 }}>
              <span className="badge ok">
                {learningStatus.toUpperCase()}
              </span>
            </div>
            <div style={{ marginTop: 8 }}>
              Simulated Trades: {simulatedTrades}
            </div>
            <div>Signal Accuracy: {accuracy}%</div>
            <small>Runs 24/7 — never stops learning</small>
          </div>

          {/* CAPITAL */}
          <div>
            <b>Capital Governance</b>
            <div style={{ marginTop: 8 }}>
              Total: ${capital.total.toLocaleString()}
            </div>
            <small>
              AI Execution: ${capital.execution.toLocaleString()} <br />
              Human Reserve: ${capital.reserve.toLocaleString()}
            </small>
          </div>

          {/* MODE CONTROL */}
          <div>
            <b>Execution Mode</b>
            <div style={{ marginTop: 8 }}>
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
        </div>

        <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>
          AI operates independently. Human override adjusts exposure only.
          Weekend lock enforced. Learning engine always active.
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
            overrideActive={overrideActive}
            overrideRiskPct={overrideRiskPct}
            setTradesUsed={setTradesUsed}
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
                <b>Signal Accuracy</b>
                <small>Learning engine performance</small>
              </div>
            </li>
            <li>
              <span className="dot warn" />
              <div>
                <b>Risk Exposure</b>
                <small>AI exposure vs human override ratio</small>
              </div>
            </li>
          </ul>
        </section>
      )}

    </div>
  );
}
