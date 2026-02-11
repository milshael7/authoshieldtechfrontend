// ExecutionEngine.js
// Core simulation engine (NO API, NO automation)

import { updateEngineMemory } from "./EngineMemory";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
}) {
  const riskAmount = balance * (riskPct / 100);

  // Simulated probability bias
  const winProbability =
    engineType === "scalp" ? 0.55 : 0.6;

  const isWin = Math.random() < winProbability;

  const pnl = isWin
    ? riskAmount * leverage
    : -riskAmount;

  const newBalance = balance + pnl;

  updateEngineMemory(engineType, {
    pnl,
    isWin,
    balanceAfter: newBalance,
  });

  return {
    pnl,
    newBalance,
  };
}
