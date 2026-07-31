import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ProfileIcon from "./ProfileIcon";

const FALLBACK_CARDS = [
  { label: "Post views", value: 0, period: "Last 7 days" },
  { label: "Profile views", value: 0, period: "Last 90 days" },
  { label: "Search appearances", value: 0, period: "Last 7 days" },
];

const cardIcon = (label) => {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("post")) return "post";
  if (normalized.includes("search")) return "search";
  if (normalized.includes("connection") || normalized.includes("follower")) return "network";
  return "eye";
};

export default function ProfileAnalyticsCard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState(FALLBACK_CARDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get("/Analytics/overview");
      const payload =
        response?.data?.data ??
        response?.data?.Data ??
        response?.data ??
        {};
      const receivedCards = payload?.cards ?? payload?.Cards;
      setCards(Array.isArray(receivedCards) && receivedCards.length ? receivedCards : FALLBACK_CARDS);
    } catch (requestError) {
      console.error("Profile analytics preview failed:", requestError);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const previewCards = useMemo(() => cards.slice(0, 3), [cards]);
  const hasData = previewCards.some((card) => Number(card.value ?? card.Value ?? 0) > 0);

  return (
    <section className="profile-analytics-card">
      <header className="profile-analytics-heading">
        <div>
          <div className="profile-analytics-title-row">
            <h2>Analytics</h2>
            <span><ProfileIcon name="lock" size={13} /> Private to you</span>
          </div>
          <p>See how people discover and engage with you.</p>
        </div>
        <button type="button" onClick={() => navigate("/analytics")}>
          View all <ProfileIcon name="arrowRight" size={15} />
        </button>
      </header>

      {loading ? (
        <div className="profile-analytics-state">Loading analytics...</div>
      ) : error ? (
        <div className="profile-analytics-state is-error">
          <span>Analytics is temporarily unavailable.</span>
          <button type="button" onClick={load}>Try again</button>
        </div>
      ) : (
        <>
          <div className="profile-analytics-metrics">
            {previewCards.map((card) => {
              const label = card.label ?? card.Label;
              const value = Number(card.value ?? card.Value ?? 0);
              const period = card.period ?? card.Period;
              return (
                <button type="button" key={label} onClick={() => navigate("/analytics")}>
                  <span className="profile-analytics-metric-icon">
                    <ProfileIcon name={cardIcon(label)} size={19} />
                  </span>
                  <span>
                    <strong>{value.toLocaleString()}</strong>
                    <b>{label}</b>
                    <small>{period}</small>
                  </span>
                </button>
              );
            })}
          </div>
          {!hasData && (
            <p className="profile-analytics-empty">
              There is not enough activity to show insights yet. Your analytics will appear here as people view your profile and posts.
            </p>
          )}
        </>
      )}
    </section>
  );
}
