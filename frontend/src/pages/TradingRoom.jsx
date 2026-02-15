import React, { useEffect, useState } from "react";

const API_BASE = "/api";

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [loading, setLoading] = useState(true);

  /* =======================================================
     LOAD SNAPSHOTS
  ======================================================= */

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
    } catch (err) {
      console.error("Snapshot load failed:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSnapshots();
    const interval = setInterval(loadSnapshots, 5000);
    return () => clearInterval(interval);
  }, []);

  /* =======================================================
     MARKET WEBSOCKET
  ======================================================= */

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

  /* =======================================================
     HELPERS
  ======================================================= */

  const money = (v) =>
    v == null ? "-" : `$${Number(v).toFixed(2)}`;

  const pct = (v) =>
    v == null ? "-" : `${(Number(v) * 100).toFixed(2)}%`;

  const statusColor = {
    connected: "#5EC6FF",
    error: "#ff4d4d",
    disconnected: "#999",
  };

  if (loading) {
    return (
      <div className="layout-content">
        <h2>Initializing Trading Command Center...</h2>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="layout-content trading-room">

      {/* HEADER */}
      <div className="trading-header">
        <h2>Trading Command Center</h2>
        <div className="trading-status">
          <span>Feed:</span>
          <strong style={{ color: statusColor[wsStatus] }}>
            {wsStatus.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* GLOBAL RISK HALT */}
      {risk?.halted && (
        <div className="trading-alert">
          ⚠ SYSTEM HALTED — {risk.haltReason}
        </div>
      )}

      {/* MAIN GRID */}
      <div className="trading-grid">

        {/* PAPER ENGINE */}
        <div className="trading-card">
          <h3>Paper Engine</h3>
          <div>Equity: {money(paper?.equity)}</div>
          <div>Peak: {money(paper?.peakEquity)}</div>
          <div>Trades: {paper?.trades?.length || 0}</div>
          <div>
            Position:{" "}
            {paper?.position
              ? `${paper.position.qty} @ ${paper.position.entry}`
              : "None"}
          </div>
        </div>

        {/* LIVE ENGINE */}
        <div className="trading-card">
          <h3>Live Engine</h3>
          <div>Mode: {live?.mode}</div>
          <div>Equity: {money(live?.equity)}</div>
          <div>Margin Used: {money(live?.marginUsed)}</div>
          <div>
            Maintenance: {money(live?.maintenanceRequired)}
          </div>
          <div>
            Liquidation:{" "}
            {live?.liquidation ? (
              <span style={{ color: "#ff4d4d" }}>YES</span>
            ) : (
              "No"
            )}
          </div>
        </div>

        {/* RISK */}
        <div className="trading-card">
          <h3>Risk Engine</h3>
          <div>Multiplier: {risk?.riskMultiplier?.toFixed(2)}</div>
          <div>Drawdown: {pct(risk?.drawdown)}</div>
          <div>Volatility Regime: {risk?.volatilityRegime}</div>
          <div>Cooling: {risk?.cooling ? "YES" : "No"}</div>
        </div>

      </div>

      {/* MARKET */}
      <div className="trading-market">
        <h3>Live Market</h3>

        {Object.keys(prices).length === 0 ? (
          <div className="muted">Waiting for market data...</div>
        ) : (
          <div className="trading-market-grid">
            {Object.entries(prices).map(([symbol, price]) => (
              <div key={symbol} className="trading-ticker">
                <strong>{symbol}</strong>
                <span>{price}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
