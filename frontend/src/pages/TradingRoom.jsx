import React, { useEffect, useState, useMemo } from "react";

const API_BASE = "/api";

/* ================= HELPERS ================= */

function money(v) {
  if (v == null) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function pct(v) {
  if (v == null) return "—";
  return `${(Number(v) * 100).toFixed(2)}%`;
}

/* =========================================================
   TRADING COMMAND CENTER
========================================================= */

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");

  /* ================= SNAPSHOTS ================= */

  async function loadSnapshots() {
    try {
      const [paperRes, liveRes, riskRes] = await Promise.all([
        fetch(`${API_BASE}/trading/paper/snapshot`).then(r => r.json()),
        fetch(`${API_BASE}/trading/live/snapshot`).then(r => r.json()),
        fetch(`${API_BASE}/trading/risk/snapshot`).then(r => r.json()),
      ]);

      if (paperRes.ok) setPaper(paperRes.snapshot);
      if (liveRes.ok) setLive(liveRes.snapshot);
      if (riskRes.ok) setRisk(riskRes.risk);
    } catch (e) {
      console.error("Trading load failed", e);
    }
  }

  useEffect(() => {
    loadSnapshots();
    const interval = setInterval(loadSnapshots, 5000);
    return () => clearInterval(interval);
  }, []);

  /* ================= WEBSOCKET ================= */

  useEffect(() => {
    const protocol =
      window.location.protocol === "https:" ? "wss:" : "ws:";

    const ws = new WebSocket(
      `${protocol}//${window.location.host}/ws/market`
    );

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("error");

    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "tick") {
          setPrices(prev => ({
            ...prev,
            [data.symbol]: data.price,
          }));
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  /* ================= DERIVED ================= */

  const position = paper?.position;
  const hasPosition = !!position;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <div className="trading-room">

      {/* ================= HEADER ================= */}

      <div className="trading-header">
        <h2>Trading Command Center</h2>

        <div
          className={`badge ${
            wsStatus === "connected"
              ? "ok"
              : wsStatus === "error"
              ? "warn"
              : ""
          }`}
        >
          Feed: {wsStatus.toUpperCase()}
        </div>
      </div>

      {/* ================= ALERT ================= */}

      {risk?.halted && (
        <div className="trading-alert">
          Trading Halted — {risk.haltReason || "Risk Governor Active"}
        </div>
      )}

      {/* ================= MARKET GRID ================= */}

      <div className="trading-card">
        <h3>Live Market Stream</h3>

        {Object.keys(prices).length === 0 ? (
          <div className="muted">Waiting for market ticks…</div>
        ) : (
          <div className="trading-market-grid">
            {Object.entries(prices).map(([symbol, price]) => (
              <div key={symbol} className="trading-ticker">
                <span>{symbol}</span>
                <span>{price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MAIN GRID ================= */}

      <div className="trading-grid">

        {/* ===== PAPER ENGINE ===== */}
        <div className="trading-card">
          <h3>Paper Engine</h3>

          <div>Equity: {money(paper?.equity)}</div>
          <div>Peak: {money(paper?.peakEquity)}</div>
          <div>Trades: {paper?.trades?.length || 0}</div>

          <hr style={{ opacity: 0.15 }} />

          <h4>Active Position</h4>

          {hasPosition ? (
            <>
              <div>Quantity: {position.qty}</div>
              <div>Entry: {money(position.entry)}</div>
            </>
          ) : (
            <div className="muted">No open position</div>
          )}
        </div>

        {/* ===== LIVE ENGINE ===== */}
        <div className="trading-card">
          <h3>Live Engine</h3>

          <div>Mode: {live?.mode || "—"}</div>
          <div>Equity: {money(live?.equity)}</div>
          <div>Margin Used: {money(live?.marginUsed)}</div>

          <div>
            Liquidation:{" "}
            {live?.liquidation ? (
              <span className="status-negative">YES ⚠</span>
            ) : (
              "No"
            )}
          </div>
        </div>

        {/* ===== RISK ENGINE ===== */}
        <div className="trading-card">
          <h3>Risk Engine</h3>

          <div>
            Halted:{" "}
            {risk?.halted ? (
              <span className="status-negative">YES</span>
            ) : (
              "No"
            )}
          </div>

          <div>Multiplier: {risk?.riskMultiplier?.toFixed(2)}</div>
          <div>Drawdown: {pct(risk?.drawdown)}</div>
          <div>Reason: {risk?.haltReason || "—"}</div>
        </div>

        {/* ===== PERFORMANCE ===== */}
        <div className="trading-card">
          <h3>Performance Snapshot</h3>

          <div>Paper Equity: {money(paper?.equity)}</div>
          <div>Live Equity: {money(live?.equity)}</div>

          <div>
            Delta:{" "}
            {money(
              (live?.equity || 0) - (paper?.equity || 0)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
