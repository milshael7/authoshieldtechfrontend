// VolatilityEngine.js
// Simulated volatility regime detector

export function evaluateVolatility(engineType) {
  // Simulated market volatility score (0–100)
  const volatilityScore = Math.floor(Math.random() * 100);

  // Extreme volatility → block trading
  if (volatilityScore > 85) {
    return {
      allowed: false,
      regime: "extreme",
      multiplier: 0,
      score: volatilityScore,
    };
  }

  // High volatility → defensive
  if (volatilityScore > 65) {
    return {
      allowed: true,
      regime: "high",
      multiplier: 0.7,
      score: volatilityScore,
    };
  }

  // Normal volatility
  if (volatilityScore > 35) {
    return {
      allowed: true,
      regime: "normal",
      multiplier: 1,
      score: volatilityScore,
    };
  }

  // Low volatility (good for scalping)
  return {
    allowed: true,
    regime: "low",
    multiplier: engineType === "scalp" ? 1.1 : 0.9,
    score: volatilityScore,
  };
}
