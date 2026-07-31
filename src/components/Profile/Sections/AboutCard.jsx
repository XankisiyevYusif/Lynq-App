import ProfileIcon from "../ProfileIcon";

export default function AboutCard({ about, isOwner, readOnly, onEdit }) {
  const canEdit = Boolean(isOwner && !readOnly && onEdit);

  return (
    <div className="profile-section-card profile-about-card" style={styles.card}>
      <div style={styles.headerRow}>
        <div className="profile-section-title" style={styles.header}>
          About
        </div>

        {canEdit && (
          <button
            type="button"
            className="profile-icon-button"
            style={styles.editButton}
            onClick={onEdit}
            title="Edit about"
            aria-label="Edit about"
          >
            <ProfileIcon name="edit" size={18} />
          </button>
        )}
      </div>

      <div className="profile-about-content" style={styles.content}>
        {about?.bio ? about.bio : "No information provided yet."}
      </div>
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

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },

  header: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--app-text)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },

  editButton: {
    width: 32,
    height: 32,
    border: "none",
    borderRadius: "50%",
    background: "transparent",
    color: "var(--app-accent)",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    fontSize: 14,
    lineHeight: "20px",
    color: "var(--app-text-soft)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    whiteSpace: "pre-line",
  },
};
