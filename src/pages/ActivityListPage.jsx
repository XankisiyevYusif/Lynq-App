import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import PostItem from "../components/Post/PostItem";
import Toast from "../components/UI/Toast";
import LoadingSpinner from "../components/UI/LoadingSpinner";

const ActivityListPage = ({ likeConnection }) => {
  const { username } = useParams();
  const location = useLocation();

  const isOwner = location.state?.isOwner === true;
  const userId = location.state?.userId;
  const openCommentsPostId = location.state?.openCommentsPostId;
  const isEmployer = location.state?.isEmployer === true;
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const page = 1;
  const pageSize = 10;

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
    const fetchPosts = async () => {
      try {
        setLoading(true);

        if (!isOwner && !userId) {
          console.error("Activity page userId is missing:", {
            username,
            state: location.state,
          });

          setPosts([]);
          return;
        }

        const endpoint = isOwner
          ? `/Post/my?page=${page}&pageSize=${pageSize}`
          : `/Post/user/${userId}?page=${page}&pageSize=${pageSize}`;

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

    fetchPosts();
  }, [username, isOwner, userId, location.state]);

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
                  showActions={isOwner}
                  isEmployer={isEmployer}
                  showToast={showToast}
                  likeConnection={likeConnection}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  defaultCommentsOpen={
                    Number(openCommentsPostId) === Number(post.id)
                  }
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