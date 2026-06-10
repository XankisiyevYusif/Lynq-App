import React, { useState } from "react";
import EmptySectionCard from "./EmptySectionCard";
import educationImage from "../../../assets/Education.png";
import pencil from "../../../assets/pencil.png";

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
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Education</h3>
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
                      src={educationImage}
                      alt="education"
                      style={styles.educationIcon}
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
                    style={styles.iconButton}
                    onClick={() => onEditEducation?.(item)}
                  >
                    <img src={pencil} alt="edit" style={styles.itemPencil} />
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
          {showAll
            ? "Show less"
            : `Show all education (${educations.length})`}
        </button>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
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
    color: "#1d2226",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
    backgroundColor: "#eef3f8",
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
  },

  itemPencil: {
    width: 18,
    height: 18,
    objectFit: "contain",
  },

  schoolName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#1d2226",
    marginBottom: 4,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  degreeField: {
    fontSize: 15,
    color: "#444",
    marginBottom: 4,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  meta: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  note: {
    margin: "6px 0 0 0",
    fontSize: 14,
    color: "#333",
    lineHeight: 1.6,
    whiteSpace: "pre-line",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  toggleButton: {
    marginTop: 16,
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },
};