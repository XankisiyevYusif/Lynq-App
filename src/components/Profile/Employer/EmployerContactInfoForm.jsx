import { useState } from "react";
import api from "../../../services/api";

export default function EmployerContactInfoForm({ user, setUser, onClose, showToast }) {
  const contact = user?.contactInfo || {};
  const company = user?.companyInfo || {};

  const [website, setWebsite] = useState(company.website || contact.website || "");
  const [email, setEmail] = useState(contact.email || "");
  const [phoneNumber, setPhoneNumber] = useState(contact.phoneNumber || "");
  const [changeEmail, setChangeEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      setError("");
      setMessage("");

      const websiteValue = website.trim();
      const emailValue = email.trim();
      const phoneValue = phoneNumber.trim();

      if (websiteValue.length > 300) {
        setError("Website cannot exceed 300 characters.");
        return;
      }

      if (phoneValue.length > 30) {
        setError("Phone number cannot exceed 30 characters.");
        return;
      }

      if (changeEmail) {
        if (!emailValue) {
          setError("Email is required.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          setError("Email format is invalid.");
          return;
        }

        if (!currentPassword.trim()) {
          setError("Password is required to change email.");
          return;
        }
      }

      setLoading(true);

    const payload = {
      website: websiteValue || null,
      phoneNumber: phoneValue || null,
      changeEmail: changeEmail,
    };

    if (changeEmail) {
      payload.email = emailValue;
      payload.currentPassword = currentPassword.trim();
    }

      const res = await api.put("/User/employer/contact-info", payload);
      const result = res?.data;

      if (result?.success === false) {
         throw new Error(result?.message || "Update failed.");
       }
      const data = result?.data || result;

      setUser((prev) => ({
        ...prev,
        contactInfo: {
          ...prev.contactInfo,
          ...(data?.contactInfo || {}),
        },
        companyInfo: {
          ...prev.companyInfo,
          ...(data?.companyInfo || {}),
        },
      }));

      showToast?.(
          result?.message || "Contact information updated successfully.",
          "success"
        );

       onClose?.();
      setCurrentPassword("");

      if (changeEmail) {
        setChangeEmail(false);
      }

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data ||
        "Update failed.";

     const finalMessage =
     typeof serverMessage === "string" ? serverMessage : "Update failed.";

        setError(finalMessage);
        showToast?.(finalMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.title}>Contact information</div>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <div style={styles.field}>
        <label style={styles.label}>Website</label>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={website}
            maxLength={300}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Example: https://company.com"
          />
          <span style={styles.counter}>{website.length}/300</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Email</label>

        {!changeEmail ? (
          <div style={styles.emailRow}>
            <a href={`mailto:${email}`} style={styles.link}>
              {email || "Not provided"}
            </a>

            <button
              type="button"
              style={styles.changeBtn}
              onClick={() => setChangeEmail(true)}
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email"
            />

            <input
              style={{ ...styles.input, marginTop: 10 }}
              value={currentPassword}
              type="password"
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />

            <button
              type="button"
              style={styles.cancelEmailBtn}
              onClick={() => {
                setChangeEmail(false);
                setEmail(contact.email || "");
                setCurrentPassword("");
              }}
            >
              Cancel email change
            </button>
          </>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Phone number</label>
        <input
          style={styles.input}
          value={phoneNumber}
          maxLength={30}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Example: +994..."
        />
      </div>

      <div style={styles.actions}>
        <button style={styles.cancelBtn} onClick={onClose} disabled={loading}>
          Cancel
        </button>

        <button style={styles.saveBtn} onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.25)",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  counter: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 11,
    color: "#777",
  },
  emailRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  link: {
    color: "#0a66c2",
    fontWeight: 600,
    textDecoration: "none",
  },
  changeBtn: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    padding: "6px 14px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 600,
  },
  cancelEmailBtn: {
    marginTop: 10,
    border: "none",
    backgroundColor: "transparent",
    color: "#666",
    cursor: "pointer",
    fontWeight: 600,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    border: "1px solid #999",
    backgroundColor: "#fff",
    color: "#555",
    padding: "8px 16px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 600,
  },
  saveBtn: {
    border: "none",
    backgroundColor: "#0a66c2",
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 600,
  },
  error: {
    backgroundColor: "#fdecea",
    color: "#b00020",
    padding: "9px 12px",
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
  },
  success: {
    backgroundColor: "#e8f5e9",
    color: "#1b5e20",
    padding: "9px 12px",
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 13,
  },
};