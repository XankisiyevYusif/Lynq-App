import React, { useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import ProfileIcon from "../components/Profile/ProfileIcon";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import "./SettingsPage.css";
import "./SettingsExtras.css";

const choices = [
  {
    value: "light",
    title: "Light",
    description: "Use Nexora with a bright appearance.",
  },
  {
    value: "dark",
    title: "Dark",
    description: "Reduce brightness with a dark interface.",
  },
  {
    value: "system",
    title: "System",
    description: "Match your device appearance automatically.",
  },
];

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const [activeSection, setActiveSection] = useState("appearance");
  const [security, setSecurity] = useState({
    loading: true,
    saving: false,
    twoFactorEnabled: false,
    email: "",
    currentPassword: "",
    message: "",
    error: "",
  });

  useEffect(() => {
    let active = true;

    api.get("/User/security")
      .then((response) => {
        if (!active) return;
        const data = response.data?.data || response.data || {};
        setSecurity((current) => ({
          ...current,
          loading: false,
          twoFactorEnabled:
            data.twoFactorEnabled ?? data.TwoFactorEnabled ?? false,
          email: data.email || data.Email || "",
        }));
      })
      .catch(() => {
        if (!active) return;
        setSecurity((current) => ({
          ...current,
          loading: false,
          error: "Security settings could not be loaded.",
        }));
      });

    return () => {
      active = false;
    };
  }, []);

  const updateTwoFactor = async () => {
    if (!security.currentPassword.trim()) {
      setSecurity((current) => ({
        ...current,
        message: "",
        error: "Enter your current password to continue.",
      }));
      return;
    }

    const enabled = !security.twoFactorEnabled;
    setSecurity((current) => ({
      ...current,
      saving: true,
      message: "",
      error: "",
    }));

    try {
      const response = await api.put("/User/security/two-factor", {
        enabled,
        currentPassword: security.currentPassword,
      });
      const data = response.data?.data || response.data || {};
      setSecurity((current) => ({
        ...current,
        saving: false,
        currentPassword: "",
        twoFactorEnabled:
          data.twoFactorEnabled ?? data.TwoFactorEnabled ?? enabled,
        message:
          data.message ||
          data.Message ||
          (enabled
            ? "Two-factor authentication is enabled."
            : "Two-factor authentication is disabled."),
      }));
    } catch (requestError) {
      const data = requestError?.response?.data;
      setSecurity((current) => ({
        ...current,
        saving: false,
        error:
          data?.message ||
          data?.Message ||
          (typeof data === "string" ? data : null) ||
          "Two-factor authentication could not be updated.",
      }));
    }
  };

  const isAppearance = activeSection === "appearance";

  return (
    <>
      <Navbar />
      <div className="settings-page">
        <aside className="settings-sidebar">
          <span>Settings</span>
          <button
            type="button"
            className={isAppearance ? "is-active" : ""}
            onClick={() => setActiveSection("appearance")}
          >
            <ProfileIcon name="activity" size={18} />
            Appearance
          </button>
          <button
            type="button"
            className={!isAppearance ? "is-active" : ""}
            onClick={() => setActiveSection("security")}
          >
            <ProfileIcon name="lock" size={18} />
            Sign-in & security
          </button>
        </aside>

        <main className="settings-main">
          <header>
            <span>{isAppearance ? "Display preferences" : "Account protection"}</span>
            <h1>{isAppearance ? "Appearance" : "Sign-in & security"}</h1>
            <p>
              {isAppearance
                ? "Choose how Nexora looks on this device."
                : "Add an email verification step when signing in with your password."}
            </p>
          </header>

          {isAppearance ? (
            <section className="settings-card">
              <h2>Theme</h2>
              <div className="theme-options">
                {choices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    className={mode === choice.value ? "is-selected" : ""}
                    onClick={() => setMode(choice.value)}
                  >
                    <span className={`theme-preview ${choice.value}`}>
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>
                      <strong>{choice.title}</strong>
                      <small>{choice.description}</small>
                    </span>
                    <b>{mode === choice.value ? "✓" : ""}</b>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <section className="settings-card security-card">
              <div className="security-status">
                <div>
                  <h2>Two-factor authentication</h2>
                  <p>
                    After your password is accepted, Nexora sends a one-time
                    verification code to {security.email || "your confirmed email"}.
                  </p>
                </div>
                <span className={security.twoFactorEnabled ? "is-on" : ""}>
                  {security.loading
                    ? "Loading"
                    : security.twoFactorEnabled
                      ? "Enabled"
                      : "Disabled"}
                </span>
              </div>

              <label>
                <span>Current password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={security.currentPassword}
                  disabled={security.loading || security.saving}
                  onChange={(event) =>
                    setSecurity((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                      message: "",
                      error: "",
                    }))
                  }
                  placeholder="Confirm your current password"
                />
              </label>

              <div className="security-actions">
                <button
                  type="button"
                  disabled={security.loading || security.saving}
                  onClick={updateTwoFactor}
                >
                  {security.saving
                    ? "Saving..."
                    : security.twoFactorEnabled
                      ? "Disable 2FA"
                      : "Enable 2FA"}
                </button>
              </div>

              {security.message && (
                <span className="settings-message is-success">
                  {security.message}
                </span>
              )}
              {security.error && (
                <span className="settings-message is-error">
                  {security.error}
                </span>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
