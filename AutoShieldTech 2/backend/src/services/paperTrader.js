/**
 * Paper Trader Engine (CommonJS)
 * - Automatic simulated trading
 * - No real money
 * - No exchange orders
 * - Safe by design
 */

let running = false;

let state = {
  balance: 100000, // paper USD
  position: null, // { entry, size }
  pnl: 0,
  trades: []
};

// Iowa City Sabbath (simple conservative window)
function isSabbath() {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
  const hour = now.getHours();

  if (day === 5 && hour >= 18) return true; // Fri after 6pm
  if (day === 6) return true;               // Sat
  if (day === 0 && hour < 18) return true;  // Sat night buffer
  return false;
}

function decide() {
  if (!state.position && Math.random() > 0.7) return "BUY";
  if (state.position && Math.random() > 0.7) return "SELL";
  return "HOLD";
}

function tick(price) {
  if (!running) return;
  if (isSabbath()) return;

  const action = decide();

  if (action === "BUY" && !state.position) {
    state.position = { entry: price, size: 1 };
    state.trades.push({ type: "BUY", price, time: Date.now() });
  }

  if (action === "SELL" && state.position) {
    const profit = price - state.position.entry;
    state.pnl += profit;
    state.balance += profit;
    state.trades.push({ type: "SELL", price, profit, time: Date.now() });
    state.position = null;
  }
}

function start() { running = true; }
function stop() { running = false; }

function snapshot() {
  return {
    running,
    balance: Number(state.balance.toFixed(2)),
    pnl: Number(state.pnl.toFixed(2)),
    openPosition: state.position,
    trades: state.trades.slice(-50)
  };
}

module.exports = { start, stop, tick, snapshot };
