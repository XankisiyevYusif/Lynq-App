import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";
import CreateJobPostBox from "./CreateJobPostBox";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import ProfileIcon from "../../Profile/ProfileIcon";

export default function JobPostFeed({ username, isOwner, onJobCreated }) {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [savingId, setSavingId] = useState(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const getResponseData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.Data)) return res.data.Data;
    return [];
  };

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

  const formatDate = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "today";
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week ago`;

    return `${Math.floor(diffDays / 30)} month ago`;
  };

  const fetchJobs = async () => {
    if (!username) return;

    try {
      setLoading(true);

      const res = await api.get(
        `/JobPost/employer/${username}?page=1&pageSize=12`,
      );
      const list = getResponseData(res);

      setJobs(list);
      setSelectedIndex(0);
    } catch (err) {
      console.error("Failed to load employer jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [username]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
  }, [emblaApi, jobs]);

  const scrollPrev = () => {
    emblaApi?.scrollPrev();
  };

  const scrollNext = () => {
    emblaApi?.scrollNext();
  };

  const scrollTo = (index) => {
    emblaApi?.scrollTo(index);
  };

  const openJobInsideSearch = (job) => {
    navigate(`/jobs/${encodeURIComponent(job.id)}`, {
      state: { jobPreview: job },
    });
  };

  const goToAllJobs = () => {
    navigate("/jobs", {
      state: { companyUsername: username },
    });
  };

  const handleSave = async (e, job) => {
    e.stopPropagation();

    try {
      setSavingId(job.id);

      if (job.isSaved) {
        await api.delete(`/JobPost/save/${job.id}`);

        setJobs((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(job.id)
              ? { ...item, isSaved: false }
              : item,
          ),
        );
      } else {
        await api.post(`/JobPost/save/${job.id}`);

        setJobs((prev) =>
          prev.map((item) =>
            Number(item.id) === Number(job.id)
              ? { ...item, isSaved: true }
              : item,
          ),
        );
      }
    } catch (err) {
      console.error("Save job failed:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleCreated = (createdJob) => {
    if (!createdJob) return;

    setJobs((prev) => [createdJob, ...prev]);
    onJobCreated?.(createdJob);

    setTimeout(() => {
      emblaApi?.reInit();
      emblaApi?.scrollTo(0);
    }, 0);
  };

  const snapCount = emblaApi?.scrollSnapList()?.length || 0;

  if (loading) {
    return (
      <div className="company-jobs-feed" style={styles.wrapper}>
        <p style={styles.empty}>Loading job openings...</p>
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="company-jobs-feed" style={styles.wrapper}>
        <div className="company-jobs-feed-header" style={styles.header}>
          <h2 style={styles.title}>Newly posted jobs</h2>

          {isOwner && (
            <div style={styles.headerActions}>
              <CreateJobPostBox compact onCreated={handleCreated} />
            </div>
          )}
        </div>

        <p style={styles.empty}>
          {isOwner
            ? "You have not posted any jobs yet."
            : "This company has no job openings yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="company-jobs-feed" style={styles.wrapper}>
      <div className="company-jobs-feed-header" style={styles.header}>
        <h2 style={styles.title}>Newly posted jobs</h2>

        <div style={styles.headerActions}>
          {isOwner && <CreateJobPostBox compact onCreated={handleCreated} />}

          {jobs.length > 3 && (
            <div style={styles.navActions}>
              <button
                type="button"
                style={styles.navButton}
                onClick={scrollPrev}
              >
                ‹ Back
              </button>

              <button
                type="button"
                style={styles.navButton}
                onClick={scrollNext}
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="company-jobs-feed-viewport" style={styles.viewport} ref={emblaRef}>
        <div className="company-jobs-feed-track" style={styles.container}>
          {jobs.map((job) => (
            <div className="company-jobs-feed-slide" key={job.id} style={styles.slide}>
              <div
                className="company-jobs-feed-card"
                style={styles.card}
                onClick={() => openJobInsideSearch(job)}
              >
                <div style={styles.cardTop}>
                  <img
                    src={getImageUrl(job.companyLogo)}
                    alt=""
                    style={styles.logo}
                  />

                  <button
                    type="button"
                    style={styles.saveButton}
                    disabled={savingId === job.id}
                    onClick={(e) => handleSave(e, job)}
                    title={job.isSaved ? "Saved" : "Save"}
                  >
                    <ProfileIcon
                      name="bookmark"
                      size={24}
                      filled={job.isSaved}
                      className="jobs-save-icon"
                    />
                  </button>
                </div>

                <div style={styles.cardBody}>
                  <h3 style={styles.jobTitle}>{job.title}</h3>

                  <p style={styles.company}>{job.companyName || "Company"}</p>

                  <p style={styles.location}>
                    {job.location || "Location not specified"}
                  </p>

                  <p style={styles.date}>{formatDate(job.createdAt)}</p>

                  {!job.canApply && (
                    <p style={styles.closedText}>Applications closed</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {snapCount > 1 && (
        <div style={styles.dots}>
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to jobs slide ${index + 1}`}
              style={{
                ...styles.dot,
                ...(selectedIndex === index ? styles.dotActive : {}),
              }}
              onClick={() => scrollTo(index)}
            />
          ))}
        </div>
      )}

      <button type="button" style={styles.viewAllButton} onClick={goToAllJobs}>
        View all jobs →
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
  },

  header: {
    padding: "18px 22px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },

  title: {
    margin: 0,
    fontSize: 18,
    fontWeight: 500,
    color: "var(--app-text)",
  },

  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  navActions: {
    display: "flex",
    alignItems: "center",
    gap: 16,
  },

  navButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "var(--app-text-soft)",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  viewport: {
    overflow: "hidden",
    padding: "8px 0 0",
  },

  container: {
    display: "flex",
    gap: 14,
    padding: "0 22px 18px",
  },

  slide: {
    flex: "0 0 calc((100% - 28px) / 3)",
    minWidth: 0,
  },

  card: {
    minHeight: 210,
    border: "1px solid var(--app-border)",
    borderRadius: 8,
    backgroundColor: "var(--app-surface)",
    padding: 18,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxSizing: "border-box",
  },

  cardTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  logo: {
    width: 54,
    height: 54,
    objectFit: "cover",
    borderRadius: 4,
  },

  saveButton: {
    border: "none",
    backgroundColor: "transparent",
    padding: 0,
    cursor: "pointer",
  },

  saveIcon: {
    width: 24,
    height: 24,
    objectFit: "contain",
  },

  cardBody: {
    marginTop: 18,
  },

  jobTitle: {
    margin: "0 0 8px",
    fontSize: 16,
    lineHeight: 1.35,
    fontWeight: 700,
    color: "var(--app-text)",
  },

  company: {
    margin: 0,
    fontSize: 14,
    color: "var(--app-text-soft)",
  },

  location: {
    margin: "4px 0 0",
    fontSize: 14,
    color: "var(--app-muted)",
  },

  date: {
    margin: "26px 0 0",
    fontSize: 13,
    color: "var(--app-muted)",
  },

  closedText: {
    margin: "6px 0 0",
    color: "#c0392b",
    fontSize: 13,
    fontWeight: 600,
  },

  dots: {
    display: "flex",
    justifyContent: "center",
    gap: 14,
    paddingBottom: 18,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "1px solid var(--app-text-soft)",
    backgroundColor: "var(--app-surface)",
    padding: 0,
    cursor: "pointer",
  },

  dotActive: {
    backgroundColor: "#000",
  },

  viewAllButton: {
    width: "100%",
    border: "none",
    borderTop: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    padding: "17px 16px",
    color: "var(--app-muted)",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },

  empty: {
    margin: 0,
    padding: 22,
    color: "var(--app-muted)",
    fontSize: 14,
  },
};
