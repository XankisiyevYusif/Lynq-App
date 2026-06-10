import React, { useState } from "react";
import pencil from "../../../assets/pencil.png";

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
  onEditExperience,
  onViewAllExperiences,
}) {
  const [expanded, setExpanded] = useState(false);

  if (!experiences || experiences.length === 0) return null;

  const previewCount = 3;
  const expandedCount = 7;

  const visibleExperiences = expanded
    ? experiences.slice(0, expandedCount)
    : experiences.slice(0, previewCount);

  const hasMoreThanPreview = experiences.length > previewCount;
  const hasMoreThanExpanded = experiences.length > expandedCount;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Experience</h2>
      </div>

      <div>
        {visibleExperiences.map((exp, index) => (
          <div key={exp.id || index}>
            <div style={styles.item}>
              <div style={styles.left}>
                <div style={styles.logoBox}>
                  {(exp.companyName || "E").charAt(0).toUpperCase()}
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
                        style={styles.iconButton}
                        onClick={() => onEditExperience?.(exp)}
                      >
                        <img src={pencil} alt="edit" style={styles.icon} />
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
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "24px",
    marginTop: "16px",
  },

  header: {
    marginBottom: "16px",
  },

  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 600,
    color: "#191919",
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
    backgroundColor: "#eef3f8",
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
    color: "#191919",
    marginBottom: "2px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  company: {
    fontSize: "15px",
    color: "#191919",
    marginBottom: "4px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  meta: {
    fontSize: "14px",
    color: "rgba(0,0,0,0.6)",
    marginBottom: "4px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  description: {
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#191919",
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
  },

  icon: {
    width: "18px",
    height: "18px",
    objectFit: "contain",
  },

  toggleButton: {
    marginTop: "16px",
    border: "none",
    background: "transparent",
    color: "#0a66c2",
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
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
    padding: 0,
    display: "block",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
};