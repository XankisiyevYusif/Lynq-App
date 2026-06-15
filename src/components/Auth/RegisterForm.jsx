import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  registerStart,
  registerSuccess,
  registerFailure,
} from "../../store/userSlice";
import api from "../../services/api";
import PersonalAccount from "../../assets/PersonalAccount.png";
import CompanyAccount from "../../assets/CompanyAccount.png";
import GoogleLoginButton from "./GoogleLoginButton";
import "./Auth.css";

const RegisterForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);

  const [accountType, setAccountType] = useState("personal");
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",

    fullName: "",

    companyName: "",
    industry: "",
    website: "",

    bio: "",
    location: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isCompany = accountType === "company";

  const pageSubtitle = useMemo(() => {
    if (isCompany) {
      return "Create your company profile and start hiring.";
    }

    return "Create your personal profile and get started.";
  }, [isCompany]);

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (!data) return err.message || "Registration failed.";

    if (typeof data === "string") return data;

    if (Array.isArray(data)) {
      return data.map((item) => item.description || item.message || item).join(" ");
    }

    if (data.message) return data.message;

    if (data.title) return data.title;

    if (data.errors) {
      const allErrors = Object.values(data.errors).flat();
      return allErrors.join(" ");
    }

    return "Registration failed.";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormError("");
    dispatch(registerFailure(null));

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectType = (type) => {
    setAccountType(type);
    setFormError("");
    dispatch(registerFailure(null));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setFormError("Username is required.");
      return false;
    }

    if (!formData.email.trim()) {
      setFormError("Email is required.");
      return false;
    }

    if (!formData.password.trim()) {
      setFormError("Password is required.");
      return false;
    }

    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return false;
    }

    if (isCompany) {
      if (!formData.companyName.trim()) {
        setFormError("Company name is required.");
        return false;
      }
    } else {
      if (!formData.fullName.trim()) {
        setFormError("Full name is required.");
        return false;
      }
    }

    return true;
  };

  const buildPayload = () => {
    if (isCompany) {
      return {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        name: formData.companyName.trim(),
        industry: formData.industry.trim() || null,
        website: formData.website.trim() || null,
        bio: formData.bio.trim() || null,
        location: formData.location.trim() || null,
      };
    }

    return {
      username: formData.username.trim(),
      email: formData.email.trim(),
      password: formData.password,
      fullName: formData.fullName.trim(),
      bio: formData.bio.trim() || null,
      location: formData.location.trim() || null,
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    dispatch(registerStart());

    try {
      const payload = buildPayload();

      const endpoint = isCompany
        ? "/Auth/employers/register"
        : "/Auth/jobseekers/register";

      const response = await api.post(endpoint, payload);

      dispatch(registerSuccess(response.data));
      navigate("/login");
    } catch (err) {
      const message = getErrorMessage(err);
      dispatch(registerFailure(message));
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
          <h2 className="auth-sidebar-title">Take the next step in your career today.</h2>
          <p className="auth-sidebar-desc">
            Create your profile, discover job opportunities, and instantly connect with companies and professionals.
          </p>
          
          <div className="auth-sidebar-card">
            <div className="auth-card-user">
              <div className="auth-card-avatar">JD</div>
              <div className="auth-card-info">
                <div className="auth-card-name">Jane Doe</div>
                <div className="auth-card-role">Talent Acquisition @ Google</div>
              </div>
            </div>
            <div className="auth-card-badge">✨ Profile Viewed</div>
          </div>
        </div>
        
        <div className="auth-sidebar-footer">
          &copy; {new Date().getFullYear()} Lynq. All rights reserved.
        </div>
      </div>

      {/* Sağ Panel - Form */}
      <div className="auth-main">
        <div className="auth-card register-card">
          {/* Mobil Görünüm için Logo */}
          <div className="auth-card-logo-mobile">
            lynq<span>.</span>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">{pageSubtitle}</p>
          </div>

          {/* Hesap Tipi Seçimi */}
          <div className="auth-type-grid">
            <button
              type="button"
              onClick={() => handleSelectType("personal")}
              className={`auth-type-card ${accountType === "personal" ? "active" : ""}`}
            >
              <img
                src={PersonalAccount}
                alt="Personal Account"
                className="auth-type-icon"
              />
              <div className="auth-type-title">Personal Account</div>
              <div className="auth-type-desc">
                Build your profile, add experience, and share posts.
              </div>
              <span className="auth-type-check">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectType("company")}
              className={`auth-type-card ${accountType === "company" ? "active" : ""}`}
            >
              <img
                src={CompanyAccount}
                alt="Company Account"
                className="auth-type-icon"
              />
              <div className="auth-type-title">Company Account</div>
              <div className="auth-type-desc">
                Create a company profile, share posts, and publish job openings.
              </div>
              <span className="auth-type-check">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isCompany ? (
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Company name</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="Enter company name"
                      required
                      className="auth-input"
                    />
                    <span className="auth-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Username</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                      className="auth-input"
                    />
                    <span className="auth-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Full name</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter your full name"
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
                  <label className="auth-label">Username</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Choose a username"
                      required
                      className="auth-input"
                    />
                    <span className="auth-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrapper">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className="auth-input"
                  />
                  <span className="auth-input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </span>
                </div>
              </div>

              <div className="auth-field">
                <label className="auth-label">Location</label>
                <div className="auth-input-wrapper">
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Example: Baku, Azerbaijan"
                    className="auth-input"
                  />
                  <span className="auth-input-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </span>
                </div>
                <div className="auth-hint">This will be shown on your profile.</div>
              </div>
            </div>

            {isCompany && (
              <div className="auth-row">
                <div className="auth-field">
                  <label className="auth-label">Industry</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="Example: Software Development"
                      className="auth-input"
                    />
                    <span className="auth-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875c-.621 0-1.125-.504-1.125-1.125v-4.25m16.5 0a2.25 2.25 0 0 0-2.25-2.25H4.875a2.25 2.25 0 0 0-2.25 2.25m16.5 0V7.493c0-.83-.67-1.5-1.5-1.5h-2.912a3 3 0 0 0-2.514-1.31h-2.186a3 3 0 0 0-2.514 1.31H4.875a1.5 1.5 0 0 0-1.5 1.5v6.657" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="auth-field">
                  <label className="auth-label">Website</label>
                  <div className="auth-input-wrapper">
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="Example: https://company.com"
                      className="auth-input"
                    />
                    <span className="auth-input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="20" height="20">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-.778.099-1.533.284-2.253" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
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

              <div className="auth-field">
                <label className="auth-label">Confirm password</label>
                <div className="auth-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-password-toggle"
                    title={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
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
            </div>

            <div className="auth-field">
              <label className="auth-label">
                {isCompany ? "Company bio" : "Bio"}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder={
                  isCompany
                    ? "Write a short description about your company"
                    : "Write a short bio"
                }
                className="auth-textarea"
              />
            </div>

            {(formError || error) && (
              <div className="auth-error-box">
                <svg className="auth-error-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <span>{formError || error}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-btn">
              {loading ? (
                <span className="auth-spinner"></span>
              ) : isCompany ? (
                "Create company account"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="auth-divider">Or continue with</div>

          <div className="auth-google-btn-container">
            <GoogleLoginButton />
          </div>

          <div className="auth-footer">
            <span className="auth-footer-text">Already have an account?</span>
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;