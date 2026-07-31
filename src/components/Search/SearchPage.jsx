import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../Layout/Navbar";
import EventCard from "../Events/EventCard";
import JobPostItem from "../Post/JobPosts/JobPostItem";
import PostItem from "../Post/PostItem";
import ProfileIcon from "../Profile/ProfileIcon";
import defaultAvatar from "../../assets/default-avatar.png";
import { SearchContext } from "../../context/SearchContext";
import {
  searchCompanies,
  searchDirectoryJobs,
  searchDirectoryPeople,
  searchEvents,
  getRelevantHashtags,
  searchPosts,
} from "../../services/searchApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import api from "../../services/api";
import "./SearchPage.css";
import "../../pages/JobsPage.css";

const PREVIEW_SIZE = 3;
const PAGE_SIZE = 6;
const TABS = [
  ["all", "All results", "search"],
  ["posts", "Posts", "post"],
  ["people", "People", "user"],
  ["companies", "Companies", "building"],
  ["jobs", "Jobs", "briefcase"],
  ["events", "Events", "calendar"],
];

const EMPTY_PAGE = { items: [], page: 1, totalPages: 1, totalCount: 0, hasMore: false };

const normalisePage = (value, fallbackPage = 1) => {
  if (Array.isArray(value)) {
    return {
      items: value,
      page: fallbackPage,
      totalPages: fallbackPage + (value.length === PAGE_SIZE ? 1 : 0),
      totalCount: value.length,
      hasMore: value.length === PAGE_SIZE,
    };
  }
  return { ...EMPTY_PAGE, ...value, items: value?.items || [] };
};

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setQuery } = useContext(SearchContext);
  const query = searchParams.get("query") || "";
  const requestedType = searchParams.get("type") || "all";
  const requestedJobId = searchParams.get("jobId");
  const initialTab = TABS.some(([key]) => key === requestedType) ? requestedType : "all";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState({
    posts: EMPTY_PAGE,
    people: EMPTY_PAGE,
    companies: EMPTY_PAGE,
    jobs: EMPTY_PAGE,
    events: EMPTY_PAGE,
  });
  const [loading, setLoading] = useState({});
  const [hashtags, setHashtags] = useState([]);
  const [eventRefreshKey, setEventRefreshKey] = useState(0);
  const [selectedJob, setSelectedJob] = useState(
    location.state?.selectedJob || null,
  );
  const [selectedJobLoading, setSelectedJobLoading] = useState(false);

  useEffect(() => {
    setQuery(query);
    setPage(1);
    setActiveTab(TABS.some(([key]) => key === requestedType) ? requestedType : "all");
  }, [query, requestedType, setQuery]);

  const updateResult = (key, value) =>
    setResults((current) => ({ ...current, [key]: normalisePage(value, page) }));

  const loadOne = async (key, targetPage, preview = false) => {
    const size = preview ? PREVIEW_SIZE + 1 : PAGE_SIZE;
    setLoading((current) => ({ ...current, [key]: true }));
    try {
      let value;
      if (key === "posts") {
        const postRequestSize = preview ? PREVIEW_SIZE + 1 : PAGE_SIZE;
        const items = query.trim() ? await searchPosts(query.trim(), targetPage, postRequestSize) : [];
        value = {
          items: items.slice(0, preview ? PREVIEW_SIZE : PAGE_SIZE),
          page: targetPage,
          totalPages: targetPage + (items.length >= (preview ? PREVIEW_SIZE + 1 : PAGE_SIZE) ? 1 : 0),
          totalCount: items.length,
          hasMore: items.length >= (preview ? PREVIEW_SIZE + 1 : PAGE_SIZE),
        };
      } else if (key === "people") {
        value = await searchDirectoryPeople(query, targetPage, size);
      } else if (key === "companies") {
        value = await searchCompanies(query, targetPage, size);
      } else if (key === "jobs") {
        value = await searchDirectoryJobs(query, targetPage, size);
      } else {
        value = await searchEvents(query, targetPage, size, true);
      }
      const normalized = normalisePage(value, targetPage);
      if (preview) {
        normalized.hasMore = normalized.hasMore || normalized.items.length > PREVIEW_SIZE;
        normalized.items = normalized.items.slice(0, PREVIEW_SIZE);
      }
      if ((key === "people" || key === "companies") && query.trim().length >= 2) {
        const usernames = normalized.items
          .map((item) => item.username || item.userName)
          .filter(Boolean);
        if (usernames.length) {
          api.post("/Analytics/track/search-appearances", {
            query: query.trim(),
            usernames,
          }).catch((error) => {
            console.error("Search appearance tracking failed:", error);
          });
        }
      }
      updateResult(key, normalized);
    } catch (error) {
      console.error(`${key} search failed:`, error);
      updateResult(key, EMPTY_PAGE);
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  };

  useEffect(() => {
    if (activeTab === "all") {
      if (!query.trim()) return;
      ["posts", "people", "companies", "jobs", "events"].forEach((key) => loadOne(key, 1, true));
      return;
    }
    loadOne(activeTab, page, false);
    // eventRefreshKey intentionally reloads attendance changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab, page, eventRefreshKey]);

  useEffect(() => {
    getRelevantHashtags(query.trim(), 5).then(setHashtags).catch(() => setHashtags([]));
  }, [query]);

  useEffect(() => {
    if (!requestedJobId) {
      setSelectedJob(null);
      setSelectedJobLoading(false);
      return;
    }

    const jobFromResults = results.jobs.items.find(
      (job) => Number(job.id) === Number(requestedJobId),
    );

    if (jobFromResults) {
      setSelectedJobLoading(false);
      setSelectedJob((current) => ({
        ...jobFromResults,
        ...(Number(current?.id) === Number(jobFromResults.id) ? current : {}),
      }));
      return;
    }

    if (Number(selectedJob?.id) === Number(requestedJobId)) {
      setSelectedJobLoading(false);
      return;
    }

    let cancelled = false;
    setSelectedJobLoading(true);

    api
      .get(`/JobPost/${requestedJobId}`)
      .then((response) => {
        if (cancelled) return;
        const payload =
          response?.data?.data ?? response?.data?.Data ?? response?.data;
        setSelectedJob(payload || null);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error("Selected job loading failed:", error);
          setSelectedJob(null);
        }
      })
      .finally(() => {
        if (!cancelled) setSelectedJobLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [requestedJobId, results.jobs.items, selectedJob?.id]);

  const switchTab = (tab) => {
    setPage(1);
    setActiveTab(tab);
    const next = {};
    if (query) next.query = query;
    if (tab !== "all") next.type = tab;
    setSearchParams(next);
    if (tab !== "jobs") setSelectedJob(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openJobInsideSearch = (job) => {
    setSelectedJob(job);
    setActiveTab("jobs");
    setPage(1);

    const next = { type: "jobs", jobId: String(job.id) };
    if (query) next.query = query;
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectedJobSaved = (jobId, isSaved) => {
    setSelectedJob((current) =>
      Number(current?.id) === Number(jobId) ? { ...current, isSaved } : current,
    );
    setResults((current) => ({
      ...current,
      jobs: {
        ...current.jobs,
        items: current.jobs.items.map((job) =>
          Number(job.id) === Number(jobId) ? { ...job, isSaved } : job,
        ),
      },
    }));
  };

  const handleSelectedJobApplied = (jobId) => {
    const appliedAt = new Date().toISOString();
    setSelectedJob((current) =>
      Number(current?.id) === Number(jobId)
        ? { ...current, isApplied: true, appliedAt }
        : current,
    );
    setResults((current) => ({
      ...current,
      jobs: {
        ...current.jobs,
        items: current.jobs.items.map((job) =>
          Number(job.id) === Number(jobId)
            ? { ...job, isApplied: true, appliedAt }
            : job,
        ),
      },
    }));
  };

  const pageNumbers = useMemo(() => {
    const total = Math.max(1, Number(results[activeTab]?.totalPages || 1));
    return Array.from({ length: total }, (_, index) => index + 1).filter(
      (number) => number === 1 || number === total || Math.abs(number - page) <= 1,
    );
  }, [activeTab, page, results]);

  const imageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

  const PersonCard = ({ person }) => (
    <article className="directory-row">
      <img className="directory-avatar" src={imageUrl(person.profileImage)} alt="" />
      <button className="directory-copy" type="button" onClick={() => navigate(`/profile/${person.username}`)}>
        <strong>{person.fullName || person.username}</strong>
        <span>{person.currentPosition || person.bio || "Nexora member"}</span>
        {person.relationReason && <small>{person.relationReason}</small>}
        {person.location && <small>{person.location}</small>}
      </button>
      <button className="directory-action" type="button" onClick={() => navigate(`/profile/${person.username}`)}>View</button>
    </article>
  );

  const CompanyCard = ({ company }) => (
    <article className="directory-row directory-company-row">
      <img className="directory-company-logo" src={imageUrl(company.logoUrl)} alt="" />
      <button className="directory-copy" type="button" onClick={() => navigate(`/profile/${company.username}`)}>
        <strong>{company.name}</strong>
        <span>{company.industry || "Company"}{company.location ? ` · ${company.location}` : ""}</span>
        {company.bio && <small className="directory-clamp">{company.bio}</small>}
        <small>{company.followerCount || 0} followers</small>
      </button>
      <button className="directory-action" type="button" onClick={() => navigate(`/profile/${company.username}`)}>View</button>
    </article>
  );

  const JobCard = ({ job }) => (
    <article
      className={`directory-row directory-clickable ${
        Number(selectedJob?.id) === Number(job.id) ? "is-selected-job" : ""
      }`}
      onClick={() => openJobInsideSearch(job)}
    >
      <img className="directory-company-logo" src={imageUrl(job.companyLogo)} alt="" />
      <div className="directory-copy">
        <strong>{job.title}</strong>
        <span>{job.companyName || "Company"}</span>
        <small>{[job.location, job.workplaceType, job.employmentType].filter(Boolean).join(" · ")}</small>
        {job.matchReason && <small className="directory-match">{job.matchReason}</small>}
      </div>
      <button className="directory-action" type="button">View</button>
    </article>
  );

  const renderItems = (key, items) => {
    if (loading[key]) return <div className="search-state">Loading {key}...</div>;
    if (!items.length) return <div className="search-state">No {key} found.</div>;
    if (key === "posts") return <div className="search-post-list">{items.map((item) => <PostItem key={item.id} post={item} />)}</div>;
    if (key === "people") return items.map((item) => <PersonCard key={item.id || item.username} person={item} />);
    if (key === "companies") return items.map((item) => <CompanyCard key={item.id || item.username} company={item} />);
    if (key === "jobs") return items.map((item) => <JobCard key={item.id} job={item} />);
    return <div className="search-event-list">{items.map((item) => <EventCard key={item.id || item.Id} event={item} onChanged={() => setEventRefreshKey((value) => value + 1)} />)}</div>;
  };

  const sectionLabel = { posts: "Posts", people: "People", companies: "Companies", jobs: "Jobs", events: "Events" };

  return (
    <>
      <Navbar />
      <div className="search-page search-page-shell">
        <aside className="search-filter-card">
          <h2>Search filters</h2>
          <nav aria-label="Search result filters">
            {TABS.map(([key, label, icon]) => (
              <button className={activeTab === key ? "is-active" : ""} key={key} type="button" onClick={() => switchTab(key)}>
                <ProfileIcon name={icon} size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="search-results-column">
          {!query.trim() && activeTab !== "events" && activeTab !== "jobs" ? (
            <section className="search-empty-card">
              <ProfileIcon name="search" size={34} />
              <h1>Find what matters to you</h1>
              <p>Search posts, people, companies, jobs and events from the expanded search in the navbar.</p>
            </section>
          ) : activeTab === "all" ? (
            <>
              <div className="search-query-heading">Results for <strong>“{query}”</strong></div>
              {["posts", "people", "companies", "jobs", "events"].map((key) => (
                <section className="search-section-card" key={key}>
                  <div className="search-section-title"><h2>{sectionLabel[key]}</h2></div>
                  {renderItems(key, results[key].items)}
                  {(results[key].hasMore || results[key].items.length === PREVIEW_SIZE) && (
                    <button className="search-see-all" type="button" onClick={() => switchTab(key)}>
                      See all {sectionLabel[key].toLowerCase()} <span>→</span>
                    </button>
                  )}
                </section>
              ))}
            </>
          ) : (
            <section className="search-section-card search-full-card">
              <div className="search-section-title">
                <div><small>{query ? `Results for “${query}”` : "Recommended for you"}</small><h1>{sectionLabel[activeTab]}</h1></div>
                {!!results[activeTab].totalCount && <span>{results[activeTab].totalCount} results</span>}
              </div>
              {activeTab === "jobs" ? (
                <div
                  className={`search-jobs-workspace ${
                    selectedJob || selectedJobLoading ? "has-selection" : ""
                  }`}
                >
                  <div className="search-jobs-list">
                    {renderItems(activeTab, results[activeTab].items)}
                  </div>

                  {(selectedJob || selectedJobLoading) && (
                    <aside className="search-job-detail">
                      {selectedJobLoading ? (
                        <div className="search-state">Loading job details...</div>
                      ) : (
                        <JobPostItem
                          job={selectedJob}
                          onSavedChanged={handleSelectedJobSaved}
                          onApplied={handleSelectedJobApplied}
                        />
                      )}
                    </aside>
                  )}
                </div>
              ) : (
                renderItems(activeTab, results[activeTab].items)
              )}
              {(page > 1 || results[activeTab].hasMore || results[activeTab].totalPages > 1) && (
                <div className="search-pagination">
                  <button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button>
                  {pageNumbers.map((number, index) => (
                    <React.Fragment key={number}>
                      {index > 0 && number - pageNumbers[index - 1] > 1 && <span>…</span>}
                      <button className={number === page ? "is-active" : ""} type="button" onClick={() => setPage(number)}>{number}</button>
                    </React.Fragment>
                  ))}
                  <button type="button" disabled={!results[activeTab].hasMore && page >= results[activeTab].totalPages} onClick={() => setPage((value) => value + 1)}>›</button>
                </div>
              )}
            </section>
          )}
        </main>

        <aside className="search-tools-column">
          <section className="search-hashtag-card">
            <div className="search-section-title"><h2>Popular hashtags</h2></div>
            {hashtags.length ? hashtags.slice(0, 5).map((tag) => (
              <button type="button" key={tag.name || tag.Name || tag} onClick={() => {
                const name = tag.name || tag.Name || tag;
                setQuery(`#${name}`);
                setSearchParams({ query: `#${name}`, type: "posts" });
              }}>
                <span>#{tag.name || tag.Name || tag}</span>
                <small>{tag.postCount ?? tag.PostCount ?? 0} posts</small>
              </button>
            )) : <p>No hashtags yet.</p>}
          </section>
        </aside>
      </div>
    </>
  );
}
