import React from "react";
import ProfileIcon from "../ProfileIcon";

export default function EmptySectionCard({
  title,
  description,
  buttonText,
  onAdd,
  onDismiss,
  isDismissible = false,
  faded = false,
}) {
  return (
    <div
      className="profile-section-card"
      style={{
        ...styles.card,
        ...(faded ? styles.fadedCard : {}),
      }}
    >
      <div style={styles.topRow}>
        <h3 className="profile-section-title" style={styles.title}>
          {title}
        </h3>

        {isDismissible && (
          <button
            type="button"
            className="profile-icon-button"
            style={styles.closeButton}
            onClick={onDismiss}
            aria-label={`Dismiss ${title}`}
          >
            <ProfileIcon name="close" size={18} />
          </button>
        )}
      </div>

      <p style={styles.description}>{description}</p>

      <button style={styles.button} onClick={onAdd}>
        {buttonText}
      </button>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 20,
  },
  fadedCard: {
    opacity: 0.72,
  },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: "var(--app-text)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    lineHeight: 1,
    color: "var(--app-muted)",
    cursor: "pointer",
    padding: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  description: {
    margin: "8px 0 16px",
    fontSize: 14,
    lineHeight: "20px",
    color: "var(--app-text-soft)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  button: {
    padding: "10px 16px",
    borderRadius: 20,
    border: "1px solid #0a66c2",
    backgroundColor: "var(--app-surface)",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
  },
};
