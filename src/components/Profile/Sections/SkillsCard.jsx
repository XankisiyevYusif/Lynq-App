import React, { useMemo, useState } from "react";
import EmptySectionCard from "./EmptySectionCard";

export default function SkillsCard({
  skills = [],
  isOwner,
  readOnly,
  onEdit,
}) {
  const [showAll, setShowAll] = useState(false);
  const previewCount = 5;

  const normalizedSkills = useMemo(() => {
    return Array.isArray(skills)
      ? skills
          .map((skill) => {
            if (typeof skill === "string") return skill.trim();

            if (skill && typeof skill === "object") {
              return (skill.name || skill.skillName || "").trim();
            }

            return "";
          })
          .filter(Boolean)
      : [];
  }, [skills]);

  const hasData = normalizedSkills.length > 0;

  if (!hasData && !isOwner) return null;

  if (!hasData && isOwner) {
    return (
      <EmptySectionCard
        title="Skills"
        description="Add your skills so others can better understand what you do."
        buttonText="Add skills"
        onAdd={onEdit}
      />
    );
  }

  const visibleSkills = showAll
    ? normalizedSkills
    : normalizedSkills.slice(0, previewCount);

  const hasMore = normalizedSkills.length > previewCount;

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Skills</h3>

        {!readOnly && isOwner && (
          <button style={styles.editButton} onClick={onEdit}>
            Edit
          </button>
        )}
      </div>

      <div style={styles.skillsWrap}>
        {visibleSkills.map((skill, index) => (
          <div key={`${skill}-${index}`} style={styles.skillBadge}>
            {skill}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          type="button"
          style={styles.toggleButton}
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll
            ? "Show less"
            : `Show all skills (${normalizedSkills.length})`}
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

  editButton: {
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
    padding: 0,
  },

  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },

  skillBadge: {
    padding: "8px 14px",
    borderRadius: 20,
    backgroundColor: "#eef3f8",
    color: "#1d2226",
    fontSize: 14,
    fontWeight: 500,
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