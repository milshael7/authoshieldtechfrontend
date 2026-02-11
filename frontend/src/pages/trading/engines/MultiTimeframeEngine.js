// MultiTimeframeEngine.js

export function confirmMultiTimeframe({
  shortSignal,
  longSignal,
}) {
  if (
    shortSignal.direction === "neutral" ||
    longSignal.direction === "neutral"
  ) {
    return {
      confirmed: false,
      reason: "Neutral signal detected",
    };
  }

  if (
    shortSignal.direction === longSignal.direction
  ) {
    return {
      confirmed: true,
      direction: shortSignal.direction,
    };
  }

  return {
    confirmed: false,
    reason: "Timeframe conflict",
  };
}
