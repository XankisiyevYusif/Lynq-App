export default function ExperienceItem({ experience, onEdit, onDelete }) {
  const { title, companyName, startDate, endDate, isCurrent, description, location } = experience;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <p style={styles.title}>{title}</p>
        <div>
          <button style={styles.editBtn} onClick={onEdit}>Edit</button>
          <button style={styles.deleteBtn} onClick={onDelete}>Delete</button>
        </div>
      </div>

      <p style={styles.company}>
        {companyName}
        {location ? ` • ${location}` : ""}
      </p>

      <p style={styles.dateText}>
        {formatDate(startDate)} – {isCurrent ? "Present" : formatDate(endDate)}
      </p>

      {description && <p style={styles.description}>{description}</p>}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px 12px",
    borderBottom: "1px solid #e6e6e6",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: 600,
  },
  editBtn: {
    backgroundColor: "#ffc107",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    marginRight: "6px",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
  },
};
