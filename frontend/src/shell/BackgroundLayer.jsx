// frontend/src/shell/BackgroundLayer.jsx
// AutoShield Tech — Background Layer
//
// PURPOSE:
// - Global visual foundation for the platform
// - Sits behind all layouts and pages
// - No logic, no motion (yet)
//
// RULES:
// - Must never block interaction
// - Must never affect layout sizing
// - Safe to extend later with images, gradients, time-based themes

import React from "react";
import "../styles/background.css";

export default function BackgroundLayer() {
  return (
    <div
      className="background-layer"
      aria-hidden="true"
    />
  );
}
