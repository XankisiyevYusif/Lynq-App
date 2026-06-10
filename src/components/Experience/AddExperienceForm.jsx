import { useState } from "react";
import experienceService from "../Experience/services/experienceService";
import Navbar from "../Layout/Navbar";

export default function AddExperienceForm({ onClose }) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    debugger;
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
        debugger;
      const dto = {
        title,
        companyName,
        description,
        startDate,
        endDate: isCurrent ? null : endDate,
        isCurrent,
      };

      const result = await experienceService.addExperience(dto);

      if (result.success) {
        onClose();
      } else {
        setError(result.message || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to add experience");
    } finally {
      setLoading(false);
    }
  };

  const styles = {

    container: {
      background: "#fff",
      padding: "2rem",
      borderRadius: "1rem",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      maxWidth: "500px",
      margin: "2rem auto",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
    header: {
      fontSize: "1.5rem",
      fontWeight: "700",
      marginBottom: "1rem",
      color: "#333",
    },
    error: {
      color: "red",
      marginBottom: "0.5rem",
      fontWeight: "500",
    },
    formGroup: {
      marginBottom: "1rem",
    },
    label: {
      display: "block",
      fontSize: "0.9rem",
      fontWeight: "600",
      marginBottom: "0.25rem",
      color: "#555",
    },
    input: {
      width: "100%",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      border: "1px solid #ccc",
      fontSize: "0.9rem",
    },
    textarea: {
      width: "100%",
      height: "100px",
      padding: "0.5rem",
      borderRadius: "0.5rem",
      border: "1px solid #ccc",
      fontSize: "0.9rem",
      resize: "none",
    },
    dateGroup: {
      display: "flex",
      gap: "1rem",
      marginBottom: "1rem",
    },
    checkboxGroup: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      marginBottom: "1rem",
    },
    buttonGroup: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "0.5rem",
      marginTop: "1rem",
    },
    cancelBtn: {
      padding: "0.5rem 1rem",
      backgroundColor: "#ccc",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
    },
    submitBtn: {
      padding: "0.5rem 1rem",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
    },
  };

  return (
        <div style={styles.container}>
            
      <h2 style={styles.header}>Add Experience</h2>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={styles.textarea}
          />
        </div>

        <div style={styles.dateGroup}>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={styles.input}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.label}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isCurrent}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.checkboxGroup}>
          <input
            type="checkbox"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
          />
          <span>Currently Working Here</span>
        </div>

        <div style={styles.buttonGroup}>
          <button type="button" onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}
