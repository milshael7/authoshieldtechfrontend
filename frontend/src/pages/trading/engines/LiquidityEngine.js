// LiquidityEngine.js
// Simulates liquidity depth + slippage impact

export function applyLiquidityModel({
  positionSize,
  leverage,
  marketRegime = "neutral",
}) {
  /* ================= LIQUIDITY DEPTH ================= */

  const baseLiquidity =
    marketRegime === "high_volatility"
      ? 0.6
      : marketRegime === "trending"
      ? 0.85
      : 1;

  /* ================= SIZE IMPACT ================= */

  const sizeImpact =
    positionSize > 5000
      ? 0.015
      : positionSize > 2000
      ? 0.01
      : positionSize > 1000
      ? 0.005
      : 0.002;

  /* ================= LEVERAGE IMPACT ================= */

  const leverageImpact =
    leverage >= 10
      ? 0.01
      : leverage >= 5
      ? 0.006
      : 0.002;

  /* ================= FINAL SLIPPAGE ================= */

  const slippage =
    (sizeImpact + leverageImpact) *
    (1 / baseLiquidity);

  return {
    slippagePct: slippage * 100,
    slippageCost: positionSize * slippage,
  };
}
