import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getSavedUser, clearToken, clearUser } from "../lib/api";
import "../styles/layout.css";

/**
 * Global Top Header (HARDENED)
 * Safe against:
 * - Corrupted localStorage
 * - Missing role
 * - Undefined user
 * - Bad route state
 */

export default function TopHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  /* ================= SAFE USER LOAD ================= */

  let user = null;

  try {
    user = getSavedUser();
  } catch (e) {
    console.error("TopHeader user load error:", e);
    user = null;
  }

  if (!user || typeof user !== "object") return null;

  const role = String(user?.role || "").toLowerCase();
  const path = String(location?.pathname || "");

  /* ================= ROOM DEFINITIONS ================= */

  const ROOMS = [
    { key: "admin", label: "Admin", path: "/admin", roles: ["admin"] },
    {
      key: "trading",
      label: "Trading",
      path: "/admin/trading",
      roles: ["admin", "manager"],
    },
    {
      key: "company",
      label: "Company",
      path: "/company",
      roles: ["admin", "company"],
    },
    {
      key: "small-company",
      label: "Small Company",
      path: "/small-company",
      roles: ["small_company"],
    },
    {
      key: "individual",
      label: "Personal",
      path: "/user",
      roles: ["individual", "user"],
    },
  ];

  const availableRooms = ROOMS.filter((r) =>
    Array.isArray(r.roles) ? r.roles.includes(role) : false
  );

  /* ================= HELPERS ================= */

  function getCurrentRoom() {
    const found = ROOMS.find((r) =>
      typeof r.path === "string" ? path.startsWith(r.path) : false
    );
    return found ? found.label : "Dashboard";
  }

  function handleLogoClick() {
    try {
      if (role === "admin") navigate("/admin");
      else if (role === "company") navigate("/company");
      else if (role === "small_company") navigate("/small-company");
      else navigate("/user");
    } catch (e) {
      console.error("Logo navigation error:", e);
    }
  }

  function logout() {
    try {
      clearToken();
      clearUser();
      navigate("/login");
    } catch (e) {
      console.error("Logout error:", e);
    }
  }

  /* ================= RENDER ================= */

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button className="logo-btn" onClick={handleLogoClick}>
          <span className="logo-mark">A</span>
          <span className="logo-text">AutoShield</span>
        </button>

        <span className="room-label">{getCurrentRoom()}</span>
      </div>

      <div className="top-header-right">
        {availableRooms.length > 1 && (
          <select
            className="room-switcher"
            value={getCurrentRoom()}
            onChange={(e) => {
              const room = availableRooms.find(
                (r) => r.label === e.target.value
              );
              if (room) {
                try {
                  navigate(room.path);
                } catch (err) {
                  console.error("Room switch error:", err);
                }
              }
            }}
          >
            {availableRooms.map((r) => (
              <option key={r.key} value={r.label}>
                {r.label}
              </option>
            ))}
          </select>
        )}

        <span className="user-role">
          {String(user?.role || "User")}
        </span>

        <button className="btn logout-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
