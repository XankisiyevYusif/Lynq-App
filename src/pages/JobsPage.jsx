import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import JobPostItem from "../components/Post/JobPosts/JobPostItem";
import CreateJobPostBox from "../components/Post/JobPosts/CreateJobPostBox";
import "./JobsPage.css";

const Icon = ({ name, size = 19 }) => {
  const paths = {
    briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    bookmark: <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z"/>,
    check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10 21v-3h4v3"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    sliders: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg className="jobs-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
};

export default function JobsPage() {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    jobTitles: [],
    locations: [],
    workplaceTypes: [],
    employmentTypes: [],
    isOpenToWork: false,
    onsiteLocations: [],
    remoteLocations: [],
    startAvailability: "Immediately",
  });
  const [preferenceDraft, setPreferenceDraft] = useState({
    jobTitles: "",
    locations: "",
    workplaceTypes: [],
    employmentTypes: [],
    isOpenToWork: false,
    onsiteLocations: [],
    remoteLocations: [],
    startAvailability: "Immediately",
  });
  const [filters, setFilters] = useState({
    workplace: "all",
    employment: "all",
    status: "all",
    sort: "newest",
  });

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
          label: companyUsernameFromProfile ? "Company jobs" : "Recommended jobs",
        },
        { key: "saved", label: "Saved jobs" },
        { key: "applied", label: "Applied jobs" },
      ];

  const tabIcons = {
    all: "briefcase",
    saved: "bookmark",
    applied: "check",
    my: "building",
  };

  const displayedJobs = [...jobs]
    .filter((job) => filters.workplace === "all" || job.workplaceType === filters.workplace)
    .filter((job) => filters.employment === "all" || job.employmentType === filters.employment)
    .filter((job) => filters.status === "all" || (filters.status === "open" ? job.canApply : !job.canApply))
    .sort((a, b) => {
      const activeDifference = Number(Boolean(b.canApply)) - Number(Boolean(a.canApply));
      if (activeDifference !== 0) return activeDifference;
      if (filters.sort === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (filters.sort === "company") return (a.companyName || "").localeCompare(b.companyName || "");
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const hasActiveFilters = Object.entries(filters).some(([key, value]) =>
    key === "sort" ? value !== "newest" : value !== "all",
  );
  const isRecommendedMode =
    activeTab === "all" &&
    !isEmployer &&
    !companyUsernameFromProfile &&
    !query.trim();

  const openJobInsideSearch = (job) => {
    navigate(`/jobs/${encodeURIComponent(job.id)}`, {
      state: { jobPreview: job },
    });
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelectedJob(null);
  };

  const clearFilters = () => {
    setFilters({ workplace: "all", employment: "all", status: "all", sort: "newest" });
    setSelectedJob(null);
  };

  const normalizePreference = (value) => {
    const source = value?.data ?? value?.Data ?? value ?? {};
    return {
      jobTitles: source.jobTitles ?? source.JobTitles ?? [],
      locations: source.locations ?? source.Locations ?? [],
      workplaceTypes: source.workplaceTypes ?? source.WorkplaceTypes ?? [],
      employmentTypes: source.employmentTypes ?? source.EmploymentTypes ?? [],
      isOpenToWork: source.isOpenToWork ?? source.IsOpenToWork ?? false,
      onsiteLocations: source.onsiteLocations ?? source.OnsiteLocations ?? [],
      remoteLocations: source.remoteLocations ?? source.RemoteLocations ?? [],
      startAvailability:
        source.startAvailability ?? source.StartAvailability ?? "Immediately",
    };
  };

  const splitPreferenceText = (value) =>
    String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, list) =>
        list.findIndex((candidate) => candidate.toLowerCase() === item.toLowerCase()) === index,
      )
      .slice(0, 8);

  const fetchPreferences = async () => {
    if (isEmployer) return;
    try {
      setPreferencesLoading(true);
      const response = await api.get("/JobPreferences");
      const next = normalizePreference(response.data);
      setPreferences(next);
      setPreferenceDraft({
        jobTitles: next.jobTitles.join(", "),
        locations: next.locations.join(", "),
        workplaceTypes: next.workplaceTypes,
        employmentTypes: next.employmentTypes,
        isOpenToWork: next.isOpenToWork,
        onsiteLocations: next.onsiteLocations,
        remoteLocations: next.remoteLocations,
        startAvailability: next.startAvailability,
      });
    } catch (error) {
      console.error("Failed to load job preferences:", error);
    } finally {
      setPreferencesLoading(false);
    }
  };

  const toggleDraftOption = (key, value) => {
    setPreferenceDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const savePreferences = async () => {
    const payload = {
      jobTitles: splitPreferenceText(preferenceDraft.jobTitles),
      locations: splitPreferenceText(preferenceDraft.locations),
      workplaceTypes: preferenceDraft.workplaceTypes,
      employmentTypes: preferenceDraft.employmentTypes,
      isOpenToWork: preferenceDraft.isOpenToWork,
      onsiteLocations: preferenceDraft.onsiteLocations,
      remoteLocations: preferenceDraft.remoteLocations,
      startAvailability: preferenceDraft.startAvailability,
    };
    try {
      setPreferencesSaving(true);
      const response = await api.put("/JobPreferences", payload);
      setPreferences(normalizePreference(response.data));
      setPreferencesOpen(false);
      setPage(1);
      await fetchJobs();
    } catch (error) {
      console.error("Failed to save job preferences:", error);
    } finally {
      setPreferencesSaving(false);
    }
  };

  const buildEndpoint = (searchOverride) => {
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

    const search = (searchOverride ?? query).trim();

    return `/JobPost?page=${page}&pageSize=10${
      search ? `&query=${encodeURIComponent(search)}` : ""
    }`;
  };

  const fetchJobs = async (searchOverride) => {
    try {
      setLoading(true);

      const showRecommendations =
        !isEmployer &&
        activeTab === "all" &&
        !companyUsernameFromProfile &&
        !(searchOverride ?? query).trim();
      const endpoint = showRecommendations
        ? "/JobPreferences/recommended?take=10"
        : buildEndpoint(searchOverride);
      const res = await api.get(endpoint);
      const list = getResponseData(res);

      setJobs(list);

      setSelectedJob((prev) => {
        if (!list.length) return null;

        if (selectedJobIdFromSearch) {
          const foundFromSearch = list.find(
            (j) => Number(j.id) === Number(selectedJobIdFromSearch),
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
    fetchPreferences();
  }, [isEmployer, companyUsernameFromProfile, queryFromSearch]);

  useEffect(() => {
    if (isEmployer && activeTab === "applied") {
      setActiveTab("all");
    }
  }, [isEmployer, activeTab]);

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
      prev.map((j) => (Number(j.id) === Number(jobId) ? { ...j, isSaved } : j)),
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(jobId) ? { ...prev, isSaved } : prev,
    );
  };

  const handleApplied = (jobId) => {
    const appliedAt = new Date().toISOString();
    setJobs((prev) =>
      prev.map((j) =>
        Number(j.id) === Number(jobId) ? { ...j, isApplied: true, appliedAt } : j,
      ),
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(jobId)
        ? { ...prev, isApplied: true, appliedAt }
        : prev,
    );
  };

  const handleApplicationWithdrawn = (jobId) => {
    if (activeTab === "applied") {
      const next = jobs.filter((job) => Number(job.id) !== Number(jobId));
      setJobs(next);
      setSelectedJob(next[0] || null);
      return;
    }

    setJobs((current) => current.map((job) =>
      Number(job.id) === Number(jobId)
        ? { ...job, isApplied: false, appliedAt: null }
        : job,
    ));
    setSelectedJob((current) =>
      current && Number(current.id) === Number(jobId)
        ? { ...current, isApplied: false, appliedAt: null }
        : current,
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
        Number(j.id) === Number(updatedJob.id) ? { ...j, ...updatedJob } : j,
      ),
    );

    setSelectedJob((prev) =>
      prev && Number(prev.id) === Number(updatedJob.id)
        ? { ...prev, ...updatedJob }
        : prev,
    );
  };

  const titleText = () => {
    if (activeTab === "all") {
      if (companyUsernameFromProfile) return "Company jobs";
      if (query.trim()) return `Job results for “${query.trim()}”`;
      if (!isEmployer) return "Recommended jobs";
      return "All jobs";
    }

    if (activeTab === "saved")
      return isEmployer ? "Saved job posts" : "Saved jobs";
    if (activeTab === "applied") return "Applied jobs";
    if (activeTab === "my") return "My job posts";

    return isEmployer ? "Hiring" : "Jobs";
  };

  return (
    <>
      <Navbar />

      <div className="jobs-page" style={styles.page}>
        <aside className="jobs-sidebar" style={styles.sidebar}>
          <div className="jobs-sidebar-heading">
            <span className="jobs-sidebar-mark"><Icon name="briefcase" size={21} /></span>
            <div>
              <h2 style={styles.sidebarTitle}>
                {isEmployer ? "Hiring" : "Jobs"}
              </h2>
              <small>
                {isEmployer ? "Manage company job posts" : "Manage your career"}
              </small>
            </div>
          </div>

          <div className="jobs-tab-list" style={styles.tabList}>
            <span className="jobs-nav-section-label">
              {companyUsernameFromProfile ? "Company" : "Browse"}
            </span>
            {tabs.filter((tab) => tab.key === "all").map((tab) => (
              <button
                className={`jobs-tab ${activeTab === tab.key ? "is-active" : ""}`}
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? styles.activeTab : {}),
                }}
                onClick={() => handleTabClick(tab.key)}
              >
                <span className="jobs-tab-icon"><Icon name={tabIcons[tab.key]} /></span>
                <span>{tab.label}</span>
                <Icon name="chevron" size={16} />
              </button>
            ))}

            <span className="jobs-nav-section-label jobs-nav-section-label-spaced">
              {isEmployer ? "Company workspace" : "My jobs"}
            </span>
            {tabs.filter((tab) => tab.key !== "all").map((tab) => (
              <button
                className={`jobs-tab ${activeTab === tab.key ? "is-active" : ""}`}
                key={tab.key}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.key ? styles.activeTab : {}),
                }}
                onClick={() => handleTabClick(tab.key)}
              >
                <span className="jobs-tab-icon"><Icon name={tabIcons[tab.key]} /></span>
                <span>{tab.label}</span>
                <Icon name="chevron" size={16} />
              </button>
            ))}

            {!isEmployer && !companyUsernameFromProfile && (
              <button
                className="jobs-preferences-button"
                type="button"
                onClick={() => setPreferencesOpen(true)}
              >
                <span className="jobs-tab-icon"><Icon name="target" /></span>
                <span><strong>Job preferences</strong><small>{preferences.jobTitles.length || preferences.locations.length ? "Personalized" : "Set your interests"}</small></span>
                <Icon name="chevron" size={16} />
              </button>
            )}
          </div>

          <div className="jobs-filter-divider" />
          <div className="jobs-filter-title">
            <span><Icon name="sliders" /> Filters</span>
            {hasActiveFilters && <button type="button" onClick={clearFilters}>Clear</button>}
          </div>

          <label className="jobs-filter-field">
            <span><Icon name="pin" size={17} /> Workplace</span>
            <select value={filters.workplace} onChange={(e) => updateFilter("workplace", e.target.value)}>
              <option value="all">All workplaces</option>
              <option value="On-site">On-site</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Remote">Remote</option>
            </select>
          </label>

          <label className="jobs-filter-field">
            <span><Icon name="briefcase" size={17} /> Job type</span>
            <select value={filters.employment} onChange={(e) => updateFilter("employment", e.target.value)}>
              <option value="all">All job types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </label>

          <label className="jobs-filter-field">
            <span><Icon name="clock" size={17} /> Status</span>
            <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)}>
              <option value="all">All statuses</option>
              <option value="open">Applications open</option>
              <option value="closed">Applications closed</option>
            </select>
          </label>

          <label className="jobs-filter-field">
            <span><Icon name="sliders" size={17} /> Sort by</span>
            <select value={filters.sort} onChange={(e) => updateFilter("sort", e.target.value)}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="company">Company A–Z</option>
            </select>
          </label>

          {isEmployer && (
            <div style={styles.createBoxWrap}>
              <CreateJobPostBox onCreated={handleCreated} />
            </div>
          )}
        </aside>

        <main style={styles.main}>
          <div
            className={`jobs-layout ${
              isRecommendedMode ? "is-recommendations" : ""
            }`}
            style={{
              ...styles.jobsLayout,
              ...(isRecommendedMode
                ? { gridTemplateColumns: "minmax(0, 1fr)" }
                : {}),
            }}
          >
            <section
              className={`jobs-list-panel ${
                isRecommendedMode ? "jobs-recommendation-panel" : ""
              }`}
              style={styles.listPanel}
            >
              <div className="jobs-list-header" style={styles.listHeader}>
                <div>
                  <h3 style={styles.listTitle}>{titleText()}</h3>
                  <p className="jobs-list-subtitle">
                    {activeTab === "applied"
                      ? "Your applications, newest first"
                      : activeTab === "saved"
                        ? "Jobs you saved for later"
                        : activeTab === "all" && !isEmployer && !companyUsernameFromProfile && !query.trim()
                          ? "Based on your job preferences and profile"
                          : "Active roles first, newest listings first"}
                  </p>
                </div>
                <div className="jobs-list-header-actions">
                  <span className="jobs-result-count">{displayedJobs.length} shown</span>
                  {activeTab === "all" && !isEmployer && !companyUsernameFromProfile && !query.trim() && (
                    <button type="button" className="jobs-more-button" onClick={() => navigate("/search?type=jobs")}>
                      More jobs <Icon name="chevron" size={15} />
                    </button>
                  )}
                </div>
              </div>

              {loading && <p style={styles.info}>Loading jobs...</p>}

              {!loading && !displayedJobs.length && (
                <div className="jobs-empty-state">
                  <Icon name="briefcase" size={28} />
                  <strong>{activeTab === "all" && !isEmployer && !companyUsernameFromProfile && !query.trim() ? "No recommendations yet" : "No jobs found"}</strong>
                  <span>{activeTab === "all" && !isEmployer && !companyUsernameFromProfile && !query.trim() ? "Add job preferences or explore all jobs from Search." : "Try another search or clear your filters."}</span>
                  {hasActiveFilters && <button onClick={clearFilters}>Clear filters</button>}
                  {activeTab === "all" && !isEmployer && !companyUsernameFromProfile && !query.trim() && (
                    <button onClick={() => setPreferencesOpen(true)}>Edit preferences</button>
                  )}
                </div>
              )}

              {!loading &&
                displayedJobs.map((job) => (
                  <JobPostItem
                    key={job.id}
                    job={job}
                    compact
                    selected={
                      !isRecommendedMode && selectedJob?.id === job.id
                    }
                    onClick={() =>
                      isRecommendedMode
                        ? openJobInsideSearch(job)
                        : setSelectedJob(job)
                    }
                    onSavedChanged={handleSavedChanged}
                    onApplied={handleApplied}
                    showWithdraw={activeTab === "applied"}
                    onApplicationWithdrawn={handleApplicationWithdrawn}
                    onDeleted={handleDeleted}
                    onUpdated={handleUpdated}
                  />
                ))}

              {(activeTab !== "all" || isEmployer || companyUsernameFromProfile || query.trim()) && (
              <div className="jobs-pagination" style={styles.pagination}>
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
              )}
            </section>

            {!isRecommendedMode && (
            <section className="jobs-detail-panel" style={styles.detailPanel}>
              {selectedJob ? (
                <JobPostItem
                  job={selectedJob}
                  onSavedChanged={handleSavedChanged}
                  onApplied={handleApplied}
                  showWithdraw={activeTab === "applied"}
                  onApplicationWithdrawn={handleApplicationWithdrawn}
                  onDeleted={handleDeleted}
                  onUpdated={handleUpdated}
                />
              ) : (
                <div style={styles.emptyDetail}>
                  Select a job to view details.
                </div>
              )}
            </section>
            )}
          </div>
        </main>
      </div>

      {preferencesOpen && (
        <div className="job-preferences-overlay" onMouseDown={(event) => event.target === event.currentTarget && !preferencesSaving && setPreferencesOpen(false)}>
          <div className="job-preferences-modal" role="dialog" aria-modal="true" aria-labelledby="job-preferences-title">
            <div className="job-preferences-header">
              <div><span>Personalize recommendations</span><h2 id="job-preferences-title">Job preferences</h2></div>
              <button type="button" onClick={() => setPreferencesOpen(false)} disabled={preferencesSaving} aria-label="Close"><Icon name="close" /></button>
            </div>

            {preferencesLoading ? <p className="job-preferences-loading">Loading preferences...</p> : (
              <div className="job-preferences-body">
                <label><span>Job titles</span><input value={preferenceDraft.jobTitles} onChange={(event) => setPreferenceDraft((current) => ({ ...current, jobTitles: event.target.value }))} placeholder="Frontend Developer, .NET Developer"/><small>Separate multiple titles with commas.</small></label>
                <label><span>Locations</span><input value={preferenceDraft.locations} onChange={(event) => setPreferenceDraft((current) => ({ ...current, locations: event.target.value }))} placeholder="Baku, Remote"/><small>You can add up to 8 locations.</small></label>

                <fieldset><legend>Workplace</legend><div className="job-preference-options">{["On-site", "Hybrid", "Remote"].map((value) => <button type="button" className={preferenceDraft.workplaceTypes.includes(value) ? "is-selected" : ""} key={value} onClick={() => toggleDraftOption("workplaceTypes", value)}>{value}</button>)}</div></fieldset>
                <fieldset><legend>Job type</legend><div className="job-preference-options">{["Full-time", "Part-time", "Internship", "Contract"].map((value) => <button type="button" className={preferenceDraft.employmentTypes.includes(value) ? "is-selected" : ""} key={value} onClick={() => toggleDraftOption("employmentTypes", value)}>{value}</button>)}</div></fieldset>
              </div>
            )}

            <div className="job-preferences-actions"><button type="button" className="is-secondary" onClick={() => setPreferencesOpen(false)} disabled={preferencesSaving}>Cancel</button><button type="button" className="is-primary" onClick={savePreferences} disabled={preferencesSaving || preferencesLoading}>{preferencesSaving ? "Saving..." : "Save preferences"}</button></div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "var(--app-bg)",
    padding: "22px 24px 32px",
    display: "grid",
    gridTemplateColumns: "254px minmax(0, 1fr)",
    gap: 18,
    boxSizing: "border-box",
  },

  sidebar: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    padding: 18,
    height: "fit-content",
    position: "sticky",
    top: 84,
  },

  sidebarTitle: {
    margin: "0 0 16px",
    fontSize: 22,
    fontWeight: 700,
    color: "var(--app-text)",
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
    padding: "11px 10px",
    borderRadius: 10,
    cursor: "pointer",
    color: "var(--app-text-soft)",
    fontWeight: 700,
    fontSize: 14,
  },

  activeTab: {
    backgroundColor: "var(--app-accent-soft)",
    color: "var(--app-accent)",
  },

  createBoxWrap: {
    marginTop: 18,
  },

  main: {
    minWidth: 0,
  },

  searchBar: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
  },

  searchForm: {
    display: "flex",
    gap: 10,
  },

  searchInput: {
    flex: 1,
    border: "none",
    backgroundColor: "transparent",
    color: "var(--app-text)",
    borderRadius: 22,
    padding: "11px 8px",
    fontSize: 15,
    outline: "none",
  },

  searchButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-accent)",
    color: "#fff",
    borderRadius: 10,
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  jobsLayout: {
    display: "grid",
    gridTemplateColumns: "410px minmax(0, 1fr)",
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    overflow: "hidden",
    minHeight: "calc(100vh - 150px)",
  },

  listPanel: {
    borderRight: "1px solid var(--app-border)",
    overflowY: "auto",
    maxHeight: "calc(100vh - 150px)",
    backgroundColor: "var(--app-surface)",
  },

  listHeader: {
    padding: "14px 16px",
    borderBottom: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    position: "sticky",
    top: 0,
    zIndex: 2,
  },

  listTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 700,
    color: "var(--app-text)",
  },

  detailPanel: {
    overflowY: "auto",
    maxHeight: "calc(100vh - 150px)",
    backgroundColor: "var(--app-surface)",
  },

  info: {
    padding: 16,
    color: "var(--app-muted)",
    fontSize: 14,
  },

  emptyDetail: {
    padding: 30,
    color: "var(--app-muted)",
    fontSize: 15,
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderTop: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
  },

  pageButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "var(--app-accent)",
    fontWeight: 700,
    cursor: "pointer",
  },

  disabledPageButton: {
    color: "var(--app-muted)",
    cursor: "not-allowed",
  },

  pageText: {
    color: "var(--app-muted)",
    fontSize: 13,
  },
};
