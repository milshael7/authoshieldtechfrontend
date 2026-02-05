// frontend/src/pages/Notifications.jsx
import React from "react";

export default function Notifications() {
  return (
    <div className="platformCard">
      <h2 style={{ marginTop: 0 }}>Notifications</h2>

      <p style={{ opacity: 0.75 }}>
        System notifications, alerts, and AI activity will appear here.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "rgba(0,0,0,.15)",
        }}
      >
        <p style={{ margin: 0, opacity: 0.7 }}>
          No notifications yet.
        </p>
      </div>
    </div>
  );
}
