export default function ActivitiesEmpty() {
  return (
    <div style={styles.card}>
      <div style={styles.header}>Activities</div>
      <div style={styles.text}>
        You haven’t shared any posts yet.
      </div>
      <div style={styles.action}>
        Create a post
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    padding: "16px 20px",
  },
  header: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 8,
        fontFamily:
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  },
  text: {
    fontSize: 14,
    color: "#6b6f73",
    fontFamily:
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  },
  action: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: 600,
    color: "#0073b1",
    cursor: "pointer",
        fontFamily:
      `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`,
  },
};