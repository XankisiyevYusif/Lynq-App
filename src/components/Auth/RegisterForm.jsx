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
    confirmEmail: "",
    password: "",
    confirmPassword: "",

    fullName: "",

    companyName: "",
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
      return data
        .map((item) => item.description || item.message || item)
        .join(" ");
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
    const nextValue = name === "username" ? value.toLowerCase() : value;

    setFormError("");
    dispatch(registerFailure(null));

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
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

    const username = formData.username.trim().toLowerCase();

    if (username.length < 3 || username.length > 30) {
      setFormError("Username must be between 3 and 30 characters.");
      return false;
    }

    if (!/^(?![._])(?!.*[._]{2})[a-z0-9]+(?:[._][a-z0-9]+)*$/.test(username)) {
      setFormError(
        "Username can only contain lowercase letters, numbers, dots and underscores.",
      );
      return false;
    }

    if (!formData.email.trim()) {
      setFormError("Email is required.");
      return false;
    }

    if (formData.email.trim().toLowerCase() !== formData.confirmEmail.trim().toLowerCase()) {
      setFormError("Email addresses do not match.");
      return false;
    }

    if (!formData.password.trim()) {
      setFormError("Password is required.");
      return false;
    }

    if (formData.password.length < 8) {
      setFormError("Password must be at least 8 characters.");
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
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim(),
        confirmEmail: formData.confirmEmail.trim(),
        password: formData.password,
        name: formData.companyName.trim(),
      };
    }

    return {
      username: formData.username.trim().toLowerCase(),
      email: formData.email.trim(),
      confirmEmail: formData.confirmEmail.trim(),
      password: formData.password,
      fullName: formData.fullName.trim(),
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
      navigate(`/verify-email?email=${encodeURIComponent(formData.email.trim())}`, {
        replace: true,
        state: {
          email: formData.email.trim(),
          emailSent: response.data?.emailSent === true,
          message: response.data?.message,
        },
      });
    } catch (err) {
      const message = getErrorMessage(err);
      dispatch(registerFailure(message));
    }
  };

  return (
    <div className="auth-container auth-register-container">
      <div className="auth-sidebar auth-register-sidebar">
        <div className="auth-sidebar-header">
          <h1 className="auth-logo">
            nexora<span>.</span>
          </h1>
        </div>

        <div className="auth-sidebar-body">
          <span className="auth-login-eyebrow">Your professional identity</span>
          <h2 className="auth-sidebar-title">
            Create a profile that opens the right doors.
          </h2>
          <p className="auth-sidebar-desc">
            Join a focused professional network where people show what they
            can do and companies discover talent with real intent.
          </p>

          <div className="auth-login-features auth-register-features">
            <article>
              <span>01</span>
              <div>
                <strong>Build a credible profile</strong>
                <small>Present your skills, experience and professional story in one clear place.</small>
              </div>
            </article>
            <article>
              <span>02</span>
              <div>
                <strong>Be discovered with intent</strong>
                <small>Open-to-Work preferences help relevant companies find you for suitable roles.</small>
              </div>
            </article>
            <article>
              <span>03</span>
              <div>
                <strong>Grow through real connections</strong>
                <small>Follow companies, share work and build a professional network around your goals.</small>
              </div>
            </article>
          </div>
        </div>

        <div className="auth-sidebar-footer">
          <span>Start with a profile. Build what comes next.</span>
          <span>&copy; {new Date().getFullYear()} Nexora</span>
        </div>
      </div>

      <div className="auth-main auth-register-main">
        <div className="auth-card register-card auth-register-card">
          <div className="auth-card-logo-mobile">
            nexora<span>.</span>
          </div>

          <div className="auth-card-header">
            <h2 className="auth-card-title">Create your account</h2>
            <p className="auth-card-subtitle">{pageSubtitle}</p>
          </div>

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
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
                          d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                        />
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
                          d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"
                        />
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
                          d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"
                        />
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
                        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm email</label>
                <div className="auth-input-wrapper">
                  <input
                    type="email"
                    name="confirmEmail"
                    value={formData.confirmEmail}
                    onChange={handleChange}
                    placeholder="Enter your email again"
                    required
                    autoComplete="email"
                    className="auth-input"
                  />
                  <span className="auth-input-icon" aria-hidden="true">@</span>
                </div>
              </div>
            </div>

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
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="auth-password-toggle"
                    title={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
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
            </div>

            {(formError || error) && (
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
            <GoogleLoginButton
              accountType={accountType}
              companyName={formData.companyName}
            />
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
