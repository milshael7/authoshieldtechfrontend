/**
 * AutoShield Tech — useSpeech Hook
 *
 * RESPONSIBILITY:
 * - Safe Text-to-Speech output
 * - Manual invocation only
 *
 * RULES:
 * - NO microphone
 * - NO listening
 * - NO auto-speak
 * - Browser-native only
 */

import { useCallback } from "react";

export default function useSpeech() {
  const supported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window;

  const speak = useCallback((text) => {
    if (!supported) return;
    if (!text || typeof text !== "string") return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.95;     // Calm, professional
    utterance.pitch = 1.0;
    utterance.volume = 0.9;

    // Prefer a neutral English voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find(v => v.lang.startsWith("en") && !v.name.includes("Google")) ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0];

    if (preferred) {
      utterance.voice = preferred;
    }

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
  }, [supported]);

  return {
    supported,
    speak,
    stop,
  };
}
