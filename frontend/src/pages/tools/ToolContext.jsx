import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, getSavedUser } from "../../lib/api.js";

/*
  Enterprise Tools Governance Context
  Fully aligned with backend v4 tools.routes.js
*/

const ToolContext = createContext(null);

export function ToolProvider({ children }) {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);

  const [myRequests, setMyRequests] = useState([]);
  const [inbox, setInbox] = useState([]);

  const [autodev, setAutodev] = useState(null);

  const base = import.meta.env.VITE_API_BASE?.replace(/\/+$/, "");

  /* =========================================================
     LOAD USER (LOCAL CACHE SAFE)
  ========================================================= */

  function loadUser() {
    const stored = getSavedUser();
    if (stored) setUser(stored);
  }

  /* =========================================================
     LOAD TOOL CATALOG
  ========================================================= */

  async function loadTools() {
    try {
      const res = await fetch(`${base}/api/tools/catalog`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.ok) setTools(data.tools || []);
    } catch (e) {
      console.error("Tool load failed", e);
    }
  }

  /* =========================================================
     LOAD MY REQUESTS
  ========================================================= */

  async function loadMyRequests() {
    try {
      const res = await fetch(`${base}/api/tools/requests/mine`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.ok) setMyRequests(data.requests || []);
    } catch {}
  }

  /* =========================================================
     LOAD INBOX (ADMIN / MANAGER / COMPANY)
  ========================================================= */

  async function loadInbox() {
    try {
      const res = await fetch(`${base}/api/tools/requests/inbox`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.ok) setInbox(data.inbox || []);
    } catch {}
  }

  /* =========================================================
     LOAD AUTODEV STATUS
  ========================================================= */

  async function loadAutodev() {
    try {
      const res = await fetch(`${base}/api/autoprotect/status`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });

      if (!res.ok) return;

      const data = await res.json();
      if (data.ok) setAutodev(data.autodev);
    } catch {}
  }

  /* =========================================================
     REQUEST TOOL ACCESS
  ========================================================= */

  async function requestTool(toolId, note = "") {
    try {
      const res = await fetch(`${base}/api/tools/request/${toolId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ note })
      });

      const data = await res.json();
      if (data.ok) {
        await loadMyRequests();
        return data;
      }
    } catch (e) {
      console.error("Tool request failed", e);
    }
  }

  /* =========================================================
     REFRESH EVERYTHING
  ========================================================= */

  async function initialize() {
    setLoading(true);

    loadUser();
    await loadTools();
    await loadMyRequests();
    await loadInbox();
    await loadAutodev();

    setLoading(false);
  }

  useEffect(() => {
    initialize();
  }, []);

  /* =========================================================
     HELPERS
  ========================================================= */

  function hasToolAccess(toolId) {
    const tool = tools.find((t) => t.id === toolId);
    return tool?.accessible === true;
  }

  function toolRequiresApproval(toolId) {
    const tool = tools.find((t) => t.id === toolId);
    return tool?.requiresApproval === true;
  }

  function hasActiveGrant(toolId) {
    const tool = tools.find((t) => t.id === toolId);
    return tool?.hasActiveGrant === true;
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
    return normalizeRole() === "company" ||
           normalizeRole() === "small_company";
  }

  function isIndividual() {
    return normalizeRole() === "individual";
  }

  /* ========================================================= */

  return (
    <ToolContext.Provider
      value={{
        loading,

        user,
        tools,
        myRequests,
        inbox,
        autodev,

        refresh: initialize,

        requestTool,

        hasToolAccess,
        toolRequiresApproval,
        hasActiveGrant,

        isAdmin,
        isManager,
        isCompany,
        isIndividual
      }}
    >
      {children}
    </ToolContext.Provider>
  );
}

export function useTools() {
  return useContext(ToolContext);
}
