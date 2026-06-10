import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../../components/Layout/Navbar";
import defaultAvatar from "../../assets/default-avatar.png";
import { SearchContext } from "../../context/SearchContext";
import { searchJobs, searchUsers } from "../../services/searchApi";
import api from "../../services/api";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
const PEOPLE_PAGE_SIZE = 6;
const JOBS_PAGE_SIZE = 6;

export default function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("query") || "";

  const { setQuery } = useContext(SearchContext);

  const [searchText, setSearchText] = useState(urlQuery);
  const [activeTab, setActiveTab] = useState("all");

  const [people, setPeople] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [peoplePage, setPeoplePage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);

  const [loadingPeople, setLoadingPeople] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);

  useEffect(() => {
    setSearchText(urlQuery);
    setQuery(urlQuery);
    setPeoplePage(1);
    setJobsPage(1);
  }, [urlQuery, setQuery]);

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ROOT}/${path.replace(/^\/+/, "")}`;
  };

  const cleanQuery = searchText.trim();

  const peopleTotalPages = Math.max(
    1,
    Math.ceil(people.length / PEOPLE_PAGE_SIZE)
  );

  const pagedPeople = useMemo(() => {
    const start = (peoplePage - 1) * PEOPLE_PAGE_SIZE;
    return people.slice(start, start + PEOPLE_PAGE_SIZE);
  }, [people, peoplePage]);

  const allPeoplePreview = people.slice(0, 3);
  const allJobsPreview = jobs.slice(0, 3);

  const submitSearch = (e) => {
    e?.preventDefault?.();

    const nextQuery = searchText.trim();

    setQuery(nextQuery);
    setPeoplePage(1);
    setJobsPage(1);

    if (!nextQuery) {
      setSearchParams({});
      return;
    }

    setSearchParams({ query: nextQuery });
  };

  const goToProfile = (username) => {
    if (!username) return;
    navigate(`/profile/${username}`);
  };

  const goToJob = (job) => {
    navigate("/jobs", {
      state: {
        query: cleanQuery,
        selectedJobId: job.id,
      },
    });
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPeoplePage(1);
    setJobsPage(1);
  };

  useEffect(() => {
    const fetchPeople = async () => {
      if (!urlQuery.trim()) {
        setPeople([]);
        return;
      }

      try {
        setLoadingPeople(true);
        const res = await searchUsers(urlQuery.trim());
        setPeople(res);
      } catch (err) {
        console.error("People search failed:", err);
        setPeople([]);
      } finally {
        setLoadingPeople(false);
      }
    };

    fetchPeople();
  }, [urlQuery]);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!urlQuery.trim()) {
        setJobs([]);
        return;
      }

      try {
        setLoadingJobs(true);

        const pageToLoad = activeTab === "jobs" ? jobsPage : 1;
        const res = await searchJobs(
          urlQuery.trim(),
          pageToLoad,
          JOBS_PAGE_SIZE
        );

        setJobs(res);
      } catch (err) {
        console.error("Jobs search failed:", err);
        setJobs([]);
      } finally {
        setLoadingJobs(false);
      }
    };

    fetchJobs();
  }, [urlQuery, activeTab, jobsPage]);

  const renderPersonCard = (user) => {
    const isEmployer =
      user.userType === "Employer" ||
      user.UserType === "Employer" ||
      user.role === "Employer" ||
      user.Role === "Employer";

    return (
      <div key={user.id || user.username} style={styles.personCard}>
        <img
          src={getImageUrl(user.profileImage)}
          alt=""
          style={{
            ...styles.personAvatar,
            borderRadius: isEmployer ? 10 : "50%",
          }}
        />

        <div
          style={styles.personInfo}
          onClick={() => goToProfile(user.username)}
        >
          <h3 style={styles.personName}>
            {user.fullName || user.name || user.username}
          </h3>

          <p style={styles.personHeadline}>
            {user.currentPosition ||
              user.bio ||
              (isEmployer ? "Company profile" : "Profile")}
          </p>

          <p style={styles.personMeta}>
            {isEmployer ? "Company" : "Person"}
            {user.location ? ` · ${user.location}` : ""}
          </p>
        </div>

        <button
          type="button"
          style={styles.viewButton}
          onClick={() => goToProfile(user.username)}
        >
          View
        </button>
      </div>
    );
  };

  const renderJobCard = (job) => (
    <div key={job.id} style={styles.jobCard} onClick={() => goToJob(job)}>
      <img
        src={getImageUrl(job.companyLogo || job.employerProfileImage)}
        alt=""
        style={styles.companyLogo}
      />

      <div style={styles.jobInfo}>
        <h3 style={styles.jobTitle}>{job.title}</h3>

        <p style={styles.companyName}>
          {job.companyName || job.employerName || "Company"}
        </p>

        <p style={styles.jobMeta}>
          {job.location || "Location not specified"}
          {job.workplaceType ? ` · ${job.workplaceType}` : ""}
          {job.employmentType ? ` · ${job.employmentType}` : ""}
        </p>

        {job.canApply === false && (
          <p style={styles.closedText}>Applications closed</p>
        )}
      </div>

      <button type="button" style={styles.openJobButton}>
        Open
      </button>
    </div>
  );

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.layout}>
          <aside style={styles.sidebar}>
            <h2 style={styles.sidebarTitle}>Search</h2>

            <button
              type="button"
              style={{
                ...styles.tabButton,
                ...(activeTab === "all" ? styles.activeTab : {}),
              }}
              onClick={() => switchTab("all")}
            >
              All results
            </button>

            <button
              type="button"
              style={{
                ...styles.tabButton,
                ...(activeTab === "people" ? styles.activeTab : {}),
              }}
              onClick={() => switchTab("people")}
            >
              People
            </button>

            <button
              type="button"
              style={{
                ...styles.tabButton,
                ...(activeTab === "jobs" ? styles.activeTab : {}),
              }}
              onClick={() => switchTab("jobs")}
            >
              Jobs
            </button>
          </aside>

          <main style={styles.main}>
            <form style={styles.searchBox} onSubmit={submitSearch}>
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search people, companies or jobs"
                style={styles.searchInput}
              />

              <button type="submit" style={styles.searchButton}>
                Search
              </button>
            </form>

            {!urlQuery.trim() && (
              <div style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>Search WorkHub</h2>
                <p style={styles.emptyText}>
                  Search for people, companies, and job posts.
                </p>
              </div>
            )}

            {urlQuery.trim() && (
              <div style={styles.resultsCard}>
                <div style={styles.resultsHeader}>
                  <h2 style={styles.resultsTitle}>
                    Search results for “{urlQuery}”
                  </h2>
                </div>

                {activeTab === "all" && (
                  <>
                    <section style={styles.section}>
                      <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>People</h3>

                        {people.length > 3 && (
                          <button
                            type="button"
                            style={styles.linkButton}
                            onClick={() => switchTab("people")}
                          >
                            See all people
                          </button>
                        )}
                      </div>

                      {loadingPeople ? (
                        <p style={styles.info}>Loading people...</p>
                      ) : allPeoplePreview.length > 0 ? (
                        allPeoplePreview.map(renderPersonCard)
                      ) : (
                        <p style={styles.info}>No people found.</p>
                      )}
                    </section>

                    <section style={styles.section}>
                      <div style={styles.sectionHeader}>
                        <h3 style={styles.sectionTitle}>Jobs</h3>

                        {jobs.length > 3 && (
                          <button
                            type="button"
                            style={styles.linkButton}
                            onClick={() => switchTab("jobs")}
                          >
                            See all jobs
                          </button>
                        )}
                      </div>

                      {loadingJobs ? (
                        <p style={styles.info}>Loading jobs...</p>
                      ) : allJobsPreview.length > 0 ? (
                        allJobsPreview.map(renderJobCard)
                      ) : (
                        <p style={styles.info}>No jobs found.</p>
                      )}
                    </section>
                  </>
                )}

                {activeTab === "people" && (
                  <section style={styles.section}>
                    {loadingPeople ? (
                      <p style={styles.info}>Loading people...</p>
                    ) : pagedPeople.length > 0 ? (
                      pagedPeople.map(renderPersonCard)
                    ) : (
                      <p style={styles.info}>No people found.</p>
                    )}

                    {people.length > PEOPLE_PAGE_SIZE && (
                      <div style={styles.pagination}>
                        <button
                          type="button"
                          style={{
                            ...styles.pageButton,
                            ...(peoplePage === 1
                              ? styles.disabledPageButton
                              : {}),
                          }}
                          disabled={peoplePage === 1}
                          onClick={() =>
                            setPeoplePage((prev) => Math.max(1, prev - 1))
                          }
                        >
                          ‹ Back
                        </button>

                        <span style={styles.pageText}>
                          Page {peoplePage} of {peopleTotalPages}
                        </span>

                        <button
                          type="button"
                          style={{
                            ...styles.pageButton,
                            ...(peoplePage >= peopleTotalPages
                              ? styles.disabledPageButton
                              : {}),
                          }}
                          disabled={peoplePage >= peopleTotalPages}
                          onClick={() =>
                            setPeoplePage((prev) =>
                              Math.min(peopleTotalPages, prev + 1)
                            )
                          }
                        >
                          Next ›
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {activeTab === "jobs" && (
                  <section style={styles.section}>
                    {loadingJobs ? (
                      <p style={styles.info}>Loading jobs...</p>
                    ) : jobs.length > 0 ? (
                      jobs.map(renderJobCard)
                    ) : (
                      <p style={styles.info}>No jobs found.</p>
                    )}

                    <div style={styles.pagination}>
                      <button
                        type="button"
                        style={{
                          ...styles.pageButton,
                          ...(jobsPage === 1 ? styles.disabledPageButton : {}),
                        }}
                        disabled={jobsPage === 1}
                        onClick={() =>
                          setJobsPage((prev) => Math.max(1, prev - 1))
                        }
                      >
                        ‹ Back
                      </button>

                      <span style={styles.pageText}>Page {jobsPage}</span>

                      <button
                        type="button"
                        style={{
                          ...styles.pageButton,
                          ...(jobs.length < JOBS_PAGE_SIZE
                            ? styles.disabledPageButton
                            : {}),
                        }}
                        disabled={jobs.length < JOBS_PAGE_SIZE}
                        onClick={() => setJobsPage((prev) => prev + 1)}
                      >
                        Next ›
                      </button>
                    </div>
                  </section>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    padding: "24px 0 60px",
  },

  layout: {
    width: "1120px",
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    gap: 18,
  },

  sidebar: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 14,
    height: "fit-content",
    position: "sticky",
    top: 84,
  },

  sidebarTitle: {
    margin: "0 0 14px",
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
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

  main: {
    minWidth: 0,
  },

  searchBox: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    gap: 10,
    marginBottom: 12,
  },

  searchInput: {
    flex: 1,
    border: "1px solid #ccc",
    borderRadius: 22,
    padding: "11px 14px",
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

  resultsCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    overflow: "hidden",
  },

  resultsHeader: {
    padding: "16px 18px",
    borderBottom: "1px solid #eee",
  },

  resultsTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
  },

  section: {
    padding: "8px 0",
    borderBottom: "1px solid #eee",
  },

  sectionHeader: {
    padding: "8px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "#222",
  },

  linkButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#0a66c2",
    fontWeight: 700,
    cursor: "pointer",
  },

  personCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderTop: "1px solid #f1f1f1",
  },

  personAvatar: {
    width: 58,
    height: 58,
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },

  personName: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 700,
    color: "#111",
  },

  personHeadline: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#444",
  },

  personMeta: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },

  viewButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 999,
    padding: "7px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  jobCard: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderTop: "1px solid #f1f1f1",
    cursor: "pointer",
  },

  companyLogo: {
    width: 58,
    height: 58,
    borderRadius: 10,
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  jobInfo: {
    flex: 1,
    minWidth: 0,
  },

  jobTitle: {
    margin: "0 0 4px",
    fontSize: 17,
    fontWeight: 700,
    color: "#0a66c2",
  },

  companyName: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#222",
  },

  jobMeta: {
    margin: 0,
    fontSize: 13,
    color: "#666",
  },

  closedText: {
    margin: "5px 0 0",
    color: "#b24020",
    fontSize: 13,
    fontWeight: 700,
  },

  openJobButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 999,
    padding: "7px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  info: {
    padding: "12px 18px",
    color: "#666",
    fontSize: 14,
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderTop: "1px solid #eee",
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

  emptyState: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 28,
    textAlign: "center",
  },

  emptyTitle: {
    margin: "0 0 8px",
    fontSize: 22,
    color: "#111",
  },

  emptyText: {
    margin: 0,
    color: "#666",
  },
};