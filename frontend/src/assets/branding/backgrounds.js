/**
 * AutoShield Tech — Background Registry
 *
 * PURPOSE:
 * - Central list of all platform background images
 * - Supports rotation, pinning, day/night logic
 *
 * RULES:
 * - NO imports from React
 * - NO DOM logic
 * - Used by background manager only
 */

const backgrounds = [
  {
    id: "soc-core-01",
    label: "SOC Command Center",
    time: "day", // day | night | any
    hasLogo: true,
    mood: "control",
    path: "/assets/backgrounds/soc-01.jpg",
  },
  {
    id: "soc-core-02",
    label: "Threat Intelligence Grid",
    time: "night",
    hasLogo: true,
    mood: "analysis",
    path: "/assets/backgrounds/soc-02.jpg",
  },
  {
    id: "soc-core-03",
    label: "Network Defense",
    time: "any",
    hasLogo: false,
    mood: "protection",
    path: "/assets/backgrounds/soc-03.jpg",
  },
];

export default backgrounds;
