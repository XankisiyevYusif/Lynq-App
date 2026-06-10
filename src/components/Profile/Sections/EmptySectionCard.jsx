import React from "react";

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
      style={{
        ...styles.card,
        ...(faded ? styles.fadedCard : {}),
      }}
    >
      <div style={styles.topRow}>
        <h3 style={styles.title}>{title}</h3>

        {isDismissible && (
          <button style={styles.closeButton} onClick={onDismiss}>
            ×
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
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
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
    color: "#1d2226",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    lineHeight: 1,
    color: "#666",
    cursor: "pointer",
    padding: 0,
  },
  description: {
    margin: "8px 0 16px",
    fontSize: 14,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.75)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  button: {
    padding: "10px 16px",
    borderRadius: 20,
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
  },
};