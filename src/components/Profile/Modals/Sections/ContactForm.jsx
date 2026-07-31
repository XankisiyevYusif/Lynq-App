import { useMemo, useState } from "react";
import api from "../../../../services/api";

const months = [
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

const normalizePhoneType = (value) => {
  const phoneTypes = { 1: "Mobile", 2: "Home", 3: "Work", 4: "Other" };
  return phoneTypes[value] || value || "";
};

export default function ContactInfoForm({ user, setUser }) {
  const contact = user?.contactInfo || {};

  const [phone, setPhone] = useState(contact.phoneNumber || "");
  const [phoneType, setPhoneType] = useState(
    normalizePhoneType(contact.phoneType),
  );
  const [address, setAddress] = useState(contact.address || "");
  const [website, setWebsite] = useState(contact.website || "");
  const [birthMonth, setBirthMonth] = useState(contact.birthMonth || "");
  const [birthDay, setBirthDay] = useState(contact.birthDay || "");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const availableDays = useMemo(() => {
    if (!birthMonth) return 31;
    return new Date(2000, Number(birthMonth), 0).getDate();
  }, [birthMonth]);

  const handleMonthChange = (value) => {
    setBirthMonth(value);
    if (
      birthDay &&
      Number(birthDay) > new Date(2000, Number(value), 0).getDate()
    ) {
      setBirthDay("");
    }
  };

  const save = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const payload = {
        phone: phone.trim() || null,
        phoneType: phoneType || null,
        address: address.trim() || null,
        website: website.trim() || null,
        birthMonth: birthMonth ? Number(birthMonth) : null,
        birthDay: birthDay ? Number(birthDay) : null,
      };

      const response = await api.put("/User/contact-info", payload);
      const updatedContact = response?.data?.data || payload;

      setUser((prev) => ({
        ...prev,
        contactInfo: {
          ...prev?.contactInfo,
          ...updatedContact,
          email: updatedContact.email || prev?.contactInfo?.email || "",
        },
      }));

      setMessage(
        response?.data?.message || "Contact information updated successfully.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.title ||
          "Failed to update contact information.",
      );
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetLink = async () => {
    const email = contact.email?.trim();
    if (!email || resetLoading) return;

    try {
      setResetLoading(true);
      setError("");
      setPasswordMessage("");
      const response = await api.post("/Auth/forgot-password", { email });
      setPasswordMessage(
        response?.data?.message ||
          "A secure password reset link was sent to your email.",
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "The password reset email could not be sent.",
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div>
      <div style={styles.title}>Edit contact information</div>

      <div style={styles.field}>
        <label style={styles.label}>Email</label>
        <input
          style={{ ...styles.input, ...styles.readOnlyInput }}
          value={contact.email || ""}
          disabled
        />
        <div style={styles.helper}>
          Email can be changed from Basic information.
        </div>
      </div>

      <section style={styles.securityCard}>
        <div style={styles.securityIcon} aria-hidden="true">↗</div>
        <div style={styles.securityCopy}>
          <strong style={styles.securityTitle}>Change password</strong>
          <p style={styles.securityText}>
            We will email <b>{contact.email || "your verified address"}</b> a
            secure 10-minute link. Open it to choose a new password.
          </p>
          {passwordMessage && (
            <div style={styles.securitySuccess}>{passwordMessage}</div>
          )}
        </div>
        <button
          type="button"
          style={styles.resetButton}
          onClick={sendPasswordResetLink}
          disabled={resetLoading || !contact.email}
        >
          {resetLoading ? "Sending..." : "Send reset link"}
        </button>
      </section>

      <div style={styles.field}>
        <label style={styles.label}>Phone number</label>
        <input
          style={styles.input}
          maxLength={30}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Phone type</label>
        <select
          style={styles.select}
          value={phoneType}
          onChange={(e) => setPhoneType(e.target.value)}
        >
          <option value="">Select phone type</option>
          <option value="Mobile">Mobile</option>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Website</label>
        <input
          style={styles.input}
          maxLength={300}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://example.com"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Address</label>
        <textarea
          style={styles.textarea}
          maxLength={220}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your address"
        />
        <div style={styles.counter}>{address.length}/220</div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Birthday</label>
        <div style={styles.birthRow}>
          <select
            style={styles.select}
            value={birthMonth}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
            <option value="">Month</option>
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
          >
            <option value="">Day</option>
            {Array.from({ length: availableDays }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div style={styles.error}>{error}</div>}
      {message && <div style={styles.success}>{message}</div>}

      <div style={styles.actions}>
        <button style={styles.saveBtn} onClick={save} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  title: { fontSize: 18, fontWeight: 700, marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid var(--app-border)",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
  },
  readOnlyInput: { backgroundColor: "var(--app-surface-2)", color: "var(--app-muted)" },
  select: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid var(--app-border)",
    padding: "0 10px",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    border: "1px solid var(--app-border)",
    padding: 10,
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
    boxSizing: "border-box",
    resize: "vertical",
  },
  counter: { textAlign: "right", fontSize: 11, color: "var(--app-muted)" },
  helper: { marginTop: 5, fontSize: 12, color: "var(--app-muted)" },
  birthRow: { display: "flex", gap: 10 },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: 20 },
  saveBtn: {
    background: "#0a66c2",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "9px 20px",
    cursor: "pointer",
    fontWeight: 600,
  },
  error: { color: "#b42318", fontSize: 13, marginTop: 10 },
  success: { color: "#067647", fontSize: 13, marginTop: 10 },
  securityCard: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: 12,
    margin: "24px 0 8px",
    padding: 15,
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    background: "var(--app-surface-2)",
  },
  securityIcon: {
    display: "grid",
    width: 34,
    height: 34,
    flex: "0 0 34px",
    placeItems: "center",
    borderRadius: 10,
    background: "var(--app-accent-soft)",
    color: "var(--app-accent)",
    fontSize: 18,
    fontWeight: 800,
  },
  securityCopy: { flex: 1, minWidth: 0 },
  securityTitle: { display: "block", color: "var(--app-text)", fontSize: 13 },
  securityText: {
    margin: "4px 0 0",
    color: "var(--app-muted)",
    fontSize: 11.5,
    lineHeight: 1.5,
  },
  securitySuccess: {
    marginTop: 8,
    color: "#15803d",
    fontSize: 11.5,
    lineHeight: 1.45,
  },
  resetButton: {
    minHeight: 36,
    flex: "0 0 auto",
    padding: "0 13px",
    border: "1px solid var(--app-accent)",
    borderRadius: 9,
    background: "transparent",
    color: "var(--app-accent)",
    cursor: "pointer",
    fontWeight: 700,
  },
};
