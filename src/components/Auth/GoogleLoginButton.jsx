import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { loginStart, loginSuccess, loginFailure } from "../../store/userSlice";

const GoogleLoginButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const buttonRef = useRef(null);

  const decodeJwtPayload = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
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

  const handleCredentialResponse = async (googleResponse) => {
    dispatch(loginStart());
    setError(null);
    try {
      const idToken = googleResponse.credential;
      const response = await api.post("/Auth/google-login", { idToken });

      const accessToken = getTokenFromResponse(response.data);
      const refreshToken = getRefreshTokenFromResponse(response.data);

      if (!accessToken) {
        dispatch(loginFailure("Token was not returned from server"));
        setError("Authentication failed: No token returned from server.");
        return;
      }

      localStorage.setItem("token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }

      try {
        const meResponse = await api.get("/User/me");
        dispatch(loginSuccess(meResponse.data));
      } catch (meError) {
        console.error("Failed to fetch current user:", meError);
      }

      if (isAdminToken(accessToken)) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("Google login failed:", err);
      const msg = err.response?.data?.message || err.response?.data || "Google login failed. Please try again.";
      dispatch(loginFailure(msg));
      setError(typeof msg === "string" ? msg : "Google login failed. Please try again.");
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google?.accounts?.id) return;

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);

      return () => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    }
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <div ref={buttonRef} className="auth-google-btn"></div>
      {error && (
        <div className="auth-error-box" style={{ marginTop: "1rem" }}>
          <svg className="auth-error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default GoogleLoginButton;
