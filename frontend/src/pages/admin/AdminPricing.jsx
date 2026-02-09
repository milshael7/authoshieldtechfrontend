// frontend/src/pages/admin/AdminPricing.jsx
// AutoShield Tech — Admin Pricing Control (UI ONLY)
//
// PURPOSE:
// - Allow administrators to VIEW and EDIT pricing values
// - Frontend-only control surface
// - No persistence, no backend, no billing logic
//
// RULES:
// - UI ONLY
// - NO API calls
// - NO automatic upgrades
// - Prices are NOT applied until backend wiring later

import React, { useState } from "react";
import { PRICING as DEFAULT_PRICING } from "../../config/pricing.config";
import "../../styles/main.css";

export default function AdminPricing() {
  // Local editable copy (safe, non-destructive)
  const [pricing, setPricing] = useState(
    JSON.parse(JSON.stringify(DEFAULT_PRICING))
  );

  function update(path, value) {
    setPricing((prev) => {
      const next = { ...prev };
      let ref = next;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = value;
      return next;
    });
  }

  return (
    <div className="container">
      <h1>Pricing Control</h1>
      <p className="muted">
        Administrator-only pricing configuration. Changes are not applied
        until backend enforcement is enabled.
      </p>

      {/* ================= INDIVIDUAL ================= */}
      <div className="card">
        <h2>Individual</h2>

        <label>
          Monthly Price
          <input
            type="number"
            value={pricing.individual.monthly}
            onChange={(e) =>
              update(["individual", "monthly"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Yearly Multiplier
          <input
            type="number"
            value={pricing.individual.yearlyMultiplier}
            onChange={(e) =>
              update(
                ["individual", "yearlyMultiplier"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.individual.yearlyFeePercent}
            onChange={(e) =>
              update(
                ["individual", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= AUTODEV ================= */}
      <div className="card">
        <h2>AutoDev 6.5 (Individual Only)</h2>

        <label>
          First Month Price
          <input
            type="number"
            value={pricing.individual.autodev.firstMonth}
            onChange={(e) =>
              update(
                ["individual", "autodev", "firstMonth"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <label>
          Ongoing Monthly Price
          <input
            type="number"
            value={pricing.individual.autodev.ongoing}
            onChange={(e) =>
              update(
                ["individual", "autodev", "ongoing"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= SMALL COMPANY ================= */}
      <div className="card">
        <h2>Small Company</h2>

        <label>
          Starting Price
          <input
            type="number"
            value={pricing.smallCompany.start}
            onChange={(e) =>
              update(["smallCompany", "start"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Maximum Price
          <input
            type="number"
            value={pricing.smallCompany.max}
            onChange={(e) =>
              update(["smallCompany", "max"], Number(e.target.value))
            }
          />
        </label>

        <label>
          User Limit
          <input
            value={pricing.smallCompany.userLimit}
            onChange={(e) =>
              update(["smallCompany", "userLimit"], e.target.value)
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.smallCompany.yearlyFeePercent}
            onChange={(e) =>
              update(
                ["smallCompany", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= COMPANY ================= */}
      <div className="card">
        <h2>Company</h2>

        <label>
          Starting Monthly Price
          <input
            type="number"
            value={pricing.company.start}
            onChange={(e) =>
              update(["company", "start"], Number(e.target.value))
            }
          />
        </label>

        <label>
          Price After 6 Months
          <input
            type="number"
            value={pricing.company.afterSixMonths}
            onChange={(e) =>
              update(
                ["company", "afterSixMonths"],
                Number(e.target.value)
              )
            }
          />
        </label>

        <label>
          Yearly Contract Fee (%)
          <input
            type="number"
            value={pricing.company.yearlyFeePercent}
            onChange={(e) =>
              update(
                ["company", "yearlyFeePercent"],
                Number(e.target.value)
              )
            }
          />
        </label>
      </div>

      {/* ================= SAVE PLACEHOLDER ================= */}
      <div style={{ marginTop: 24 }}>
        <button disabled>
          Save Pricing (Backend Not Connected)
        </button>
        <p className="muted small">
          Pricing changes are staged only. Backend enforcement will be added
          later.
        </p>
      </div>
    </div>
  );
}
