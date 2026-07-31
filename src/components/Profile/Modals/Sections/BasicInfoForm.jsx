import { useState } from "react";
import api from "../../../../services/api";
import ProfileLookupInput from "../../../UI/ProfileLookupInput";

export default function BasicInfoForm({ user, setUser, onClose }) {
  const nameParts = user?.basicInfo?.fullName?.split(" ") || [];

  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [currentPosition, setCurrentPosition] = useState(
    user?.basicInfo?.currentPosition || "",
  );
  const [location, setLocation] = useState(user?.basicInfo?.location || "");
  const [newUsername, setNewUsername] = useState(
    user?.basicInfo?.username || "",
  );

  const [changeEmail, setChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.contactInfo?.email || "");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    try {
      setError("");
      setMessage("");

      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const usernameValue = newUsername.trim().toLowerCase();
      const currentPositionValue = currentPosition.trim();
      const locationValue = location.trim();
      const emailValue = newEmail.trim();

      if (!firstName.trim()) {
        setError("First name is required.");
        return;
      }

      if (!lastName.trim()) {
        setError("Last name is required.");
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
        setError("Username can be maximum 30 characters.");
        return;
      }

      const usernameRegex =
        /^(?![._])(?!.*[._]{2})[a-z0-9]+(?:[._][a-z0-9]+)*$/;
      if (!usernameRegex.test(usernameValue)) {
        setError(
          "Username can only contain lowercase letters, numbers, dots and underscores.",
        );
        return;
      }

      const payload = {
        fullName,
        currentPosition: currentPositionValue || null,
        username: usernameValue,
        location: locationValue || null,
      };

      if (changeEmail) {
        if (!emailValue) {
          setError("Enter a new email address.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          setError("Enter a valid email address.");
          return;
        }

        if (!password.trim()) {
          setError("Enter your password to change the email address.");
          return;
        }

        payload.email = emailValue;
        payload.currentPassword = password.trim();
      }

      setLoading(true);

      const response = await api.put("/user/basic-info", payload);

      const result = response?.data;
      const responseData = result?.data || result;

      const updatedBasicInfo = responseData?.basicInfo ||
        responseData || {
          fullName,
          currentPosition: currentPositionValue || null,
          username: usernameValue,
          location: locationValue || null,
        };

      const updatedEmail =
        responseData?.email ||
        (changeEmail ? emailValue : user?.contactInfo?.email || "");

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          fullName: updatedBasicInfo.fullName,
          currentPosition: updatedBasicInfo.currentPosition,
          username: updatedBasicInfo.username,
          location: updatedBasicInfo.location,
          profileImage:
            updatedBasicInfo.profileImage ?? prev.basicInfo?.profileImage,
          backgroundImage:
            updatedBasicInfo.backgroundImage ?? prev.basicInfo?.backgroundImage,
        },
        contactInfo: {
          ...prev.contactInfo,
          email: updatedEmail,
        },
      }));

      setMessage(result?.message || "Basic information updated successfully.");
      setPassword("");

      if (changeEmail) {
        setChangeEmail(false);
      }

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "An error occurred while updating your information.";

      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.helper}>* Required fields</div>

      <div style={styles.title}>Basic information</div>

      <div style={styles.field}>
        <label style={styles.label}>First name*</label>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={firstName}
            maxLength={50}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <span style={styles.counter}>{firstName.length}/50</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Last name*</label>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={lastName}
            maxLength={50}
            onChange={(e) => setLastName(e.target.value)}
          />
          <span style={styles.counter}>{lastName.length}/50</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Current position</label>
        <div style={styles.inputWrapper}>
          <ProfileLookupInput
            type="Position"
            inputStyle={styles.input}
            value={currentPosition}
            maxLength={100}
            onChange={setCurrentPosition}
            placeholder="For example: Software Engineer"
          />
          <span style={styles.counter}>{currentPosition.length}/100</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Location</label>
        <div style={styles.inputWrapper}>
          <ProfileLookupInput
            type="Location"
            inputStyle={styles.input}
            value={location}
            maxLength={100}
            onChange={setLocation}
            placeholder="For example: Baku, Azerbaijan"
          />
          <span style={styles.counter}>{location.length}/100</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Username*</label>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={newUsername}
            maxLength={30}
            onChange={(e) =>
              setNewUsername(e.target.value.replace(/\s/g, "").toLowerCase())
            }
            placeholder="Enter a username"
          />
          <span style={styles.counter}>{newUsername.length}/30</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Current email</label>
        <input
          style={{ ...styles.input, backgroundColor: "#f4f4f4", color: "var(--app-muted)" }}
          value={user?.contactInfo?.email || ""}
          disabled
        />
      </div>

      <div style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={changeEmail}
          onChange={() => setChangeEmail((prev) => !prev)}
          style={styles.checkbox}
        />
        <span style={styles.checkboxText}>Change email</span>
      </div>

      {changeEmail && (
        <div style={styles.emailBox}>
          <div style={styles.field}>
            <label style={styles.label}>New email</label>
            <input
              style={styles.input}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter a new email address"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>
        </div>
      )}

      {error ? <div style={styles.error}>{error}</div> : null}
      {message ? <div style={styles.success}>{message}</div> : null}

      <div style={styles.actions}>
        <button
          style={{
            ...styles.saveBtn,
            opacity: loading ? 0.7 : 1,
            cursor: loading ? "not-allowed" : "pointer",
          }}
          onClick={save}
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    boxSizing: "border-box",
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
  },

  helper: {
    fontSize: 12,
    color: "var(--app-muted)",
    marginBottom: 10,
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
    outline: "none",
    fontSize: 14,
    boxSizing: "border-box",
  },

  counter: {
    position: "absolute",
    right: 10,
    bottom: -18,
    fontSize: 11,
    color: "var(--app-muted)",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },

  checkboxText: {
    fontSize: 14,
    color: "var(--app-text)",
  },

  emailBox: {
    padding: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    backgroundColor: "var(--app-surface-2)",
    marginBottom: 10,
  },

  error: {
    color: "#b00020",
    fontSize: 13,
    marginTop: 8,
  },

  success: {
    color: "#0a7a33",
    fontSize: 13,
    marginTop: 8,
  },

  actions: {
    marginTop: 20,
    display: "flex",
    justifyContent: "flex-end",
  },

  saveBtn: {
    background: "#0073b1",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    fontWeight: 600,
  },
};
