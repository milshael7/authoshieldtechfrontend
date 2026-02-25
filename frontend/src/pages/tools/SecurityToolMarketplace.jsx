import React, { useEffect, useState } from "react";

/*
  Security Tool Marketplace
  Entitlement Driven • Billing Integrated • Enterprise Clean
*/

export default function SecurityToolMarketplace() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  /* =========================================================
     LOAD CATALOG FROM BACKEND
  ========================================================= */

  async function loadCatalog() {
    try {
      const res = await fetch("/api/tools/catalog", {
        credentials: "include",
      });

      const data = await res.json();

      if (data.ok) {
        setCatalog(data.tools || []);
      }
    } catch (e) {
      console.error("Failed to load tools", e);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  /* =========================================================
     BILLING CHECKOUT
  ========================================================= */

  async function purchaseTool(toolId) {
    try {
      setProcessing(toolId);

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          type: toolId,
          successUrl: window.location.href,
          cancelUrl: window.location.href,
        }),
      });

      const data = await res.json();

      if (data.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.error || "Checkout failed");
      }
    } catch (e) {
      console.error(e);
      alert("Billing error");
    } finally {
      setProcessing(null);
    }
  }

  /* =========================================================
     TOOL LAUNCH
  ========================================================= */

  async function launchTool(toolId) {
    try {
      const res = await fetch(`/api/tools/access/${toolId}`, {
        credentials: "include",
      });

      const data = await res.json();

      if (!data.ok) {
        alert(data.error || "Access denied");
        return;
      }

      alert(`Launching ${data.tool.name}`);
      // Here you can route to tool page later
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="postureCard">
        <h3>Loading Marketplace...</h3>
      </div>
    );
  }

  return (
    <div className="postureCard">
      <div style={{ marginBottom: 24 }}>
        <h3>Security Control Marketplace</h3>
        <small className="muted">
          Deploy enterprise-grade security modules powered by Autodev 6.5.
        </small>
      </div>

      <div className="toolGrid">
        {catalog.map((tool) => {
          const locked = !tool.accessible;
          const isProcessing = processing === tool.id;

          return (
            <div
              key={tool.id}
              className="toolCard"
              style={{
                opacity: locked ? 0.7 : 1,
                border:
                  tool.tier === "enterprise"
                    ? "1px solid rgba(255,215,0,.4)"
                    : undefined,
              }}
            >
              <div className="toolHeader">
                <div>
                  <div className="toolTitle">{tool.name}</div>
                  <div className="toolCategory">
                    {tool.category} • {tool.tier.toUpperCase()}
                  </div>
                </div>

                <span
                  className={`badge ${
                    locked ? "warn" : "ok"
                  }`}
                >
                  {locked ? "Locked" : "Active"}
                </span>
              </div>

              <div className="toolDesc">
                {tool.description || "Enterprise security module."}
              </div>

              <div className="toolActions">
                {locked ? (
                  <button
                    className="btn primary"
                    onClick={() => purchaseTool(tool.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Processing..." : "Upgrade"}
                  </button>
                ) : (
                  <button
                    className="btn ok"
                    onClick={() => launchTool(tool.id)}
                  >
                    Launch
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
