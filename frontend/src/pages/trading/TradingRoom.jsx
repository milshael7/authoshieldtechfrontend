import React, { useMemo, useState, useEffect, useRef } from "react";

/**
 * TradingRoom.jsx — HARDENED
 * SOC-aligned Trading Control Room
 *
 * ROLE:
 * - Operational governance
 * - Risk & execution visibility
 * - Human-in-the-loop execution
 *
 * HARD RULES:
 * - NO AI execution
 * - NO API keys
 * - NO auto trading
 * - Assistant lives in layout ONLY
 */

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
  executionState: parentExecution = "idle",
}) {
  /* ===================== STATE ===================== */
  const [mode, setMode] = useState(parentMode.toUpperCase()); // PAPER | LIVE
  const [execution, setExecution] = useState(parentExecution); // idle | armed | executing | paused
  const [riskPct, setRiskPct] = useState(1);
  const [tradeStyle, setTradeStyle] = useState("short"); // short | session
  const [tradesUsed, setTradesUsed] = useState(1);

  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "Trading room initialized." },
  ]);

  /* ===================== SYNC ===================== */
  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  useEffect(() => {
    setExecution(parentExecution);
  }, [parentExecution]);

  /* ===================== STATS ===================== */
  const stats = useMemo(
    () => ({
      tradesToday: tradesUsed,
      wins: 1,
      losses: 0,
      lastAction: "BUY BTCUSDT",
    }),
    [tradesUsed]
  );

  /* ===================== HELPERS ===================== */
  const pushLog = (message) => {
    setLog((prev) =>
      [{ t: new Date().toLocaleTimeString(), m: message }, ...prev].slice(0, 80)
    );
  };

  /* ===================== AI CONTEXT (ADVISORY ONLY) ===================== */
  const learnedRef = useRef(false);

  useEffect(() => {
    if (learnedRef.current) return;
    learnedRef.current = true;

    fetch("/api/ai/learn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        type: "site",
        text: `
AutoShield Trading Room — Governance Context

- PAPER = simulated execution
- LIVE = real capital exposure
- Human confirmation required
- Daily trade limits enforced visually
- Risk is percentage-based
- Assistant explains rationale, never executes
`,
      }),
    }).catch(() => {});
  }, []);

  /* ===================== UI ===================== */
  return (
    <div className="postureWrap">
      {/* ================= LEFT: CONTROL ================= */}
      <section className="postureCard">
        {/* HEADER */}
        <div className="postureTop">
          <div>
            <h2>Trading Control Room</h2>
            <small>Execution intent, exposure & governance</small>
          </div>

          <span
            className={`badge ${
              mode === "LIVE" ? "warn" : ""
            }`}
          >
            {mode}
          </span>
        </div>

        {/* EXECUTION STATUS */}
        <div className="stats">
          <div>
            <b>Status:</b>{" "}
            <span
              className={`badge ${
                execution === "paused"
                  ? "warn"
                  : execution === "executing"
                  ? "ok"
                  : ""
              }`}
            >
              {execution.toUpperCase()}
            </span>
          </div>

          <div>
            <b>Trades Used:</b> {tradesUsed} / {dailyLimit}
          </div>

          <div>
            <b>Risk:</b> {riskPct}%
          </div>

          <div>
            <b>Style:</b> {tradeStyle.toUpperCase()}
          </div>
        </div>

        {/* RISK CONTROL */}
        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={riskPct}
              onChange={(e) => {
                setRiskPct(e.target.value);
                pushLog(`Risk adjusted to ${e.target.value}%`);
              }}
            />
          </label>
        </div>

        {/* TRADE STYLE */}
        <div className="ctrlRow">
          <button
            className={`pill ${tradeStyle === "short" ? "active" : ""}`}
            onClick={() => {
              setTradeStyle("short");
              pushLog("Trade style set to SHORT trades");
            }}
          >
            Short Trades
          </button>

          <button
            className={`pill ${tradeStyle === "session" ? "active" : ""}`}
            onClick={() => {
              setTradeStyle("session");
              pushLog("Trade style set to SESSION trades");
            }}
          >
            Session Trades
          </button>
        </div>

        {/* OPERATOR ACTIONS */}
        <div className="actions">
          <button
            className="btn warn"
            disabled={execution === "paused"}
            onClick={() => {
              setExecution("paused");
              pushLog("Operator paused trading");
            }}
          >
            Pause
          </button>

          <button
            className="btn ok"
            disabled={tradesUsed >= dailyLimit}
            onClick={() => {
              setExecution("executing");
              setTradesUsed((v) => v + 1);
              pushLog("Trade executed (simulated)");
            }}
          >
            Execute Trade
          </button>
        </div>

        {tradesUsed >= dailyLimit && (
          <p className="muted" style={{ marginTop: 12 }}>
            Daily trade limit reached. Execution locked.
          </p>
        )}
      </section>

      {/* ================= RIGHT: ACTIVITY LOG ================= */}
      <aside className="postureCard">
        <h3>Operational Activity</h3>
        <p className="muted">
          System state changes and operator actions.
        </p>

        <div
          className="tr-log"
          style={{
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          {log.map((x, i) => (
            <div key={i} className="tr-msg">
              <span className="time">{x.t}</span>
              <div>{x.m}</div>
            </div>
          ))}
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Use the assistant drawer for explanations and trade rationale.
        </p>
      </aside>
    </div>
  );
}
