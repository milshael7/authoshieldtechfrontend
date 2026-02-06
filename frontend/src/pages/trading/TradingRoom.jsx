import React, { useMemo, useState } from "react";
import VoiceAI from "../../components/VoiceAI";

export default function TradingRoom() {
  const [log, setLog] = useState([
    { t: new Date().toLocaleTimeString(), m: "AI online. Awaiting strategy input." },
  ]);

  const pushLog = (m) =>
    setLog((p) => [{ t: new Date().toLocaleTimeString(), m }, ...p].slice(0, 50));

  const status = useMemo(
    () => [
      { k: "Mode", v: "Paper" },
      { k: "Mindset", v: "Risk-Controlled" },
      { k: "Max Losses", v: "3" },
    ],
    []
  );

  return (
    <div className="trading-room">
      {/* ===== HEADER ===== */}
      <header className="tr-header">
        <div className="tr-title">
          <h2>Trading Room</h2>
          <small>AI strategy, control & execution</small>
        </div>

        <div className="tr-status">
          {status.map((x) => (
            <span key={x.k} className="tr-badge">
              {x.k}: <b>{x.v}</b>
            </span>
          ))}
        </div>
      </header>

      {/* ===== BODY ===== */}
      <div className="tr-body">
        {/* ===== AI COMMAND PANEL ===== */}
        <section className="tr-panel">
          <h3>AI Command</h3>
          <p className="tr-muted">
            Give rules, ask reasoning, adjust risk behavior.
          </p>

          <VoiceAI
            title="AutoShield AI"
            endpoint="/api/ai/chat"
            onActivity={(msg) => pushLog(msg)}
          />
        </section>

        {/* ===== ACTIVITY LOG ===== */}
        <section className="tr-panel">
          <h3>AI Activity</h3>

          <div className="tr-log">
            {log.map((x, i) => (
              <div key={i} className="tr-msg">
                <span className="tr-time">{x.t}</span>
                <div>{x.m}</div>
              </div>
            ))}
          </div>

          <div className="tr-actions">
            <button
              className="tr-btn warn"
              onClick={() => pushLog("Operator: Trading paused")}
            >
              Pause AI
            </button>
            <button
              className="tr-btn ok"
              onClick={() => pushLog("Operator: Trading resumed")}
            >
              Resume AI
            </button>
          </div>
        </section>
      </div>

      {/* ===== STYLES (SCOPED) ===== */}
      <style>{`
        .trading-room{
          display:flex;
          flex-direction:column;
          gap:16px;
        }

        .tr-header{
          display:flex;
          justify-content:space-between;
          gap:12px;
          flex-wrap:wrap;
          align-items:flex-end;
        }

        .tr-title small{
          opacity:.7;
        }

        .tr-status{
          display:flex;
          gap:8px;
          flex-wrap:wrap;
        }

        .tr-badge{
          padding:6px 10px;
          border-radius:999px;
          font-size:12px;
          border:1px solid rgba(255,255,255,.15);
          background:rgba(0,0,0,.25);
        }

        .tr-body{
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:16px;
        }

        .tr-panel{
          background:rgba(0,0,0,.18);
          border:1px solid rgba(255,255,255,.12);
          border-radius:16px;
          padding:16px;
          display:flex;
          flex-direction:column;
          min-height:320px;
        }

        .tr-muted{
          opacity:.7;
          font-size:13px;
          margin-bottom:10px;
        }

        .tr-log{
          flex:1;
          overflow:auto;
          display:flex;
          flex-direction:column;
          gap:10px;
          margin-top:6px;
        }

        .tr-msg{
          background:rgba(255,255,255,.06);
          border-radius:12px;
          padding:10px;
          font-size:14px;
        }

        .tr-time{
          display:block;
          font-size:11px;
          opacity:.6;
          margin-bottom:4px;
        }

        .tr-actions{
          display:flex;
          gap:10px;
          margin-top:12px;
        }

        .tr-btn{
          flex:1;
          padding:12px;
          border-radius:12px;
          font-weight:600;
          cursor:pointer;
          border:1px solid rgba(255,255,255,.12);
        }

        .tr-btn.ok{
          background:#2bd576;
          color:#000;
        }

        .tr-btn.warn{
          background:#ffd166;
          color:#000;
        }

        /* 📱 MOBILE */
        @media (max-width: 768px){
          .tr-body{
            grid-template-columns:1fr;
          }

          .tr-panel{
            min-height:auto;
          }
        }
      `}</style>
    </div>
  );
}
