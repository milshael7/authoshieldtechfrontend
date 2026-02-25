// frontend/src/components/security/RiskMonitor.jsx

import React, { useMemo } from "react";
import { useSecurity } from "../../context/SecurityContext";

function getRiskColor(score) {
  if (score >= 60) return "#ff4d4f";
  if (score >= 30) return "#faad14";
  return "#52c41a";
}

function getRiskLabel(score) {
  if (score >= 60) return "HIGH RISK";
  if (score >= 30) return "ELEVATED";
  return "STABLE";
}

export default function RiskMonitor() {
  const { riskScore, assetExposure } = useSecurity();

  const riskColor = getRiskColor(riskScore);
  const riskLabel = getRiskLabel(riskScore);

  const exposureList = useMemo(() => {
    return Object.entries(assetExposure || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [assetExposure]);

  return (
    <div style={styles.wrapper}>

      {/* ================= HEADER ================= */}

      <div style={styles.header}>
        <h3 style={styles.title}>Risk Intelligence Monitor</h3>
        <span style={{ ...styles.badge, backgroundColor: riskColor }}>
          {riskLabel}
        </span>
      </div>

      {/* ================= DIAL ================= */}

      <div style={styles.dialContainer}>
        <div style={styles.dial}>
          <div
            style={{
              ...styles.dialFill,
              transform: `rotate(${riskScore * 1.8}deg)`,
              backgroundColor: riskColor
            }}
          />
          <div style={styles.dialCenter}>
            <span style={{ fontSize: 28, fontWeight: 700 }}>
              {riskScore}
            </span>
            <span style={styles.outOf}>/100</span>
          </div>
        </div>
      </div>

      {/* ================= EXPOSURE LIST ================= */}

      <div style={styles.exposureSection}>
        <h4 style={styles.subTitle}>Top Asset Exposure</h4>

        {exposureList.length === 0 && (
          <div style={styles.empty}>No active exposure</div>
        )}

        {exposureList.map(([asset, value]) => (
          <div key={asset} style={styles.exposureItem}>
            <span style={styles.assetName}>{asset}</span>
            <div style={styles.assetBarWrap}>
              <div
                style={{
                  ...styles.assetBar,
                  width: `${Math.min(value, 100)}%`,
                  backgroundColor: riskColor
                }}
              />
            </div>
            <span style={styles.assetValue}>{value}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    background: "#111827",
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    boxShadow: "0 0 25px rgba(0,0,0,0.45)"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20
  },

  title: {
    color: "#e5e7eb",
    margin: 0
  },

  badge: {
    padding: "6px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    color: "#fff"
  },

  dialContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 30
  },

  dial: {
    position: "relative",
    width: 180,
    height: 90,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    overflow: "hidden",
    background: "#1f2937"
  },

  dialFill: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    width: 4,
    height: "100%",
    transformOrigin: "bottom center",
    transition: "transform 0.5s ease"
  },

  dialCenter: {
    position: "absolute",
    bottom: 10,
    width: "100%",
    textAlign: "center",
    color: "#f9fafb"
  },

  outOf: {
    fontSize: 12,
    marginLeft: 4,
    color: "#9ca3af"
  },

  exposureSection: {
    marginTop: 10
  },

  subTitle: {
    color: "#cbd5e1",
    marginBottom: 12
  },

  empty: {
    color: "#6b7280",
    fontStyle: "italic"
  },

  exposureItem: {
    display: "flex",
    alignItems: "center",
    marginBottom: 10,
    gap: 10
  },

  assetName: {
    width: 100,
    color: "#e5e7eb",
    fontSize: 13
  },

  assetBarWrap: {
    flex: 1,
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 6,
    overflow: "hidden"
  },

  assetBar: {
    height: "100%",
    transition: "width 0.4s ease"
  },

  assetValue: {
    width: 30,
    textAlign: "right",
    color: "#9ca3af",
    fontSize: 12
  }
};
