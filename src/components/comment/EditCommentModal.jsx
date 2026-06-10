import { useEffect, useState } from "react";

export default function EditCommentModal({
  isOpen,
  initialText,
  onClose,
  onSave,
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (isOpen) {
      setText(initialText ?? "");
    }
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={styles.title}>Edit comment</h3>

        <textarea
          style={styles.textarea}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />

        <div style={styles.actions}>
          <button style={styles.cancel} onClick={onClose}>
            Cancel
          </button>

          <button
            style={styles.save}
            disabled={!text.trim()}
            onClick={() => onSave(text.trim())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   🎨 MODAL STYLES
=============================== */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: "420px",
    background: "#fff",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  title: {
    margin: "0 0 10px",
    fontSize: "16px",
    fontWeight: 600,
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    resize: "none",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    outline: "none",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
  },
  cancel: {
    background: "transparent",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    color: "#6b7280",
  },
  save: {
    background: "#0a66c2",
    color: "#fff",
    border: "none",
    padding: "6px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    cursor: "pointer",
    fontWeight: 600,
  },
};
