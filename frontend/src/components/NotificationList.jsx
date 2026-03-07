import React from "react";
import { readAloud } from "./ReadAloud.jsx";
import ShareSnippet from "./ShareSnippet.jsx";

function normalizeSeverity(sev) {
  const s = String(sev || "info").toLowerCase();

  if (s === "warn" || s === "warning") return "warn";
  if (s === "danger" || s === "error" || s === "critical") return "danger";
  if (s === "ok" || s === "success") return "ok";
  return "info";
}

function badgeClass(sev) {
  const n = normalizeSeverity(sev);
  if (n === "warn") return "warn";
  if (n === "danger") return "danger";
  if (n === "ok") return "ok";
  return "";
}

function formatTime(n) {
  const t = n?.createdAt || n?.at || n?.time;
  if (!t) return "";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return String(t);
  }
}

export default function NotificationList({ items = [], onRead }) {
  const list = Array.isArray(items) ? items : [];
  const canRead = typeof onRead === "function";

  return (
    <div className="card">
      <h3>Notifications</h3>

      {list.length === 0 && <small>No notifications yet.</small>}

      {list.map((n) => {
        const sev = normalizeSeverity(n?.severity);
        const title = n?.title || "Notification";
        const message = n?.message || "";
        const when = formatTime(n);
        const read = !!n?.read;

        return (
          <div
            key={n?.id || `${title}-${when}`}
            className="pill"
            style={{ marginBottom: 10 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <b>{title}</b>{" "}
                <span className={`badge ${badgeClass(sev)}`}>
                  {sev.toUpperCase()}
                </span>
                {when && (
                  <div>
                    <small>{when}</small>
                  </div>
                )}
              </div>

              <div className="actions" style={{ maxWidth: 360 }}>
                {/* 🔊 Read aloud button using hardened engine */}
                <button
                  onClick={() =>
                    readAloud(`${title}. ${message}`)
                  }
                >
                  🔊
                </button>

                <ShareSnippet text={`${title}\n\n${message}`} />

                {!read && canRead && (
                  <button onClick={() => onRead(n.id)}>
                    ✓ Mark read
                  </button>
                )}
              </div>
            </div>

            {message && (
              <div
                style={{
                  marginTop: 8,
                  color: "var(--muted)",
                  wordBreak: "break-word",
                }}
              >
                {message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
