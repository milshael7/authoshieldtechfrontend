import { generateSignal } from "./SignalEngine";
import { adjustConfidence } from "./AdaptiveConfidence";
import { detectRegime } from "./RegimeEngine";
import {
  calculateVolatility,
  volatilityPositionModifier,
} from "./VolatilityEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  performance = { wins: 0, losses: 0, peak: balance },
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    capitalFloor: 100,
  },
}) {
  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  const priceHistory = generateSyntheticPrices(60);

  const regime = detectRegime(priceHistory);

  const volatility = calculateVolatility(priceHistory);
  const volatilityModifier =
    volatilityPositionModifier(volatility);

  const signal = generateSignal({
    priceHistory,
    engineType,
  });

  if (signal.direction === "neutral") {
    return { blocked: true, reason: "No strong signal" };
  }

  const drawdownPct =
    ((performance.peak - balance) / performance.peak) * 100;

  let baseConfidence = signal.confidence;

  if (regime === "uptrend" && signal.direction === "long") {
    baseConfidence += 0.05;
  }

  if (regime === "downtrend" && signal.direction === "short") {
    baseConfidence += 0.05;
  }

  if (regime === "range") {
    baseConfidence -= 0.05;
  }

  const adaptiveConfidence = adjustConfidence({
    baseConfidence,
    wins: performance.wins,
    losses: performance.losses,
    drawdownPct,
  });

  const effectiveRisk =
    cappedRisk *
    adaptiveConfidence *
    volatilityModifier;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  const isWin =
    Math.random() < adaptiveConfidence;

  const pnl = isWin
    ? positionSize * 0.8
    : -positionSize * 0.6;

  const newBalance = balance + pnl;

  if (newBalance < humanCaps.capitalFloor) {
    return {
      blocked: true,
      reason: "Capital floor hit",
    };
  }

  return {
    pnl,
    newBalance,
    isWin,
    positionSize,
    confidence: adaptiveConfidence,
    regime,
    volatility,
  };
}

function generateSyntheticPrices(n) {
  let prices = [100];
  for (let i = 1; i < n; i++) {
    prices.push(
      prices[i - 1] *
        (1 + (Math.random() - 0.5) * 0.02)
    );
  }
  return prices;
}
