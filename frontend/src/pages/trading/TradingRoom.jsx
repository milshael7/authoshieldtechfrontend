import React, { useState } from "react";
import { executeEngine } from "./engines/ExecutionEngine";
import { CapitalAllocator } from "./capital/CapitalAllocator";
import { OrderLedger } from "./ledger/OrderLedger";
import { DrawdownGovernor } from "./risk/DrawdownGovernor";

export default function TradingRoom({
  mode: parentMode = "paper",
  dailyLimit = 5,
}) {
  const [engineType, setEngineType] = useState("scalp");
  const [exchange, setExchange] = useState("coinbase");
  const [riskPct, setRiskPct] = useState(1);
  const [leverage, setLeverage] = useState(1);
  const [tradesUsed, setTradesUsed] = useState(0);
  const [log, setLog] = useState([]);

  const allocator = new CapitalAllocator({});
  const ledger = new OrderLedger();
  const governor = new DrawdownGovernor();

  function pushLog(message) {
    setLog((prev) => [
      { t: new Date().toLocaleTimeString(), m: message },
      ...prev,
    ]);
  }

  function executeTrade() {
    if (tradesUsed >= dailyLimit) {
      pushLog("Daily trade limit reached.");
      return;
    }

    const balance = allocator.getBalance(exchange);
    const total = allocator.getTotal();

    const protection = governor.evaluate({
      peakBalance: total,
      currentBalance: total,
      riskPct,
      leverage,
    });

    if (protection.paused) {
      pushLog("Portfolio paused due to drawdown.");
      return;
    }

    const decision = executeEngine({
      engineType,
      balance,
      riskPct: protection.adjustedRisk,
      leverage: protection.adjustedLeverage,
    });

    if (decision.blocked) {
      pushLog(`Blocked: ${decision.reason}`);
      return;
    }

    allocator.applyPnL(exchange, decision.pnl);
    allocator.rebalance();

    ledger.record({
      engine: engineType,
      exchange,
      side: decision.isWin ? "buy" : "sell",
      size: decision.positionSize,
      pnl: decision.pnl,
    });

    setTradesUsed((v) => v + 1);

    pushLog(
      `${exchange.toUpperCase()} | ${engineType.toUpperCase()} | PnL: ${decision.pnl.toFixed(
        2
      )}`
    );
  }

  const snapshot = allocator.snapshot();
  const stats = ledger.getStats();

  return (
    <div className="postureWrap">
      <section className="postureCard">
        <h2>Portfolio Execution Room</h2>

        <div className="stats">
          <div><b>Total:</b> ${snapshot.total.toFixed(2)}</div>
          <div><b>Coinbase:</b> ${snapshot.coinbase.toFixed(2)}</div>
          <div><b>Kraken:</b> ${snapshot.kraken.toFixed(2)}</div>
          <div><b>Reserve:</b> ${snapshot.reserve.toFixed(2)}</div>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${exchange === "coinbase" ? "active" : ""}`}
            onClick={() => setExchange("coinbase")}
          >
            Coinbase
          </button>
          <button
            className={`pill ${exchange === "kraken" ? "active" : ""}`}
            onClick={() => setExchange("kraken")}
          >
            Kraken
          </button>
        </div>

        <div className="ctrlRow">
          <button
            className={`pill ${engineType === "scalp" ? "active" : ""}`}
            onClick={() => setEngineType("scalp")}
          >
            Scalp
          </button>
          <button
            className={`pill ${engineType === "session" ? "active" : ""}`}
            onClick={() => setEngineType("session")}
          >
            Session
          </button>
        </div>

        <div className="ctrl">
          <label>
            Risk %
            <input
              type="number"
              value={riskPct}
              min="0.1"
              step="0.1"
              onChange={(e) => setRiskPct(Number(e.target.value))}
            />
          </label>

          <label>
            Leverage
            <input
              type="number"
              value={leverage}
              min="1"
              max="20"
              onChange={(e) => setLeverage(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="actions">
          <button className="btn ok" onClick={executeTrade}>
            Route Portfolio Order
          </button>
        </div>
      </section>

      <aside className="postureCard">
        <h3>Portfolio Stats</h3>
        <div>Trades: {stats?.totalTrades || 0}</div>
        <div>Win Rate: {stats?.winRate || 0}%</div>
        <div>Total PnL: ${stats?.pnl?.toFixed(2) || "0.00"}</div>

        <h3 style={{ marginTop: 20 }}>Execution Log</h3>
        <div style={{ maxHeight: 350, overflowY: "auto" }}>
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
