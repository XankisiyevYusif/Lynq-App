import { useState } from "react";

export default function CommentInput({ onSend }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);      // ⬅️ SignalR burdan çağırılır
    setText("");       // ⬅️ input təmizlənir
  };

  return (
    <div style={styles.wrapper}>
      <input
        type="text"
        placeholder="Write a comment..."
        style={styles.input}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
      <button style={styles.button} onClick={handleSend}>
        Post
      </button>
    </div>
  );
}

/* ===============================
   🎨 STYLES
=============================== */
const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderTop: "1px solid #eee",
    gap: "10px",
  },
  input: {
    flex: 1,
    padding: "10px 14px",
    fontSize: "14px",
    borderRadius: "20px",
    border: "1px solid #ccc",
    outline: "none",
  },
  button: {
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#0a66c2",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontWeight: "600",
  },
};
