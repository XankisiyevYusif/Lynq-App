import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import Navbar from "../components/Layout/Navbar";
import CreatePostBox from "../components/Post/CreatePostBox";
import HomeFeed from "../components/Home/HomeFeed";
import Toast from "../components/UI/Toast";

import api from "../services/api";
import defaultAvatar from "../assets/default-avatar.png";
import defaultBackground from "../assets/defoultBackground.jpg";
import "./HomePage.css";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const HomePage = ({ likeConnection }) => {
  const user = useSelector((state) => state.user.user);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [feedRefreshKey, setFeedRefreshKey] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);
  const [toast, setToast] = useState(null);
  const isCurrentEmployer =
  user?.userType === "Employer" ||
  user?.role === "Employer" ||
  user?.roleName === "Employer" ||
  user?.basicInfo?.userType === "Employer" ||
  user?.basicInfo?.role === "Employer" ||
  user?.basicInfo?.roleName === "Employer" ||
  !!user?.companyInfo ||
  !!user?.company;

  const basicInfo = user?.basicInfo || user || {};

  const fullName =
    basicInfo.fullName ||
    user?.fullName ||
    user?.name ||
    "User";

  const username =
    basicInfo.username ||
    user?.username ||
    "";

  const currentPosition =
    basicInfo.currentPosition ||
    user?.currentPosition ||
    "Member";

  const location =
    basicInfo.location ||
    user?.location ||
    "";

  const profileImage =
    basicInfo.profileImage ||
    user?.profileImage ||
    "";

  const backgroundImage =
    basicInfo.backgroundImage ||
    user?.backgroundImage ||
    "";

  const profileImageSrc = profileImage
    ? `${API_ROOT}/${profileImage.replace(/^\/+/, "")}`
    : defaultAvatar;

  const backgroundImageSrc = backgroundImage
    ? `${API_ROOT}/${backgroundImage.replace(/^\/+/, "")}`
    : defaultBackground;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    const fetchConnectionCount = async () => {
      try {
        const res = await api.get("/Connection/my-connections");

        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.Data)
          ? res.data.Data
          : [];

        setConnectionCount(data.length);
      } catch (err) {
        console.error("Connection count failed:", err);
      }
    };

    fetchConnectionCount();
  }, []);

  useEffect(() => {
    if (!isCreateOpen) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [isCreateOpen]);

  const handlePostCreated = () => {
    setIsCreateOpen(false);
    setFeedRefreshKey((prev) => prev + 1);
    showToast("Post shared successfully.", "success");
  };

  return (
    <div>
      <Navbar />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="home-page">
        <div className="home-layout">
          <aside className="home-sidebar">
            <div className="home-profile-card">
              <div
                className="home-cover"
                style={{
                  backgroundImage: `url(${backgroundImageSrc})`,
                }}
              />

              <div className="home-profile-body">
                <img
                  src={profileImageSrc}
                  alt={fullName}
                  className="home-profile-avatar"
                  style={{
                    borderRadius: isCurrentEmployer ? "10px" : "50%",
                  }}
                />

                <div className="home-profile-name">{fullName}</div>

                <div className="home-profile-title">
                  {currentPosition || "Member"}
                </div>

                {location && (
                  <div className="home-profile-location">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="14" height="14" style={{ color: "#64748b" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {location}
                  </div>
                )}

                {username && (
                  <a href="/profile" className="home-profile-link">
                    View Profile
                  </a>
                )}
              </div>
            </div>

            <div className="home-stats-card">
              <div className="home-stats-row">
                <span>Connections</span>
                <strong>{connectionCount}</strong>
              </div>

              <div className="home-stats-muted">Grow your network</div>
            </div>
          </aside>

          <main className="home-feed">
            <div className="home-create-card">
              <div className="home-create-top">
                <img
                  src={profileImageSrc}
                  alt={fullName}
                  className="home-create-avatar"
                  style={{
                    borderRadius: isCurrentEmployer ? "8px" : "50%",
                  }}
                />

                <button
                  type="button"
                  className="home-create-input"
                  onClick={() => setIsCreateOpen(true)}
                >
                  Start a post
                </button>
              </div>

              <div className="home-create-actions">
                <button
                  type="button"
                  className="home-action-btn photo"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" width="18" height="18" style={{ color: "#22c55e" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                  Photo
                </button>

                <button
                  type="button"
                  className="home-action-btn video"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" width="18" height="18" style={{ color: "#f97316" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Video
                </button>

                <button
                  type="button"
                  className="home-action-btn article"
                  onClick={() => setIsCreateOpen(true)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" width="18" height="18" style={{ color: "#3b82f6" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
                  </svg>
                  Write article
                </button>
              </div>
            </div>

            <div className="home-sort-row">
              <div className="home-sort-line"></div>
              <span>Sort by: Top</span>
            </div>

            <HomeFeed
              key={feedRefreshKey}
              likeConnection={likeConnection}
              showToast={showToast}
            />
          </main>
        </div>
      </div>

      {isCreateOpen && (
        <div className="home-modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="home-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="home-modal-close"
              onClick={() => setIsCreateOpen(false)}
            >
              ×
            </button>

            <CreatePostBox onPostCreated={handlePostCreated} />
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;