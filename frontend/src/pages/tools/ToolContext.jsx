// frontend/src/pages/tools/ToolContext.jsx
// Enterprise Tools Governance Context
// v4 — Single Source of Truth • App-Aligned User • 401 Storm Guard • Drift Eliminated

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import {
  getToken,
  clearToken,
  clearUser,
} from "../../lib/api.js";

const ToolContext = createContext(null);

export function ToolProvider({ user, children }) {
  const [loading, setLoading] = useState(true);

  // User now comes from App (single source of truth)
  const [tools, setTools] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [inbox, setInbox] = useState([]);
  const [autodev, setAutodev] = useState(null);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  const redirectingRef = useRef(false);

  /* =========================================================
     SAFE FETCH
  ========================================================= */

  async function safeFetch(url, options = {}) {
    const token = getToken();

    const headers = {
      ...(options.headers || {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      if (!redirectingRef.current) {
        redirectingRef.current = true;
        clearToken();
        clearUser();
        window.location.href = "/login";
      }
      return null;
    }

    return res;
  }

  /* =========================================================
     DATA LOADERS
  ========================================================= */

  async function loadTools() {
    const res = await safeFetch(`${base}/api/tools/catalog`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setTools(data.tools || []);
  }

  async function loadMyRequests() {
    const res = await safeFetch(`${base}/api/tools/requests/mine`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setMyRequests(data.requests || []);
  }

  async function loadInbox() {
    const res = await safeFetch(`${base}/api/tools/requests/inbox`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setInbox(data.inbox || []);
  }

  async function loadAutodev() {
    const res = await safeFetch(`${base}/api/autoprotect/status`);
    if (!res || !res.ok) return;

    const data = await res.json();
    if (data.ok) setAutodev(data.autodev);
  }

  /* =========================================================
     REQUEST TOOL
  ========================================================= */

  async function requestTool(toolId, note = "") {
    const res = await safeFetch(`${base}/api/tools/request/${toolId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });

    if (!res) return;

    const data = await res.json();
    if (data.ok) {
      await loadMyRequests();
      await loadTools();
      return data;
    }
  }

  /* =========================================================
     INITIALIZE (runs when user changes)
  ========================================================= */

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function initialize() {
      setLoading(true);

      await loadTools();
      await loadMyRequests();
      await loadInbox();
      await loadAutodev();

      setLoading(false);
    }

    initialize();

    const interval = setInterval(() => {
      loadTools();
      loadMyRequests();
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  /* =========================================================
     HELPERS
  ========================================================= */

  function getTool(toolId) {
    return tools.find((t) => t.id === toolId);
  }

  function hasToolAccess(toolId) {
    const tool = getTool(toolId);
    return tool?.accessible === true;
  }

  function toolRequiresApproval(toolId) {
    const tool = getTool(toolId);
    return tool?.requiresApproval === true;
  }

  function hasActiveGrant(toolId) {
    const tool = getTool(toolId);
    return tool?.hasActiveGrant === true;
  }

  function subscriptionLocked() {
    const s = String(user?.subscriptionStatus || "").toLowerCase();
    return s === "locked" || s === "past_due";
  }

  function normalizeRole() {
    return String(user?.role || "").toLowerCase();
  }

  function isAdmin() {
    return normalizeRole() === "admin";
  }

  function isManager() {
    return normalizeRole() === "manager";
  }

  function isCompany() {
    return (
      normalizeRole() === "company" ||
      normalizeRole() === "small_company"
    );
  }

  function isIndividual() {
    return normalizeRole() === "individual";
  }

  return (
    <ToolContext.Provider
      value={{
        loading,
        user,
        tools,
        myRequests,
        inbox,
        autodev,

        refresh: () => {
          if (user) {
            loadTools();
            loadMyRequests();
            loadInbox();
            loadAutodev();
          }
        },

        requestTool,

        hasToolAccess,
        toolRequiresApproval,
        hasActiveGrant,
        subscriptionLocked,

        isAdmin,
        isManager,
        isCompany,
        isIndividual,
      }}
    >
      {children}
    </ToolContext.Provider>
  );
}

export function useTools() {
  return useContext(ToolContext);
}
