// frontend/src/pages/Billing.jsx
// Billing Page — Stripe Integrated • Subscription Aware

import React, { useEffect, useState } from "react";

const PLANS = [
  { key: "individual_autodev", label: "Individual", price: "$29/mo" },
  { key: "micro", label: "Micro", price: "$79/mo" },
  { key: "small", label: "Small", price: "$149/mo" },
  { key: "mid", label: "Mid", price: "$299/mo" },
  { key: "enterprise", label: "Enterprise", price: "Contact Sales" },
];

export default function Billing() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  /* ======================================================
     LOAD CURRENT SUBSCRIPTION
  ====================================================== */

  useEffect(() => {
    async function loadSubscription() {
      try {
        const res = await fetch("/api/billing/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (data.ok) {
          setSubscription(data.subscription);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadSubscription();
  }, [token]);

  /* ======================================================
     START CHECKOUT
  ====================================================== */

  async function startCheckout(planKey) {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: planKey,
          successUrl: window.location.origin + "/billing",
          cancelUrl: window.location.origin + "/billing",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.href = data.checkoutUrl;

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ======================================================
     OPEN STRIPE PORTAL
  ====================================================== */

  async function openPortal() {
    try {
      setLoading(true);

      const res = await fetch("/api/billing/portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          returnUrl: window.location.origin + "/billing",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Portal failed");
      }

      window.location.href = data.portalUrl;

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ======================================================
     CANCEL SUBSCRIPTION
  ====================================================== */

  async function cancelSubscription() {
    try {
      setLoading(true);

      const res = await fetch("/api/billing/cancel", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Cancel failed");
      }

      window.location.reload();

    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="postureWrap">
      <div className="postureCard">

        <h2>Billing & Subscription</h2>

        {subscription && (
          <>
            <p className="muted">
              Status: <b>{subscription.status}</b>
            </p>

            {subscription.stripeSubscriptionId && (
              <div style={{ marginTop: 12 }}>
                <button onClick={openPortal} disabled={loading}>
                  Manage Billing
                </button>

                <button
                  onClick={cancelSubscription}
                  disabled={loading}
                  style={{ marginLeft: 10 }}
                >
                  Cancel Subscription
                </button>
              </div>
            )}
          </>
        )}

        {error && (
          <p style={{ color: "red", marginTop: 10 }}>
            {error}
          </p>
        )}

      </div>

      {/* ================= PLANS ================= */}

      <div
        className="postureGrid"
        style={{ marginTop: 20 }}
      >
        {PLANS.map((plan) => (
          <div key={plan.key} className="postureCard">
            <h3>{plan.label}</h3>
            <p className="muted">{plan.price}</p>

            <button
              onClick={() => startCheckout(plan.key)}
              disabled={loading}
              style={{ marginTop: 10 }}
            >
              Choose Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
