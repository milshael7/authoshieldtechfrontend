// MarketRegimeEngine.js
// Adaptive Market Regime Model
// Structured for ExecutionEngine integration

export function detectMarketRegime() {
  const regimes = [
    "trending",
    "ranging",
    "high_volatility",
    "neutral",
  ];

  const regime =
    regimes[Math.floor(Math.random() * regimes.length)];

  return regime;
}

/* ==================================================
   Regime Bias Table
   - Controls win probability bias
   - Controls risk scaling
================================================== */

export function getRegimeBias(engineType, regime) {
  const table = {
    trending: {
      scalp: { winRate: 0.48, riskModifier: 1.05 },
      session: { winRate: 0.62, riskModifier: 1.15 },
    },
    ranging: {
      scalp: { winRate: 0.58, riskModifier: 1.1 },
      session: { winRate: 0.50, riskModifier: 0.9 },
    },
    high_volatility: {
      scalp: { winRate: 0.45, riskModifier: 0.75 },
      session: { winRate: 0.55, riskModifier: 0.85 },
    },
    neutral: {
      scalp: { winRate: 0.52, riskModifier: 1 },
      session: { winRate: 0.55, riskModifier: 1 },
    },
  };

  return table[regime][engineType].winRate;
}
