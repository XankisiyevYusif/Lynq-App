import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { loginStart, loginSuccess, loginFailure } from "../../store/userSlice";

const GOOGLE_SCRIPT_ID = "google-identity-services";

const loadGoogleIdentity = () => {
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    const onLoad = () => resolve();
    const onError = () => reject(new Error("Google Sign-In could not be loaded."));

    if (existingScript) {
      existingScript.addEventListener("load", onLoad, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  });
};

const GoogleLoginButton = ({ accountType = "personal", companyName = "" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [twoFactor, setTwoFactor] = useState({
    required: false,
    email: "",
    identifier: "",
    code: "",
  });
  const buttonRef = useRef(null);
  const isProcessingRef = useRef(false);
  const accountTypeRef = useRef(accountType);
  const companyNameRef = useRef(companyName);

  accountTypeRef.current = accountType;
  companyNameRef.current = companyName;

  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
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
    const roleClaim =
      payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ||
      payload.role ||
      payload.roles;
    const role = Array.isArray(roleClaim) ? roleClaim[0] : roleClaim;
    const username =
      payload.unique_name || payload.username || payload.preferred_username || "";

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

  const completeGoogleLogin = (data) => {
    const accessToken = getTokenFromResponse(data);
    const refreshToken = getRefreshTokenFromResponse(data);

    if (!accessToken) {
      dispatch(loginFailure("Token was not returned from server"));
      setError("Authentication failed: No token returned from server.");
      return false;
    }

    localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    dispatch(loginSuccess(getUserFromResponse(data) || getFallbackUser(accessToken)));

    navigate(isAdminToken(accessToken) ? "/admin" : "/home", { replace: true });
    api.get("/User/me")
      .then((meResponse) => {
        const currentUser = meResponse.data?.data || meResponse.data;
        if (currentUser) dispatch(loginSuccess(currentUser));
      })
      .catch((meError) => {
        console.warn("Current user profile hydration was delayed:", meError);
      });
    return true;
  };

  const handleCredentialResponse = async (googleResponse) => {
    if (isProcessingRef.current) return;

    if (
      accountTypeRef.current === "company" &&
      !companyNameRef.current.trim()
    ) {
      setError("Enter the company name before continuing with Google.");
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    dispatch(loginStart());
    setError(null);
    try {
      const idToken = googleResponse.credential;
      const response = await api.post("/Auth/google-login", {
        idToken,
        accountType: accountTypeRef.current,
        companyName: companyNameRef.current.trim() || null,
      });

      const payload = response.data?.data ?? response.data?.Data ?? response.data;
      if (payload?.requiresTwoFactor || payload?.RequiresTwoFactor) {
        setTwoFactor({
          required: true,
          email: payload?.email || payload?.Email || "",
          identifier:
            payload?.identifier || payload?.Identifier || payload?.email || payload?.Email || "",
          code: "",
        });
        dispatch(loginFailure(null));
        return;
      }
      completeGoogleLogin(response.data);
    } catch (err) {
      console.error("Google login failed:", err);
      const msg =
        err.response?.data?.message ||
        err.response?.data ||
        "Google login failed. Please try again.";
      dispatch(loginFailure(msg));
      setError(
        typeof msg === "string"
          ? msg
          : "Google login failed. Please try again.",
      );
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const verifyGoogleTwoFactor = async (event) => {
    event.preventDefault();
    const code = twoFactor.code.replace(/\s/g, "");
    if (code.length < 4) {
      setError("Enter the verification code from your email.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      const response = await api.post("/Auth/verify-two-factor", {
        username: twoFactor.identifier,
        code,
      });
      completeGoogleLogin(response.data);
    } catch (verifyError) {
      setError(
        verifyError?.response?.data?.message ||
          "The verification code is invalid or has expired.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initializeGoogleSignIn = () => {
      if (!active || !window.google?.accounts?.id) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

      if (!clientId) {
        setError("Google Sign-In is not configured.");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "rectangular",
        });
      }
    };

    loadGoogleIdentity()
      .then(initializeGoogleSignIn)
      .catch((loadError) => {
        if (active) setError(loadError.message);
      });

    return () => {
      active = false;
    };
  }, [twoFactor.required]);

  const companyNameRequired =
    accountType === "company" && !companyName.trim();

  return (
    <div
      className={`auth-google-state ${isProcessing ? "is-processing" : ""} ${
        companyNameRequired ? "is-disabled" : ""
      }`}
      style={{ width: "100%" }}
    >
      {!twoFactor.required && <div ref={buttonRef} className="auth-google-btn"></div>}
      {twoFactor.required && (
        <form className="auth-two-factor-form" onSubmit={verifyGoogleTwoFactor}>
          <div className="auth-two-factor-icon" aria-hidden="true">✓</div>
          <p className="auth-google-hint">Google account verified. Enter the code sent to {twoFactor.email || "your email"}.</p>
          <label className="auth-label" htmlFor="google-two-factor-code">Verification code</label>
          <input id="google-two-factor-code" className="auth-input auth-code-input" value={twoFactor.code}
            onChange={(event) => setTwoFactor((current) => ({ ...current, code: event.target.value.replace(/[^\d\s]/g, "") }))}
            type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="Enter your code" maxLength={8} autoFocus required />
          <button className="auth-btn" type="submit" disabled={isProcessing}>
            {isProcessing ? "Verifying…" : "Verify and sign in"}
          </button>
          <div className="auth-two-factor-actions"><button type="button" disabled={isProcessing} onClick={() => { setTwoFactor({ required: false, email: "", identifier: "", code: "" }); setError(null); }}>Use another Google account</button></div>
        </form>
      )}
      {companyNameRequired && (
        <p className="auth-google-hint">
          Enter the company name to create a company account with Google.
        </p>
      )}
      {isProcessing && (
        <div className="auth-google-progress">
          <span className="auth-spinner" />
          Signing in with Google…
        </div>
      )}
      {error && (
        <div className="auth-error-box" style={{ marginTop: "1rem" }}>
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
    </div>
  );
};

export default GoogleLoginButton;
