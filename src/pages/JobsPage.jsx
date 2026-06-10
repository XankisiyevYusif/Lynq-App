import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import JobPostItem from "../components/Post/JobPosts/JobPostItem";
import CreateJobPostBox from "../components/Post/JobPosts/CreateJobPostBox";

export default function JobsPage() {
  const location = useLocation();
  const user = useSelector((state) => state.user.user);

  const isEmployer =
    user?.userType === "Employer" ||
    user?.UserType === "Employer" ||
    user?.role === "Employer" ||
    user?.Role === "Employer";

  const companyUsernameFromProfile = location.state?.companyUsername;
  const queryFromSearch = location.state?.query || "";
  const selectedJobIdFromSearch = location.state?.selectedJobId;

  const [activeTab, setActiveTab] = useState("all");
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [query, setQuery] = useState(queryFromSearch);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const getResponseData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.Data)) return res.data.Data;
    return [];
  };

  const tabs = isEmployer
    ? [
        {
          key: "all",
          label: companyUsernameFromProfile ? "Company jobs" : "All jobs",
        },
        { key: "saved", label: "Saved jobs" },
        { key: "my", label: "My job posts" },
      ]
    : [
        {
          key: "all",
          label: companyUsernameFromProfile ? "Company jobs" : "All jobs",
        },
        { key: "saved", label: "Saved jobs" },
        { key: "applied", label: "Applied jobs" },
      ];

  const buildEndpoint = () => {
    if (companyUsernameFromProfile && activeTab === "all") {
      return `/JobPost/employer/${companyUsernameFromProfile}?page=${page}&pageSize=10`;
    }

    if (activeTab === "saved") {
      return `/JobPost/saved?page=${page}&pageSize=10`;
    }

    if (activeTab === "applied") {
      return `/JobPost/applied?page=${page}&pageSize=10`;
    }

    if (activeTab === "my") {
      return `/JobPost/my?page=${page}&pageSize=10`;
    }

    const search = query.trim();

    return `/JobPost?page=${page}&pageSize=10${
      search ? `&query=${encodeURIComponent(search)}` : ""
    }`;
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const res = await api.get(buildEndpoint());
      const list = getResponseData(res);

      setJobs(list);

      setSelectedJob((prev) => {
        if (!list.length) return null;

        if (selectedJobIdFromSearch) {
          const foundFromSearch = list.find(
            (j) => Number(j.id) === Number(selectedJobIdFromSearch)
          );

          if (foundFromSearch) return foundFromSearch;
        }

        if (prev && list.some((j) => Number(j.id) === Number(prev.id))) {
          return list.find((j) => Number(j.id) === Number(prev.id));
        }

        return list[0];
      });
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setJobs([]);
      setSelectedJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setQuery(queryFromSearch);
    setPage(1);
  }, [queryFromSearch]);

  useEffect(() => {
    fetchJobs();
  }, [activeTab, page, companyUsernameFromProfile, queryFromSearch]);

  useEffect(() => {
    if (isEmployer && activeTab === "applied") {
      setActiveTab("all");
    }
  }, [isEmployer, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);

    setTimeout(() => {
      fetchJobs();
    }, 0);
  };

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
    setSelectedJob(null);
  };

  const handleCreated = (job) => {
    if (activeTab === "my") {
      setJobs((prev) => [job, ...prev]);
      setSelectedJob(job);
    } else {
      setActiveTab("my");
      setPage(1);
    }
  };

  const handleSavedChanged = (jobId, isSaved) => {
    if (activeTab === "saved" && !isSaved) {
      const next = jobs.filter((j) => Number(j.id) !== Number(jobId));
      setJobs(next);
      setSelectedJob(next[0] || null);
      return;
    }

    setJobs((prev) =>
      prev.map((j) => (Number(j.id) === Number(jobId) ? { ...j, isSaved } : j))
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(jobId) ? { ...prev, isSaved } : prev
    );
  };

  const handleApplied = (jobId) => {
    setJobs((prev) =>
      prev.map((j) =>
        Number(j.id) === Number(jobId) ? { ...j, isApplied: true } : j
      )
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(jobId)
        ? { ...prev, isApplied: true }
        : prev
    );
  };

  const handleDeleted = (jobId) => {
    const next = jobs.filter((j) => Number(j.id) !== Number(jobId));
    setJobs(next);
    setSelectedJob(next[0] || null);
  };

  const handleUpdated = (updatedJob) => {
    setJobs((prev) =>
      prev.map((j) =>
        Number(j.id) === Number(updatedJob.id) ? { ...j, ...updatedJob } : j
      )
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(updatedJob.id)
        ? { ...prev, ...updatedJob }
        : prev
    );
  };

  const titleText = () => {
    if (activeTab === "all") {
      if (companyUsernameFromProfile) return "Company jobs";
      if (query.trim()) return `Job results for “${query.trim()}”`;
      return "Job results";
    }

    if (activeTab === "saved") return "Saved jobs";
    if (activeTab === "applied") return "Applied jobs";
    if (activeTab === "my") return "My job posts";

    return "Jobs";
  };

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <aside style={styles.sidebar}>
          <h2 style={styles.sidebarTitle}>Jobs</h2>

          <div style={styles.tabList}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? styles.activeTab : {}),
                }}
                onClick={() => handleTabClick(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isEmployer && (
            <div style={styles.createBoxWrap}>
              <CreateJobPostBox onCreated={handleCreated} />
            </div>
          )}
        </aside>

        <main style={styles.main}>
          {activeTab === "all" && !companyUsernameFromProfile && (
            <div style={styles.searchBar}>
              <form onSubmit={handleSearch} style={styles.searchForm}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search jobs by title, company or location"
                  style={styles.searchInput}
                />

                <button style={styles.searchButton}>Search</button>
              </form>
            </div>
          )}

          <div style={styles.jobsLayout}>
            <section style={styles.listPanel}>
              <div style={styles.listHeader}>
                <h3 style={styles.listTitle}>{titleText()}</h3>
              </div>

              {loading && <p style={styles.info}>Loading jobs...</p>}

              {!loading && !jobs.length && (
                <p style={styles.info}>No job posts found.</p>
              )}

              {!loading &&
                jobs.map((job) => (
                  <JobPostItem
                    key={job.id}
                    job={job}
                    compact
                    selected={selectedJob?.id === job.id}
                    onClick={() => setSelectedJob(job)}
                    onSavedChanged={handleSavedChanged}
                    onApplied={handleApplied}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                ))}

              <div style={styles.pagination}>
                <button
                  style={{
                    ...styles.pageButton,
                    ...(page === 1 ? styles.disabledPageButton : {}),
                  }}
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  ‹ Back
                </button>

                <span style={styles.pageText}>Page {page}</span>

                <button
                  style={{
                    ...styles.pageButton,
                    ...(jobs.length < 10 ? styles.disabledPageButton : {}),
                  }}
                  disabled={jobs.length < 10}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next ›
                </button>
              </div>
            </section>

            <section style={styles.detailPanel}>
              {selectedJob ? (
                <JobPostItem
                  job={selectedJob}
                  onSavedChanged={handleSavedChanged}
                  onApplied={handleApplied}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ) : (
                <div style={styles.emptyDetail}>Select a job to view details.</div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    padding: "24px",
    display: "grid",
    gridTemplateColumns: "260px minmax(0, 1fr)",
    gap: 18,
    boxSizing: "border-box",
  },

  sidebar: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    height: "fit-content",
    position: "sticky",
    top: 84,
  },

  sidebarTitle: {
    margin: "0 0 16px",
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
  },

  tabList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },

  tabButton: {
    width: "100%",
    textAlign: "left",
    border: "none",
    backgroundColor: "transparent",
    padding: "11px 12px",
    borderRadius: 8,
    cursor: "pointer",
    color: "#222",
    fontWeight: 700,
    fontSize: 14,
  },

  activeTab: {
    backgroundColor: "#eef3f8",
    color: "#0a66c2",
  },

  createBoxWrap: {
    marginTop: 18,
  },

  main: {
    minWidth: 0,
  },

  searchBar: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },

  searchForm: {
    display: "flex",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    border: "1px solid #ccc",
    borderRadius: 22,
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
  },

  searchButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 22,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  jobsLayout: {
    display: "grid",
    gridTemplateColumns: "420px minmax(0, 1fr)",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    overflow: "hidden",
    minHeight: "calc(100vh - 150px)",
  },

  listPanel: {
    borderRight: "1px solid #ddd",
    overflowY: "auto",
    maxHeight: "calc(100vh - 150px)",
    backgroundColor: "#fff",
  },

  listHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid #eee",
    backgroundColor: "#fff",
    position: "sticky",
    top: 0,
    zIndex: 2,
  },

  listTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#222",
  },

  detailPanel: {
    overflowY: "auto",
    maxHeight: "calc(100vh - 150px)",
    backgroundColor: "#fff",
  },

  info: {
    padding: 16,
    color: "#666",
    fontSize: 14,
  },

  emptyDetail: {
    padding: 30,
    color: "#666",
    fontSize: 15,
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderTop: "1px solid #eee",
    backgroundColor: "#fff",
  },

  pageButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#0a66c2",
    fontWeight: 700,
    cursor: "pointer",
  },

  disabledPageButton: {
    color: "#aaa",
    cursor: "not-allowed",
  },

  pageText: {
    color: "#666",
    fontSize: 13,
  },
};