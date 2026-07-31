import React from "react";

export default function EmployerTabs({ activeTab, onChange }) {
  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "about", label: "About" },
    { key: "posts", label: "Posts" },
    { key: "jobs", label: "Jobs" },
    { key: "people", label: "People" },
    { key: "events", label: "Events" },
  ];

  return (
    <div className="employer-tabs">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;

        return (
          <button
            className={`employer-tab ${active ? "is-active" : ""}`}
            key={tab.key}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
