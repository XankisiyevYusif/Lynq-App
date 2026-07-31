import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import CreateJobPostBox from "../components/Post/JobPosts/CreateJobPostBox";
import api from "../services/api";
import "./CompanyHiringPage.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

const formatDate = (value) => {
  if (!value) return "No expiry";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "No expiry"
    : date.toLocaleDateString();
};

export default function CompanyHiringPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const [overviewResponse, jobsResponse] = await Promise.all([
        api.get("/company/hiring/overview"),
        api.get(`/company/hiring/jobs?status=${status}`),
      ]);
      setOverview(unwrap(overviewResponse));
      const payload = unwrap(jobsResponse);
      setJobs(payload?.items || payload?.Items || []);
    } catch (requestError) {
      console.error("Hiring workspace load failed:", requestError);
      setError("Hiring data could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const changeStatus = async (job) => {
    const id = job.id || job.Id;
    const isActive = job.isActive ?? job.IsActive;
    await api.patch(`/company/hiring/jobs/${id}/status`, {
      isActive: !isActive,
    });
    await load();
  };

  const showInsights = async (job) => {
    try {
      setError("");
      const response = await api.get(
        `/company/hiring/jobs/${job.id || job.Id}/insights`,
      );
      const source = unwrap(response) || {};
      const jobSource = source.job || source.Job || {};
      setInsights({
        job: {
          title: jobSource.title || jobSource.Title,
          saves: jobSource.saves ?? jobSource.Saves ?? 0,
          invitations: jobSource.invitations ?? jobSource.Invitations ?? 0,
          views: jobSource.views ?? jobSource.Views ?? 0,
        },
        externalApplyClicks:
          source.externalApplyClicks ?? source.ExternalApplyClicks ?? 0,
        applyClickConversion:
          source.applyClickConversion ?? source.ApplyClickConversion ?? 0,
        chart: (source.chart || source.Chart || []).map((point) => ({
          date: point.date || point.Date,
          externalApplyClicks:
            point.externalApplyClicks ?? point.ExternalApplyClicks ?? 0,
        })),
      });
      setTab("insights");
    } catch (requestError) {
      console.error("Job insights could not be loaded:", requestError);
      setError("Job insights could not be loaded.");
    }
  };

  const metrics = overview?.metrics || overview?.Metrics || {};
  const metricCards = [
    ["Active jobs", metrics.activeJobs ?? 0, "Roles currently accepting interest"],
    ["External apply clicks", metrics.externalApplyClicks ?? 0, "Clicks to company career pages"],
    ["Job saves", metrics.totalSaves ?? 0, "Member intent across all jobs"],
    ["Invitations sent", metrics.sentInvitations ?? 0, "Direct talent outreach"],
  ];

  return (
    <>
      <Navbar />
      <main className="company-hiring-page">
        <header className="hiring-hero">
          <div>
            <span>Company workspace</span>
            <h1>Hiring</h1>
            <p>Manage job posts, review meaningful signals and move from role requirements to relevant talent.</p>
          </div>
          <CreateJobPostBox compact onCreated={load} />
        </header>

        <nav className="hiring-tabs">
          {[["overview", "Overview"], ["jobs", "Job posts"], ["insights", "Insights"]].map(([key, label]) => (
            <button key={key} type="button" className={tab === key ? "is-active" : ""} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="hiring-state">Loading hiring workspace...</div>
        ) : error ? (
          <div className="hiring-state is-error">{error}</div>
        ) : (
          <>
            {tab === "overview" && (
              <>
                <section className="hiring-metrics">
                  {metricCards.map(([label, value, note]) => (
                    <article key={label}>
                      <span>{label}</span><strong>{value}</strong><small>{note}</small>
                    </article>
                  ))}
                </section>
                <section className="hiring-overview-grid">
                  <article>
                    <span>Hiring focus</span>
                    <h2>Turn job requirements into a talent shortlist</h2>
                    <p>Each job can carry required skills and minimum experience. Nexora uses those fields to rank relevant profiles.</p>
                    <button type="button" onClick={() => navigate("/company/talent")}>Find matching talent</button>
                  </article>
                  <article>
                    <span>Measurement model</span>
                    <h2>External applications stay transparent</h2>
                    <p>Nexora records the apply-link click, while the final application remains on the company website.</p>
                    <button type="button" onClick={() => setTab("jobs")}>Manage job posts</button>
                  </article>
                </section>
              </>
            )}

            {tab === "jobs" && (
              <section className="hiring-jobs-panel">
                <header>
                  <div><span>Role management</span><h2>Job posts</h2></div>
                  <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="all">All jobs</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
                  </select>
                </header>
                <div className="hiring-job-list">
                  {jobs.length === 0 ? (
                    <div className="hiring-state">No job posts in this view.</div>
                  ) : jobs.map((job) => {
                    const active = job.isActive ?? job.IsActive;
                    const id = job.id || job.Id;
                    return (
                      <article key={id}>
                        <div className="hiring-job-title">
                          <span className={active ? "is-active" : "is-closed"}>{active ? "Active" : "Closed"}</span>
                          <h3>{job.title || job.Title}</h3>
                          <p>{job.location || job.Location || "Location flexible"} · {job.workplaceType || job.WorkplaceType} · {job.employmentType || job.EmploymentType}</p>
                          <small>Expires: {formatDate(job.expiresAt || job.ExpiresAt)}</small>
                        </div>
                        <div className="hiring-job-signals">
                          <span><strong>{job.matchingTalent ?? 0}</strong> matching talent</span>
                          <span><strong>{job.saves ?? 0}</strong> saves</span>
                          <span><strong>{job.externalApplyClicks ?? 0}</strong> apply clicks</span>
                          <span><strong>{job.invitations ?? 0}</strong> invites</span>
                        </div>
                        <div className="hiring-job-actions">
                          <button type="button" onClick={() => navigate(`/company/talent?job=${id}`)}>View matching talent</button>
                          <button type="button" onClick={() => showInsights(job)}>Insights</button>
                          <button type="button" className={active ? "is-danger" : "is-primary"} onClick={() => changeStatus(job)}>
                            {active ? "Close job" : "Reopen job"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {tab === "insights" && (
              <section className="hiring-insights">
                {!insights ? (
                  <div className="hiring-state">
                    <strong>Select a job from Job posts</strong>
                    <span>Its saves, external apply clicks and recent trend will appear here.</span>
                  </div>
                ) : (
                  <>
                    <header>
                      <div><span>Job insight</span><h2>{insights.job?.title || insights.job?.Title}</h2></div>
                      <strong>{insights.externalApplyClicks ?? 0} apply clicks</strong>
                    </header>
                    <div className="hiring-insight-summary">
                      <article><span>Job saves</span><strong>{insights.job?.saves ?? 0}</strong></article>
                      <article><span>Job views</span><strong>{insights.job?.views ?? 0}</strong></article>
                      <article><span>Invitations</span><strong>{insights.job?.invitations ?? 0}</strong></article>
                      <article><span>Apply clicks / views</span><strong>{insights.applyClickConversion ?? 0}%</strong></article>
                    </div>
                    <div className="hiring-mini-chart">
                      {(insights.chart || []).map((point) => (
                        <i
                          key={point.date}
                          style={{ height: `${Math.max(5, Math.min(100, point.externalApplyClicks * 18))}%` }}
                          title={`${point.date}: ${point.externalApplyClicks}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
