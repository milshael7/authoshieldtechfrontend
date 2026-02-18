// frontend/src/pages/public/Signup.jsx
// Public Signup Page — Role-Aware Registration

import React, { useState } from "react";
import { api } from "../../lib/api.js";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "individual", // default
    companyName: ""
  });

  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 🔥 You will wire backend later
      await api.signup?.(form); // safe optional call

      alert("Account created. Awaiting approval if required.");
      navigate("/login");
    } catch (e) {
      alert(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100svh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div className="card" style={{ width: 420 }}>
        <h2>Create Account</h2>

        <form onSubmit={submit} className="form">

          <label>Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <label>Account Type</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="individual">Individual</option>
            <option value="small_company">Small Company</option>
            <option value="company">Company</option>
          </select>

          {form.role === "company" && (
            <>
              <label>Company Name</label>
              <input
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                required
              />
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>

        </form>

        <div style={{ marginTop: 14 }}>
          <small>
            Already have an account?{" "}
            <a href="/login">Sign in</a>
          </small>
        </div>
      </div>
    </div>
  );
}
