import React, { useState } from "react";
import EmptySectionCard from "./EmptySectionCard";
import educationImage from "../../../assets/Education.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import ProfileIcon from "../ProfileIcon";

const monthLabels = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

function formatEducationDate(month, year) {
  const monthText = monthLabels[Number(month)] || "";
  if (!monthText && !year) return "";
  if (monthText && year) return `${monthText} ${year}`;
  return monthText || year || "";
}

function formatEducationRange(item) {
  const startDate = formatEducationDate(item.startMonth, item.startYear);
  const endDate = formatEducationDate(item.endMonth, item.endYear);

  if (!startDate && !endDate) return "";
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate) return `${startDate} -`;
  return `- ${endDate}`;
}

export default function EducationCard({
  educations = [],
  isOwner,
  readOnly,
  onAddEducation,
  onEditEducation,
}) {
  const [showAll, setShowAll] = useState(false);
  const previewCount = 3;

  const hasData = educations?.length > 0;

  if (!hasData && !isOwner) return null;

  if (!hasData && isOwner) {
    return (
      <EmptySectionCard
        title="Education"
        description="Add your education to show your academic background."
        buttonText="Add education"
        onAdd={onAddEducation}
      />
    );
  }

  const visibleEducations = showAll
    ? educations
    : educations.slice(0, previewCount);

  const hasMore = educations.length > previewCount;

  return (
    <div className="profile-section-card" style={styles.card}>
      <div style={styles.header}>
        <h3 className="profile-section-title" style={styles.title}>
          Education
        </h3>

        {isOwner && !readOnly && (
          <button
            type="button"
            className="profile-icon-button profile-section-add-button"
            style={styles.addButton}
            onClick={onAddEducation}
            aria-label="Add education"
            title="Add education"
          >
            <ProfileIcon name="plus" size={19} strokeWidth={2.4} />
          </button>
        )}
      </div>

      <div style={styles.list}>
        {visibleEducations.map((item, index) => {
          const dateRange = formatEducationRange(item);
          const degreeFieldText = [item.degree, item.field]
            .filter(Boolean)
            .join(" · ");

          return (
            <div
              key={item.id || index}
              style={{
                ...styles.item,
                borderBottom:
                  index !== visibleEducations.length - 1
                    ? "1px solid #eaeaea"
                    : "none",
              }}
            >
              <div style={styles.itemRow}>
                <div style={styles.leftIconBox}>
                  <div style={styles.iconWrapper}>
                    <img
                      src={
                        item.institutionLogoUrl
                          ? resolveMediaUrl(item.institutionLogoUrl)
                          : educationImage
                      }
                      alt={
                        item.institutionLogoUrl
                          ? `${item.school || "Institution"} logo`
                          : "Education"
                      }
                      style={
                        item.institutionLogoUrl
                          ? styles.institutionLogo
                          : styles.educationIcon
                      }
                    />
                  </div>
                </div>

                <div style={styles.content}>
                  {!!item.school && (
                    <div style={styles.schoolName}>{item.school}</div>
                  )}

                  {!!degreeFieldText && (
                    <div style={styles.degreeField}>{degreeFieldText}</div>
                  )}

                  {!!dateRange && <div style={styles.meta}>{dateRange}</div>}

                  {!!item.note && <p style={styles.note}>{item.note}</p>}
                </div>

                {!readOnly && isOwner && (
                  <button
                    type="button"
                    className="profile-icon-button"
                    style={styles.iconButton}
                    onClick={() => onEditEducation?.(item)}
                  >
                    <ProfileIcon name="edit" size={18} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type="button"
          style={styles.toggleButton}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll ? "Show less" : `Show all education (${educations.length})`}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 20,
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    color: "var(--app-text)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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

  list: {
    display: "flex",
    flexDirection: "column",
  },

  item: {
    padding: "16px 0",
  },

  itemRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },

  leftIconBox: {
    flexShrink: 0,
  },

  iconWrapper: {
    width: 52,
    height: 52,
    backgroundColor: "var(--app-surface-2)",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  educationIcon: {
    width: 26,
    height: 26,
    objectFit: "contain",
  },

  institutionLogo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    objectFit: "cover",
  },

  content: {
    flex: 1,
    minWidth: 0,
  },

  iconButton: {
    width: 36,
    height: 36,
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

  schoolName: {
    fontSize: 16,
    fontWeight: 600,
    color: "var(--app-text)",
    marginBottom: 4,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  degreeField: {
    fontSize: 15,
    color: "var(--app-text-soft)",
    marginBottom: 4,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  meta: {
    fontSize: 14,
    color: "var(--app-muted)",
    marginBottom: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  note: {
    margin: "6px 0 0 0",
    fontSize: 14,
    color: "var(--app-text-soft)",
    lineHeight: 1.6,
    whiteSpace: "pre-line",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  toggleButton: {
    marginTop: 16,
    border: "none",
    background: "transparent",
    color: "var(--app-accent)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
};
