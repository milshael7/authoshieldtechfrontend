import React, { useState } from "react";
import { PRICING } from "../../config/pricing.config";
import "../../styles/main.css";

export default function PricingAdmin() {
  const [pricing, setPricing] = useState(PRICING);

  function update(path, value) {
    setPricing((prev) => {
      const copy = structuredClone(prev);
      let ref = copy;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = Number(value);
      return copy;
    });
  }

  return (
    <div className="container">
      <h1>Pricing Control</h1>
      <p className="muted">
        Administrators may update pricing values here.
        Changes do not automatically upgrade users.
        Notifications are required.
      </p>

      {/* ===== INDIVIDUAL ===== */}
      <section className="card">
        <h2>Individual</h2>

        <label>
          Monthly Price
          <input
            type="number"
            value={pricing.individual.monthly}
            onChange={(e) =>
              update(["individual", "monthly"], e.target.value)
            }
          />
        </label>

        <label>
          AutoDev 6.5 – First Month
          <input
            type="number"
            value={pricing.individual.autodev.firstMonth}
            onChange={(e) =>
              update(["individual", "autodev", "firstMonth"], e.target.value)
            }
          />
        </label>

        <label>
          AutoDev 6.5 – Ongoing
          <input
            type="number"
            value={pricing.individual.autodev.ongoing}
            onChange={(e) =>
              update(["individual", "autodev", "ongoing"], e.target.value)
            }
          />
        </label>
      </section>

      {/* ===== SMALL COMPANY ===== */}
      <section className="card">
        <h2>Small Company</h2>

        <label>
          Starting Price
          <input
            type="number"
            value={pricing.smallCompany.start}
            onChange={(e) =>
              update(["smallCompany", "start"], e.target.value)
            }
          />
        </label>

        <label>
          Maximum Price
          <input
            type="number"
            value={pricing.smallCompany.max}
            onChange={(e) =>
              update(["smallCompany", "max"], e.target.value)
            }
          />
        </label>
      </section>

      {/* ===== COMPANY ===== */}
      <section className="card">
        <h2>Company</h2>

        <label>
          Starting Price
          <input
            type="number"
            value={pricing.company.start}
            onChange={(e) =>
              update(["company", "start"], e.target.value)
            }
          />
        </label>

        <label>
          Price After 6 Months
          <input
            type="number"
            value={pricing.company.afterSixMonths}
            onChange={(e) =>
              update(["company", "afterSixMonths"], e.target.value)
            }
          />
        </label>
      </section>

      <div className="card">
        <p className="muted">
          ⚠️ Saving pricing requires backend confirmation.
          <br />
          ⚠️ Users are notified — never auto-upgraded.
        </p>
      </div>
    </div>
  );
}
