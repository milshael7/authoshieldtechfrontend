import React, { useMemo, useState, useEffect } from "react";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
  executionState: parentExecution = "idle",
}) {

  /* ================= EXECUTION ================= */
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [execution, setExecution] = useState(parentExecution);
  const [riskPct, setRiskPct] = useState(1);
  const [tradeStyle, setTradeStyle] = useState("scalp");
  const [tradesUsed, setTradesUsed] = useState(1);

  /* ================= ACCOUNT MODEL ================= */
  const [accountBalance] = useState(100000);
  const [currentExposure, setCurrentExposure] = useState(15000);
  const [leverage, setLeverage] = useState(2);
  const [maxDrawdownPct] = useState(15);

  /* ================= DERIVED CALCS ================= */
  const effectiveExposure = useMemo(
    () => currentExposure * leverage,
    [currentExposure, leverage]
  );

  const riskPerTradeAmount = useMemo(
    () => (accountBalance * riskPct) / 100,
    [accountBalance, riskPct]
  );

  const drawdownLimit = useMemo(
    () => (accountBalance * maxDrawdownPct) / 100,
    [accountBalance, maxDrawdownPct]
  );

  const liquidationBuffer = useMemo(
    () => accountBalance - effectiveExposure,
    [accountBalance, effectiveExposure]
  );

  /* ================= NO TRADE WINDOW ================= */
  const tradingAllowed = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();

    if (day === 5 && hour >= 21) return false;
    if (day === 6 && hour < 21) return false;
    return true;
  }, []);

  useEffect(() => setMode(parentMode.toUpperCase()), [parentMode]);
  useEffect(() => setExecution(parentExecution), [parentExecution]);

  /* ================= UI ================= */
  return (
    <div className="postureWrap">

      {/* ================= LEFT PANEL ================= */}
      <section className="postureCard">

        <div className="postureTop">
          <div>
            <h2 style={{ color: "#7ec8ff" }}>
              Quant Execution Engine
            </h2>
            <small>Micro & session trade supervision</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {!tradingAllowed && (
          <p style={{ color: "#ff7a7a", marginTop: 12 }}>
            Trading window closed (Fri 9PM → Sat 9PM)
          </p>
        )}

        <div className="stats">
          <div><b>Status:</b> {execution}</div>
          <div><b>Trades:</b> {tradesUsed}/{dailyLimit}</div>
          <div><b>Risk:</b> {riskPct}%</div>
          <div><b>Style:</b> {tradeStyle}</div>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${tradeStyle === "scalp" ? "active" : ""}`}
            onClick={() => setTradeStyle("scalp")}
          >
            Micro Scalp
          </button>
          <button
            className={`pill ${tradeStyle === "session" ? "active" : ""}`}
            onClick={() => setTradeStyle("session")}
          >
            Session
          </button>
        </div>

        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="actions">
          <button
            className="btn warn"
            disabled={!tradingAllowed}
            onClick={() => setExecution("paused")}
          >
            Pause
          </button>

          <button
            className="btn ok"
            disabled={tradesUsed >= dailyLimit || !tradingAllowed}
            onClick={() => {
              setExecution("executing");
              setTradesUsed((v) => v + 1);
              setCurrentExposure((v) => v + riskPerTradeAmount);
            }}
          >
            Execute
          </button>
        </div>

      </section>

      {/* ================= RIGHT PANEL ================= */}
      <aside className="postureCard">

        <h3 style={{ color: "#7ec8ff" }}>
          Exposure & Leverage Model
        </h3>

        <div className="stats">
          <div>
            <b>Balance:</b> ${accountBalance.toLocaleString()}
          </div>

          <div>
            <b>Exposure:</b> ${currentExposure.toLocaleString()}
          </div>

          <div>
            <b>Leverage:</b>
            <input
              type="number"
              min="1"
              max="10"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              style={{ width: 60, marginLeft: 8 }}
            />
            x
          </div>

          <div>
            <b>Effective Exposure:</b> $
            {effectiveExposure.toLocaleString()}
          </div>

          <div>
            <b>Risk / Trade:</b> $
            {riskPerTradeAmount.toFixed(2)}
          </div>

          <div>
            <b>Drawdown Limit:</b> $
            {drawdownLimit.toLocaleString()}
          </div>

          <div>
            <b>Liquidation Buffer:</b>{" "}
            <span style={{
              color:
                liquidationBuffer < accountBalance * 0.2
                  ? "#ff7a7a"
                  : "#7ec8ff"
            }}>
              ${liquidationBuffer.toLocaleString()}
            </span>
          </div>
        </div>

        <p className="muted" style={{ marginTop: 12 }}>
          Effective exposure reflects leveraged capital. 
          Liquidation buffer shows remaining capital after exposure.
        </p>

      </aside>

    </div>
  );
}
