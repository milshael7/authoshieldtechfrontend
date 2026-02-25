// frontend/src/pages/Dashboard.jsx
// Enterprise Security Command Center (Role Aware)

import React from "react";
import { useUser } from "../context/UserContext"; // adjust if your path differs

import SecurityOverview from "../components/security/SecurityOverview";
import RiskMonitor from "../components/security/RiskMonitor";
import SessionMonitor from "../components/security/SessionMonitor";
import DeviceIntegrityPanel from "../components/security/DeviceIntegrityPanel";
import AuditStream from "../components/security/AuditStream";

export default function Dashboard() {

  const { user } = useUser() || {};

  const role = user?.role;

  /* ================= ADMIN VIEW ================= */

  if (role === "Admin" || role === "Finance") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Admin Security Command Center</h2>

        <SecurityOverview />
        <RiskMonitor />
        <SessionMonitor />
        <DeviceIntegrityPanel />
        <AuditStream />
      </div>
    );
  }

  /* ================= MANAGER VIEW ================= */

  if (role === "Manager") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Manager Security Overview</h2>

        <SecurityOverview />
        <RiskMonitor />
        <DeviceIntegrityPanel />
      </div>
    );
  }

  /* ================= COMPANY VIEW ================= */

  if (role === "Company" || role === "Small_Company") {
    return (
      <div style={styles.wrapper}>
        <h2 style={styles.title}>Company Risk Dashboard</h2>

        <SecurityOverview />
        <RiskMonitor />
      </div>
    );
  }

  /* ================= DEFAULT SAFE FALLBACK ================= */

  return (
    <div style={styles.wrapper}>
      <h2 style={styles.title}>Platform Dashboard</h2>

      <div style={styles.fallbackCard}>
        <p style={{ opacity: 0.8 }}>
          Dashboard is operational.
        </p>

        <p style={{ fontSize: 13, opacity: 0.6, marginTop: 10 }}>
          Limited security visibility for this account level.
        </p>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {

  wrapper: {
    padding: 28,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f1f5f9"
  },

  title: {
    marginBottom: 24
  },

  fallbackCard: {
    padding: 20,
    borderRadius: 12,
    background: "rgba(255,255,255,.04)",
    border: "1px solid rgba(255,255,255,.08)",
  }
};
