/**
 * AuthoDev 6.6 — Unified Read Aloud Engine (HARDENED)
 * Single voice • single stream • lifecycle-safe
 *
 * Guarantees:
 * - One voice
 * - One cadence
 * - One speaker at a time
 * - No overlap
 * - Safe on unmount / route change
 */

let synth = null;
let currentUtterance = null;

function getSynth() {
  if (typeof window === "undefined") return null;
  if (!synth) synth = window.speechSynthesis;
  return synth;
}

/**
 * Hard stop — always safe
 */
export function stopReadAloud() {
  const s = getSynth();
  if (!s) return;

  try {
    s.cancel();
  } catch {}

  currentUtterance = null;
}

/**
 * Read text aloud
 * @param {string} text
 * @param {function} onEnd optional callback when speech finishes
 */
export function readAloud(text, onEnd) {
  if (!text) return;

  const s = getSynth();
  if (!s) return;

  // HARD RULE: never overlap
  try {
    s.cancel();
  } catch {}

  const utter = new SpeechSynthesisUtterance(
    String(text)
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim()
  );

  // 🔊 AuthoDev voice tuning
  utter.rate = 0.95;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  utter.onend = () => {
    currentUtterance = null;
    if (typeof onEnd === "function") {
      try { onEnd(); } catch {}
    }
  };

  utter.onerror = () => {
    currentUtterance = null;
    try {
      s.cancel();
    } catch {}
  };

  currentUtterance = utter;

  try {
    s.speak(utter);
  } catch {
    currentUtterance = null;
  }
}
