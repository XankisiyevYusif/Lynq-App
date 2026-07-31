import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import ProfileIcon from "../Profile/ProfileIcon";

const unwrap = (response) => {
  const payload =
    response?.data?.data ?? response?.data?.Data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

export default function HomeSidebarWidgets() {
  const navigate = useNavigate();
  const [savedPosts, setSavedPosts] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  const load = async () => {
    const [savedResponse, eventResponse] = await Promise.all([
      api.get("/SavedPost").catch(() => ({ data: [] })),
      api.get("/Event/upcoming?take=3").catch(() => ({ data: [] })),
    ]);
    setSavedPosts(unwrap(savedResponse));
    setUpcomingEvents(unwrap(eventResponse));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handleSavedChange = ({ detail }) => {
      if (!detail?.postId) return;
      setSavedPosts((current) => {
        const exists = current.some((post) => Number(post.id) === Number(detail.postId));
        if (!detail.isSaved) {
          return current.filter((post) => Number(post.id) !== Number(detail.postId));
        }
        return exists ? current : [...current, { id: detail.postId }];
      });
    };
    window.addEventListener("nexora:saved-post-changed", handleSavedChange);
    return () => window.removeEventListener("nexora:saved-post-changed", handleSavedChange);
  }, []);

  return (
    <div className="home-sidebar-widgets">
      <section className="home-widget-card">
        <button
          type="button"
          className="home-widget-heading"
          onClick={() => navigate("/saved")}
        >
          <span className="home-widget-icon" aria-hidden="true">
            <ProfileIcon name="bookmark" size={17} strokeWidth={2} />
          </span>
          <span>
            <strong>Saved posts</strong>
            <small>{savedPosts.length} saved items</small>
          </span>
          <ProfileIcon name="arrowRight" size={16} />
        </button>
      </section>

      <section className="home-widget-card">
        <button
          type="button"
          className="home-widget-heading"
          onClick={() => navigate("/events")}
        >
          <span className="home-widget-icon" aria-hidden="true">
            <ProfileIcon name="calendar" size={17} strokeWidth={2} />
          </span>
          <span>
            <strong>Events</strong>
            <small>{upcomingEvents.length} upcoming</small>
          </span>
          <ProfileIcon name="arrowRight" size={16} />
        </button>
      </section>

    </div>
  );
}
