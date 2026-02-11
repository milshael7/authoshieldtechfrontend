// PerformanceEngine.js
// Institutional performance analytics engine

export function evaluatePerformance(trades = []) {
  if (!trades.length) {
    return {
      winRate: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      expectancy: 0,
      maxDrawdown: 0,
      sharpe: 0,
    };
  }

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl < 0);

  const totalPnL = trades.reduce((a, b) => a + b.pnl, 0);
  const grossProfit = wins.reduce((a, b) => a + b.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b.pnl, 0));

  const winRate = wins.length / trades.length;

  const averageWin =
    wins.length > 0
      ? grossProfit / wins.length
      : 0;

  const averageLoss =
    losses.length > 0
      ? grossLoss / losses.length
      : 0;

  const profitFactor =
    grossLoss > 0
      ? grossProfit / grossLoss
      : grossProfit;

  const expectancy =
    winRate * averageWin -
    (1 - winRate) * averageLoss;

  /* ================= MAX DRAWDOWN ================= */

  let peak = 0;
  let maxDrawdown = 0;
  let equity = 0;

  trades.forEach(t => {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (dd > maxDrawdown) maxDrawdown = dd;
  });

  /* ================= SHARPE (simplified) ================= */

  const mean =
    totalPnL / trades.length;

  const variance =
    trades.reduce((sum, t) => {
      return sum + Math.pow(t.pnl - mean, 2);
    }, 0) / trades.length;

  const stdDev = Math.sqrt(variance);

  const sharpe =
    stdDev !== 0
      ? mean / stdDev
      : 0;

  return {
    winRate,
    profitFactor,
    averageWin,
    averageLoss,
    expectancy,
    maxDrawdown,
    sharpe,
  };
}
