import React, { useEffect } from "react";

export default function Toast({
  message,
  type = "success",
  duration = 3000,
  onClose,
}) {
  useEffect(() => {
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: type === "success" ? "#4CAF50" : "#F44336",
        color: "#fff",
        padding: "12px 18px",
        borderRadius: "12px",
        fontSize: "14px",
        fontWeight: 500,
        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
        zIndex: 10000,
        minWidth: "260px",
        maxWidth: "520px",
        width: "max-content",
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}