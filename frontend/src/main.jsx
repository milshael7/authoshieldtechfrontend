// frontend/src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// 🔥 NEW: Company Context Provider
import { CompanyProvider } from "./context/CompanyContext";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";

/* =========================================================
   🔥 FORCE GLOBAL ERROR CAPTURE (EARLIEST POSSIBLE)
========================================================= */

window.onerror = function (message, source, lineno, colno, error) {
  document.body.innerHTML = `
    <div style="
      background:#0b1220;
      color:white;
      min-height:100vh;
      padding:40px;
      font-family:system-ui;
    ">
      <h1>🔥 GLOBAL JS ERROR</h1>
      <pre>${message}</pre>
      <pre>${error?.stack || ""}</pre>
    </div>
  `;
};

window.onunhandledrejection = function (event) {
  document.body.innerHTML = `
    <div style="
      background:#0b1220;
      color:white;
      min-height:100vh;
      padding:40px;
      font-family:system-ui;
    ">
      <h1>🔥 PROMISE REJECTION</h1>
      <pre>${event.reason?.message || event.reason}</pre>
      <pre>${event.reason?.stack || ""}</pre>
    </div>
  `;
};

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
    console.error("🔥 Runtime Crash:", error, info);
    alert("RUNTIME STACK:\n\n" + (error?.stack || error));
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
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ marginBottom: 14 }}>
              🔥 AutoShield Runtime Crash
            </h1>

            <p style={{ opacity: 0.8, marginBottom: 18 }}>
              Full stack trace below:
            </p>

            <pre
              style={{
                whiteSpace: "pre-wrap",
                fontSize: 13,
                opacity: 0.85,
                background: "#111827",
                padding: 16,
                borderRadius: 8,
              }}
            >
              {this.state.error?.stack ||
                JSON.stringify(this.state.error, null, 2)}
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
  document.body.innerHTML =
    "<h1 style='color:white;background:black;padding:40px'>Root element #root not found</h1>";
  throw new Error("Root element #root not found");
}

const root = ReactDOM.createRoot(rootEl);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      {/* 🔥 GLOBAL MULTI-COMPANY LAYER */}
      <CompanyProvider>
        <AppShell>
          <App />
        </AppShell>
      </CompanyProvider>
    </RootErrorBoundary>
  </React.StrictMode>
);
