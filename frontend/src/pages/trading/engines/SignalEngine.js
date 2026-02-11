// SignalEngine.js
// Deterministic signal scoring model

export function generateSignal({
  priceHistory = [],
  engineType,
}) {
  if (priceHistory.length < 20) {
    return {
      direction: "neutral",
      confidence: 0.5,
    };
  }

  const recent = priceHistory.slice(-20);
  const avg =
    recent.reduce((a, b) => a + b, 0) / recent.length;

  const last = recent[recent.length - 1];

  const momentum = last - avg;

  let direction = "neutral";
  let confidence = 0.5;

  if (momentum > 0) {
    direction = "long";
    confidence =
      engineType === "scalp"
        ? 0.65
        : 0.72;
  } else if (momentum < 0) {
    direction = "short";
    confidence =
      engineType === "scalp"
        ? 0.62
        : 0.70;
  }

  return {
    direction,
    confidence,
  };
}
