// RegimeEngine.js
// Detects market regime (trend or range)

export function detectRegime(priceHistory = []) {
  if (priceHistory.length < 20) {
    return "neutral";
  }

  const shortMA = average(priceHistory.slice(-10));
  const longMA = average(priceHistory.slice(-20));

  const diff = (shortMA - longMA) / longMA;

  if (diff > 0.01) return "uptrend";
  if (diff < -0.01) return "downtrend";

  return "range";
}

function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
