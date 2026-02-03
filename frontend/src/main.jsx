// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Existing pages
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";
import Company from "./pages/Company.jsx";
import Individual from "./pages/Individual.jsx";
import Manager from "./pages/Manager.jsx";
import Posture from "./pages/Posture.jsx";

// ✅ Trading (NEW wrapper page that shows Market + TradingRoom tabs)
import Trading from "./pages/Trading.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/trading" replace />} />

        {/* Auth / other pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/company" element={<Company />} />
        <Route path="/individual" element={<Individual />} />
        <Route path="/manager" element={<Manager />} />
        <Route path="/posture" element={<Posture />} />

        {/* ✅ Trading */}
        <Route path="/trading" element={<Trading />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/trading" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
