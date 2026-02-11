/**
 * TimeGovernor
 * Controls execution windows.
 * Learning is NEVER paused.
 */

export function isTradingWindowOpen() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const hour = now.getUTCHours();

  // Friday after 21:00 UTC
  if (day === 5 && hour >= 21) return false;

  // Saturday before 21:00 UTC
  if (day === 6 && hour < 21) return false;

  return true;
}
