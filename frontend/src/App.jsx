import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Session (✅ FIXED PATH)
import { getSavedUser } from "./lib/api.js";

// Layouts
import AdminLayout from "./layouts/AdminLayout.jsx";
import ManagerLayout from "./layouts/ManagerLayout.jsx";
import CompanyLayout from "./layouts/CompanyLayout.jsx";
import UserLayout from "./layouts/UserLayout.jsx";

// Pages
import Login from "./pages/Login.jsx";
import Trading from "./pages/Trading.jsx";
import Posture from "./pages/Posture.jsx";
import Notifications from "./pages/Notifications.jsx";
import NotFound from "./pages/NotFound.jsx";

// ---------------- Role Guard ----------------
function RequireRole({ allow, children }) {
  const user = getSavedUser();

  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/404" replace />;

  return children;
}

export default function App() {
  const user = getSavedUser();

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PUBLIC ---------- */}
        <Route path="/login" element={<Login />} />

        {/* ---------- ADMIN ---------- */}
        <Route
          path="/admin/*"
          element={
            <RequireRole allow={["Admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="global" />} />
          <Route path="trading" element={<Trading mode="admin" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ---------- MANAGER ---------- */}
        <Route
          path="/manager/*"
          element={
            <RequireRole allow={["Admin", "Manager"]}>
              <ManagerLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="manager" />} />
          <Route path="trading" element={<Trading mode="watch" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ---------- COMPANY ---------- */}
        <Route
          path="/company/*"
          element={
            <RequireRole allow={["Admin", "Company"]}>
              <CompanyLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="company" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ---------- INDIVIDUAL USER ---------- */}
        <Route
          path="/app/*"
          element={
            <RequireRole allow={["Individual"]}>
              <UserLayout />
            </RequireRole>
          }
        >
          <Route index element={<Posture scope="user" />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* ---------- FALLBACK ---------- */}
        <Route path="/404" element={<NotFound />} />
        <Route
          path="*"
          element={<Navigate to={user ? "/app" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
