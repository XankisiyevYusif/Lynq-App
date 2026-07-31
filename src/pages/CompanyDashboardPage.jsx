import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Layout/Navbar";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../services/api";
import "./CompanyDashboardPage.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

const valueOf = (source, camelCaseKey, pascalCaseKey, fallback = 0) =>
  source?.[camelCaseKey] ?? source?.[pascalCaseKey] ?? fallback;

const DashboardIcon = ({ name }) => {
  const paths = {
    eye: (
      <>
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.7" />
      </>
    ),
    followers: (
      <>
        <path d="M16 20v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V20" />
        <circle cx="9" cy="7" r="3.5" />
        <path d="M17 8v6M14 11h6" />
      </>
    ),
    jobs: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),
    clicks: (
      <>
        <path d="m6 3 12 9-6 2-3 6L6 3Z" />
        <path d="m14 15 4 4" />
      </>
    ),
    events: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M8 3v4M16 3v4M3 10h18" />
      </>
    ),
    attendees: (
      <>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2" />
        <path d="M3 20a6 6 0 0 1 12 0M15 15a5 5 0 0 1 6 5" />
      </>
    ),
    engagement: (
      <>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
    talent: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0M17 8h4M19 6v4" />
      </>
    ),
    arrow: <path d="m9 18 6-6-6-6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
  };

  return (
    <svg
      className="company-dashboard-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
};

