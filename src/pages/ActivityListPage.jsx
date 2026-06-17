import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import PostItem from "../components/Post/PostItem";
import Toast from "../components/UI/Toast";
import LoadingSpinner from "../components/UI/LoadingSpinner";

const ActivityListPage = ({ likeConnection }) => {
  const { username } = useParams();
  const location = useLocation();

  const [resolvedUserId, setResolvedUserId] = useState(location.state?.userId || null);
  const [resolvedIsOwner, setResolvedIsOwner] = useState(location.state?.isOwner === true);
  const [resolvedIsEmployer, setResolvedIsEmployer] = useState(location.state?.isEmployer === true);
  const openCommentsPostId = location.state?.openCommentsPostId;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

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

        let currentUserId = resolvedUserId;
        let currentIsOwner = resolvedIsOwner;
        let currentIsEmployer = resolvedIsEmployer;

        // Resolve user info if missing (direct URL visit fallback)
        if (!currentUserId) {
          const token = localStorage.getItem("token");
          let loggedInUsername = null;
          if (token) {
            try {
              const decoded = jwtDecode(token);
              loggedInUsername = decoded?.unique_name || decoded?.username || null;
            } catch (err) {
              console.error("Token decode error in ActivityListPage:", err);
            }
          }

          const isOwnerMatch = loggedInUsername?.toLowerCase() === username?.toLowerCase();
          currentIsOwner = isOwnerMatch;
          setResolvedIsOwner(isOwnerMatch);

          let res;
          if (isOwnerMatch) {
            res = await api.get("/User/me");
          } else {
            res = await api.get(`/User/${username}`);
          }

          const userProfile = res.data;
          if (userProfile) {
            currentUserId = userProfile.id || userProfile.userId || userProfile.basicInfo?.id;
            currentIsEmployer = userProfile.userType === "Employer" || userProfile.role === "Employer";

            setResolvedUserId(currentUserId);
            setResolvedIsEmployer(currentIsEmployer);
          }
        }

        if (!currentUserId && !currentIsOwner) {
          console.error("Activity page userId is missing and cannot be resolved:", {
            username,
            state: location.state,
          });

          setPosts([]);
          return;
        }

        const endpoint = currentIsOwner
          ? `/Post/my?page=${page}&pageSize=${pageSize}`
          : `/Post/user/${currentUserId}?page=${page}&pageSize=${pageSize}`;

        console.log("Activity endpoint:", endpoint);

        const res = await api.get(endpoint);

        const data = res.data?.data || res.data || [];

        setPosts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch activity posts:", error);
        setPosts([]);
        showToast("Postlar yüklənmədi.", "error");
      } finally {
        setLoading(false);
      }
    };

    resolveUserAndFetchPosts();
  }, [username, resolvedUserId, resolvedIsOwner, resolvedIsEmployer, location.state]);

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === updatedPost.id
          ? {
              ...p,
              ...updatedPost,
              id: p.id,
            }
          : p
      )
    );
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p.id !== deletedPostId));
  };

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.title}>All activity</h2>

          {loading ? (
            <LoadingSpinner text="Loading activity feed..." />
          ) : posts.length === 0 ? (
            <div style={styles.message}>No posts found.</div>
          ) : (
            <div style={styles.list}>
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

const styles = {
  page: {
    backgroundColor: "#f3f2ef",
    minHeight: "100vh",
    padding: "24px 0",
  },

  container: {
    width: "800px",
    margin: "0 auto",
  },

  title: {
    marginBottom: 20,
    fontSize: 28,
    fontWeight: 700,
  },

  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  message: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: 18,
    color: "#666",
    fontSize: 15,
  },
};

export default ActivityListPage;