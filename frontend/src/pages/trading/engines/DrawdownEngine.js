export function evaluateDrawdown({
  equityHistory,
  currentEquity,
  maxDrawdownPct = 20,
}) {
  const peak = Math.max(...equityHistory, currentEquity);

  const drawdown =
    peak > 0 ? ((peak - currentEquity) / peak) * 100 : 0;

  if (drawdown >= maxDrawdownPct) {
    return {
      approved: false,
      drawdown: drawdown.toFixed(2),
      riskModifier: 0,
      reason: "Max drawdown exceeded — Trading halted",
    };
  }

  if (drawdown >= maxDrawdownPct * 0.75) {
    return {
      approved: true,
      drawdown: drawdown.toFixed(2),
      riskModifier: 0.5,
      warning: "High drawdown — Risk reduced",
    };
  }

  if (drawdown >= maxDrawdownPct * 0.5) {
    return {
      approved: true,
      drawdown: drawdown.toFixed(2),
      riskModifier: 0.75,
    };
  }

  return {
    approved: true,
    drawdown: drawdown.toFixed(2),
    riskModifier: 1,
  };
}
