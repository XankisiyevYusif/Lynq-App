import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import Toast from "../../UI/Toast";

export default function CreateJobPostBox({ onCreated, compact = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    workplaceType: "On-site",
    employmentType: "Full-time",
    applyUrl: "",
    expiresAt: "",
  });

  useEffect(() => {
    if (!isModalOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [isModalOpen]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      location: "",
      workplaceType: "On-site",
      employmentType: "Full-time",
      applyUrl: "",
      expiresAt: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validate = () => {
    if (!formData.title.trim()) {
      showToast("Job title is required.", "error");
      return false;
    }

    if (!formData.description.trim()) {
      showToast("Job description is required.", "error");
      return false;
    }

    if (formData.applyUrl.trim()) {
      const valid =
        formData.applyUrl.startsWith("http://") ||
        formData.applyUrl.startsWith("https://");

      if (!valid) {
        showToast("Apply URL must start with http:// or https://", "error");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      setLoading(true);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim() || null,
        workplaceType: formData.workplaceType,
        employmentType: formData.employmentType,
        applyUrl: formData.applyUrl.trim() || null,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : null,
      };

      const res = await api.post("/JobPost", payload);
      const createdJob = res.data?.data || res.data?.Data || res.data;

      showToast("Job post created successfully.", "success");
      resetForm();
      setIsModalOpen(false);

      onCreated?.(createdJob);
    } catch (err) {
      console.error("Create job failed:", err);

      showToast(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Failed to create job post.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div style={compact ? styles.compactCreateBox : styles.createBox}>
        <button
          type="button"
          style={compact ? styles.compactCreateButton : styles.createButton}
          onClick={() => setIsModalOpen(true)}
        >
          Post a job
        </button>
      </div>

      {isModalOpen && (
        <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.title}>Create job post</h2>

              <button
                type="button"
                style={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              <label style={styles.label}>Job title *</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: Junior Frontend Developer"
                style={styles.input}
              />

              <label style={styles.label}>Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Example: Baku, Azerbaijan"
                style={styles.input}
              />

              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Workplace type</label>
                  <select
                    name="workplaceType"
                    value={formData.workplaceType}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div style={styles.col}>
                  <label style={styles.label}>Employment type</label>
                  <select
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <label style={styles.label}>Apply URL</label>
              <input
                name="applyUrl"
                value={formData.applyUrl}
                onChange={handleChange}
                placeholder="https://company.com/careers/job"
                style={styles.input}
              />

              <label style={styles.label}>Expires at</label>
              <input
                type="date"
                name="expiresAt"
                value={formData.expiresAt}
                onChange={handleChange}
                style={styles.input}
              />

              <label style={styles.label}>Job description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities and requirements..."
                style={styles.textarea}
              />

              <div style={styles.actions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" style={styles.submitButton} disabled={loading}>
                  {loading ? "Posting..." : "Post job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  createBox: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },

  createButton: {
    width: "100%",
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 22,
    padding: "10px 16px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },

  compactCreateBox: {
    backgroundColor: "transparent",
    border: "none",
    padding: 0,
    boxShadow: "none",
  },

  compactCreateButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 20,
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  modal: {
    width: 560,
    maxHeight: "88vh",
    overflowY: "auto",
    backgroundColor: "#fff",
    borderRadius: 14,
    boxShadow: "0 16px 40px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 650,
  },

  closeButton: {
    border: "none",
    backgroundColor: "transparent",
    fontSize: 28,
    cursor: "pointer",
    color: "#555",
  },

  form: {
    padding: 22,
    display: "flex",
    flexDirection: "column",
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#444",
    marginBottom: 6,
  },

  input: {
    border: "1px solid #c9c9c9",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 14,
    fontFamily: "inherit",
  },

  textarea: {
    border: "1px solid #c9c9c9",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    minHeight: 150,
    resize: "vertical",
    marginBottom: 16,
    fontFamily: "inherit",
  },

  row: {
    display: "flex",
    gap: 12,
  },

  col: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#333",
    borderRadius: 20,
    padding: "9px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },

  submitButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 20,
    padding: "9px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};