export default function CompanyDashboardPage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/Company/dashboard")
      .then((response) => {
        if (active) setDashboard(unwrap(response));
      })
      .catch(() => {
        if (active) setError("Company dashboard could not be loaded.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (!dashboard && !error) {
    return (
      <>
        <Navbar />
        <LoadingSpinner text="Loading company dashboard..." />
      </>
    );
  }

  const metrics = dashboard?.metrics || dashboard?.Metrics || {};
  const company = dashboard?.company || dashboard?.Company || {};
  const username = valueOf(company, "username", "Username", "");
  const companyName = valueOf(company, "name", "Name", "Company");
  const upcomingEvents =
    dashboard?.upcomingEventItems || dashboard?.UpcomingEventItems || [];
  const recentJobs = dashboard?.recentJobs || dashboard?.RecentJobs || [];

  const cards = [
    {
      label: "Active jobs",
      value: valueOf(metrics, "activeJobs", "ActiveJobs"),
      period: "Last 30 days",
      icon: "jobs",
      tone: "indigo",
    },
    {
      label: "Job views",
      value: valueOf(metrics, "jobViews", "JobViews"),
      period: "Last 30 days",
      icon: "eye",
      tone: "cyan",
    },
    {
      label: "Job saves",
      value: valueOf(metrics, "jobSaves", "JobSaves"),
      period: "Total member intent",
      icon: "engagement",
      tone: "violet",
    },
    {
      label: "External apply clicks",
      value: valueOf(
        metrics,
        "applicationLinkClicks",
        "ApplicationLinkClicks",
      ),
      period: "Total tracked clicks",
      icon: "clicks",
      tone: "amber",
    },
    {
      label: "Matching talent",
      value: valueOf(metrics, "matchingTalent", "MatchingTalent"),
      period: "Across active jobs",
      icon: "talent",
      tone: "rose",
    },
    {
      label: "Invitations sent",
      value: valueOf(metrics, "sentInvitations", "SentInvitations"),
      period: "Direct outreach",
      icon: "attendees",
      tone: "emerald",
    },
    {
      label: "Followers",
      value: valueOf(metrics, "followers", "Followers"),
      period: "Total audience",
      icon: "followers",
      tone: "blue",
    },
    {
      label: "Profile views",
      value: valueOf(metrics, "profileViews", "ProfileViews"),
      period: "Last 30 days",
      icon: "eye",
      tone: "indigo",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="company-dashboard-page">
        <section className="company-dashboard-hero">
          <div>
            <span className="company-dashboard-eyebrow">Company workspace</span>
            <h1>{companyName} Dashboard</h1>
            <p>
              Track your audience, hiring activity, content and upcoming
              events from one place.
            </p>
          </div>

          <button
            type="button"
            className="company-dashboard-profile-button"
            onClick={() => username && navigate(`/profile/${username}`)}
            disabled={!username}
          >
            View company profile
            <DashboardIcon name="arrow" />
          </button>
        </section>

        {error ? (
          <section className="company-dashboard-state" role="alert">
            <strong>Dashboard unavailable</strong>
            <span>{error}</span>
          </section>
        ) : (
          <>
            <section className="company-dashboard-metrics">
              {cards.map((card) => (
                <article
                  key={card.label}
                  className={`company-dashboard-metric tone-${card.tone}`}
                >
                  <span className="company-dashboard-metric-icon">
                    <DashboardIcon name={card.icon} />
                  </span>
                  <span className="company-dashboard-metric-label">
                    {card.label}
                  </span>
                  <strong>{card.value}</strong>
                  <small>{card.period}</small>
                </article>
              ))}
            </section>

            <section className="company-dashboard-actions-card">
              <div>
                <span className="company-dashboard-eyebrow">Quick actions</span>
                <h2>Keep your company moving</h2>
                <p>Jump directly into your most common workspace tasks.</p>
              </div>

              <div className="company-dashboard-actions">
                <button
                  type="button"
                  className="is-primary"
                  onClick={() => navigate("/company/hiring")}
                >
                  <DashboardIcon name="plus" />
                  Post a job
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/company/talent")}
                >
                  <DashboardIcon name="search" />
                  Find talent
                </button>
                <button type="button" onClick={() => navigate("/events")}>
                  <DashboardIcon name="events" />
                  Create event
                </button>
                <button
                  type="button"
                  onClick={() =>
                    username &&
                    navigate(`/profile/${username}?tab=posts`)
                  }
                  disabled={!username}
                >
                  <DashboardIcon name="engagement" />
                  Create post
                </button>
              </div>
            </section>

            <section className="company-dashboard-columns">
              <article className="company-dashboard-list-card">
                <header>
                  <div>
                    <span>Schedule</span>
                    <h2>Upcoming events</h2>
                  </div>
                  <button type="button" onClick={() => navigate("/events")}>
                    View all
                  </button>
                </header>

                {upcomingEvents.length === 0 ? (
                  <div className="company-dashboard-empty">
                    <DashboardIcon name="events" />
                    <strong>No upcoming events</strong>
                    <span>Create an event to engage your community.</span>
                  </div>
                ) : (
                  <div className="company-dashboard-list">
                    {upcomingEvents.map((item) => {
                      const id = valueOf(item, "id", "Id", "");
                      const title = valueOf(
                        item,
                        "title",
                        "Title",
                        "Untitled event",
                      );
                      const startsAt = valueOf(
                        item,
                        "startsAt",
                        "StartsAt",
                        null,
                      );
                      const attendeeCount = valueOf(
                        item,
                        "attendeeCount",
                        "AttendeeCount",
                      );

                      return (
                        <button
                          type="button"
                          key={id}
                          className="company-dashboard-row"
                          onClick={() => navigate(`/events/${id}`)}
                        >
                          <span className="company-dashboard-row-date">
                            {startsAt
                              ? new Date(startsAt).toLocaleDateString(
                                  undefined,
                                  { day: "2-digit", month: "short" },
                                )
                              : "TBA"}
                          </span>
                          <span className="company-dashboard-row-copy">
                            <strong>{title}</strong>
                            <small>{attendeeCount} attendees</small>
                          </span>
                          <DashboardIcon name="arrow" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>

              <article className="company-dashboard-list-card">
                <header>
                  <div>
                    <span>Hiring</span>
                    <h2>Recent job posts</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate("/company/hiring")}
                  >
                    View all
                  </button>
                </header>

                {recentJobs.length === 0 ? (
                  <div className="company-dashboard-empty">
                    <DashboardIcon name="jobs" />
                    <strong>No job posts yet</strong>
                    <span>Publish a role when you are ready to hire.</span>
                  </div>
                ) : (
                  <div className="company-dashboard-list">
                    {recentJobs.map((item) => {
                      const id = valueOf(item, "id", "Id", "");
                      const title = valueOf(
                        item,
                        "title",
                        "Title",
                        "Untitled job",
                      );
                      const active = valueOf(
                        item,
                        "isActive",
                        "IsActive",
                        false,
                      );
                      const clicks = valueOf(
                        item,
                        "applicationLinkClicks",
                        "ApplicationLinkClicks",
                      );

                      return (
                        <button
                          type="button"
                          key={id}
                          className="company-dashboard-row"
                          onClick={() => navigate(`/jobs/${id}`)}
                        >
                          <span
                            className={`company-dashboard-job-status ${
                              active ? "is-active" : ""
                            }`}
                          />
                          <span className="company-dashboard-row-copy">
                            <strong>{title}</strong>
                            <small>
                              {active ? "Active" : "Closed"} · {clicks} apply
                              clicks
                            </small>
                          </span>
                          <DashboardIcon name="arrow" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </main>
    </>
  );
}
