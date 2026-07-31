import { useEffect, useState } from "react";
import api from "../../services/api";
import "./ProfileSafetyModals.css";

const profileReasons = [
  { value: "Fake profile", label: "Fake profile", help: "This person may be pretending to be someone else." },
  { value: "Harassment", label: "Harassment or bullying", help: "This person is targeting or intimidating someone." },
  { value: "Spam", label: "Spam or scam", help: "This profile sends unwanted or deceptive content." },
  { value: "Inappropriate content", label: "Inappropriate content", help: "The profile contains offensive or unsafe material." },
  { value: "Other", label: "Something else", help: "Describe an issue that is not listed above." },
];

function ModalShell({ children, onClose, labelledBy }) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
    };
  }, [onClose]);

  return (
    <div className="profile-safety-backdrop" onMouseDown={onClose} role="presentation">
      <section
        className="profile-safety-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  );
}

export function ReportProfileModal({
  username,
  targetLabel,
  targetKind = "profile",
  onClose,
  showToast,
}) {
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = profileReasons.find((item) => item.value === category);
  const detailsRequired = category === "Other";
  const isCompany = targetKind === "company";
  const safeTargetLabel = targetLabel || `@${username}`;

  const submit = async (event) => {
    event.preventDefault();
    if (!category) {
      showToast?.("Choose a reason for reporting this profile.", "error");
      return;
    }
    if (detailsRequired && !details.trim()) {
      showToast?.("Please briefly explain the issue.", "error");
      return;
    }

    try {
      setSaving(true);
      await api.post(`/Reports/profile/${encodeURIComponent(username)}`, {
        category,
        details: details.trim() || null,
      });
      showToast?.(
        `${isCompany ? "Company" : "Profile"} report submitted for review.`,
        "success",
      );
      onClose();
    } catch (error) {
      showToast?.(error.response?.data?.message || "The profile could not be reported.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} labelledBy="report-profile-title">
      <form onSubmit={submit}>
        <header className="profile-safety-header">
          <span className="profile-safety-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 4.5 6v5.3c0 4.5 2.8 7.9 7.5 9.7 4.7-1.8 7.5-5.2 7.5-9.7V6L12 3Z" />
              <path d="M12 8v5M12 16.4h.01" />
            </svg>
          </span>
          <div>
            <span className="profile-safety-eyebrow">Trust &amp; safety</span>
            <h2 id="report-profile-title">
              Report {isCompany ? "company" : "profile"}
            </h2>
            <p>
              Tell us what is wrong with <strong>{safeTargetLabel}</strong>.
              Reports are confidential and reviewed by moderators.
            </p>
          </div>
          <button type="button" className="profile-safety-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="profile-safety-notice">
          <span aria-hidden="true">✓</span>
          <p>
            The reported account will not see who submitted this report.
          </p>
        </div>

        <div className="profile-report-options">
          {profileReasons.map((reason) => (
            <label key={reason.value} className={category === reason.value ? "is-selected" : ""}>
              <input
                type="radio"
                name="profile-report-reason"
                value={reason.value}
                checked={category === reason.value}
                onChange={() => setCategory(reason.value)}
              />
              <span><strong>{reason.label}</strong><small>{reason.help}</small></span>
            </label>
          ))}
        </div>

        {category && (
          <label className="profile-report-details">
            <span>{detailsRequired ? "Describe the issue *" : "Additional details (optional)"}</span>
            <textarea
              maxLength="500"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={selected?.help}
              required={detailsRequired}
            />
            <small>{details.length}/500</small>
          </label>
        )}

        <footer className="profile-safety-actions">
          <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="is-danger" disabled={saving || !category}>
            {saving ? "Submitting..." : "Submit report"}
          </button>
        </footer>
      </form>
    </ModalShell>
  );
}

export function BlockUserModal({ username, onClose, onConfirm, saving = false }) {
  return (
    <ModalShell onClose={onClose} labelledBy="block-user-title">
      <header className="profile-safety-header">
        <span className="profile-safety-icon is-block" aria-hidden="true">×</span>
        <div>
          <h2 id="block-user-title">Block @{username}?</h2>
          <p>They will not be notified that you blocked them.</p>
        </div>
        <button type="button" className="profile-safety-close" onClick={onClose} aria-label="Close">×</button>
      </header>
      <ul className="profile-block-effects">
        <li>You will no longer be connected.</li>
        <li>You will not see each other’s posts or profiles.</li>
        <li>You can unblock this person later from Settings → Blocked users.</li>
      </ul>
      <footer className="profile-safety-actions">
        <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="button" className="is-danger" onClick={onConfirm} disabled={saving}>
          {saving ? "Blocking..." : "Block user"}
        </button>
      </footer>
    </ModalShell>
  );
}
