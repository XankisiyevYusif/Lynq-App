import { useState } from "react";
import api from "../../../../services/api";

export default function BasicInfoForm({ user, setUser, onClose }) {
  const nameParts = user?.basicInfo?.fullName?.split(" ") || [];

  const [firstName, setFirstName] = useState(nameParts[0] || "");
  const [lastName, setLastName] = useState(nameParts.slice(1).join(" ") || "");
  const [currentPosition, setCurrentPosition] = useState(
    user?.basicInfo?.currentPosition || ""
  );
  const [location, setLocation] = useState(user?.basicInfo?.location || "");
  const [newUsername, setNewUsername] = useState(
    user?.basicInfo?.username || ""
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
      const usernameValue = newUsername.trim();
      const currentPositionValue = currentPosition.trim();
      const locationValue = location.trim();
      const emailValue = newEmail.trim();

      if (!firstName.trim()) {
        setError("Ad boş ola bilməz.");
        return;
      }

      if (!lastName.trim()) {
        setError("Soyad boş ola bilməz.");
        return;
      }

      if (!usernameValue) {
        setError("Username boş ola bilməz.");
        return;
      }

      if (usernameValue.length < 3) {
        setError("Username minimum 3 simvol olmalıdır.");
        return;
      }

      if (usernameValue.length > 30) {
        setError("Username maksimum 30 simvol ola bilər.");
        return;
      }

      const usernameRegex = /^[a-zA-Z0-9._]+$/;
      if (!usernameRegex.test(usernameValue)) {
        setError(
          "Username yalnız hərf, rəqəm, nöqtə və alt xətdən ibarət ola bilər."
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
          setError("Yeni e-posta daxil edin.");
          return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailValue)) {
          setError("Düzgün e-posta formatı daxil edin.");
          return;
        }

        if (!password.trim()) {
          setError("E-postayi dəyişmək üçün şifrə daxil edin.");
          return;
        }

        payload.email = emailValue;
        payload.currentPassword = password.trim();
      }

      setLoading(true);

      const response = await api.put("/user/basic-info", payload);

      const result = response?.data;
      const responseData = result?.data || result;

      const updatedBasicInfo =
        responseData?.basicInfo ||
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

      setMessage(result?.message || "Basic info uğurla yeniləndi.");
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
        "Yeniləmə zamanı xəta baş verdi.";

      setError(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.helper}>* Zəruri sahələr</div>

      <div style={styles.title}>Temel bilgiler</div>

      <div style={styles.field}>
        <label style={styles.label}>Ad*</label>
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
        <label style={styles.label}>Soyad*</label>
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
          <input
            style={styles.input}
            value={currentPosition}
            maxLength={100}
            onChange={(e) => setCurrentPosition(e.target.value)}
            placeholder="Məsələn: Software Engineer"
          />
          <span style={styles.counter}>{currentPosition.length}/100</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Location</label>
        <div style={styles.inputWrapper}>
          <input
            style={styles.input}
            value={location}
            maxLength={100}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Məsələn: Baku, Azerbaijan"
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
            onChange={(e) => setNewUsername(e.target.value.replace(/\s/g, ""))}
            placeholder="Username daxil edin"
          />
          <span style={styles.counter}>{newUsername.length}/30</span>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Mövcud e-posta</label>
        <input
          style={{ ...styles.input, backgroundColor: "#f4f4f4", color: "#666" }}
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
        <span style={styles.checkboxText}>E-postayi dəyiş</span>
      </div>

      {changeEmail && (
        <div style={styles.emailBox}>
          <div style={styles.field}>
            <label style={styles.label}>Yeni e-posta</label>
            <input
              style={styles.input}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Yeni gmail daxil edin"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Şifrə</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Şifrəni daxil edin"
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
          {loading ? "Kaydediliyor..." : "Kaydet"}
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
    color: "#666",
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
    color: "#777",
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
    color: "#222",
  },

  emailBox: {
    padding: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    backgroundColor: "#fafafa",
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