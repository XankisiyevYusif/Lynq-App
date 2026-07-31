import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import api from "../../services/api";
import "./Auth.css";

const getMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const getRetrySeconds = (error) =>
  Number(error?.response?.data?.retryAfterSeconds || 60);

const getCode = (error) => error?.response?.data?.code || "";

function SpamNotice() {
  return (
    <p className="auth-spam-notice">
      <span className="auth-spam-notice-icon" aria-hidden="true">!</span>
      Didn&apos;t receive it? Check your Spam or Junk folder.
    </p>
  );
}

function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [seconds]);

  return [seconds, setSeconds];
}

function AccountEmailShell({ title, subtitle, children }) {
  return (
    <div className="auth-container auth-email-page">
      <div className="auth-sidebar">
        <div className="auth-sidebar-header">
          <h1 className="auth-logo">nexora<span>.</span></h1>
        </div>
        <div className="auth-sidebar-body">
          <h2 className="auth-sidebar-title">Your account, protected at every step.</h2>
          <p className="auth-sidebar-desc">
            Email verification and secure password recovery keep your professional identity safe.
          </p>
        </div>
        <div className="auth-sidebar-footer">Secure account access</div>
      </div>

      <main className="auth-main">
        <section className="auth-card auth-email-card">
          <div className="auth-email-icon" aria-hidden="true">✉</div>
          <header className="auth-card-header">
            <h2 className="auth-card-title">{title}</h2>
            <p className="auth-card-subtitle">{subtitle}</p>
          </header>
          {children}
        </section>
      </main>
    </div>
  );
}

export function VerifyEmailPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(
    searchParams.get("email") || location.state?.email || "",
  );
  const initialEmailSent = location.state?.emailSent === true;
  const [message, setMessage] = useState(
    initialEmailSent ? location.state?.message || "Confirmation email sent." : "",
  );
  const [error, setError] = useState(
    location.state?.emailSent === false
      ? location.state?.message || "The confirmation email was not sent. Try again below."
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useCountdown(location.state?.emailSent ? 60 : 0);
  const [showEmailChange, setShowEmailChange] = useState(false);
  const [changeForm, setChangeForm] = useState({
    newEmail: "",
    confirmNewEmail: "",
    password: "",
  });
  const [changeLoading, setChangeLoading] = useState(false);

  const resend = async (event) => {
    event.preventDefault();
    if (!email.trim() || loading || seconds > 0) return;

    setLoading(true);
    setError("");
    try {
      const response = await api.post("/Auth/resend-confirmation", {
        email: email.trim(),
      });
      setMessage(response.data?.message || "Confirmation email sent.");
      setSeconds(60);
    } catch (requestError) {
      setError(getMessage(requestError, "The email could not be sent."));
      if (requestError?.response?.status === 429) {
        setSeconds(getRetrySeconds(requestError));
      }
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (changeForm.newEmail.trim().toLowerCase() !==
        changeForm.confirmNewEmail.trim().toLowerCase()) {
      setError("Email addresses do not match.");
      return;
    }

    setChangeLoading(true);
    try {
      const response = await api.post("/Auth/change-unconfirmed-email", {
        currentEmail: email.trim(),
        newEmail: changeForm.newEmail.trim(),
        confirmNewEmail: changeForm.confirmNewEmail.trim(),
        password: changeForm.password,
      });
      const changedEmail = changeForm.newEmail.trim();
      setEmail(changedEmail);
      setChangeForm({ newEmail: "", confirmNewEmail: "", password: "" });
      setShowEmailChange(false);
      setMessage(response.data?.message || "Email changed. Check your new inbox.");
      setSeconds(60);
    } catch (requestError) {
      setError(getMessage(requestError, "The email address could not be changed."));
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <AccountEmailShell
      title="Check your email"
      subtitle="Open the verification link within 15 minutes before signing in."
    >
      <form className="auth-form" onSubmit={resend}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="verification-email">Email</label>
          <input
            id="verification-email"
            className="auth-input auth-email-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {message && (
          <>
            <div className="auth-success-box">{message}</div>
            <SpamNotice />
          </>
        )}
        {error && <div className="auth-error-box">{error}</div>}
        <button className="auth-btn" disabled={loading || seconds > 0}>
          {loading
            ? "Sending..."
            : seconds > 0
              ? `Send again in ${seconds}s`
              : "Resend confirmation email"}
        </button>
      </form>
      <div className="auth-email-actions">
        <button
          type="button"
          className="auth-link auth-link-button"
          onClick={() => {
            setShowEmailChange((value) => !value);
            setError("");
          }}
        >
          {showEmailChange ? "Cancel email change" : "Change email address"}
        </button>
      </div>
      {showEmailChange && (
        <form className="auth-form auth-change-email-form" onSubmit={changeEmail}>
          <div className="auth-info-box">
            For security, enter the password used when this account was created.
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="new-verification-email">New email</label>
            <input
              id="new-verification-email"
              className="auth-input auth-email-input"
              type="email"
              value={changeForm.newEmail}
              onChange={(event) => setChangeForm((value) => ({ ...value, newEmail: event.target.value }))}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm-new-verification-email">Confirm new email</label>
            <input
              id="confirm-new-verification-email"
              className="auth-input auth-email-input"
              type="email"
              value={changeForm.confirmNewEmail}
              onChange={(event) => setChangeForm((value) => ({ ...value, confirmNewEmail: event.target.value }))}
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label" htmlFor="change-email-password">Password</label>
            <input
              id="change-email-password"
              className="auth-input auth-email-input"
              type="password"
              value={changeForm.password}
              onChange={(event) => setChangeForm((value) => ({ ...value, password: event.target.value }))}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="auth-btn" disabled={changeLoading}>
            {changeLoading ? "Changing..." : "Change email and send new link"}
          </button>
        </form>
      )}
      <div className="auth-footer"><Link className="auth-link" to="/login">Back to sign in</Link></div>
    </AccountEmailShell>
  );
}

