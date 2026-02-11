// PHASE 4 — Intelligent Adaptive Execution Engine
// AI = full decision autonomy
// Human = safety rails + override limits
// Adds:
// - Confidence drift
// - Loss streak dampening
// - Performance acceleration
// - Capital pressure scaling
// - Engine health state

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  confidence = 0.8,
  humanMultiplier = 1,
  performance = { wins: 0, losses: 0, pnl: 0 },
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

  /* ================= PERFORMANCE METRICS ================= */

  const totalTrades = performance.wins + performance.losses;
  const winRate =
    totalTrades > 0 ? performance.wins / totalTrades : 0.5;

  const lossStreakPressure =
    performance.losses > performance.wins
      ? 1 - (performance.losses - performance.wins) * 0.03
      : 1;

  /* ================= ADAPTIVE CONFIDENCE ================= */

  let adaptiveConfidence = confidence;

  if (totalTrades > 10) {
    if (winRate > 0.6) adaptiveConfidence += 0.05;
    if (winRate < 0.45) adaptiveConfidence -= 0.07;
  }

  adaptiveConfidence *= lossStreakPressure;

  adaptiveConfidence = clamp(adaptiveConfidence, 0.55, 0.95);

  /* ================= CAPITAL PRESSURE ================= */

  const capitalPressure =
    balance < 500
      ? 0.75
      : balance < 300
      ? 0.6
      : 1;

  /* ================= VOLATILITY MODEL ================= */

  const volatilityFactor =
    engineType === "scalp"
      ? randomBetween(0.85, 1.25)
      : randomBetween(0.9, 1.15);

  const effectiveRisk =
    cappedRisk *
    adaptiveConfidence *
    humanMultiplier *
    volatilityFactor *
    capitalPressure;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  /* ================= OUTCOME EDGE MODEL ================= */

  const baseEdge =
    engineType === "scalp" ? 0.52 : 0.55;

  const outcomeBias =
    baseEdge + (adaptiveConfidence - 0.8) * 0.12;

  const isWin = Math.random() < outcomeBias;

  const pnl = isWin
    ? positionSize * randomBetween(0.4, 1.0)
    : -positionSize * randomBetween(0.3, 0.8);

  const newBalance = balance + pnl;

  /* ================= DRAW DOWN PROTECTION ================= */

  const drawdownPct =
    ((balance - newBalance) / balance) * 100;

  if (drawdownPct > humanCaps.maxDrawdownPct) {
    return {
      pnl: 0,
      newBalance: balance,
      blocked: true,
      reason: "Drawdown cap exceeded",
      engineHealth: "guarded",
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
      engineHealth: "critical",
    };
  }

  /* ================= ENGINE HEALTH ================= */

  let engineHealth = "stable";

  if (winRate > 0.65) engineHealth = "aggressive";
  if (winRate < 0.4) engineHealth = "recovering";

  return {
    pnl,
    newBalance,
    blocked: false,
    effectiveRisk,
    positionSize,
    isWin,
    adaptiveConfidence,
    engineHealth,
  };
}

/* ================= HELPERS ================= */

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
