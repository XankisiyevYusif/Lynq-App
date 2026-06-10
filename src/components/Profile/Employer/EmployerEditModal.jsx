import React, { useEffect } from "react";
import EmployerCompanyInfoForm from "./EmployerCompanyInfoForm";
import EmployerContactInfoForm from "./EmployerContactInfoForm";

export default function EmployerEditModal({
  isOpen,
  onClose,
  activeSection,
  onChangeSection,
  user,
  setUser,
  showToast,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { key: "company", label: "Company information" },
    { key: "contact", label: "Contact information" },
  ];

  return (
    <div style={s.overlay} onMouseDown={onClose}>
      <div style={s.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={s.header}>
          <div style={s.title}>Edit company profile</div>

          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={s.content}>
          <div style={s.left}>
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => onChangeSection?.(item.key)}
                style={{
                  ...s.menuItem,
                  ...(activeSection === item.key ? s.menuActive : null),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div style={s.right}>
            {activeSection === "company" && (
              <EmployerCompanyInfoForm
                user={user}
                setUser={setUser}
                onClose={onClose}
                showToast={showToast}
              />
            )}

            {activeSection === "contact" && (
              <EmployerContactInfoForm
                user={user}
                setUser={setUser}
                onClose={onClose}
                showToast={showToast}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: 900,
    background: "#fff",
    borderRadius: 14,
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    overflow: "hidden",
    maxHeight: "90vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    padding: 6,
    borderRadius: 10,
  },
  content: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    minHeight: 420,
  },
  left: {
    borderRight: "1px solid rgba(0,0,0,0.08)",
    padding: 12,
    background: "rgba(0,0,0,0.015)",
  },
  menuItem: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 8,
  },
  menuActive: {
    background: "rgba(0,115,177,0.08)",
    border: "1px solid rgba(0,115,177,0.25)",
    fontWeight: 700,
    color: "#006097",
  },
  right: {
    padding: 16,
    maxHeight: "calc(85vh - 56px)",
    overflowY: "auto",
  },
};