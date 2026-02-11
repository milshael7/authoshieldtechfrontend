// Adaptive Execution Engine — PHASE 3 CORE
// AI 100% decision engine
// Human = risk caps + override control
// Includes adaptive confidence + capital awareness

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  confidence = 0.8, // AI base confidence
  humanMultiplier = 1, // human override modifier
  performance = { wins: 0, losses: 0 },
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    maxDrawdownPct: 20,
    capitalFloor: 100,
  },
}) {
  /* ================= HUMAN SAFETY CAPS ================= */

  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  /* ================= AI ADAPTIVE CONFIDENCE ================= */

  const totalTrades = performance.wins + performance.losses;

  let adaptiveConfidence = confidence;

  if (totalTrades > 10) {
    const winRate = performance.wins / totalTrades;

    if (winRate > 0.6) adaptiveConfidence += 0.05;
    if (winRate < 0.45) adaptiveConfidence -= 0.05;
  }

  adaptiveConfidence = clamp(adaptiveConfidence, 0.6, 0.95);

  /* ================= VOLATILITY MODEL ================= */

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.8, 1.25)
      : randomBetween(0.9, 1.15);

  const effectiveRisk =
    cappedRisk *
    adaptiveConfidence *
    humanMultiplier *
    volatilityFactor;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  /* ================= OUTCOME MODEL ================= */

  const baseEdge =
    engineType === "scalp" ? 0.52 : 0.55;

  const outcomeBias =
    baseEdge + (adaptiveConfidence - 0.8) * 0.1;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 0.9)
    : -positionSize * randomBetween(0.3, 0.7);

  const newBalance = balance + pnl;

  /* ================= DRAWDOWN PROTECTION ================= */

  const drawdownPct =
    ((balance - newBalance) / balance) * 100;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      pnl: 0,
      newBalance: balance,
      blocked: true,
      reason: "Drawdown cap exceeded",
    };
  }

  /* ================= CAPITAL FLOOR ================= */

  if (newBalance < humanCaps.capitalFloor) {
    return {
      pnl,
      newBalance: humanCaps.capitalFloor,
      floorTriggered: true,
      isWin,
      adaptiveConfidence,
    };
  }

  return {
    pnl,
    newBalance,
    blocked: false,
    effectiveRisk,
    positionSize,
    isWin,
    adaptiveConfidence,
  };
}

/* ================= HELPERS ================= */

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
