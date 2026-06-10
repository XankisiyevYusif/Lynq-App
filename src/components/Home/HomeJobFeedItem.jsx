import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import defaultAvatar from "../../assets/default-avatar.png";
import saveIcon from "../../assets/save.png";
import saveActiveIcon from "../../assets/saveactive.png";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const HomeJobFeedItem = ({ job, onJobChanged, showToast }) => {
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

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
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return "now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const handleOpenJob = () => {
    navigate("/jobs", {
      state: {
        query: job.title || "",
        selectedJobId: job.id,
      },
    });
  };

  const handleSave = async (e) => {
    e.stopPropagation();

    try {
      setSaving(true);

      if (job.isSaved) {
        await api.delete(`/JobPost/save/${job.id}`);

        onJobChanged?.({
          ...job,
          isSaved: false,
        });

        showToast?.("Job removed from saved jobs.", "success");
      } else {
        await api.post(`/JobPost/save/${job.id}`);

        onJobChanged?.({
          ...job,
          isSaved: true,
        });

        showToast?.("Job saved.", "success");
      }
    } catch (err) {
      console.error("Save job failed:", err);
      showToast?.("Failed to update saved job.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (e) => {
    e.stopPropagation();

    if (!job.canApply) return;

    try {
      setApplying(true);

      const res = await api.post(`/JobPost/apply/${job.id}`);
      const applyUrl = res.data?.data || res.data?.Data || job.applyUrl;

      onJobChanged?.({
        ...job,
        isApplied: true,
      });

      showToast?.("Application opened.", "success");

      if (applyUrl) {
        window.open(applyUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Apply failed:", err);

      showToast?.(
        err.response?.data?.message ||
          err.response?.data?.Message ||
          "Could not apply for this job.",
        "error"
      );
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={styles.card} onClick={handleOpenJob}>
      <div style={styles.topLabel}>Job recommendation</div>

      <div style={styles.header}>
        <img
          src={getImageUrl(job.companyLogo)}
          alt={job.companyName || "Company"}
          style={styles.logo}
        />

        <div style={styles.headerInfo}>
          <div style={styles.title}>{job.title}</div>

          <div style={styles.companyLine}>
            {job.companyName || "Company"}
            {job.location ? ` · ${job.location}` : ""}
          </div>

          <div style={styles.metaLine}>
            {job.workplaceType || "On-site"}
            {job.employmentType ? ` · ${job.employmentType}` : ""}
            {job.createdAt ? ` · ${formatDate(job.createdAt)}` : ""}
          </div>
        </div>

        <button
          type="button"
          style={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
          title={job.isSaved ? "Saved" : "Save"}
        >
          <img
            src={job.isSaved ? saveActiveIcon : saveIcon}
            alt={job.isSaved ? "Saved" : "Save"}
            style={styles.saveIcon}
          />
        </button>
      </div>

      <div style={styles.badges}>
        <span style={styles.badge}>{job.workplaceType || "On-site"}</span>
        <span style={styles.badge}>{job.employmentType || "Full-time"}</span>

        {!job.canApply && <span style={styles.closedBadge}>Closed</span>}
      </div>

      {job.description && (
        <p style={styles.description}>
          {job.description.length > 180
            ? `${job.description.slice(0, 180)}...`
            : job.description}
        </p>
      )}

      {!job.canApply && (
        <p style={styles.closedText}>
          Applications are no longer accepted for this job.
        </p>
      )}

      {job.isApplied && (
        <p style={styles.appliedText}>You have applied for this job.</p>
      )}

      <div style={styles.actions}>
        <button
          type="button"
          style={{
            ...styles.applyButton,
            ...(!job.canApply ? styles.disabledButton : {}),
          }}
          onClick={handleApply}
          disabled={!job.canApply || applying}
        >
          {job.canApply ? (applying ? "Opening..." : "Apply ↗") : "Closed"}
        </button>

        <button type="button" style={styles.viewButton} onClick={handleOpenJob}>
          View details
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  topLabel: {
    fontSize: "13px",
    color: "#666",
    marginBottom: "12px",
    fontWeight: 600,
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },

  logo: {
    width: "52px",
    height: "52px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #ddd",
    flexShrink: 0,
  },

  headerInfo: {
    flex: 1,
    minWidth: 0,
  },

  title: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#0a66c2",
    lineHeight: 1.3,
    marginBottom: "4px",
  },

  companyLine: {
    fontSize: "14px",
    color: "#222",
    marginBottom: "3px",
  },

  metaLine: {
    fontSize: "13px",
    color: "#666",
  },

  saveButton: {
    border: "none",
    backgroundColor: "transparent",
    padding: "4px",
    cursor: "pointer",
  },

  saveIcon: {
    width: "22px",
    height: "22px",
    objectFit: "contain",
  },

  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },

  badge: {
    backgroundColor: "#eef3f8",
    color: "#333",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 600,
  },

  closedBadge: {
    backgroundColor: "#fdeaea",
    color: "#c0392b",
    borderRadius: "999px",
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: 700,
  },

  description: {
    fontSize: "14px",
    color: "#333",
    lineHeight: 1.5,
    marginTop: "14px",
    marginBottom: 0,
    whiteSpace: "pre-wrap",
  },

  closedText: {
    fontSize: "13px",
    color: "#c0392b",
    fontWeight: 600,
    marginTop: "12px",
    marginBottom: 0,
  },

  appliedText: {
    fontSize: "13px",
    color: "#057642",
    fontWeight: 600,
    marginTop: "12px",
    marginBottom: 0,
  },

  actions: {
    display: "flex",
    gap: "10px",
    marginTop: "16px",
  },

  applyButton: {
    border: "none",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: "999px",
    padding: "9px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  disabledButton: {
    backgroundColor: "#b5b5b5",
    cursor: "not-allowed",
  },

  viewButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: "999px",
    padding: "9px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default HomeJobFeedItem;