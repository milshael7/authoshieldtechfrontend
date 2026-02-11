/**
 * EngineSession.js
 * Session Trend Engine
 * Simulation only
 */

export function runSessionEngine({
  balance,
  riskPct,
  leverage,
}) {
  const riskAmount = balance * (riskPct / 100);
  const positionSize = riskAmount * leverage;

  // Slower but larger simulated move
  const volatility = 0.01; // bigger swings
  const directionBias = Math.random() > 0.45 ? 1 : -1;
  const priceMove = directionBias * (Math.random() * volatility);

  const pnl = positionSize * priceMove;

  return {
    style: "session",
    positionSize,
    pnl,
    newBalance: balance + pnl,
  };
}