export function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState({ loading: true, success: false, message: "Confirming your email..." });
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      setState({ loading: false, success: false, message: "This confirmation link is incomplete." });
      return;
    }

    api.post("/Auth/confirm-email", { email, token })
      .then((response) => setState({ loading: false, success: true, used: false, message: response.data?.message || "Email confirmed." }))
      .catch((error) => setState({
        loading: false,
        success: false,
        used: getCode(error) === "LINK_ALREADY_USED",
        message: getMessage(error, "This confirmation link is invalid, expired, or already used."),
      }));
  }, [searchParams]);

  return (
    <AccountEmailShell title="Email confirmation" subtitle="We are validating your secure confirmation link.">
      <div className={state.success ? "auth-success-box" : state.loading || state.used ? "auth-info-box" : "auth-error-box"}>
        {state.message}
      </div>
      {!state.loading && (
        <div className="auth-email-actions">
          {state.success || state.used
            ? <Link className="auth-btn auth-button-link" to="/login">Continue to sign in</Link>
            : <Link className="auth-link" to="/verify-email">Request a new link</Link>}
        </div>
      )}
      {!state.loading && !state.success && !state.used && (
        <Link
          className="auth-link"
          to={`/verify-email?email=${encodeURIComponent(searchParams.get("email") || "")}`}
        >
          Change email address
        </Link>
      )}
    </AccountEmailShell>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useCountdown();

  const submit = async (event) => {
    event.preventDefault();
    if (loading || seconds > 0) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/Auth/forgot-password", { email: email.trim() });
      setMessage(response.data?.message || "If the account exists, a reset email has been sent.");
      setSeconds(60);
    } catch (requestError) {
      setError(getMessage(requestError, "The request could not be completed."));
      if (requestError?.response?.status === 429) setSeconds(getRetrySeconds(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountEmailShell title="Forgot password?" subtitle="Enter your verified email and we will send a secure 10-minute reset link.">
      <form className="auth-form" onSubmit={submit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="forgot-email">Email</label>
          <input id="forgot-email" className="auth-input auth-email-input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
        </div>
        {message && (
          <>
            <div className="auth-success-box">{message}</div>
            <SpamNotice />
          </>
        )}
        {error && <div className="auth-error-box">{error}</div>}
        <button className="auth-btn" disabled={loading || seconds > 0}>
          {loading ? "Sending..." : seconds > 0 ? `Try again in ${seconds}s` : "Send reset link"}
        </button>
      </form>
      <div className="auth-footer"><Link className="auth-link" to="/login">Back to sign in</Link></div>
    </AccountEmailShell>
  );
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkState, setLinkState] = useState({ loading: true, valid: false });
  const validationStarted = useRef(false);

  useEffect(() => {
    if (validationStarted.current) return;
    validationStarted.current = true;

    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      setError("This password reset link is incomplete.");
      setLinkState({ loading: false, valid: false });
      return;
    }

    api.post("/Auth/validate-password-reset-token", { email, token })
      .then(() => setLinkState({ loading: false, valid: true }))
      .catch((requestError) => {
        setError(getMessage(
          requestError,
          "This password reset link is invalid, expired, or has already been used.",
        ));
        setLinkState({ loading: false, valid: false });
      });
  }, [searchParams]);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const email = searchParams.get("email");
    const token = searchParams.get("token");
    if (!email || !token) {
      setError("This password reset link is incomplete.");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/Auth/reset-password", { email, token, ...form });
      setMessage(response.data?.message || "Password reset successfully.");
      setLinkState({ loading: false, valid: false });
      window.setTimeout(() => navigate("/login", { replace: true }), 1600);
    } catch (requestError) {
      setError(getMessage(requestError, "The reset link is invalid or expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AccountEmailShell title="Create a new password" subtitle="Use at least 8 characters with uppercase, lowercase, number and symbol.">
      {linkState.loading && (
        <div className="auth-info-box">Checking this secure reset link...</div>
      )}
      {!linkState.loading && linkState.valid && (
        <form className="auth-form" onSubmit={submit}>
        <div className="auth-field">
          <label className="auth-label" htmlFor="new-password">New password</label>
          <input id="new-password" className="auth-input auth-email-input" type="password" minLength="8" autoComplete="new-password" value={form.newPassword} onChange={(event) => setForm((value) => ({ ...value, newPassword: event.target.value }))} required />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" className="auth-input auth-email-input" type="password" minLength="8" autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm((value) => ({ ...value, confirmPassword: event.target.value }))} required />
        </div>
        {message && <div className="auth-success-box">{message}</div>}
        {error && <div className="auth-error-box">{error}</div>}
        <button className="auth-btn" disabled={loading}>{loading ? "Updating..." : "Reset password"}</button>
        </form>
      )}
      {!linkState.loading && !linkState.valid && (
        <>
          {message && <div className="auth-success-box">{message}</div>}
          {error && <div className="auth-error-box">{error}</div>}
          <div className="auth-email-actions">
            <Link className="auth-link" to={message ? "/login" : "/forgot-password"}>
              {message ? "Continue to sign in" : "Request a new reset link"}
            </Link>
          </div>
        </>
      )}
    </AccountEmailShell>
  );
}
