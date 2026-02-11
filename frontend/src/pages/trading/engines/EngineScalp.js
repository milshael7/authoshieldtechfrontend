/**
 * EngineScalp.js
 * Micro Scalping Engine (2–3 sec concept)
 * Simulation only — no exchange connection
 */

export function runScalpEngine({
  balance,
  riskPct,
  leverage,
}) {
  const riskAmount = balance * (riskPct / 100);
  const positionSize = riskAmount * leverage;

  // Simulated rapid PnL fluctuation
  const volatility = 0.002; // micro movement
  const directionBias = Math.random() > 0.48 ? 1 : -1;
  const priceMove = directionBias * (Math.random() * volatility);

  const pnl = positionSize * priceMove;

  return {
    style: "scalp",
    positionSize,
    pnl,
    newBalance: balance + pnl,
  };
}
