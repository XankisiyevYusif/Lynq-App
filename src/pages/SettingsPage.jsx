import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import ProfileIcon from "../components/Profile/ProfileIcon";
import defaultAvatar from "../assets/default-avatar.png";
import { useTheme } from "../context/ThemeContext";
import { resolveMediaUrl } from "../utils/mediaUrl";
import api from "../services/api";
import "./SettingsPage.css";
import "./SettingsExtras.css";

const choices = [
  { value: "light", title: "Light", description: "Use Nexora with a bright appearance." },
  { value: "dark", title: "Dark", description: "Reduce brightness with a dark interface." },
  { value: "system", title: "System", description: "Match your device appearance automatically." },
];

const sections = {
  appearance: ["Display preferences", "Appearance", "Choose how Nexora looks on this device."],
  security: ["Account protection", "Sign-in & security", "Require a verification code only when two-factor authentication is enabled."],
  blocked: ["Privacy controls", "Blocked users", "Review and unblock accounts you have blocked."],
};

export default function SettingsPage() {
  const { mode, setMode } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section") || "appearance";
  const activeSection = sections[requestedSection] ? requestedSection : "appearance";
  const setActiveSection = (section) => {
    const next = new URLSearchParams(searchParams);
    if (section === "appearance") next.delete("section");
    else next.set("section", section);
    setSearchParams(next, { replace: true });
  };
  const [security, setSecurity] = useState({
    loading: true, saving: false, twoFactorEnabled: false, email: "",
    currentPassword: "", message: "", error: "",
  });
  const [blocked, setBlocked] = useState({
    loading: false, loaded: false, items: [], busy: "", error: "", message: "",
  });
  const [unblockTarget, setUnblockTarget] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/User/security").then((response) => {
      if (!active) return;
      const data = response.data?.data || response.data || {};
      setSecurity((current) => ({
        ...current,
        loading: false,
        twoFactorEnabled: data.twoFactorEnabled ?? data.TwoFactorEnabled ?? false,
        email: data.email || data.Email || "",
      }));
    }).catch(() => active && setSecurity((current) => ({
      ...current, loading: false, error: "Security settings could not be loaded.",
    })));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (activeSection !== "blocked" || blocked.loaded || blocked.loading) return;
    let active = true;
    setBlocked((current) => ({ ...current, loading: true, error: "" }));
    api.get("/privacy/blocked-users").then((response) => {
      if (!active) return;
      const data = response.data?.data || response.data || [];
      setBlocked({
        loading: false, loaded: true, items: Array.isArray(data) ? data : [],
        busy: "", error: "", message: "",
      });
    }).catch(() => active && setBlocked((current) => ({
      ...current, loading: false, loaded: true, error: "Blocked users could not be loaded.",
    })));
    return () => { active = false; };
  }, [activeSection, blocked.loaded]);

  const updateTwoFactor = async () => {
    if (!security.currentPassword.trim()) {
      setSecurity((current) => ({
        ...current, message: "", error: "Enter your current password to continue.",
      }));
      return;
    }
    const enabled = !security.twoFactorEnabled;
    setSecurity((current) => ({ ...current, saving: true, message: "", error: "" }));
    try {
      const response = await api.put("/User/security/two-factor", {
        enabled, currentPassword: security.currentPassword,
      });
      const data = response.data?.data || response.data || {};
      setSecurity((current) => ({
        ...current,
        saving: false,
        currentPassword: "",
        twoFactorEnabled: data.twoFactorEnabled ?? data.TwoFactorEnabled ?? enabled,
        message: data.message || data.Message ||
          (enabled ? "Two-factor authentication is enabled." : "Two-factor authentication is disabled."),
      }));
    } catch (requestError) {
      const data = requestError?.response?.data;
      setSecurity((current) => ({
        ...current,
        saving: false,
        error: data?.message || data?.Message ||
          (typeof data === "string" ? data : null) ||
          "Two-factor authentication could not be updated.",
      }));
    }
  };

  const unblock = async (username) => {
    if (!username) return;
    setBlocked((current) => ({ ...current, busy: username, error: "", message: "" }));
    try {
      await api.delete(`/privacy/block/${encodeURIComponent(username)}`);
      setBlocked((current) => ({
        ...current,
        busy: "",
        items: current.items.filter((item) => (item.userName || item.UserName) !== username),
        message: `@${username} was unblocked.`,
      }));
      setUnblockTarget(null);
    } catch (requestError) {
      setBlocked((current) => ({
        ...current, busy: "",
        error: requestError?.response?.data?.message || "This account could not be unblocked.",
      }));
    }
  };

  const [eyebrow, title, description] = sections[activeSection];
  return (
    <>
      <Navbar />
      <div className="settings-page">
        <aside className="settings-sidebar">
          <span>Settings</span>
          <button type="button" className={activeSection === "appearance" ? "is-active" : ""} onClick={() => setActiveSection("appearance")}><ProfileIcon name="activity" size={18} />Appearance</button>
          <button type="button" className={activeSection === "security" ? "is-active" : ""} onClick={() => setActiveSection("security")}><ProfileIcon name="lock" size={18} />Sign-in & security</button>
          <button type="button" className={activeSection === "blocked" ? "is-active" : ""} onClick={() => setActiveSection("blocked")}><ProfileIcon name="users" size={18} />Blocked users</button>
        </aside>
        <main className="settings-main">
          <header><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></header>
          {activeSection === "appearance" && (
            <section className="settings-card"><h2>Theme</h2><div className="theme-options">
              {choices.map((choice) => (
                <button key={choice.value} type="button" className={mode === choice.value ? "is-selected" : ""} onClick={() => setMode(choice.value)}>
                  <span className={`theme-preview ${choice.value}`}><i /><i /><i /></span>
                  <span><strong>{choice.title}</strong><small>{choice.description}</small></span><b>{mode === choice.value ? "✓" : ""}</b>
                </button>
              ))}
            </div></section>
          )}
          {activeSection === "security" && (
            <section className="settings-card security-card">
              <div className="security-status"><div><h2>Two-factor authentication</h2><p>When enabled, Nexora requests a one-time email code after password or Google sign-in. When disabled, no code is requested.</p></div>
                <span className={security.twoFactorEnabled ? "is-on" : ""}>{security.loading ? "Loading" : security.twoFactorEnabled ? "Enabled" : "Disabled"}</span>
              </div>
              <label><span>Current password</span><input type="password" autoComplete="current-password" value={security.currentPassword} disabled={security.loading || security.saving} onChange={(event) => setSecurity((current) => ({ ...current, currentPassword: event.target.value, message: "", error: "" }))} placeholder="Confirm your current password" /></label>
              <div className="security-actions"><button type="button" disabled={security.loading || security.saving} onClick={updateTwoFactor}>{security.saving ? "Saving..." : security.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}</button></div>
              {security.message && <span className="settings-message is-success">{security.message}</span>}
              {security.error && <span className="settings-message is-error">{security.error}</span>}
            </section>
          )}
          {activeSection === "blocked" && (
            <section className="settings-card blocked-users-card">
              <div className="blocked-users-heading"><div><h2>Blocked accounts</h2><p>Blocked accounts cannot connect with, follow or contact you.</p></div><strong>{blocked.items.length}</strong></div>
              {blocked.loading ? <div className="blocked-users-state">Loading blocked users...</div> : blocked.items.length === 0 ? (
                <div className="blocked-users-state"><ProfileIcon name="user" size={28} /><strong>No blocked users</strong><span>Accounts you block will appear here.</span></div>
              ) : (
                <div className="blocked-users-list">{blocked.items.map((item) => {
                  const username = item.userName || item.UserName;
                  return <article key={username}><img src={resolveMediaUrl(item.profileImage || item.ProfileImage, defaultAvatar)} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} /><span><strong>{item.fullName || item.FullName || username}</strong><small>@{username}</small></span><button type="button" disabled={blocked.busy === username} onClick={() => setUnblockTarget(item)}>{blocked.busy === username ? "Unblocking..." : "Unblock"}</button></article>;
                })}</div>
              )}
              {blocked.message && <span className="settings-message is-success">{blocked.message}</span>}
              {blocked.error && <span className="settings-message is-error">{blocked.error}</span>}
            </section>
          )}
        </main>
      </div>
      {unblockTarget && (
        <div className="settings-confirm-overlay" onMouseDown={(event) => event.target === event.currentTarget && !blocked.busy && setUnblockTarget(null)}>
          <section className="settings-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="unblock-title">
            <button type="button" className="settings-confirm-close" onClick={() => setUnblockTarget(null)} disabled={!!blocked.busy}>×</button>
            <span className="settings-confirm-icon" aria-hidden="true">?</span>
            <h2 id="unblock-title">Unblock this account?</h2>
            <p>You are about to unblock <strong>@{unblockTarget.userName || unblockTarget.UserName}</strong>. They may find your profile and interact with you again.</p>
            <footer><button type="button" onClick={() => setUnblockTarget(null)} disabled={!!blocked.busy}>Cancel</button><button type="button" className="is-primary" onClick={() => unblock(unblockTarget.userName || unblockTarget.UserName)} disabled={!!blocked.busy}>{blocked.busy ? "Unblocking..." : "Yes, unblock"}</button></footer>
          </section>
        </div>
      )}
    </>
  );
}
