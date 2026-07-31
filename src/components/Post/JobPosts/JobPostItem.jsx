import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import { isEmployerAccount } from "../../../utils/accountType";

export default function JobPostItem({
  job,
  compact = false,
  selected = false,
  onClick,
  onSavedChanged,
  onApplied,
  showWithdraw = false,
  onApplicationWithdrawn,
  onDeleted,
  onUpdated,
}) {
  const currentUser = useSelector((state) => state.user.user);
  const isEmployer = isEmployerAccount(currentUser);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    location: "",
    workplaceType: "On-site",
    employmentType: "Full-time",
    applyUrl: "",
    requiredSkills: "",
    minimumExperienceYears: "0",
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
      requiredSkills: (job.requiredSkills || []).join(", "),
      minimumExperienceYears: String(job.minimumExperienceYears || 0),
      expiresAt: job.expiresAt ? job.expiresAt.slice(0, 10) : "",
      isActive: job.isActive !== false,
    });
  }, [job, isEditOpen]);

  useEffect(() => {
    if (!isEditOpen && !isWithdrawOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key !== "Escape" || withdrawing) return;
      setIsWithdrawOpen(false);
      setIsEditOpen(false);
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isEditOpen, isWithdrawOpen, withdrawing]);

  if (!job) return null;

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

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

  const formatFullDate = (dateValue) => {
    if (!dateValue) return "Date unavailable";
    return new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateValue));
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
          "Could not apply for this job.",
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

  const handleWithdraw = async (e) => {
    e?.stopPropagation?.();
    setIsWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    try {
      setWithdrawing(true);
      await api.delete(`/JobPost/apply/${job.id}`);
      setIsWithdrawOpen(false);
      onApplicationWithdrawn?.(job.id);
    } catch (err) {
      console.error("Withdraw application failed:", err);
      alert(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Could not withdraw this application.",
      );
    } finally {
      setWithdrawing(false);
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
        requiredSkills: editForm.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        minimumExperienceYears: Number(
          editForm.minimumExperienceYears || 0,
        ),
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
          "Failed to update job post.",
      );
    } finally {
      setUpdating(false);
    }
  };

  if (compact) {
    return (
      <div
        className={`job-post-compact ${selected ? "is-selected" : ""}`}
        style={{
          ...styles.compactCard,
          ...(selected ? styles.compactSelected : {}),
        }}
        onClick={onClick}
      >
        <img
          src={getImageUrl(job.companyLogo)}
          alt=""
          style={styles.logoSmall}
        />

        <div style={styles.compactInfo}>
          <div style={styles.compactTitle}>{job.title}</div>
          <div style={styles.company}>{job.companyName || "Company"}</div>
          <div style={styles.meta}>
            {job.location || "Location not specified"} · {job.workplaceType || "On-site"} · {job.employmentType || "Full-time"}
          </div>
          {(job.recommendationReason || job.matchReason) && (
            <div className="job-recommendation-reason">
              {job.recommendationReason || job.matchReason}
            </div>
          )}

          <div className="job-compact-status" style={styles.smallStatus}>
            {job.canApply ? (
              <span style={styles.activeText}>Active</span>
            ) : (
              <span style={styles.closedText}>Applications closed</span>
            )}
            <span> · Posted {formatFullDate(job.createdAt)}</span>
          </div>
          {job.isApplied && job.appliedAt && (
            <div className="job-applied-date">Applied {formatFullDate(job.appliedAt)}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="job-post-detail" style={styles.detailCard}>
        <div style={styles.header}>
          <img src={getImageUrl(job.companyLogo)} alt="" style={styles.logo} />

          <div style={{ flex: 1 }}>
            <h1 style={styles.title}>{job.title}</h1>

            <div style={styles.companyLine}>
              <strong>{job.companyName || "Company"}</strong>
            </div>

            <div className="job-detail-meta" style={styles.subLine}>
              <span>{job.location || "Location not specified"}</span>
              <span>{job.workplaceType || "On-site"}</span>
              <span>Posted {formatFullDate(job.createdAt)} ({formatDate(job.createdAt)})</span>
            </div>
          </div>

          {job.isOwner && (
            <div style={styles.ownerActions}>
              <button
                style={styles.editButton}
                onClick={() => setIsEditOpen(true)}
              >
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
          {job.expiresAt && <span style={styles.badge}>Closes {formatFullDate(job.expiresAt)}</span>}
          {(job.requiredSkills || []).map((skill) => (
            <span key={skill} style={styles.skillBadge}>{skill}</span>
          ))}
          {Number(job.minimumExperienceYears || 0) > 0 && (
            <span style={styles.badge}>
              {job.minimumExperienceYears}+ years experience
            </span>
          )}
        </div>

        {!isEmployer && <div style={styles.actions}>
          <button
            style={{
              ...styles.applyButton,
              ...(!job.canApply ? styles.disabledButton : {}),
            }}
            disabled={!job.canApply || applying || job.isApplied}
            onClick={handleApply}
          >
            {job.isApplied
              ? "Applied"
              : job.canApply
              ? applying
                ? "Opening..."
                : "Apply ↗"
              : "Applications closed"}
          </button>

          <button
            style={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {job.isSaved ? "Saved" : "Save"}
          </button>

          {showWithdraw && job.isApplied && (
            <button
              className="job-withdraw-button"
              type="button"
              disabled={withdrawing}
              onClick={handleWithdraw}
            >
              {withdrawing ? "Removing..." : "Withdraw application"}
            </button>
          )}
        </div>}

        {!job.canApply && (
          <p style={styles.closedMessage}>
            Applications are no longer accepted for this job.
          </p>
        )}

        {job.isApplied && (
          <p style={styles.appliedMessage}>
            You applied{job.appliedAt ? ` on ${formatFullDate(job.appliedAt)}` : ""}.
          </p>
        )}

        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>About the job</h2>
          <p style={styles.description}>{job.description}</p>
        </div>
      </div>

      {isEditOpen && (
        <div style={styles.overlay} onClick={() => setIsEditOpen(false)}>
          <div className="job-post-edit-modal" style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit job post</h2>
              <button
                style={styles.closeButton}
                onClick={() => setIsEditOpen(false)}
              >
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

              <div style={styles.row}>
                <div style={styles.col}>
                  <label style={styles.label}>Required skills</label>
                  <input
                    name="requiredSkills"
                    value={editForm.requiredSkills}
                    onChange={handleEditChange}
                    placeholder="React, .NET, SQL"
                    style={styles.input}
                  />
                </div>
                <div style={styles.col}>
                  <label style={styles.label}>Minimum experience</label>
                  <select
                    name="minimumExperienceYears"
                    value={editForm.minimumExperienceYears}
                    onChange={handleEditChange}
                    style={styles.input}
                  >
                    <option value="0">No minimum</option>
                    <option value="1">1+ years</option>
                    <option value="2">2+ years</option>
                    <option value="3">3+ years</option>
                    <option value="5">5+ years</option>
                    <option value="8">8+ years</option>
                  </select>
                </div>
              </div>

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

                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={updating}
                >
                  {updating ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isWithdrawOpen && (
        <div
          className="job-withdraw-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !withdrawing) {
              setIsWithdrawOpen(false);
            }
          }}
        >
          <div
            className="job-withdraw-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`withdraw-title-${job.id}`}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="job-withdraw-modal-header">
              <span className="job-withdraw-warning-icon" aria-hidden="true">!</span>
              <div>
                <h2 id={`withdraw-title-${job.id}`}>Withdraw application?</h2>
                <p>
                  This removes the application from your Applied jobs. You can apply
                  again later while the job is still open.
                </p>
              </div>
            </div>

            <div className="job-withdraw-summary">
              <strong>{job.title}</strong>
              <span>{job.companyName || "Company"}</span>
            </div>

            <div className="job-withdraw-modal-actions">
              <button
                className="job-withdraw-cancel"
                type="button"
                disabled={withdrawing}
                onClick={() => setIsWithdrawOpen(false)}
              >
                Keep application
              </button>
              <button
                className="job-withdraw-confirm"
                type="button"
                disabled={withdrawing}
                onClick={confirmWithdraw}
              >
                {withdrawing ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
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
    borderBottom: "1px solid var(--app-border)",
    cursor: "pointer",
    backgroundColor: "var(--app-surface)",
  },
  compactSelected: {
    backgroundColor: "var(--app-accent-soft)",
    borderLeft: "3px solid var(--app-accent)",
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
    color: "var(--app-text)",
    lineHeight: 1.35,
  },
  company: {
    fontSize: 14,
    color: "var(--app-text)",
    marginTop: 4,
  },
  meta: {
    fontSize: 13,
    color: "var(--app-muted)",
    marginTop: 3,
  },
  smallStatus: {
    fontSize: 12,
    color: "var(--app-muted)",
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
    backgroundColor: "var(--app-surface)",
    minHeight: "100%",
    padding: "30px 34px",
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
    fontSize: 27,
    fontWeight: 650,
    color: "var(--app-text)",
    lineHeight: 1.2,
  },
  companyLine: {
    marginTop: 8,
    fontSize: 14,
    color: "var(--app-text-soft)",
  },
  subLine: {
    marginTop: 5,
    fontSize: 14,
    color: "var(--app-muted)",
  },
  ownerActions: {
    display: "flex",
    gap: 8,
  },
  editButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-accent)",
    borderRadius: 18,
    padding: "7px 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  deleteButton: {
    border: "1px solid #c0392b",
    backgroundColor: "var(--app-surface)",
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
    border: "1px solid var(--app-border)",
    borderRadius: 18,
    padding: "7px 14px",
    color: "var(--app-text-soft)",
    fontSize: 14,
    fontWeight: 600,
  },
  skillBadge: {
    border: "1px solid rgba(8,145,178,.25)",
    borderRadius: 18,
    padding: "7px 14px",
    backgroundColor: "rgba(8,145,178,.07)",
    color: "#0891b2",
    fontSize: 14,
    fontWeight: 700,
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
    marginTop: 22,
    flexWrap: "wrap",
  },
  applyButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-accent)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 22px",
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
  },
  disabledButton: {
    backgroundColor: "var(--app-surface-2)",
    borderColor: "var(--app-border)",
    color: "var(--app-muted)",
    cursor: "not-allowed",
  },
  saveButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-accent)",
    borderRadius: 10,
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
    color: "var(--app-text-soft)",
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
    backgroundColor: "var(--app-surface)",
    borderRadius: 14,
    boxShadow: "0 18px 44px rgba(0,0,0,0.25)",
  },
  modalHeader: {
    padding: "18px 22px",
    borderBottom: "1px solid var(--app-border)",
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
    color: "var(--app-muted)",
  },
  form: {
    padding: 22,
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--app-text-soft)",
    marginBottom: 6,
  },
  input: {
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface-2)",
    color: "var(--app-text)",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    marginBottom: 14,
    fontFamily: "inherit",
  },
  textarea: {
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface-2)",
    color: "var(--app-text)",
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
    color: "var(--app-text-soft)",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },
  cancelButton: {
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text-soft)",
    borderRadius: 20,
    padding: "9px 16px",
    fontWeight: 600,
    cursor: "pointer",
  },
  submitButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-accent)",
    color: "#fff",
    borderRadius: 20,
    padding: "9px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },
};
