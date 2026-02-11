// TimeGovernor.js
// Execution window enforcement
// Learning engine NEVER stops

export function isTradingWindowOpen() {
  const now = new Date();
  const day = now.getDay();     // 0=Sun, 5=Fri, 6=Sat
  const hour = now.getHours();

  // Friday after 9PM → CLOSED
  if (day === 5 && hour >= 21) {
    return false;
  }

  // Saturday before 9PM → CLOSED
  if (day === 6 && hour < 21) {
    return false;
  }

  return true;
}

export function getTradingWindowStatus() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();

  if (day === 5 && hour >= 21) {
    return {
      allowed: false,
      reason: "Weekend lock (Friday after 21:00)",
    };
  }

  if (day === 6 && hour < 21) {
    return {
      allowed: false,
      reason: "Weekend lock (Saturday before 21:00)",
    };
  }

  return {
    allowed: true,
    reason: "Trading window open",
  };
}
