// frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AppShell from "./shell/AppShell.jsx";

// Global styles
import "./styles/main.css";
import "./styles/layout.css";

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <AppShell>
      <App />
    </AppShell>
  </React.StrictMode>
);
