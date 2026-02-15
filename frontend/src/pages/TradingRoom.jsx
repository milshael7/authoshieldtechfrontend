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

  function money(v) {
    if (v == null) return "-";
    return `$${Number(v).toFixed(2)}`;
  }

  function pct(v) {
    if (v == null) return "-";
    return `${(Number(v) * 100).toFixed(2)}%`;
  }

  function statusColor(status) {
    if (status === "connected") return "#5EC6FF";
    if (status === "error") return "#ff4d4d";
    return "#999";
  }

  /* =======================================================
     UI
  ======================================================= */

  if (loading) {
    return (
      <div className="postureWrap" style={{ padding: 30 }}>
        Loading trading engine...
      </div>
    );
  }

  return (
    <div className="postureWrap" style={{ padding: 30 }}>
      <h2 style={{ marginBottom: 20 }}>Trading Oversight</h2>

      {/* ================= CONNECTION STATUS ================= */}
      <div style={{ marginBottom: 30 }}>
        <strong>Market Feed:</strong>{" "}
        <span style={{ color: statusColor(wsStatus) }}>
          {wsStatus.toUpperCase()}
        </span>
      </div>

      {/* ================= GRID ================= */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* PAPER */}
        <div className="card">
          <h3>Paper Engine</h3>
          {paper ? (
            <>
              <div>Equity: {money(paper.equity)}</div>
              <div>Peak: {money(paper.peakEquity)}</div>
              <div>Trades: {paper.trades?.length || 0}</div>
              <div>
                Position:{" "}
                {paper.position
                  ? `${paper.position.qty} @ ${paper.position.entry}`
                  : "None"}
              </div>
            </>
          ) : (
            "Unavailable"
          )}
        </div>

        {/* LIVE */}
        <div className="card">
          <h3>Live Engine</h3>
          {live ? (
            <>
              <div>Mode: {live.mode}</div>
              <div>Equity: {money(live.equity)}</div>
              <div>Margin Used: {money(live.marginUsed)}</div>
              <div>
                Maintenance: {money(live.maintenanceRequired)}
              </div>
              <div>
                Liquidation:{" "}
                {live.liquidation ? (
                  <span style={{ color: "#ff4d4d" }}>YES ⚠️</span>
                ) : (
                  "No"
                )}
              </div>
            </>
          ) : (
            "Unavailable"
          )}
        </div>

        {/* RISK */}
        <div className="card">
          <h3>Risk Status</h3>
          {risk ? (
            <>
              <div>
                Halted:{" "}
                {risk.halted ? (
                  <span style={{ color: "#ff4d4d" }}>YES</span>
                ) : (
                  "No"
                )}
              </div>
              <div>Reason: {risk.haltReason || "None"}</div>
              <div>Multiplier: {risk.riskMultiplier?.toFixed(2)}</div>
              <div>Drawdown: {pct(risk.drawdown)}</div>
            </>
          ) : (
            "Unavailable"
          )}
        </div>
      </div>

      {/* ================= MARKET ================= */}
      <div style={{ marginTop: 40 }}>
        <h3>Live Market Prices</h3>

        {Object.keys(prices).length === 0 ? (
          <div style={{ opacity: 0.6 }}>Waiting for ticks...</div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
              marginTop: 10,
            }}
          >
            {Object.entries(prices).map(([symbol, price]) => (
              <div key={symbol} className="card small">
                <strong>{symbol}</strong>
                <div>{price}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
