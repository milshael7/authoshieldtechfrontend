// frontend/src/pages/trading/TradingRoom.jsx
import React, { useMemo, useState } from "react";
import VoiceAI from "../../components/VoiceAI";

export default function TradingRoom() {
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "AI online. Waiting for instructions…" },
  ]);

  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 50));

  const tools = useMemo(
    () => [
      { k: "Paper Mode", v: "ON" },
      { k: "Real Mode", v: "OFF" },
      { k: "Risk Cap", v: "Safe Base (coming)" },
      { k: "Max Losses", v: "3 (coming)" },
    ],
    []
  );

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0 }}>Trading Room</h2>
          <small>AI voice + control room (kept separate so Market panel never gets squished)</small>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {tools.map((x) => (
            <span key={x.k} className="badge">
              {x.k}: <b>{x.v}</b>
            </span>
          ))}
        </div>
      </div>

      <div className="grid" style={{ marginTop: 12 }}>
        <div className="card" style={{ background: "rgba(0,0,0,.18)" }}>
          <h3 style={{ marginTop: 0 }}>Voice AI</h3>
          <p style={{ opacity: 0.75, marginTop: 6 }}>
            This panel is where you talk to the AI and give it rules like “set order”, “safe base”, etc.
          </p>

          {/* Keep endpoint as-is for now; wire backend later */}
          <VoiceAI
            title="AutoShield Voice"
            endpoint="/api/ai/chat"
            onActivity={(msg) => pushLog(msg)}
          />
        </div>

        <div className="card" style={{ background: "rgba(0,0,0,.18)" }}>
          <h3 style={{ marginTop: 0 }}>AI Activity</h3>
          <p style={{ opacity: 0.75, marginTop: 6 }}>
            Real notifications will appear here (wins/losses/why it entered/why it skipped).
          </p>

          <div className="chatLog" style={{ maxHeight: 380 }}>
            {log.map((x, i) => (
              <div key={i} className="chatMsg ai">
                <b style={{ opacity: 0.8 }}>{x.t}</b>
                <div style={{ marginTop: 6 }}>{x.m}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button type="button" onClick={() => pushLog("Manual: Pause trading (demo)")}>
              Pause
            </button>
            <button type="button" onClick={() => pushLog("Manual: Resume trading (demo)")}>
              Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
