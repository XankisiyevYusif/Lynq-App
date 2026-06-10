import React from "react";

export default function EmployerTabs({ activeTab, onChange }) {
  const tabs = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "posts", label: "Posts" },
    { key: "jobs", label: "Jobs" },
  ];

  return (
    <div style={styles.tabs}>
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            style={{
              ...styles.tab,
              ...(active ? styles.activeTab : {}),
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  tabs: {
    width: "100%",
    maxWidth: 820,
    display: "flex",
    gap: 18,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: "0 18px",
    boxSizing: "border-box",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },
  tab: {
    height: 48,
    border: "none",
    backgroundColor: "transparent",
    color: "#666",
    fontWeight: 600,
    cursor: "pointer",
    borderBottom: "3px solid transparent",
    fontSize: 14,
  },
  activeTab: {
    color: "#057642",
    borderBottom: "3px solid #057642",
  },
};