// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";

/* =========================================================
   GLOBAL ERROR LISTENERS (RUNTIME DETECTION)
========================================================= */

window.addEventListener("error", (e) => {
  const message = e?.error?.message || e?.message || "Unknown error";
  alert("JS ERROR: " + message);
  console.error("Global Error:", e);
});

window.addEventListener("unhandledrejection", (e) => {
  const message = e?.reason?.message || e?.reason || "Unknown promise error";
  alert("PROMISE ERROR: " + message);
  console.error("Unhandled Promise Rejection:", e);
});

/* =========================================================
   ROOT ERROR BOUNDARY
========================================================= */

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("🔥 React Crash:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100svh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
            background: "#0b1220",
            color: "#ffffff",
            fontFamily:
              "system-ui,-apple-system,Segoe UI,Roboto,Arial",
          }}
        >
          <div style={{ maxWidth: 540 }}>
            <h1 style={{ marginBottom: 14 }}>
              AutoShield Platform Error
            </h1>

            <p style={{ opacity: 0.8, marginBottom: 18 }}>
              A runtime error occurred. Details below:
            </p>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 12,
                opacity: 0.8,
              }}
            >
              {String(this.state.error)}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/* =========================================================
   BOOTSTRAP
========================================================= */

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppShell>
        <App />
      </AppShell>
    </RootErrorBoundary>
  </React.StrictMode>
);
