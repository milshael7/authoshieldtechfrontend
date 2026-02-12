// ExecutionEngine.js
// Institutional Adaptive Execution Engine
// AI full control | Human caps | Regime aware | Cooldown enabled

import { evaluateConfidence } from "./ConfidenceEngine";
import { detectMarketRegime, getRegimeBias } from "./MarketRegimeEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  recentPerformance = { wins: 0, losses: 0, pnl: 0 },
  humanMultiplier = 1,
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  if (balance <= 0) {
    return {
      blocked: true,
      reason: "No capital available",
      confidenceScore: 0,
    };
  }

  const lossStreak = recentPerformance.losses || 0;
  const winStreak = recentPerformance.wins || 0;
  const cumulativePnL = recentPerformance.pnl || 0;

  /* ================= COOLDOWN MODE ================= */

  const cooldownActive = lossStreak >= 4;

  if (cooldownActive) {
    return {
      blocked: true,
      reason: "Cooldown active after consecutive losses",
      confidenceScore: 0,
    };
  }

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

  /* ================= REGIME DETECTION ================= */

  const regime = detectMarketRegime();
  const regimeBias = getRegimeBias(engineType, regime);

  /* ================= ADAPTIVE RISK ================= */

  const adaptiveRiskReduction =
    lossStreak >= 3 ? 0.6 :
    lossStreak === 2 ? 0.75 :
    lossStreak === 1 ? 0.9 :
    1;

  const winBoost =
    winStreak >= 3 ? 1.15 :
    winStreak === 2 ? 1.08 :
    1;

  const recoveryMode =
    cumulativePnL < 0 ? 0.85 : 1;

  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  const finalRisk =
    cappedRisk *
    adaptiveRiskReduction *
    winBoost *
    recoveryMode *
    confidenceData.modifier *
    humanMultiplier;

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.2)
      : randomBetween(0.9, 1.1);

  const effectiveRisk = finalRisk * volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  /* ================= PROBABILITY MODEL ================= */

  const confidenceBoost =
    (confidenceData.score - 50) / 1000;

  const adjustedBias = Math.min(
    0.7,
    Math.max(0.4, regimeBias + confidenceBoost)
  );

  const isWin = Math.random() < adjustedBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  const drawdownPct =
    balance > 0
      ? ((balance - newBalance) / balance) * 100
      : 0;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      blocked: true,
      reason: "Drawdown cap exceeded",
      confidenceScore: confidenceData.score,
    };
  }

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
    metadata: {
      regime,
      adjustedBias,
      cooldownActive,
      lossStreak,
      winStreak,
    },
  };
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}
