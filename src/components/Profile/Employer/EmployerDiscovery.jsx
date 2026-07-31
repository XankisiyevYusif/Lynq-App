import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchHashtags } from "../../../services/searchApi";
import ProfileIcon from "../ProfileIcon";
import "./EmployerDiscovery.css";
import "./EmployerTrends.css";

const normalizeTag = (item) =>
  String(item?.name || item?.Name || item?.tag || item?.Tag || item || "")
    .trim()
    .replace(/^#+/, "");

const postCount = (item) =>
  Number(item?.postCount ?? item?.PostCount ?? item?.count ?? item?.Count ?? 0);

export default function EmployerDiscovery() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    searchHashtags("", 6)
      .then((items) => {
        if (!active) return;
        setTopics(
          (Array.isArray(items) ? items : [])
            .map((item) => ({
              name: normalizeTag(item),
              postCount: postCount(item),
            }))
            .filter((item) => item.name)
            .slice(0, 6),
        );
      })
      .catch(() => active && setTopics([]))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const openTopic = (name) =>
    navigate(`/search?query=${encodeURIComponent(`#${name}`)}&type=posts`);

  return (
    <div className="employer-discovery-stack">
      <section className="employer-discovery-card employer-trends-card">
        <header className="employer-trends-heading">
          <div>
            <span>Company discovery</span>
            <h2>Trending topics</h2>
          </div>
          <ProfileIcon name="activity" size={20} />
        </header>

        {loading ? (
          <div className="employer-trends-state">Loading trends...</div>
        ) : topics.length ? (
          <div className="employer-trends-list">
            {topics.map((topic, index) => (
              <button
                key={topic.name.toLowerCase()}
                type="button"
                onClick={() => openTopic(topic.name)}
              >
                <span>{index + 1}</span>
                <div>
                  <strong>#{topic.name}</strong>
                  <small>
                    {topic.postCount
                      ? `${topic.postCount} ${
                          topic.postCount === 1 ? "post" : "posts"
                        }`
                      : "Explore topic"}
                  </small>
                </div>
                <ProfileIcon name="arrowRight" size={16} />
              </button>
            ))}
          </div>
        ) : (
          <div className="employer-trends-state">
            <strong>No active trends yet</strong>
            <span>Hashtags from member posts will appear here.</span>
          </div>
        )}

        <button
          type="button"
          className="employer-discovery-footer"
          onClick={() => navigate("/search?type=posts")}
        >
          Explore conversations <ProfileIcon name="arrowRight" size={17} />
        </button>
      </section>
    </div>
  );
}
