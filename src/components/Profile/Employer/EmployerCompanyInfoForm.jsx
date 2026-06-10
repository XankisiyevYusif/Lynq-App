import { useState } from "react";
import api from "../../../services/api";

export default function EmployerCompanyInfoForm({
  user,
  setUser,
  onClose,
  showToast,
}) {
  const basic = user?.basicInfo || {};
  const company = user?.companyInfo || {};

  const [name, setName] = useState(company.name || basic.fullName || "");
  const [username, setUsername] = useState(basic.username || "");
  const [tagline, setTagline] = useState(company.tagline || "");
  const [industry, setIndustry] = useState(company.industry || "");
  const [location, setLocation] = useState(company.location || basic.location || "");
  const [bio, setBio] = useState(company.bio || user?.about?.bio || "");
  const [companySize, setCompanySize] = useState(company.companySize || "");
  const [foundedYear, setFoundedYear] = useState(
    company.foundedYear ? String(company.foundedYear) : ""
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      setError("");

      const nameValue = name.trim();
      const usernameValue = username.trim();
      const taglineValue = tagline.trim();
      const industryValue = industry.trim();
      const locationValue = location.trim();
      const bioValue = bio.trim();
      const companySizeValue = companySize.trim();
      const foundedValue = foundedYear.trim();

      if (!nameValue) {
        setError("Company name is required.");
        return;
      }

      if (nameValue.length > 150) {
        setError("Company name cannot exceed 150 characters.");
        return;
      }

      if (!usernameValue) {
        setError("Username is required.");
        return;
      }

      if (usernameValue.length < 3) {
        setError("Username must be at least 3 characters.");
        return;
      }

      if (usernameValue.length > 30) {
        setError("Username cannot exceed 30 characters.");
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      if (!usernameRegex.test(usernameValue)) {
        setError("Username can only contain letters, numbers, dots and underscores.");
        return;
      }

      if (taglineValue.length > 120) {
        setError("Tagline cannot exceed 120 characters.");
        return;
      }

      if (industryValue.length > 100) {
        setError("Industry cannot exceed 100 characters.");
        return;
      }

      if (locationValue.length > 150) {
        setError("Headquarters cannot exceed 150 characters.");
        return;
      }

      if (bioValue.length > 1000) {
        setError("Overview cannot exceed 1000 characters.");
        return;
      }

      if (companySizeValue.length > 50) {
        setError("Company size cannot exceed 50 characters.");
        return;
      }

      let foundedNumber = null;

      if (foundedValue) {
        foundedNumber = Number(foundedValue);
        const currentYear = new Date().getFullYear();

        if (!Number.isInteger(foundedNumber)) {
          setError("Founded year must be a number.");
          return;
        }

        if (foundedNumber < 1800 || foundedNumber > currentYear) {
          setError(`Founded year must be between 1800 and ${currentYear}.`);
          return;
        }
      }

      setLoading(true);

      const payload = {
        name: nameValue,
        username: usernameValue,
        tagline: taglineValue || null,
        industry: industryValue || null,
        location: locationValue || null,
        bio: bioValue || null,
        companySize: companySizeValue || null,
        foundedYear: foundedNumber,
      };

      const res = await api.put("/User/employer/company-info", payload);
      const result = res?.data;

      if (result?.success === false) {
        throw new Error(result?.message || "Update failed.");
      }

      const data = result?.data || result;

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          ...(data?.basicInfo || {}),
        },
        about: {
          ...prev.about,
          ...(data?.about || { bio: bioValue || null }),
        },
        companyInfo: {
          ...prev.companyInfo,
          ...(data?.companyInfo || {}),
        },
      }));

      showToast?.(
        result?.message || "Company information updated successfully.",
        "success"
      );

      onClose?.();
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
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
      <div style={styles.helper}>* Required fields</div>
      <div style={styles.title}>Company information</div>

      {error && <div style={styles.error}>{error}</div>}

      <Field label="Company name*" value={name} setValue={setName} max={150} />
      <Field label="Username*" value={username} setValue={setUsername} max={30} />
      <Field
        label="Tagline"
        value={tagline}
        setValue={setTagline}
        max={120}
        placeholder="Short company headline"
      />
      <Field label="Industry" value={industry} setValue={setIndustry} max={100} />
      <Field
        label="Headquarters"
        value={location}
        setValue={setLocation}
        max={150}
      />
      <Field
        label="Company size"
        value={companySize}
        setValue={setCompanySize}
        max={50}
        placeholder="Example: 51-200 employees"
      />

      <div style={styles.field}>
        <label style={styles.label}>Founded</label>
        <input
          style={styles.input}
          value={foundedYear}
          onChange={(e) => setFoundedYear(e.target.value)}
          placeholder="Example: 2016"
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Overview</label>
        <textarea
          style={styles.textarea}
          value={bio}
          maxLength={1000}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Write a short overview about your company..."
        />
        <div style={styles.textareaCounter}>{bio.length}/1000</div>
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

function Field({ label, value, setValue, max, placeholder }) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrapper}>
        <input
          style={styles.input}
          value={value}
          maxLength={max}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
        />
        <span style={styles.counter}>{value.length}/{max}</span>
      </div>
    </div>
  );
}

const styles = {
  helper: {
    fontSize: 12,
    color: "#777",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 650,
    marginBottom: 20,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    display: "block",
    color: "#333",
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.25)",
    padding: "0 58px 0 12px",
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
  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.25)",
    padding: 10,
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  textareaCounter: {
    textAlign: "right",
    fontSize: 11,
    color: "#777",
    marginTop: 4,
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
};