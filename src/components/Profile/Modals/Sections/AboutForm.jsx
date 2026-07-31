import { useState } from "react";
import api from "../../../../services/api";

const MAX_BIO_LENGTH = 1000;

export default function AboutForm({ user, setUser, onClose }) {
  const [bio, setBio] = useState(user?.about?.bio || "");
  const [originalBio, setOriginalBio] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleImproveBio = async () => {
    const text = bio.trim();

    if (!text || isImproving || isSaving) return;

    try {
      setError("");
      setMessage("");
      setIsImproving(true);

      const response = await api.post("/Ai/improve-bio", { text });
      const result = response?.data;

      if (result?.success === false) {
        throw new Error(result?.message || "Bio could not be improved.");
      }

      const improvedText =
        result?.data?.improvedText || result?.improvedText || "";

      if (!improvedText.trim()) {
        throw new Error("AI returned an empty result. Please try again.");
      }

      // İlk istifadəçinin yazdığı variant saxlanır. AI düyməsinə bir neçə dəfə
      // basılsa belə, "Restore original" həmişə həmin ilkin versiyaya qaytarır.
      if (originalBio === null) {
        setOriginalBio(bio);
      }

      setBio(improvedText.trim().slice(0, MAX_BIO_LENGTH));
      setMessage("Bio was improved. Review it before saving.");
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Bio could not be improved right now.";

      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : "Bio could not be improved right now.",
      );
    } finally {
      setIsImproving(false);
    }
  };

  const restoreOriginal = () => {
    if (originalBio === null || isSaving) return;

    setBio(originalBio);
    setOriginalBio(null);
    setError("");
    setMessage("Original bio restored.");
  };

  const save = async () => {
    try {
      setError("");
      setMessage("");
      setIsSaving(true);

      const bioValue = bio.trim();
      const response = await api.put("/User/about", {
        bio: bioValue || null,
      });

      const result = response?.data;

      if (result?.success === false) {
        throw new Error(result?.message || "About section could not be saved.");
      }

      const data = result?.data || result || {};
      const savedBio = data?.bio ?? (bioValue || null);

      setUser((previousUser) => ({
        ...previousUser,
        about: {
          ...previousUser?.about,
          bio: savedBio,
        },
      }));

      onClose?.();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "About section could not be saved.";

      setError(
        typeof serverMessage === "string"
          ? serverMessage
          : "About section could not be saved.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>About</div>
      <div style={styles.helper}>
        Write a short professional introduction about yourself.
      </div>

      <div style={styles.field}>
        <label style={styles.label} htmlFor="about-bio">
          Bio
        </label>

        <div style={styles.textareaWrapper}>
          <textarea
            id="about-bio"
            style={styles.textarea}
            value={bio}
            maxLength={MAX_BIO_LENGTH}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a short introduction about yourself..."
            disabled={isSaving}
          />

          <button
            type="button"
            style={{
              ...styles.aiButton,
              ...(isImproving || isSaving || !bio.trim()
                ? styles.aiButtonDisabled
                : null),
            }}
            onClick={handleImproveBio}
            disabled={isImproving || isSaving || !bio.trim()}
            title="Make bio professional with AI"
            aria-label="Make bio professional with AI"
          >
            {isImproving ? "…" : "✦"}
          </button>
        </div>

        <div style={styles.metaRow}>
          <span style={styles.counter}>
            {bio.length}/{MAX_BIO_LENGTH}
          </span>

          {originalBio !== null && (
            <button
              type="button"
              style={styles.restoreButton}
              onClick={restoreOriginal}
              disabled={isSaving}
            >
              ↶ Restore original
            </button>
          )}
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.cancelButton}
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </button>
        <button
          type="button"
          style={{
            ...styles.saveButton,
            ...(isSaving ? styles.saveButtonDisabled : null),
          }}
          onClick={save}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    color: "var(--app-muted)",
    marginBottom: 18,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
  },
  textareaWrapper: {
    position: "relative",
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    resize: "vertical",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.25)",
    padding: "12px 52px 12px 12px",
    outline: "none",
    fontSize: 14,
    fontFamily: "inherit",
    lineHeight: 1.5,
    boxSizing: "border-box",
  },
  aiButton: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 32,
    height: 32,
    border: "1px solid rgba(10, 102, 194, 0.24)",
    borderRadius: 8,
    background: "#eef6ff",
    color: "#0a66c2",
    cursor: "pointer",
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1,
    display: "grid",
    placeItems: "center",
  },
  aiButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.55,
  },
  metaRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 6,
    minHeight: 22,
  },
  counter: {
    fontSize: 11,
    color: "var(--app-muted)",
  },
  restoreButton: {
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontSize: 12,
    fontWeight: 600,
    padding: 0,
    cursor: "pointer",
  },
  error: {
    color: "#b00020",
    fontSize: 13,
    marginBottom: 12,
  },
  success: {
    color: "#0a7a33",
    fontSize: 13,
    marginBottom: 12,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    border: "1px solid rgba(0,0,0,0.18)",
    background: "var(--app-surface)",
    color: "var(--app-text)",
    borderRadius: 20,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveButton: {
    background: "#0073b1",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  saveButtonDisabled: {
    cursor: "not-allowed",
    opacity: 0.65,
  },
};
