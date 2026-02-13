// PerformanceEngine.js
// Institutional Performance Memory + Analytics Engine

/* =========================================================
   INTERNAL MEMORY (Per Engine)
========================================================= */

const performanceMemory = {
  scalp: [],
  session: [],
};

/* =========================================================
   TRADE REGISTRATION
========================================================= */

export function updatePerformance(engineType, pnl, isWin) {
  if (!performanceMemory[engineType]) {
    performanceMemory[engineType] = [];
  }

  performanceMemory[engineType].push({
    pnl,
    isWin,
    timestamp: Date.now(),
  });

  // Keep last 500 trades only (memory safety)
  if (performanceMemory[engineType].length > 500) {
    performanceMemory[engineType].shift();
  }
}

/* =========================================================
   ENGINE STATS
========================================================= */

export function getPerformanceStats(engineType) {
  const trades = performanceMemory[engineType] || [];

  const wins = trades.filter(t => t.isWin).length;
  const losses = trades.filter(t => !t.isWin).length;

  const lossStreak = calculateLossStreak(trades);
  const winStreak = calculateWinStreak(trades);

  return {
    wins,
    losses,
    total: trades.length,
    trades, // ✅ CRITICAL — required by TradingRoom
    lossStreak,
    winStreak,
  };
}

export function getAllPerformanceStats() {
  return {
    scalp: getPerformanceStats("scalp"),
    session: getPerformanceStats("session"),
  };
}

/* =========================================================
   FULL ANALYTICS ENGINE (Institutional Metrics)
========================================================= */

export function evaluatePerformance(trades = []) {
  if (!Array.isArray(trades) || trades.length === 0) {
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

  const averageWin = wins.length ? grossProfit / wins.length : 0;
  const averageLoss = losses.length ? grossLoss / losses.length : 0;

  const profitFactor =
    grossLoss > 0 ? grossProfit / grossLoss : grossProfit;

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

  /* ================= SHARPE (Simplified) ================= */

  const mean = totalPnL / trades.length;

  const variance =
    trades.reduce((sum, t) => {
      return sum + Math.pow(t.pnl - mean, 2);
    }, 0) / trades.length;

  const stdDev = Math.sqrt(variance);

  const sharpe =
    stdDev !== 0 ? mean / stdDev : 0;

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

/* =========================================================
   STREAK CALCULATIONS
========================================================= */

function calculateLossStreak(trades) {
  let streak = 0;

  for (let i = trades.length - 1; i >= 0; i--) {
    if (!trades[i].isWin) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calculateWinStreak(trades) {
  let streak = 0;

  for (let i = trades.length - 1; i >= 0; i--) {
    if (trades[i].isWin) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
