import ProfileIcon from "../ProfileIcon";

export default function ActivitiesCard({ posts }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>Activities</div>

      <div style={styles.list}>
        {posts.map((post) => (
          <div key={post.id} style={styles.post}>
            <div style={styles.postText}>{post.content}</div>

            <div style={styles.postMeta}>
              {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <span>Show all posts</span>
        <ProfileIcon name="arrowRight" size={17} />
      </div>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
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
    color: "var(--app-text)",
    lineHeight: "20px",
  },

  postMeta: {
    marginTop: 6,
    fontSize: 12,
    color: "var(--app-muted)",
  },

  footer: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    fontSize: 14,
    color: "#0073b1",
    fontWeight: 600,
    cursor: "pointer",
  },
};
