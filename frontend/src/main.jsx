// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";

/* =========================================================
   ROOT ERROR BOUNDARY — BOOT SAFETY
   Prevents blank / blue screens on runtime errors
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
    // Log only — no side effects
    console.error("🔥 Application bootstrap error:", error, info);
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
            padding: 32,
            background: "#0b1220",
            color: "white",
            fontFamily:
              "system-ui,-apple-system,Segoe UI,Roboto,Arial",
          }}
        >
          <div style={{ maxWidth: 520 }}>
            <h1 style={{ marginBottom: 12 }}>
              Application Error
            </h1>
            <p style={{ opacity: 0.8, marginBottom: 16 }}>
              The application failed to load correctly.
              This is a client-side error, not a deployment failure.
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 12,
                opacity: 0.7,
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

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <AppShell>
        <App />
      </AppShell>
    </RootErrorBoundary>
  </React.StrictMode>
);
