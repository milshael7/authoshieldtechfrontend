import React, { useEffect, useState } from "react";

const API_BASE = "/api";

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");
  const [loading, setLoading] = useState(true);

  /* ================= LOAD SNAPSHOTS ================= */

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

  /* ================= MARKET WS ================= */

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

  function money(v) {
    if (v == null) return "-";
    return `$${Number(v).toFixed(2)}`;
  }

  if (loading) {
    return <div style={{ padding: 40 }}>Loading trading engine...</div>;
  }

  return (
    <div className="trading-room">

      {/* ================= HEADER ================= */}
      <div className="trading-header">
        <h2>Trading Command Center</h2>
        <div>
          Market Feed:{" "}
          <strong className={
            wsStatus === "connected"
              ? "status-positive"
              : wsStatus === "error"
              ? "status-negative"
              : "status-neutral"
          }>
            {wsStatus.toUpperCase()}
          </strong>
        </div>
      </div>

      {/* ================= RISK ALERT ================= */}
      {risk?.halted && (
        <div className="trading-alert">
          Trading HALTED — {risk.haltReason || "Risk protection triggered"}
        </div>
      )}

      {/* ================= KPI SUMMARY ================= */}
      <div className="trading-grid">

        <div className="trading-card">
          <h3>Paper Equity</h3>
          <h1>{money(paper?.equity)}</h1>
          <div>Peak: {money(paper?.peakEquity)}</div>
          <div>Trades: {paper?.trades?.length || 0}</div>
        </div>

        <div className="trading-card">
          <h3>Live Equity</h3>
          <h1>{money(live?.equity)}</h1>
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

        <div className="trading-card">
          <h3>Risk Status</h3>
          <h1>
            {risk?.halted ? (
              <span className="status-negative">HALTED</span>
            ) : (
              <span className="status-positive">ACTIVE</span>
            )}
          </h1>
          <div>Drawdown: {(risk?.drawdown * 100 || 0).toFixed(2)}%</div>
          <div>Multiplier: {risk?.riskMultiplier?.toFixed(2)}</div>
        </div>

      </div>

      {/* ================= MARKET TICKER ================= */}
      <div>
        <h3>Live Market</h3>

        {Object.keys(prices).length === 0 ? (
          <div style={{ opacity: 0.6 }}>Waiting for ticks...</div>
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

    </div>
  );
}
