import React, { useEffect, useState } from "react";

const API_BASE = "/api";

function money(v) {
  if (v == null) return "—";
  return `$${Number(v).toFixed(2)}`;
}

function pct(v) {
  if (v == null) return "—";
  return `${(Number(v) * 100).toFixed(2)}%`;
}

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");

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
    const interval = setInterval(loadSnapshots, 4000);
    return () => clearInterval(interval);
  }, []);

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

  const position = paper?.position;

  return (
    <div style={{ padding: 30 }}>
      <h2>Trading Command Center</h2>

      <p>Feed Status: {wsStatus}</p>

      <hr />

      <h3>Live Market</h3>
      {Object.keys(prices).length === 0 ? (
        <p>Waiting for ticks...</p>
      ) : (
        Object.entries(prices).map(([symbol, price]) => (
          <div key={symbol}>
            {symbol}: {price}
          </div>
        ))
      )}

      <hr />

      <h3>Paper Engine</h3>
      {paper ? (
        <>
          <div>Equity: {money(paper.equity)}</div>
          <div>Trades: {paper.trades?.length || 0}</div>
        </>
      ) : (
        <p>Unavailable</p>
      )}

      <hr />

      <h3>Live Engine</h3>
      {live ? (
        <>
          <div>Mode: {live.mode}</div>
          <div>Equity: {money(live.equity)}</div>
          <div>Margin Used: {money(live.marginUsed)}</div>
          <div>
            Liquidation: {live.liquidation ? "YES" : "No"}
          </div>
        </>
      ) : (
        <p>Unavailable</p>
      )}

      <hr />

      <h3>Risk</h3>
      {risk ? (
        <>
          <div>Halted: {risk.halted ? "YES" : "No"}</div>
          <div>Reason: {risk.haltReason || "—"}</div>
          <div>Multiplier: {risk.riskMultiplier?.toFixed(2)}</div>
          <div>Drawdown: {pct(risk.drawdown)}</div>
        </>
      ) : (
        <p>Unavailable</p>
      )}
    </div>
  );
}
