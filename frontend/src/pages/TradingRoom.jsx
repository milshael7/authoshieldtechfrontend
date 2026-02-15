import React, { useEffect, useState } from "react";

const API_BASE = "/api";

export default function TradingRoom() {
  const [paper, setPaper] = useState(null);
  const [live, setLive] = useState(null);
  const [risk, setRisk] = useState(null);
  const [prices, setPrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");

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
          setPrices((prev) => ({
            ...prev,
            [data.symbol]: data.price,
          }));
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="postureWrap" style={{ padding: 20 }}>
      <h2>Trading Oversight</h2>

      <div style={{ marginBottom: 20 }}>
        <strong>WebSocket:</strong>{" "}
        <span
          style={{
            color:
              wsStatus === "connected"
                ? "#5EC6FF"
                : wsStatus === "error"
                ? "#ff4d4d"
                : "#aaa",
          }}
        >
          {wsStatus}
        </span>
      </div>

      {/* ================= PAPER ================= */}

      <section style={{ marginBottom: 30 }}>
        <h3>Paper Engine</h3>
        {paper ? (
          <div>
            <div>Equity: ${paper.equity?.toFixed(2)}</div>
            <div>Peak: ${paper.peakEquity?.toFixed(2)}</div>
            <div>
              Position:{" "}
              {paper.position
                ? `${paper.position.qty} @ ${paper.position.entry}`
                : "None"}
            </div>
            <div>Trades: {paper.trades?.length}</div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </section>

      {/* ================= LIVE ================= */}

      <section style={{ marginBottom: 30 }}>
        <h3>Live Engine</h3>
        {live ? (
          <div>
            <div>Mode: {live.mode}</div>
            <div>Equity: ${live.equity?.toFixed(2)}</div>
            <div>Margin Used: ${live.marginUsed?.toFixed(2)}</div>
            <div>
              Maintenance Required: $
              {live.maintenanceRequired?.toFixed(2)}
            </div>
            <div>
              Liquidation Flag:{" "}
              {live.liquidation ? "YES ⚠️" : "No"}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </section>

      {/* ================= RISK ================= */}

      <section style={{ marginBottom: 30 }}>
        <h3>Risk Status</h3>
        {risk ? (
          <div>
            <div>Halted: {risk.halted ? "YES" : "No"}</div>
            <div>Reason: {risk.haltReason || "None"}</div>
            <div>
              Risk Multiplier: {risk.riskMultiplier?.toFixed(2)}
            </div>
            <div>
              Drawdown: {(risk.drawdown * 100)?.toFixed(2)}%
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </section>

      {/* ================= MARKET PRICES ================= */}

      <section>
        <h3>Live Market</h3>
        {Object.keys(prices).length === 0 ? (
          <div>No ticks yet...</div>
        ) : (
          Object.entries(prices).map(([symbol, price]) => (
            <div key={symbol}>
              {symbol}: {price}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
