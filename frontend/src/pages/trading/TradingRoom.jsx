import React, { useState, useEffect } from "react";
import { executeEngine } from "../../trading/engines/EngineController";
import {
  allocateCapital,
  rebalanceCapital,
} from "../../trading/engines/CapitalController";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [mode, setMode] = useState(parentMode.toUpperCase());
  const [masterCapital, setMasterCapital] = useState(1000);
  const [allocationPct, setAllocationPct] = useState(50);
  const [allocation, setAllocation] = useState(
    allocateCapital(1000, 50)
  );

  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(5);
  const [engineType, setEngineType] = useState("scalp");
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    setMode(parentMode.toUpperCase());
  }, [parentMode]);

  useEffect(() => {
    setAllocation(allocateCapital(masterCapital, allocationPct));
  }, [masterCapital, allocationPct]);

  function pushLog(message) {
    setLog((prev) =>
      [{ t: new Date().toLocaleTimeString(), m: message }, ...prev].slice(0, 100)
    );
  }

  function executeTrade() {
    if (tradesUsed >= dailyLimit) {
      pushLog("Daily limit reached.");
      return;
    }

    const engineCapital =
      engineType === "scalp" ? allocation.scalp : allocation.session;

    const result = executeEngine({
      engineType,
      balance: engineCapital,
      riskPct,
      leverage,
    });

    const updatedCapital = result.newBalance;

    const newAllocation =
      engineType === "scalp"
        ? {
            ...allocation,
            scalp: updatedCapital,
            total:
              updatedCapital + allocation.session,
          }
        : {
            ...allocation,
            session: updatedCapital,
            total:
              allocation.scalp + updatedCapital,
          };

    setAllocation(newAllocation);
    setMasterCapital(newAllocation.total);
    setTradesUsed((v) => v + 1);

    pushLog(
      `${engineType.toUpperCase()} trade | PnL: ${result.pnl.toFixed(
        2
      )} | Engine Balance: ${updatedCapital.toFixed(2)}`
    );
  }

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <div className="postureTop">
          <div>
            <h2>Capital Allocation Control</h2>
            <small>Separated engine capital</small>
          </div>
          <span className={`badge ${mode === "LIVE" ? "warn" : ""}`}>
            {mode}
          </span>
        </div>

        {/* MASTER CAPITAL */}
        <div style={{ marginBottom: 16 }}>
          <b>Master Capital</b>
          <input
            type="number"
            value={masterCapital}
            onChange={(e) =>
              setMasterCapital(Number(e.target.value))
            }
          />
        </div>

        {/* ALLOCATION */}
        <div style={{ marginBottom: 16 }}>
          <b>Scalp Allocation %</b>
          <input
            type="number"
            value={allocationPct}
            min="0"
            max="100"
            onChange={(e) =>
              setAllocationPct(Number(e.target.value))
            }
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <b>Scalp:</b> ${allocation.scalp.toFixed(2)}
          <br />
          <b>Session:</b> ${allocation.session.toFixed(2)}
        </div>

        {/* ENGINE SELECT */}
        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp Engine
          </button>
          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session Engine
          </button>
        </div>

        {/* EXECUTE */}
        <div className="actions">
          <button
            className="btn ok"
            disabled={tradesUsed >= dailyLimit}
            onClick={executeTrade}
          >
            Execute Trade
          </button>
        </div>

        <div style={{ marginTop: 20 }}>
          <b>Total Balance:</b> ${masterCapital.toFixed(2)}
        </div>
      </section>

      <aside className="postureCard">
        <h3>Execution Log</h3>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {log.map((x, i) => (
            <div key={i}>
              <small>{x.t}</small>
              <div>{x.m}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
