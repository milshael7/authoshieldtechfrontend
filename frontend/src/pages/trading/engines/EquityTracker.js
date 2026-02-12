// EquityTracker.js
// Tracks equity curve and drawdown statistics

let equityHistory = [];
let peakEquity = 0;

export function updateEquity(totalCapital) {
  if (totalCapital > peakEquity) {
    peakEquity = totalCapital;
  }

  const drawdown =
    peakEquity > 0
      ? ((peakEquity - totalCapital) / peakEquity) * 100
      : 0;

  equityHistory.push({
    timestamp: Date.now(),
    equity: totalCapital,
    drawdown,
  });

  return {
    peakEquity,
    drawdown,
  };
}

export function getEquityHistory() {
  return equityHistory;
}

export function resetEquityTracker() {
  equityHistory = [];
  peakEquity = 0;
}
