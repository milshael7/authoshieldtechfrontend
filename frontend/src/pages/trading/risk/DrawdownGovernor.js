// DrawdownGovernor.js
// Capital protection + dynamic risk throttle

export class DrawdownGovernor {
  constructor({
    maxDrawdownPct = 15,
    throttleFactor = 0.5,
    pauseAtPct = 25,
  } = {}) {
    this.maxDrawdownPct = maxDrawdownPct;
    this.throttleFactor = throttleFactor;
    this.pauseAtPct = pauseAtPct;
  }

  evaluate({ peakBalance, currentBalance, riskPct, leverage }) {
    const drawdownPct =
      ((peakBalance - currentBalance) / peakBalance) * 100;

    let adjustedRisk = riskPct;
    let adjustedLeverage = leverage;
    let paused = false;
    let action = "normal";

    if (drawdownPct >= this.pauseAtPct) {
      paused = true;
      action = "paused";
    } else if (drawdownPct >= this.maxDrawdownPct) {
      adjustedRisk = riskPct * this.throttleFactor;
      adjustedLeverage = leverage * this.throttleFactor;
      action = "throttled";
    }

    return {
      drawdownPct,
      adjustedRisk,
      adjustedLeverage,
      paused,
      action,
    };
  }
}
