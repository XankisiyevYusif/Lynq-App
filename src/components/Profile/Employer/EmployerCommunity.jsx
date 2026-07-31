import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import PostItem from "../../Post/PostItem";
import CreatePostBox from "../../Post/CreatePostBox";
import "./EmployerCommunity.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data ?? {};

export default function EmployerCommunity({
  username,
  isOwner,
  likeConnection,
  showToast,
  defaultType = "official",
}) {
  const [type, setType] = useState(defaultType);
  const [sort, setSort] = useState("latest");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!username) return;
    setLoading(true);
    try {
      const response = await api.get(`/Company/${username}/posts`, {
        params: { type, sort, page: 1, pageSize: 20 },
      });
      const payload = unwrap(response);
      setPosts(payload?.items || payload?.Items || []);
    } catch (error) {
      console.error("Company posts could not be loaded:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [username, type, sort]);

  return (
    <section className="company-posts-section">
      <header className="company-posts-header">
        <div>
          <span>Company conversations</span>
          <h2>Posts</h2>
          <p>
            {type === "official"
              ? "Updates published by the company."
              : `Member posts that mention @${username}.`}
          </p>
        </div>
        <div className="company-posts-view-switch">
          <button type="button" className={type === "official" ? "is-active" : ""} onClick={() => setType("official")}>Official</button>
          <button type="button" className={type === "mentions" ? "is-active" : ""} onClick={() => setType("mentions")}>Mentions</button>
        </div>
      </header>

      {type === "mentions" && (
        <div className="company-posts-sort">
          <span>Sort mentions</span>
          <div>
            {["latest", "popular"].map((item) => (
              <button key={item} type="button" className={sort === item ? "is-active" : ""} onClick={() => setSort(item)}>
                {item === "latest" ? "Recent" : "Popular"}
              </button>
            ))}
          </div>
        </div>
      )}

      {isOwner && type === "official" && (
        <CreatePostBox
          placeholder={`Share an update as @${username}`}
          onPostCreated={(post) => setPosts((items) => [post, ...items])}
        />
      )}

      {loading ? (
        <div className="company-posts-state">Loading posts...</div>
      ) : posts.length === 0 ? (
        <div className="company-posts-state">
          {type === "official"
            ? "The company has not published a post yet."
            : `No member posts mention @${username} yet.`}
        </div>
      ) : (
        <div className="company-posts-list">
          {posts.map((post) => {
            const id = post.id || post.Id;
            const official = post.isOfficial || post.IsOfficial;
            return (
              <div
                key={id}
                className={`company-context-post ${official ? "is-official" : "is-mention"}`}
              >
                <div className="company-context-label">
                  {official ? "Official post" : `Mentioned @${username}`}
                </div>
                <PostItem
                  post={post}
                  showActions={isOwner && official}
                  isEmployer={post.role === "Employer" || post.Role === "Employer"}
                  likeConnection={likeConnection}
                  showToast={showToast}
                  onPostDeleted={(postId) =>
                    setPosts((items) =>
                      items.filter((item) => (item.id || item.Id) !== postId),
                    )
                  }
                  onPostUpdated={(updated) =>
                    setPosts((items) =>
                      items.map((item) =>
                        (item.id || item.Id) === (updated.id || updated.Id)
                          ? { ...item, ...updated }
                          : item,
                      ),
                    )
                  }
                />
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
