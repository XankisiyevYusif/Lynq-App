export default function ActivitiesCard({ posts }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>Activities</div>

      <div style={styles.list}>
        {posts.map((post) => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postText}>
              {post.content}
            </div>

            <div style={styles.postMeta}>
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        Show all posts →
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
    marginBottom: 12,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },

  post: {
    paddingBottom: 12,
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },

  postText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.85)",
    lineHeight: "20px",
  },

  postMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "#6b6f73",
  },

  footer: {
    marginTop: 12,
    fontSize: 14,
    color: "#0073b1",
    fontWeight: 600,
    cursor: "pointer",
  },
};