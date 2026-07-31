import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import ProfileIcon from "../components/Profile/ProfileIcon";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../services/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import defaultAvatar from "../assets/default-avatar.png";
import "./AnalyticsPage.css";

const TABS = [
  { key: "overview", label: "Overview", icon: "chart" },
  { key: "content", label: "Content", icon: "post" },
  { key: "audience", label: "Audience", icon: "user" },
];

const EMPTY_TOTALS = {
  postViews: 0,
  reactions: 0,
  comments: 0,
  saves: 0,
  engagementRate: 0,
};

const EMPTY_OVERVIEW = {
  account: null,
  cards: [
    { label: "Post views", value: 0, changePercent: 0, period: "Last 7 days" },
    { label: "Profile views", value: 0, changePercent: 0, period: "Last 90 days" },
    { label: "Search appearances", value: 0, changePercent: 0, period: "Last 7 days" },
    { label: "Connections", value: 0, changePercent: 0, period: "Total audience" },
  ],
};

const compactNumber = new Intl.NumberFormat("en", { notation: "compact" });
const unwrap = (payload) => payload?.data ?? payload?.Data ?? payload ?? {};
const pick = (source, camel, pascal, fallback) =>
  source?.[camel] ?? source?.[pascal] ?? fallback;

const normalizeContent = (payload) => {
  const source = unwrap(payload);
  const totalsSource = pick(source, "totals", "Totals", {});
  const normalizePost = (post) => ({
    id: pick(post, "id", "Id", 0),
    content: pick(post, "content", "Content", "Media post"),
    createdAt: pick(post, "createdAt", "CreatedAt", null),
    imageUrl: pick(post, "imageUrl", "ImageUrl", null),
    hasVideo: pick(post, "hasVideo", "HasVideo", false),
    views: pick(post, "views", "Views", 0),
    reactions: pick(post, "reactions", "Reactions", 0),
    comments: pick(post, "comments", "Comments", 0),
    saves: pick(post, "saves", "Saves", 0),
    engagementRate: pick(post, "engagementRate", "EngagementRate", 0),
  });
  return {
    totals: {
      postViews: pick(totalsSource, "postViews", "PostViews", 0),
      reactions: pick(totalsSource, "reactions", "Reactions", 0),
      comments: pick(totalsSource, "comments", "Comments", 0),
      saves: pick(totalsSource, "saves", "Saves", 0),
      engagementRate: pick(
        totalsSource,
        "engagementRate",
        "EngagementRate",
        0,
      ),
    },
    chart: pick(source, "chart", "Chart", []).map((item) => ({
      date: pick(item, "date", "Date", ""),
      views: pick(item, "views", "Views", 0),
      engagements: pick(item, "engagements", "Engagements", 0),
    })),
    topPosts: pick(source, "topPosts", "TopPosts", []).map(normalizePost),
  };
};

const normalizeAudience = (payload) => {
  const source = unwrap(payload);
  const normalizeBreakdown = (items) =>
    (items || []).map((item) => ({
      label: pick(item, "label", "Label", "Unknown"),
      count: pick(item, "count", "Count", 0),
      percentage: pick(item, "percentage", "Percentage", 0),
    }));
  return {
    title: pick(source, "title", "Title", "Audience growth"),
    total: pick(source, "total", "Total", 0),
    newThisPeriod: pick(source, "newThisPeriod", "NewThisPeriod", 0),
    chart: pick(source, "chart", "Chart", []).map((item) => ({
      date: pick(item, "date", "Date", ""),
      total: pick(item, "total", "Total", 0),
    })),
    locations: normalizeBreakdown(
      pick(source, "locations", "Locations", []),
    ),
    positions: normalizeBreakdown(
      pick(source, "positions", "Positions", []),
    ),
    skills: normalizeBreakdown(pick(source, "skills", "Skills", [])),
  };
};

function Trend({ value }) {
  if (value === null || value === undefined) {
    return <span className="analytics-trend is-new">New activity</span>;
  }
  const numeric = Number(value || 0);
  return (
    <span className={`analytics-trend ${numeric < 0 ? "is-down" : numeric > 0 ? "is-up" : ""}`}>
      {numeric > 0 ? "↑" : numeric < 0 ? "↓" : "—"} {Math.abs(numeric)}%
    </span>
  );
}

