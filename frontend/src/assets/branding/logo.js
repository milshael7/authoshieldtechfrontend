/**
 * AutoShield Tech — Brand Colors
 * Single source of truth for platform theming
 *
 * RULES:
 * - DO NOT hardcode colors elsewhere
 * - Import from this file only
 * - Used by UI, charts, backgrounds, overlays
 */

const brandColors = {
  /* ================= PRIMARY ================= */
  primary: "#7AA7FF",        // Core brand blue
  primaryDark: "#4F78D6",
  primaryLight: "#A9C3FF",

  /* ================= ACCENTS ================= */
  accent: "#9B7CFF",         // Intelligence / security accent
  accentSoft: "rgba(155,124,255,0.25)",

  /* ================= STATUS ================= */
  success: "#2BD576",
  warning: "#FFD166",
  danger: "#FF5A5F",
  info: "#4FC3F7",

  /* ================= BACKGROUND ================= */
  bgDark: "#0B0E14",         // SOC base background
  bgPanel: "rgba(255,255,255,0.06)",
  bgPanelStrong: "rgba(255,255,255,0.10)",

  /* ================= TEXT ================= */
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.75)",
  textMuted: "rgba(255,255,255,0.55)",

  /* ================= BORDERS ================= */
  borderSoft: "rgba(255,255,255,0.14)",
  borderStrong: "rgba(255,255,255,0.25)",
};

export default brandColors;
