import React from "react";

export default function EmployerHome({ user, onOpenAbout }) {
  const company = user?.companyInfo || {};
  const overview = company.bio || user?.about?.bio || "";

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} onClick={onOpenAbout}>
        <h2 style={styles.title}>About</h2>

        <p style={styles.text}>
          {overview
            ? overview.length > 220
              ? `${overview.slice(0, 220)}...`
              : overview
            : "Company overview has not been added yet."}
        </p>

        <button style={styles.linkBtn}>View about section</button>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
    maxWidth: 820,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    cursor: "pointer",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },
  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 650,
    color: "#222",
  },
  text: {
    color: "#666",
    lineHeight: 1.5,
    marginTop: 10,
    marginBottom: 0,
    fontSize: 14,
    fontWeight: 400,
  },
  linkBtn: {
    marginTop: 12,
    border: "none",
    backgroundColor: "transparent",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    padding: 0,
    fontSize: 14,
  },
};