import { createPortal } from "react-dom";
import ProfileIcon from "./ProfileIcon";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const displayPhoneType = (value) => {
  const phoneTypes = { 1: "Mobile", 2: "Home", 3: "Work", 4: "Other" };
  return phoneTypes[value] || value || "";
};

export default function ContactInfoModal({ contactInfo, onClose }) {
  const contact = contactInfo || {};
  const hasContactInfo = Boolean(
    contact.email ||
      contact.phoneNumber ||
      contact.website ||
      contact.address ||
      contact.birthMonth ||
      contact.birthDay,
  );

  const websiteHref = contact.website
    ? /^https?:\/\//i.test(contact.website)
      ? contact.website
      : `https://${contact.website}`
    : "";

  const birthday = contact.birthMonth
    ? `${monthNames[Number(contact.birthMonth) - 1] || ""}${
        contact.birthDay ? ` ${contact.birthDay}` : ""
      }`
    : "";

  return createPortal(
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Contact information</h2>
          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close contact information"
          >
            <ProfileIcon name="close" size={19} />
          </button>
        </div>

        {!hasContactInfo ? (
          <div style={styles.empty}>No contact information has been added.</div>
        ) : (
          <div style={styles.list}>
            {contact.email && (
              <ContactRow label="Email">
                <a style={styles.link} href={`mailto:${contact.email}`}>
                  {contact.email}
                </a>
              </ContactRow>
            )}

            {contact.phoneNumber && (
              <ContactRow label="Phone">
                <a style={styles.link} href={`tel:${contact.phoneNumber}`}>
                  {contact.phoneNumber}
                </a>
                {contact.phoneType && (
                  <span style={styles.muted}>
                    {` · ${displayPhoneType(contact.phoneType)}`}
                  </span>
                )}
              </ContactRow>
            )}

            {contact.website && (
              <ContactRow label="Website">
                <a
                  style={styles.link}
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  {contact.website}
                </a>
              </ContactRow>
            )}

            {contact.address && (
              <ContactRow label="Address">{contact.address}</ContactRow>
            )}

            {birthday && <ContactRow label="Birthday">{birthday}</ContactRow>}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function ContactRow({ label, children }) {
  return (
    <div style={styles.row}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{children}</div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 2000,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "85vh",
    overflowY: "auto",
    backgroundColor: "var(--app-surface)",
    borderRadius: 14,
    boxShadow: "0 18px 50px rgba(0,0,0,0.22)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 22px",
    borderBottom: "1px solid var(--app-border)",
  },
  title: { margin: 0, fontSize: 20, color: "var(--app-text)" },
  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    color: "var(--app-text-soft)",
    width: 36,
    height: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  list: { padding: "8px 22px 22px" },
  row: { padding: "14px 0", borderBottom: "1px solid var(--app-border)" },
  label: { marginBottom: 5, fontSize: 13, fontWeight: 600, color: "var(--app-muted)" },
  value: {
    fontSize: 15,
    lineHeight: 1.45,
    color: "var(--app-text)",
    wordBreak: "break-word",
  },
  link: { color: "#0a66c2", textDecoration: "none" },
  muted: { color: "var(--app-muted)" },
  empty: { padding: 24, color: "var(--app-muted)", fontSize: 14 },
};
