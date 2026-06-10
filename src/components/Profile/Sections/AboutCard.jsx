export default function AboutCard({ about }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>About</div>

      <div style={styles.content}>
        {about.bio
          ? about.bio
          : "No information provided yet."}
      </div>
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
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
    marginBottom: 12,
    color: "rgba(0,0,0,0.9)",
    fontFamily:
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  },

  content: {
    fontSize: 14,
    lineHeight: "20px",
    color: "rgba(0,0,0,0.75)",
    fontFamily:
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
    whiteSpace: "pre-line", // line break-lər üçün
  },
};