function LineChart({ data = [], valueKey = "views", secondaryKey }) {
  const width = 760;
  const height = 220;
  const inset = 18;
  const max = Math.max(
    1,
    ...data.map((item) => Number(item[valueKey] || 0)),
    ...(secondaryKey ? data.map((item) => Number(item[secondaryKey] || 0)) : []),
  );

  const pointsFor = (key) =>
    data
      .map((item, index) => {
        const x = inset + (index * (width - inset * 2)) / Math.max(1, data.length - 1);
        const y = height - inset - (Number(item[key] || 0) / max) * (height - inset * 2);
        return `${x},${y}`;
      })
      .join(" ");

  if (!data.length) return <div className="analytics-empty-chart">No activity for this period.</div>;

  return (
    <div className="analytics-chart-wrap">
      <svg className="analytics-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Analytics trend chart">
        {[0.25, 0.5, 0.75].map((line) => (
          <line key={line} x1={inset} x2={width - inset} y1={height * line} y2={height * line} className="analytics-grid-line" />
        ))}
        <polyline points={pointsFor(valueKey)} className="analytics-line-primary" />
        {secondaryKey && <polyline points={pointsFor(secondaryKey)} className="analytics-line-secondary" />}
      </svg>
      <div className="analytics-chart-dates">
        <span>{new Date(data[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

function Breakdown({ title, items = [] }) {
  return (
    <section className="analytics-breakdown-card">
      <h3>{title}</h3>
      {items.length ? (
        <div className="analytics-breakdown-list">
          {items.map((item) => (
            <div key={item.label} className="analytics-breakdown-row">
              <div>
                <strong>{item.label}</strong>
                <span>{item.count} people</span>
              </div>
              <div className="analytics-breakdown-meter">
                <i style={{ width: `${Math.min(100, Number(item.percentage || 0))}%` }} />
              </div>
              <b>{item.percentage}%</b>
            </div>
          ))}
        </div>
      ) : (
        <p className="analytics-empty-copy">More audience data is needed to show this breakdown.</p>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState(null);
  const [content, setContent] = useState(null);
  const [audience, setAudience] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const normalizeOverview = (payload) => {
    const source = payload?.data ?? payload?.Data ?? payload ?? {};
    const cards = source.cards ?? source.Cards;
    return {
      account: source.account ?? source.Account ?? null,
      cards: Array.isArray(cards) && cards.length ? cards : EMPTY_OVERVIEW.cards,
    };
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        if (activeTab === "overview" && !overview) {
          const response = await api.get("/Analytics/overview");
          if (!cancelled) setOverview(normalizeOverview(response.data));
        }
        if (activeTab === "content") {
          const response = await api.get(`/Analytics/content?days=${days}`);
          if (!cancelled) setContent(normalizeContent(response.data));
        }
        if (activeTab === "audience" && !audience) {
          const response = await api.get("/Analytics/audience");
          if (!cancelled) setAudience(normalizeAudience(response.data));
        }
      } catch (requestError) {
        console.error("Analytics loading failed:", requestError);
        if (!cancelled) setError("Analytics could not be loaded. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab, days]);

  const chartSummary = useMemo(() => {
    const totals = content?.totals || EMPTY_TOTALS;
    return [
      ["Post views", totals.postViews],
      ["Reactions", totals.reactions],
      ["Comments", totals.comments],
      ["Saves", totals.saves],
    ];
  }, [content]);

  const hasOverviewData = (overview?.cards || []).some((card) =>
    Number(card.value ?? card.Value ?? 0) > 0,
  );

  return (
    <>
      <Navbar />
      <div className="analytics-page">
        <aside className="analytics-sidebar">
          <section className="analytics-account-card">
            <img
              src={resolveMediaUrl(overview?.account?.image, defaultAvatar)}
              alt=""
              onError={(event) => {
                event.currentTarget.src = defaultAvatar;
              }}
            />
            <div>
              <strong>{overview?.account?.displayName || "Your analytics"}</strong>
              {overview?.account?.username && <span>@{overview.account.username}</span>}
            </div>
          </section>
          <nav className="analytics-tabs" aria-label="Analytics sections">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={activeTab === tab.key ? "is-active" : ""}
                onClick={() => setActiveTab(tab.key)}
              >
                <ProfileIcon name={tab.icon} size={19} />
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="analytics-privacy-note">
            <ProfileIcon name="lock" size={17} />
            <p><strong>Private to you</strong><span>Only you can view these insights.</span></p>
          </div>
        </aside>

        <main className="analytics-main">
          <header className="analytics-heading">
            <div>
              <span className="analytics-eyebrow">Performance</span>
              <h1>{TABS.find((tab) => tab.key === activeTab)?.label} analytics</h1>
              <p>Understand how your profile, content and professional audience are growing.</p>
            </div>
            {activeTab === "content" && (
              <select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Analytics period">
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            )}
          </header>

          {loading ? (
            <div className="analytics-loading"><LoadingSpinner text="Loading analytics..." /></div>
          ) : error ? (
            <section className="analytics-error-card">
              <h2>Something went wrong</h2>
              <p>{error}</p>
              <button type="button" onClick={() => window.location.reload()}>Try again</button>
            </section>
          ) : activeTab === "overview" ? (
            <>
              <section className="analytics-metric-grid">
                {(overview?.cards || []).map((card, index) => (
                  <article className="analytics-metric-card" key={card.label}>
                    <span className={`analytics-metric-icon tone-${index + 1}`}>
                      <ProfileIcon name={index === 0 ? "eye" : index === 1 ? "user" : index === 2 ? "search" : "network"} size={20} />
                    </span>
                    <small>{card.label}</small>
                    <strong>{compactNumber.format(Number(card.value || 0))}</strong>
                    <footer><Trend value={card.changePercent} /><span>{card.period}</span></footer>
                  </article>
                ))}
              </section>
              {!hasOverviewData && (
                <section className="analytics-no-data-card">
                  <span className="analytics-no-data-icon"><ProfileIcon name="chart" size={21} /></span>
                  <div>
                    <h2>Not enough data yet</h2>
                    <p>This is normal for a new account. Insights will appear after your profile and posts begin receiving activity.</p>
                  </div>
                </section>
              )}
              <section className="analytics-insight-card">
                <div className="analytics-insight-mark">N</div>
                <div>
                  <span className="analytics-eyebrow">Nexora insight</span>
                  <h2>Consistency makes your profile easier to discover.</h2>
                  <p>Complete your profile and publish useful posts regularly. New activity will appear here as people view and find you.</p>
                </div>
              </section>
            </>
          ) : activeTab === "content" ? (
            <>
              <section className="analytics-content-summary">
                {chartSummary.map(([label, value]) => (
                  <div key={label}><span>{label}</span><strong>{compactNumber.format(Number(value || 0))}</strong></div>
                ))}
                <div className="analytics-rate"><span>Engagement rate</span><strong>{content?.totals?.engagementRate || 0}%</strong></div>
              </section>
              <section className="analytics-chart-card">
                <div className="analytics-card-heading">
                  <div><h2>Content performance</h2><p>Views and engagement across the selected period</p></div>
                  <div className="analytics-legend"><span><i />Views</span><span><i />Engagements</span></div>
                </div>
                <LineChart data={content?.chart} valueKey="views" secondaryKey="engagements" />
              </section>
              <section className="analytics-top-posts">
                <div className="analytics-card-heading"><div><h2>Top performing posts</h2><p>Your best content for this period</p></div></div>
                {(content?.topPosts || []).length ? content.topPosts.map((post, index) => (
                  <article key={post.id} className="analytics-post-row">
                    <span className="analytics-post-rank">{index + 1}</span>
                    <div className="analytics-post-copy">
                      <strong>{post.content}</strong>
                      <small>{new Date(post.createdAt).toLocaleDateString()} {post.hasVideo ? "· Video" : post.imageUrl ? "· Image" : ""}</small>
                    </div>
                    <div className="analytics-post-stats">
                      <span><b>{post.views}</b> views</span>
                      <span><b>{post.reactions}</b> reactions</span>
                      <span><b>{post.comments}</b> comments</span>
                      <span><b>{post.saves}</b> saves</span>
                    </div>
                    <div className="analytics-post-rate"><b>{post.engagementRate}%</b><span>engagement</span></div>
                  </article>
                )) : <p className="analytics-empty-copy">Publish a post to start seeing content insights.</p>}
              </section>
            </>
          ) : (
            <>
              <section className="analytics-chart-card">
                <div className="analytics-card-heading">
                  <div><h2>{audience?.title || "Audience growth"}</h2><p>Growth over the last 30 days</p></div>
                  <div className="analytics-audience-total"><strong>{audience?.total || 0}</strong><span>+{audience?.newThisPeriod || 0} new</span></div>
                </div>
                <LineChart data={audience?.chart} valueKey="total" />
              </section>
              <div className="analytics-breakdown-grid">
                <Breakdown title="Top locations" items={audience?.locations} />
                <Breakdown title="Top positions" items={audience?.positions} />
                <Breakdown title="Top skills" items={audience?.skills} />
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
