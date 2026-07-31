import React, { useState } from "react";
import EmptySectionCard from "./EmptySectionCard";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import ProfileIcon from "../ProfileIcon";

const monthNames = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

function formatMonthYear(month, year) {
  if (!month && !year) return "";
  if (month && year) return `${monthNames[month]} ${year}`;
  if (year) return `${year}`;
  return "";
}

function getDateRange(exp) {
  const start = formatMonthYear(exp.startMonth, exp.startYear);

  if (exp.isCurrent) {
    return `${start} - Present`;
  }

  const end = formatMonthYear(exp.endMonth, exp.endYear);
  return `${start} - ${end}`;
}

export default function ExperienceCard({
  experiences = [],
  isOwner,
  readOnly,
  onAddExperience,
  onEditExperience,
  onViewAllExperiences,
}) {
  const [expanded, setExpanded] = useState(false);

  const hasData = Array.isArray(experiences) && experiences.length > 0;

  if (!hasData && !isOwner) return null;

  if (!hasData && isOwner) {
    return (
      <EmptySectionCard
        title="Experience"
        description="Add your experience to show your professional background."
        buttonText="Add experience"
        onAdd={onAddExperience}
      />
    );
  }

  const previewCount = 3;
  const expandedCount = 7;

  const visibleExperiences = expanded
    ? experiences.slice(0, expandedCount)
    : experiences.slice(0, previewCount);

  const hasMoreThanPreview = experiences.length > previewCount;
  const hasMoreThanExpanded = experiences.length > expandedCount;

  return (
    <div className="profile-section-card" style={styles.card}>
      <div style={styles.header}>
        <h2 className="profile-section-title" style={styles.title}>
          Experience
        </h2>

        {isOwner && !readOnly && (
          <button
            type="button"
            className="profile-icon-button profile-section-add-button"
            style={styles.addButton}
            onClick={onAddExperience}
            aria-label="Add experience"
            title="Add experience"
          >
            <ProfileIcon name="plus" size={19} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div>
        {visibleExperiences.map((exp, index) => (
          <div key={exp.id || index}>
            <div style={styles.item}>
              <div style={styles.left}>
                <div style={styles.logoBox}>
                  {exp.companyLogoUrl ? (
                    <img
                      src={resolveMediaUrl(exp.companyLogoUrl)}
                      alt={`${exp.companyName || "Company"} logo`}
                      style={styles.organizationLogo}
                    />
                  ) : (
                    (exp.companyName || "E").charAt(0).toUpperCase()
                  )}
                </div>

                <div style={styles.info}>
                  <div style={styles.topRow}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.position}>{exp.title}</div>
                      <div style={styles.company}>{exp.companyName}</div>
                    </div>

                    {isOwner && !readOnly && (
                      <button
                        type="button"
                        className="profile-icon-button"
                        style={styles.iconButton}
                        onClick={() => onEditExperience?.(exp)}
                      >
                        <ProfileIcon name="edit" size={18} />
                      </button>
                    )}
                  </div>

                  <div style={styles.meta}>{getDateRange(exp)}</div>

                  {(exp.location || exp.locationType) && (
                    <div style={styles.meta}>
                      {exp.location || ""}
                      {exp.location && exp.locationType ? " · " : ""}
                      {exp.locationType || ""}
                    </div>
                  )}

                  {exp.employmentType && (
                    <div style={styles.meta}>{exp.employmentType}</div>
                  )}

                  {exp.description && (
                    <div style={styles.description}>{exp.description}</div>
                  )}
                </div>
              </div>
            </div>

            {index !== visibleExperiences.length - 1 && (
              <div style={styles.divider} />
            )}
          </div>
        ))}
      </div>

      {hasMoreThanPreview && !expanded && (
        <button
          type="button"
          style={styles.toggleButton}
          onClick={() => setExpanded(true)}
        >
          Show more experiences
        </button>
      )}

      {expanded && (
        <button
          type="button"
          style={styles.toggleButton}
          onClick={() => setExpanded(false)}
        >
          Show less
        </button>
      )}

      {expanded && hasMoreThanExpanded && (
        <button
          type="button"
          style={styles.viewAllButton}
          onClick={onViewAllExperiences}
        >
          View all experiences ({experiences.length})
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "16px",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },

  addButton: {
    width: 34,
    height: 34,
    display: "grid",
    placeItems: "center",
    padding: 0,
    border: "1px solid var(--app-border)",
    borderRadius: 10,
    background: "var(--app-surface)",
    color: "var(--app-muted)",
    cursor: "pointer",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--app-text)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  item: {
    padding: "8px 0",
  },

  left: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  logoBox: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    backgroundColor: "var(--app-surface-2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "18px",
    color: "#428DFF",
    flexShrink: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  organizationLogo: {
    width: "100%",
    height: "100%",
    borderRadius: "10px",
    objectFit: "cover",
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },

  position: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--app-text)",
    marginBottom: "2px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  company: {
    fontSize: "15px",
    color: "var(--app-text)",
    marginBottom: "4px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  meta: {
    fontSize: "14px",
    color: "var(--app-muted)",
    marginBottom: "4px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  description: {
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "var(--app-text-soft)",
    whiteSpace: "pre-wrap",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  divider: {
    borderTop: "1px solid #ebebeb",
    margin: "12px 0",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: "var(--app-muted)",
  },

  toggleButton: {
    marginTop: "16px",
    border: "none",
    background: "transparent",
    color: "var(--app-accent)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  viewAllButton: {
    marginTop: "12px",
    border: "none",
    background: "transparent",
    color: "var(--app-accent)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    display: "block",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
};
