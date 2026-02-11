import React from "react";

export default function CapitalHealthPanel({
  totalCapital,
  peakCapital,
  dailyPnL,
  tradeCount,
}) {
  const drawdownPct =
    peakCapital > 0
      ? ((peakCapital - totalCapital) / peakCapital) * 100
      : 0;

  const healthScore = Math.max(
    0,
    100 - drawdownPct * 2 - Math.abs(dailyPnL) * 0.01
  );

  function getHealthTier() {
    if (healthScore >= 75) return "ok";
    if (healthScore >= 50) return "warn";
    return "bad";
  }

  const tier = getHealthTier();

  return (
    <section className="postureCard">
      <h3>Capital Health Monitor</h3>

      <div className="stats">
        <div>
          <b>Health Score:</b>{" "}
          <span className={`badge ${tier}`}>
            {healthScore.toFixed(1)}%
          </span>
        </div>

        <div>
          <b>Drawdown:</b> {drawdownPct.toFixed(2)}%
        </div>

        <div>
          <b>Daily PnL Impact:</b> ${dailyPnL.toFixed(2)}
        </div>

        <div>
          <b>Trades Today:</b> {tradeCount}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div
          style={{
            height: 8,
            background: "#111",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${healthScore}%`,
              height: "100%",
              background:
                tier === "ok"
                  ? "#22c55e"
                  : tier === "warn"
                  ? "#facc15"
                  : "#ef4444",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      <p className="muted" style={{ marginTop: 12 }}>
        Health score dynamically adjusts based on drawdown,
        volatility exposure, and daily performance.
      </p>
    </section>
  );
}
