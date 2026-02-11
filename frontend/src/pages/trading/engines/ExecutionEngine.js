import { generateSignal } from "./SignalEngine";
import { adjustConfidence } from "./AdaptiveConfidence";
import { detectRegime } from "./RegimeEngine";
import {
  calculateVolatility,
  volatilityPositionModifier,
} from "./VolatilityEngine";
import { confirmMultiTimeframe } from "./MultiTimeframeEngine";

export function executeEngine({
  engineType,
  balance,
  riskPct,
  leverage,
  performance = {
    wins: 0,
    losses: 0,
    peak: balance,
    losingStreak: 0,
  },
  humanCaps = {
    maxRiskPct: 2,
    maxLeverage: 10,
    capitalFloor: 100,
  },
}) {
  const cappedRisk = Math.min(riskPct, humanCaps.maxRiskPct);
  const cappedLeverage = Math.min(leverage, humanCaps.maxLeverage);

  const shortHistory = generateSyntheticPrices(60);
  const longHistory = generateSyntheticPrices(200);

  const regime = detectRegime(longHistory);
  const volatility = calculateVolatility(shortHistory);
  const volatilityModifier =
    volatilityPositionModifier(volatility);

  const shortSignal = generateSignal({
    priceHistory: shortHistory,
    engineType,
  });

  const longSignal = generateSignal({
    priceHistory: longHistory,
    engineType,
  });

  const confirmation = confirmMultiTimeframe({
    shortSignal,
    longSignal,
  });

  if (!confirmation.confirmed) {
    return {
      blocked: true,
      reason: confirmation.reason,
    };
  }

  const drawdownPct =
    ((performance.peak - balance) / performance.peak) * 100;

  let baseConfidence = shortSignal.confidence;

  if (regime === "range") {
    baseConfidence -= 0.05;
  }

  const adaptiveConfidence = adjustConfidence({
    baseConfidence,
    wins: performance.wins,
    losses: performance.losses,
    drawdownPct,
  });

  let streakModifier = 1;

  if (performance.losingStreak >= 3) {
    streakModifier = 0.7;
  }

  if (performance.losingStreak >= 5) {
    streakModifier = 0.5;
  }

  if (performance.losingStreak >= 7) {
    return {
      blocked: true,
      reason: "Circuit breaker — excessive losing streak",
    };
  }

  const effectiveRisk =
    cappedRisk *
    adaptiveConfidence *
    volatilityModifier *
    streakModifier;

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
