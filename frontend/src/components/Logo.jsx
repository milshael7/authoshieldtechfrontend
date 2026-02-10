/**
 * AutoShield Tech — Logo Component (FINAL)
 *
 * RESPONSIBILITY:
 * - Render platform logo consistently
 * - Support sidebar, topbar, and public pages
 * - Dark-background safe
 *
 * RULES:
 * - No routing
 * - No logic
 * - No layout assumptions
 */

import React from "react";

export default function Logo({
  size = "md",        // sm | md | lg
  variant = "full",   // full | icon
}) {
  const sizes = {
    sm: {
      fontSize: 16,
      icon: 20,
    },
    md: {
      fontSize: 18,
      icon: 24,
    },
    lg: {
      fontSize: 22,
      icon: 30,
    },
  };

  const cfg = sizes[size] || sizes.md;

  return (
    <div
      className="autosheild-logo"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontWeight: 900,
        letterSpacing: "0.08em",
        color: "#7AA7FF",
        userSelect: "none",
        whiteSpace: "nowrap",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: cfg.icon,
          height: cfg.icon,
          borderRadius: 6,
          background:
            "linear-gradient(135deg, #7AA7FF, #9B7CFF)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#0b0e14",
          fontSize: cfg.icon * 0.55,
          fontWeight: 900,
        }}
      >
        A
      </div>

      {/* Wordmark */}
      {variant === "full" && (
        <span
          style={{
            fontSize: cfg.fontSize,
            lineHeight: 1,
          }}
        >
          AUTOSHIELD
        </span>
      )}
    </div>
  );
}
