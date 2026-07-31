import React, { useMemo, useState } from "react";
import EmptySectionCard from "./EmptySectionCard";
import ProfileIcon from "../ProfileIcon";

export default function SkillsCard({ skills = [], isOwner, readOnly, onEdit }) {
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
    <div className="profile-section-card" style={styles.card}>
      <div style={styles.header}>
        <h3 className="profile-section-title" style={styles.title}>
          Skills
        </h3>

        {!readOnly && isOwner && (
          <button
            type="button"
            className="profile-icon-button profile-section-add-button"
            style={styles.addButton}
            onClick={onEdit}
            aria-label="Add skill"
            title="Add skill"
          >
            <ProfileIcon name="plus" size={19} strokeWidth={2.4} />
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

  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },

  skillBadge: {
    padding: "8px 14px",
    borderRadius: 20,
    backgroundColor: "var(--app-surface-2)",
    color: "var(--app-text-soft)",
    fontSize: 14,
    fontWeight: 500,
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
