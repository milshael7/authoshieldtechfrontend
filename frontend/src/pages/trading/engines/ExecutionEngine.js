// ExecutionEngine.js
// Institutional Smart Execution Engine
// AI decides trade
// Human sets caps only

import { evaluateConfidence } from "./ConfidenceEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  recentPerformance = { wins: 0, losses: 0 },
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  /* ================= CONFIDENCE ================= */

  const confidenceData = evaluateConfidence({
    engineType,
    recentPerformance,
  });

  if (!confidenceData.approved) {
    return {
      blocked: true,
      reason: confidenceData.reason,
      confidenceScore: confidenceData.score,
    };
  }

  /* ================= HUMAN CAPS ================= */

  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  /* ================= POSITION SIZING ================= */

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk =
    cappedRisk *
    confidenceData.modifier *
    volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  /* ================= AI OUTCOME MODEL ================= */

  const outcomeBias =
    engineType === "scalp" ? 0.52 : 0.55;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  /* ================= DRAW DOWN PROTECTION ================= */

  const drawdownPct =
    ((balance - newBalance) / balance) * 100;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      blocked: true,
      reason: "Drawdown cap exceeded",
      confidenceScore: confidenceData.score,
    };
  }

  /* ================= CAPITAL FLOOR ================= */

  const finalBalance =
    newBalance < humanCaps.capitalFloor
      ? humanCaps.capitalFloor
      : newBalance;

  return {
    blocked: false,
    pnl,
    newBalance: finalBalance,
    confidenceScore: confidenceData.score,
    effectiveRisk,
    positionSize,
    isWin,
  };
}

/* ================= UTILITY ================= */

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
