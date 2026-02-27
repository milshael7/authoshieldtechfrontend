import React, { useState } from "react";
import { api, setToken, saveUser } from "../lib/api.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await api.login(email, password);

      const token = result?.token;
      const user = result?.user;

      if (!token || !user) {
        throw new Error("Invalid login response from server");
      }

      setToken(token);
      saveUser(user);

      // 🔥 Full platform rehydrate
      window.location.replace(redirectByRole(user.role));

    } catch (err) {
      alert(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  function redirectByRole(role) {
    const r = String(role || "").toLowerCase();

    if (r === "admin") return "/admin";
    if (r === "manager") return "/manager";
    if (r === "company") return "/company";
    if (r === "small_company") return "/small-company";
    if (r === "individual") return "/user";

    return "/";
  }

  const reset = async (e) => {
    e.preventDefault();
    try {
      await api.resetPassword(resetEmail, resetPass);
      alert("Password updated. Now sign in.");
      setMode("login");
    } catch (err) {
      alert(err?.message || "Reset failed");
    }
  };

  return (
    <div
      className="row"
      style={{
        minHeight: "100svh",
        alignItems: "center",
      }}
    >
      <div className="col" style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            {mode === "login" ? "Sign in" : "Reset password"}
          </h2>

          {mode === "login" ? (
            <form onSubmit={submit}>
              <input
                placeholder="Email"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
              <div style={{ height: 12 }} />

              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div style={{ height: 16 }} />

              <button type="submit" disabled={loading}>
                {loading ? "Signing in…" : "Sign in"}
              </button>

              <div style={{ height: 14 }} />

              <small>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("reset");
                  }}
                >
                  Reset password
                </a>
              </small>
            </form>
          ) : (
            <form onSubmit={reset}>
              <input
                placeholder="Email"
                value={resetEmail}
                autoComplete="email"
                onChange={(e) => setResetEmail(e.target.value)}
              />
              <div style={{ height: 12 }} />

              <input
                type="password"
                placeholder="New password"
                autoComplete="new-password"
                value={resetPass}
                onChange={(e) => setResetPass(e.target.value)}
              />
              <div style={{ height: 16 }} />

              <button type="submit">Set new password</button>

              <div style={{ height: 14 }} />

              <small>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setMode("login");
                  }}
                >
                  Back
                </a>
              </small>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
