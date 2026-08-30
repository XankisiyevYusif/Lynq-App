import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { loginSuccess } from "../store/userSlice";
import {
  createUserFromToken,
  getTokenRole,
  isStaffRole,
} from "../utils/auth";
import "./AdminLoginPage.css";

const AdminLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({ identifier: "", password: "" });
  const [verification, setVerification] = useState({
    required: false,
    email: "",
    code: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const finishStaffLogin = (data) => {
    const accessToken = data?.accessToken || data?.AccessToken;
    const refreshToken = data?.refreshToken || data?.RefreshToken;
    const role = getTokenRole(accessToken);

    if (!accessToken || !isStaffRole(role)) {
      setError("This account does not have access to the Admin Portal.");
      return;
    }

    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);

    dispatch(loginSuccess(data?.user || createUserFromToken(accessToken)));
    navigate("/admin", { replace: true });
  };

  const submitCredentials = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/Auth/staff-login", {
        identifier: form.identifier.trim(),
        password: form.password,
      });

      if (response.data?.requiresTwoFactor) {
        setVerification({
          required: true,
          email: response.data?.email || "your staff email",
          code: "",
        });
      }
    } catch (requestError) {
      const data = requestError?.response?.data;
      setError(
        data?.message ||
          (typeof data === "string" ? data : null) ||
          "Staff sign-in failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const submitVerification = async (event) => {
    event.preventDefault();
    const code = verification.code.replace(/\s/g, "");

    if (code.length < 4) {
      setError("Enter the verification code sent to your staff email.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post("/Auth/staff-verify-two-factor", {
        identifier: form.identifier.trim(),
        password: form.password,
        code,
      });
      finishStaffLogin(response.data);
    } catch (requestError) {
      const data = requestError?.response?.data;
      setError(
        data?.message ||
          (typeof data === "string" ? data : null) ||
          "The verification code is invalid or has expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="staff-login-page">
      <section className="staff-login-intro">
        <Link to="/login" className="staff-brand" aria-label="Nexora home">
          nexora<span>.</span>
        </Link>

        <div className="staff-intro-copy">
          <span className="staff-kicker">STAFF WORKSPACE</span>
          <h1>Keep the Nexora community trusted.</h1>
          <p>
            Review reports, manage platform safety and handle moderation from
            one protected workspace.
          </p>
        </div>

        <div className="staff-security-note">
          <span aria-hidden="true">◆</span>
          <div>
            <strong>Protected staff access</strong>
            <small>Role verification and two-step authentication are required.</small>
          </div>
        </div>
      </section>

      <section className="staff-login-panel">
        <div className="staff-login-card">
          <div className="staff-card-heading">
            <span className="staff-lock" aria-hidden="true">N</span>
            <div>
              <h2>{verification.required ? "Verify staff access" : "Admin Portal"}</h2>
              <p>
                {verification.required
                  ? `Enter the code sent to ${verification.email}.`
                  : "Sign in with your authorized staff account."}
              </p>
            </div>
          </div>

          {error && <div className="staff-login-error" role="alert">{error}</div>}

          {verification.required ? (
            <form className="staff-login-form" onSubmit={submitVerification}>
              <label htmlFor="staff-code">Verification code</label>
              <input
                id="staff-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={verification.code}
                onChange={(event) =>
                  setVerification((current) => ({
                    ...current,
                    code: event.target.value.replace(/[^\d\s]/g, ""),
                  }))
                }
                placeholder="Enter your code"
                maxLength={20}
                autoFocus
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify and continue"}
              </button>

              <div className="staff-form-actions">
                <button type="button" onClick={submitCredentials} disabled={loading}>
                  Resend code
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setVerification({ required: false, email: "", code: "" });
                    setError("");
                  }}
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
            <form className="staff-login-form" onSubmit={submitCredentials}>
              <label htmlFor="staff-identifier">Staff email or username</label>
              <input
                id="staff-identifier"
                type="text"
                autoComplete="username"
                value={form.identifier}
                onChange={(event) =>
                  setForm((current) => ({ ...current, identifier: event.target.value }))
                }
                placeholder="name@nexora.com"
                required
                autoFocus
              />

              <label htmlFor="staff-password">Password</label>
              <div className="staff-password-field">
                <input
                  id="staff-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Checking access..." : "Continue securely"}
              </button>
            </form>
          )}

          <div className="staff-login-footer">
            <Link to="/login">Return to Nexora</Link>
            <span>Authorized staff only</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default AdminLoginPage;
