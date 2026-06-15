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

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const response = await api.post("/Auth/login", formData);

      const accessToken = getTokenFromResponse(response.data);
      const refreshToken = getRefreshTokenFromResponse(response.data);

      if (!accessToken) {
        dispatch(loginFailure("Token was not returned from server"));
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
      console.error("Login failed:", err);
      dispatch(loginFailure("Invalid email or password"));
    }
  };

  return (
    <div className="auth-container">
      {/* Sol Panel - Görsel ve Tanıtım */}
      <div className="auth-sidebar">
        <div className="auth-sidebar-header">
          <h1 className="auth-logo">lynq<span>.</span></h1>
        </div>
        
        <div className="auth-sidebar-body">
          <h2 className="auth-sidebar-title">Connect your professional world in one place.</h2>
          <p className="auth-sidebar-desc">
            Connect with colleagues, stay up-to-date with job opportunities, and take your career to the next level.
          </p>
          
          <div className="auth-sidebar-card">
            <div className="auth-card-user">
              <div className="auth-card-avatar">YK</div>
              <div className="auth-card-info">
                <div className="auth-card-name">Yusif Xankisiyev</div>
                <div className="auth-card-role">Developer @ Lynq</div>
              </div>
            </div>
            <div className="auth-card-badge">✨ New Connection Established</div>
          </div>
        </div>
        
        <div className="auth-sidebar-footer">
          &copy; {new Date().getFullYear()} Lynq. All rights reserved.
        </div>
      </div>

      {/* Sağ Panel - Form */}
      <div className="auth-main">
        <div className="auth-card">
          {/* Mobil Görünüm için Logo */}
          <div className="auth-card-logo-mobile">
            lynq<span>.</span>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">Welcome Back</h2>
            <p className="auth-card-subtitle">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Username</label>
              <div className="auth-input-wrapper">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                  className="auth-input"
                />
                <span className="auth-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
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
                  required
                  className="auth-input has-toggle"
                />
                <span className="auth-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && !loading && (
              <div className="auth-error-box">
                <svg className="auth-error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? <span className="auth-spinner"></span> : "Sign In"}
            </button>
          </form>

          <div className="auth-divider">Or continue with</div>

          <div className="auth-google-btn-container">
            <GoogleLoginButton />
          </div>

          <div className="auth-footer">
            <span className="auth-footer-text">New to Lynq?</span>
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;