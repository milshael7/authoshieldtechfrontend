// CooldownEngine.js
// Prevents overtrading & revenge trading

let lastTradeTime = null;

export function evaluateCooldown({
  lastPnL = 0,
  tradesUsed = 0,
  minCooldownMs = 15000, // 15 sec cooldown
}) {
  const now = Date.now();

  // First trade
  if (!lastTradeTime) {
    lastTradeTime = now;
    return { allowed: true };
  }

  const timeSinceLast = now - lastTradeTime;

  // Rapid fire trading protection
  if (timeSinceLast < minCooldownMs) {
    return {
      allowed: false,
      reason: "Cooldown active",
    };
  }

  // After large loss → enforce longer cooldown
  if (lastPnL < -50) {
    if (timeSinceLast < minCooldownMs * 2) {
      return {
        allowed: false,
        reason: "Post-loss stabilization",
      };
    }
  }

  // After large win → prevent overconfidence spike
  if (lastPnL > 100) {
    if (timeSinceLast < minCooldownMs * 1.5) {
      return {
        allowed: false,
        reason: "Post-win throttle",
      };
    }
  }

  lastTradeTime = now;

  return { allowed: true };
}
