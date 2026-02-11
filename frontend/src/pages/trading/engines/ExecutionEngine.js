import { generateSignal } from "./SignalEngine";
import { adjustConfidence } from "./AdaptiveConfidence";

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

  const signal = generateSignal({
    priceHistory,
    engineType,
  });

  if (signal.direction === "neutral") {
    return { blocked: true, reason: "No strong signal" };
  }

  const drawdownPct =
    ((performance.peak - balance) / performance.peak) * 100;

  const adaptiveConfidence = adjustConfidence({
    baseConfidence: signal.confidence,
    wins: performance.wins,
    losses: performance.losses,
    drawdownPct,
  });

  const effectiveRisk =
    cappedRisk * adaptiveConfidence;

  const positionSize =
    (balance * effectiveRisk * cappedLeverage) / 100;

  const isWin =
    Math.random() < adaptiveConfidence;

  const pnl = isWin
    ? positionSize * 0.8
    : -positionSize * 0.6;

  const newBalance = balance + pnl;

  return {
    pnl,
    newBalance,
    isWin,
    positionSize,
    confidence: adaptiveConfidence,
    direction: signal.direction,
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
