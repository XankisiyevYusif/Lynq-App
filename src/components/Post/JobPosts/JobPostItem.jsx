import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

export default function JobPostItem({
  job,
  compact = false,
  selected = false,
  onClick,
  onSavedChanged,
  onApplied,
  onDeleted,
  onUpdated,
}) {
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    workplaceType: "On-site",
    employmentType: "Full-time",
    applyUrl: "",
    expiresAt: "",
    isActive: true,
  });

  useEffect(() => {
    if (!job || !isEditOpen) return;

    setEditForm({
      title: job.title || "",
      description: job.description || "",
      location: job.location || "",
      workplaceType: job.workplaceType || "On-site",
      employmentType: job.employmentType || "Full-time",
      applyUrl: job.applyUrl || "",
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : "",
      isActive: job.isActive !== false,
    });
  }, [job, isEditOpen]);

  useEffect(() => {
    if (!isEditOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [isEditOpen]);

  if (!job) return null;

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ROOT}/${path.replace(/^\/+/, "")}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week ago`;
    return `${Math.floor(diffDays / 30)} month ago`;
  };

  const handleSave = async (e) => {
    e?.stopPropagation?.();

    try {
      setSaving(true);

      if (job.isSaved) {
        await api.delete(`/JobPost/save/${job.id}`);
        onSavedChanged?.(job.id, false);
      } else {
        await api.post(`/JobPost/save/${job.id}`);
        onSavedChanged?.(job.id, true);
      }
    } catch (err) {
      console.error("Save job failed:", err);
      alert("Failed to update saved job.");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (e) => {
    e?.stopPropagation?.();

    if (!job.canApply) return;

    try {
      setApplying(true);

      const res = await api.post(`/JobPost/apply/${job.id}`);
      const applyUrl = res.data?.data || res.data?.Data || job.applyUrl;

      onApplied?.(job.id);

      if (applyUrl) {
        window.open(applyUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Apply failed:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Could not apply for this job."
      );
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async (e) => {
    e?.stopPropagation?.();

    const ok = window.confirm("Delete this job post?");
    if (!ok) return;

    try {
      await api.delete(`/JobPost/${job.id}`);
      onDeleted?.(job.id);
    } catch (err) {
      console.error("Delete job failed:", err);
      alert("Failed to delete job post.");
    }
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!editForm.title.trim()) {
      alert("Job title is required.");
      return;
    }

    if (!editForm.description.trim()) {
      alert("Job description is required.");
      return;
    }

    if (
      editForm.applyUrl.trim() &&
      !editForm.applyUrl.startsWith("http://") &&
      !editForm.applyUrl.startsWith("https://")
    ) {
      alert("Apply URL must start with http:// or https://");
      return;
    }

    try {
      setUpdating(true);

      const payload = {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        location: editForm.location.trim() || null,
        workplaceType: editForm.workplaceType,
        employmentType: editForm.employmentType,
        applyUrl: editForm.applyUrl.trim() || null,
        expiresAt: editForm.expiresAt
          ? new Date(editForm.expiresAt).toISOString()
          : null,
        isActive: editForm.isActive,
      };

      const res = await api.put(`/JobPost/${job.id}`, payload);
      const updatedJob = res.data?.data || res.data?.Data || res.data;

      onUpdated?.(updatedJob);
      setIsEditOpen(false);
    } catch (err) {
      console.error("Update job failed:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Failed to update job post."
      );
    } finally {
      setUpdating(false);
    }
  };

  if (compact) {
    return (
      <div
        style={{
          ...styles.compactCard,
          ...(selected ? styles.compactSelected : {}),
        }}
        onClick={onClick}
      >
        <img src={getImageUrl(job.companyLogo)} alt="" style={styles.logoSmall} />

        <div style={styles.compactInfo}>
          <div style={styles.compactTitle}>{job.title}</div>
          <div style={styles.company}>{job.companyName || "Company"}</div>
          <div style={styles.meta}>
            {job.location || "Location not specified"}{" "}
            {job.workplaceType ? `(${job.workplaceType})` : ""}
          </div>

          <div style={styles.smallStatus}>
            {job.canApply ? (
              <span style={styles.activeText}>Active</span>
            ) : (
              <span style={styles.closedText}>Applications closed</span>
            )}
            <span> · {formatDate(job.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={styles.detailCard}>
        <div style={styles.header}>
          <img src={getImageUrl(job.companyLogo)} alt="" style={styles.logo} />

          <div style={{ flex: 1 }}>
            <h1 style={styles.title}>{job.title}</h1>

            <div style={styles.companyLine}>
              {job.companyName || "Company"} ·{" "}
              {job.location || "Location not specified"} · {formatDate(job.createdAt)}
            </div>

            <div style={styles.subLine}>
              {job.canApply
                ? "Applications are open"
                : "Applications are no longer accepted for this job."}
            </div>
          </div>

          {job.isOwner && (
            <div style={styles.ownerActions}>
              <button style={styles.editButton} onClick={() => setIsEditOpen(true)}>
                Edit
              </button>

              <button style={styles.deleteButton} onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>

        <div style={styles.badges}>
          <span style={styles.badge}>{job.workplaceType || "On-site"}</span>
          <span style={styles.badge}>{job.employmentType || "Full-time"}</span>

          {!job.canApply && <span style={styles.closedBadge}>Closed</span>}
        </div>

        <div style={styles.actions}>
          <button
            style={{
              ...styles.applyButton,
              ...(!job.canApply ? styles.disabledButton : {}),
            }}
            disabled={!job.canApply || applying}
            onClick={handleApply}
          >
            {job.canApply ? (applying ? "Opening..." : "Apply ↗") : "Applications closed"}
          </button>

          <button style={styles.saveButton} onClick={handleSave} disabled={saving}>
            {job.isSaved ? "Saved" : "Save"}
          </button>
        </div>

        {!job.canApply && (
          <p style={styles.closedMessage}>
            Applications are no longer accepted for this job.
          </p>
        )}

        {job.isApplied && (
          <p style={styles.appliedMessage}>You have applied for this job.</p>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>About the job</h2>
          <p style={styles.description}>{job.description}</p>
        </div>
      </div>

      {isEditOpen && (
        <div style={styles.overlay} onClick={() => setIsEditOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit job post</h2>
              <button style={styles.closeButton} onClick={() => setIsEditOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleUpdate} style={styles.form}>
              <label style={styles.label}>Job title *</label>
              <input
                name="title"
                value={editForm.title}
                onChange={handleEditChange}
                style={styles.input}
              />

              <label style={styles.label}>Location</label>
              <input
                name="location"
                value={editForm.location}
                onChange={handleEditChange}
                style={styles.input}
              />

              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Workplace type</label>
                  <select
                    name="workplaceType"
                    value={editForm.workplaceType}
                    onChange={handleEditChange}
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
                    value={editForm.employmentType}
                    onChange={handleEditChange}
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
                value={editForm.applyUrl}
                onChange={handleEditChange}
                style={styles.input}
              />

              <label style={styles.label}>Expires at</label>
              <input
                type="date"
                name="expiresAt"
                value={editForm.expiresAt}
                onChange={handleEditChange}
                style={styles.input}
              />

              <label style={styles.checkRow}>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={editForm.isActive}
                  onChange={handleEditChange}
                />
                <span>Applications are open</span>
              </label>

              <label style={styles.label}>Job description *</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                style={styles.textarea}
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelButton}
                  onClick={() => setIsEditOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" style={styles.submitButton} disabled={updating}>
                  {updating ? "Saving..." : "Save changes"}
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
  compactCard: {
    display: "flex",
    gap: 12,
    padding: "14px 12px",
    borderBottom: "1px solid #e5e5e5",
    cursor: "pointer",
    backgroundColor: "#fff",
  },
  compactSelected: {
    backgroundColor: "#eef3f8",
    borderLeft: "3px solid #0a66c2",
  },
  logoSmall: {
    width: 48,
    height: 48,
    objectFit: "cover",
    borderRadius: 4,
    flexShrink: 0,
  },
  compactInfo: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0a66c2",
    lineHeight: 1.35,
  },
  company: {
    fontSize: 14,
    color: "#222",
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: "#666",
    marginTop: 3,
  },
  smallStatus: {
    fontSize: 12,
    color: "#777",
    marginTop: 7,
  },
  activeText: {
    color: "#057642",
    fontWeight: 700,
  },
  closedText: {
    color: "#c0392b",
    fontWeight: 700,
  },
  detailCard: {
    backgroundColor: "#fff",
    minHeight: "100%",
    padding: "28px 32px",
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
  },
  logo: {
    width: 58,
    height: 58,
    objectFit: "cover",
    borderRadius: 4,
    flexShrink: 0,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 650,
    color: "#111",
    lineHeight: 1.2,
  },
  companyLine: {
    marginTop: 8,
    fontSize: 14,
    color: "#555",
  },
  subLine: {
    marginTop: 5,
    fontSize: 14,
    color: "#666",
  },
  ownerActions: {
    display: "flex",
    gap: 8,
  },
  editButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 18,
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButton: {
    border: "1px solid #c0392b",
    backgroundColor: "#fff",
    color: "#c0392b",
    borderRadius: 18,
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  badges: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 18,
  },
  badge: {
    border: "1px solid #777",
    borderRadius: 18,
    padding: "7px 14px",
    color: "#444",
    fontSize: 14,
    fontWeight: 600,
  },
  closedBadge: {
    border: "1px solid #c0392b",
    borderRadius: 18,
    padding: "7px 14px",
    color: "#c0392b",
    fontSize: 14,
    fontWeight: 700,
  },
  actions: {
    display: "flex",
    gap: 10,
    marginTop: 18,
  },
  applyButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 22,
    padding: "10px 22px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "#e5e5e5",
    borderColor: "#d0d0d0",
    color: "#777",
    cursor: "not-allowed",
  },
  saveButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 22,
    padding: "10px 22px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  closedMessage: {
    marginTop: 12,
    color: "#c0392b",
    fontSize: 14,
    fontWeight: 600,
  },
  appliedMessage: {
    marginTop: 12,
    color: "#057642",
    fontSize: 14,
    fontWeight: 600,
  },
  section: {
    marginTop: 34,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 650,
    margin: "0 0 14px",
  },
  description: {
    whiteSpace: "pre-wrap",
    fontSize: 15,
    lineHeight: 1.65,
    color: "#222",
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
    boxShadow: "0 18px 44px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
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
  checkRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    fontSize: 14,
    fontWeight: 600,
    color: "#333",
  },
  modalActions: {
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