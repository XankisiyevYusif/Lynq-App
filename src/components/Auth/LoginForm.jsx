import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";

import { loginStart, loginSuccess, loginFailure } from "../../store/userSlice";
import api from "../../services/api";
import GoogleLoginButton from "./GoogleLoginButton";
import "./Auth.css";

const LoginForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.user);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  const [twoFactor, setTwoFactor] = useState({
    required: false,
    email: "",
    code: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => {
            return `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`;
          })
          .join(""),
      );

      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Token decode failed:", err);
      return null;
    }
  };

  const isAdminToken = (token) => {
    if (!token) return false;

    const payload = decodeJwtPayload(token);
    if (!payload) return false;

    const role =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role ||
      payload.roles;

    if (Array.isArray(role)) {
      return role.includes("Admin");
    }

    return role === "Admin";
  };

  const getPrimaryRole = (token) => {
    const payload = decodeJwtPayload(token);
    const role =
      payload?.[
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
      ] ||
      payload?.role ||
      payload?.roles;
    return Array.isArray(role) ? role[0] : role;
  };

  const getTokenFromResponse = (data) => {
    return (
      data?.accessToken ||
      data?.AccessToken ||
      data?.token ||
      data?.Token ||
      data?.data?.accessToken ||
      data?.data?.AccessToken ||
      data?.data?.token ||
      data?.data?.Token
    );
  };

  const getRefreshTokenFromResponse = (data) => {
    return (
      data?.refreshToken ||
      data?.RefreshToken ||
      data?.data?.refreshToken ||
      data?.data?.RefreshToken
    );
  };

  const getUserFromResponse = (data) =>
    data?.user || data?.User || data?.data?.user || data?.data?.User || null;

  const getFallbackUser = (accessToken) => {
    const payload = decodeJwtPayload(accessToken) || {};
    const username =
      payload.unique_name || payload.username || payload.preferred_username || "";
    const roleClaim =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role ||
      payload.roles;
    const role = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;

    return {
      username,
      fullName: payload.name || username,
      role,
      userType: role,
      basicInfo: {
        username,
        fullName: payload.name || username,
        role,
      },
    };
  };

  const completeLogin = (data) => {
    const accessToken = getTokenFromResponse(data);
    const refreshToken = getRefreshTokenFromResponse(data);

    if (!accessToken) {
      dispatch(loginFailure("Token was not returned from server"));
      return;
    }

    localStorage.setItem("token", accessToken);

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    dispatch(
      loginSuccess(
        getUserFromResponse(data) || getFallbackUser(accessToken),
      ),
    );

    if (isAdminToken(accessToken)) {
      navigate("/admin", { replace: true });
    } else if (getPrimaryRole(accessToken) === "Employer") {
      navigate("/company/dashboard", { replace: true });
    } else {
      navigate("/home", { replace: true });
    }

    api.get("/User/me")
      .then((meResponse) => {
        const currentUser = meResponse.data?.data || meResponse.data;
        if (currentUser) dispatch(loginSuccess(currentUser));
      })
      .catch((meError) => {
        console.warn("Current user profile hydration was delayed:", meError);
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    setUnconfirmedEmail("");

    try {
      const response = await api.post("/Auth/login", formData);

      if (
        response.data?.requiresTwoFactor ||
        response.data?.RequiresTwoFactor
      ) {
        setTwoFactor({
          required: true,
          email: response.data?.email || response.data?.Email || "",
          code: "",
        });
        dispatch(loginFailure(null));
        return;
      }

      completeLogin(response.data);
    } catch (err) {
      console.error("Login failed:", err);
      const data = err?.response?.data;
      if (data?.code === "EMAIL_NOT_CONFIRMED") {
        setUnconfirmedEmail(data.email || "");
        dispatch(loginFailure(data.message));
      } else {
        const message =
          data?.message ||
          (typeof data === "string" ? data : null) ||
          "The username/email or password is incorrect.";
        dispatch(loginFailure(message));
      }
    }
  };

  const handleTwoFactorSubmit = async (event) => {
    event.preventDefault();
    const code = twoFactor.code.replace(/\s/g, "");
    if (code.length < 4) {
      dispatch(loginFailure("Enter the verification code from your email."));
      return;
    }

    dispatch(loginStart());
    try {
      const response = await api.post("/Auth/verify-two-factor", {
        username: formData.username.trim(),
        code,
      });
      completeLogin(response.data);
    } catch (err) {
      const data = err?.response?.data;
      dispatch(
        loginFailure(
          data?.message ||
            (typeof data === "string" ? data : null) ||
            "The verification code is invalid or has expired.",
        ),
      );
    }
  };

  const resendTwoFactorCode = async () => {
    dispatch(loginStart());
    try {
      const response = await api.post("/Auth/login", formData);
      if (
        response.data?.requiresTwoFactor ||
        response.data?.RequiresTwoFactor
      ) {
        setTwoFactor((current) => ({
          ...current,
          email: response.data?.email || response.data?.Email || current.email,
          code: "",
        }));
        dispatch(loginFailure(null));
      } else {
        completeLogin(response.data);
      }
    } catch (err) {
      const data = err?.response?.data;
      dispatch(
        loginFailure(
          data?.message ||
            (typeof data === "string" ? data : null) ||
            "A new verification code could not be sent.",
        ),
      );
    }
  };

  return (
    <div className="auth-container auth-login-container">
      <div className="auth-sidebar auth-login-sidebar">
        <div className="auth-sidebar-header">
          <h1 className="auth-logo">
            nexora<span>.</span>
          </h1>
        </div>

        <div className="auth-sidebar-body">
          <span className="auth-login-eyebrow">Professional network & hiring</span>
          <h2 className="auth-sidebar-title">
            Build your next professional move with clarity.
          </h2>
          <p className="auth-sidebar-desc">
            Nexora brings professional identity, meaningful connections,
            relevant opportunities and focused hiring into one trusted space.
          </p>

          <div className="auth-login-features">
            <article>
              <span>01</span>
              <div>
                <strong>Show your professional value</strong>
                <small>Build a credible profile around experience, skills and real activity.</small>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <strong>Discover relevant opportunities</strong>
                <small>Use preferences and Open-to-Work details to improve job and talent matching.</small>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <strong>Connect people and companies</strong>
                <small>Share ideas, grow your network and manage hiring from one workspace.</small>
              </div>
            </article>
          </div>
        </div>

        <div className="auth-sidebar-footer">
          <span>Connect. Grow. Build what comes next.</span>
          <span>&copy; {new Date().getFullYear()} Nexora</span>
        </div>
      </div>

      <div className="auth-main auth-login-main">
        <div className="auth-card auth-login-card">
          <div className="auth-card-logo-mobile">
            nexora<span>.</span>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">
              {twoFactor.required ? "Verify your sign-in" : "Welcome Back"}
            </h2>
            <p className="auth-card-subtitle">
              {twoFactor.required
                ? `Enter the code sent to ${twoFactor.email || "your email"}.`
                : "Please enter your details to sign in."}
            </p>
          </div>

          {twoFactor.required ? (
            <form onSubmit={handleTwoFactorSubmit} className="auth-form auth-two-factor-form">
              <div className="auth-two-factor-icon" aria-hidden="true">✓</div>
              <div className="auth-field">
                <label className="auth-label" htmlFor="two-factor-code">
                  Verification code
                </label>
                <input
                  id="two-factor-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={20}
                  value={twoFactor.code}
                  onChange={(event) =>
                    setTwoFactor((current) => ({
                      ...current,
                      code: event.target.value.replace(/[^\d\s]/g, ""),
                    }))
                  }
                  placeholder="Enter your code"
                  className="auth-input auth-code-input"
                  autoFocus
                  required
                />
              </div>

              {error && !loading && (
                <div className="auth-error-box">
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading} className="auth-btn">
                {loading ? <span className="auth-spinner"></span> : "Verify and sign in"}
              </button>

              <div className="auth-two-factor-actions">
                <button
                  type="button"
                  disabled={loading}
                  onClick={resendTwoFactorCode}
                >
                  Resend code
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setTwoFactor({ required: false, email: "", code: "" });
                    dispatch(loginFailure(null));
                  }}
                >
                  Back to sign in
                </button>
              </div>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Username or email</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username or email"
                  autoComplete="username"
                  required
                  className="auth-input"
                />
                <span className="auth-input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    width="20"
                    height="20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="auth-input has-toggle"
                />
                <span className="auth-input-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    width="20"
                    height="20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && !loading && (
              <div className="auth-error-box">
                <svg
                  className="auth-error-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  width="18"
                  height="18"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {unconfirmedEmail && (
              <Link
                className="auth-inline-link"
                to={`/verify-email?email=${encodeURIComponent(unconfirmedEmail)}`}
              >
                Resend confirmation email
              </Link>
            )}

            <div className="auth-form-helper">
              <Link to="/forgot-password" className="auth-link">Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <span className="auth-spinner"></span> : "Sign In"}
            </button>
          </form>
          )}

          {!twoFactor.required && (
            <>
          <div className="auth-divider">Or continue with</div>

          <div className="auth-google-btn-container">
            <GoogleLoginButton />
          </div>

          <div className="auth-footer">
            <span className="auth-footer-text">New to Nexora?</span>
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
