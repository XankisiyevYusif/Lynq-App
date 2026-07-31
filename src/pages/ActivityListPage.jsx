import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import PostItem from "../components/Post/PostItem";
import Toast from "../components/UI/Toast";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import defaultAvatar from "../assets/default-avatar.png";
import { resolveMediaUrl } from "../utils/mediaUrl";
import ProfileIcon from "../components/Profile/ProfileIcon";
import "./ActivityListPage.css";

const ActivityListPage = ({ likeConnection }) => {
  const { username } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [resolvedIsOwner, setResolvedIsOwner] = useState(
    location.state?.isOwner === true,
  );
  const [resolvedIsEmployer, setResolvedIsEmployer] = useState(
    location.state?.isEmployer === true,
  );
  const openCommentsPostId = location.state?.openCommentsPostId;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileSummary, setProfileSummary] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const page = 1;
  const pageSize = 10;

  const queryParams = new URLSearchParams(location.search);
  const targetPostId = queryParams.get("postId");

  const showToast = (message, type = "success") => {
    setToast({
      open: true,
      message,
      type,
    });
  };

  const closeToast = () => {
    setToast({
      open: false,
      message: "",
      type: "success",
    });
  };

  useEffect(() => {
    const resolveUserAndFetchPosts = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");
        let loggedInUsername = null;

        if (token) {
          try {
            const decoded = jwtDecode(token);
            loggedInUsername =
              decoded?.unique_name || decoded?.username || null;
          } catch (err) {
            console.error("Token decode error in ActivityListPage:", err);
          }
        }

        const currentIsOwner =
          location.state?.isOwner === true ||
          loggedInUsername?.toLowerCase() === username?.toLowerCase();

        const profileResponse = currentIsOwner
          ? await api.get("/User/me")
          : await api.get(`/User/${username}`);

        const userProfile =
          profileResponse?.data?.data || profileResponse?.data || null;

        setProfileSummary(userProfile);

        const currentUserId =
          location.state?.userId ||
          userProfile?.id ||
          userProfile?.userId ||
          userProfile?.basicInfo?.userId ||
          userProfile?.basicInfo?.id;

        const currentIsEmployer =
          location.state?.isEmployer === true ||
          userProfile?.userType === "Employer" ||
          userProfile?.role === "Employer";

        setResolvedIsOwner(currentIsOwner);
        setResolvedIsEmployer(currentIsEmployer);

        if (!currentUserId && !currentIsOwner) {
          console.error(
            "Activity page userId is missing and cannot be resolved:",
            {
              username,
              state: location.state,
            },
          );

          setPosts([]);
          return;
        }

        const endpoint = currentIsOwner
          ? `/Post/my?page=${page}&pageSize=${pageSize}`
          : `/Post/user/${currentUserId}?page=${page}&pageSize=${pageSize}`;

        const res = await api.get(endpoint);

        const data = res.data?.data || res.data || [];

        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch activity posts:", error);
        setPosts([]);
        showToast("Posts could not be loaded.", "error");
      } finally {
        setLoading(false);
      }
    };

    resolveUserAndFetchPosts();
  }, [
    username,
    location.state?.isEmployer,
    location.state?.isOwner,
    location.state?.userId,
  ]);

  const basicInfo = profileSummary?.basicInfo || {};
  const profileName =
    basicInfo.fullName ||
    profileSummary?.companyInfo?.name ||
    profileSummary?.fullName ||
    username;
  const profileImage =
    basicInfo.profileImage || profileSummary?.companyInfo?.logoUrl;
  const profilePosition =
    basicInfo.currentPosition ||
    profileSummary?.companyInfo?.industry ||
    "Nexora member";

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === updatedPost.id
          ? {
              ...p,
              ...updatedPost,
              id: p.id,
            }
          : p,
      ),
    );
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  };

  return (
    <>
      <Navbar />

      <div className="activity-page">
        <div className="activity-layout">
          <aside className="activity-profile-card">
            <img
              className="activity-profile-avatar"
              src={resolveMediaUrl(profileImage, defaultAvatar)}
              alt={profileName}
              onError={(event) => {
                event.currentTarget.src = defaultAvatar;
              }}
            />
            <h2 className="activity-profile-name">{profileName}</h2>
            <p className="activity-profile-position">{profilePosition}</p>
            {basicInfo.location && (
              <p className="activity-profile-location">{basicInfo.location}</p>
            )}
            <button
              type="button"
              className="activity-view-profile"
              onClick={() => navigate(`/profile/${username}`)}
            >
              View profile
              <ProfileIcon name="arrowRight" size={17} />
            </button>
          </aside>

          <main className="activity-feed-column">
            <div className="activity-heading-card">
              <div className="activity-heading-icon" aria-hidden="true">
                <ProfileIcon name="activity" size={21} strokeWidth={2} />
              </div>
              <div className="activity-heading-copy">
                <span className="activity-eyebrow">Profile activity</span>
                <h1>All activity</h1>
                <p>Posts and updates shared by {profileName}</p>
              </div>
            </div>

            {loading ? (
              <div className="activity-state-card">
                <LoadingSpinner text="Loading activity feed..." />
              </div>
            ) : posts.length === 0 ? (
              <div className="activity-state-card">No posts found.</div>
            ) : (
              <div className="activity-post-list">
                {posts.map((post) => (
                  <PostItem
                    key={post.id}
                    post={post}
                    showActions={resolvedIsOwner}
                    isEmployer={resolvedIsEmployer}
                    showToast={showToast}
                    likeConnection={likeConnection}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostDeleted}
                    defaultCommentsOpen={
                      Number(openCommentsPostId) === Number(post.id)
                    }
                    highlighted={Number(targetPostId) === Number(post.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={closeToast}
        />
      )}
    </>
  );
};

export default ActivityListPage;
