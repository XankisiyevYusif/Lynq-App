import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchHashtags } from "../../services/searchApi";

const normalizeTag = (item) =>
  String(item?.name || item?.Name || item?.tag || item?.Tag || item || "")
    .trim()
    .replace(/^#+/, "");

const getPostCount = (item) =>
  Number(item?.postCount ?? item?.PostCount ?? item?.count ?? item?.Count ?? 0);

export default function NexoraTrends() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    searchHashtags("", 5)
      .then((items) => {
        if (!active) return;

        setTopics(
          (Array.isArray(items) ? items : [])
            .map((item) => ({
              name: normalizeTag(item),
              postCount: getPostCount(item),
            }))
            .filter((item) => item.name)
            .slice(0, 5),
        );
      })
      .catch(() => active && setTopics([]))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const openTopic = (name) => {
    navigate(`/search?query=${encodeURIComponent(`#${name}`)}&type=posts`);
  };

  return (
    <section className="nexora-trends-card" aria-labelledby="nexora-trends-title">
      <div className="nexora-trends-header">
        <div>
          <span className="nexora-trends-eyebrow">Discover</span>
          <h2 id="nexora-trends-title">Trending on Nexora</h2>
        </div>
        <span className="nexora-trends-mark" aria-hidden="true">N</span>
      </div>

      {loading ? (
        <div className="nexora-trends-loading" aria-label="Loading trends">
          {[1, 2, 3, 4].map((item) => <span key={item} />)}
        </div>
      ) : topics.length > 0 ? (
        <div className="nexora-trends-list">
          {topics.map((topic, index) => (
            <button
              key={topic.name.toLowerCase()}
              type="button"
              onClick={() => openTopic(topic.name)}
            >
              <span className="nexora-trends-rank">{index + 1}</span>
              <span className="nexora-trends-topic">
                <strong>#{topic.name}</strong>
                <small>
                  {topic.postCount > 0
                    ? `${topic.postCount} ${topic.postCount === 1 ? "post" : "posts"}`
                    : "Explore topic"}
                </small>
              </span>
              <span className="nexora-trends-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="nexora-trends-empty">
          <strong>Be the first to start a trend</strong>
          <span>Add a hashtag to your next post.</span>
        </div>
      )}

      <button
        type="button"
        className="nexora-trends-more"
        onClick={() => navigate("/search?type=posts")}
      >
        Explore all posts <span aria-hidden="true">→</span>
      </button>
    </section>
  );
}
