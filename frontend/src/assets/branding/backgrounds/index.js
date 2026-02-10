/**
 * AutoShield Tech — Background Registry
 *
 * PURPOSE:
 * - Central catalog of all background visuals
 * - Used by useBackground hook ONLY
 *
 * RULES:
 * - NO imports from React
 * - NO logic
 * - NO side effects
 * - Static data ONLY
 */

const backgrounds = [
  /* ================= DEFAULT SOC ================= */
  {
    id: "soc-dark-01",
    src: "/assets/backgrounds/soc-dark-01.jpg",
    time: "any",           // day | night | any
    context: "global",     // global | trading | admin | marketing
    label: "SOC Dark Default",
  },

  /* ================= SAFE FALLBACK ================= */
  {
    id: "fallback-gradient",
    src: null,             // handled safely by BackgroundLayer
    time: "any",
    context: "global",
    label: "Fallback Gradient",
  },
];

export default backgrounds;
