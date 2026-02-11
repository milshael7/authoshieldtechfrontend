// VolatilityGovernor.js
// Dynamically adjusts leverage + risk during high volatility

export function evaluateVolatility({
  engineType,
  baseRisk,
  leverage,
}) {
  // Simulated volatility score (replace with real ATR later)
  const volatilityScore = Math.random(); // 0 → 1

  let adjustedRisk = baseRisk;
  let adjustedLeverage = leverage;
  let regime = "normal";

  // Moderate volatility
  if (volatilityScore > 0.6 && volatilityScore <= 0.8) {
    adjustedRisk = baseRisk * 0.85;
    adjustedLeverage = leverage * 0.8;
    regime = "elevated";
  }

  // High volatility
  if (volatilityScore > 0.8) {
    adjustedRisk = baseRisk * 0.6;
    adjustedLeverage = leverage * 0.6;
    regime = "high";
  }

  return {
    volatilityScore: Number(volatilityScore.toFixed(2)),
    adjustedRisk: Number(adjustedRisk.toFixed(3)),
    adjustedLeverage: Number(adjustedLeverage.toFixed(2)),
    regime,
  };
}
