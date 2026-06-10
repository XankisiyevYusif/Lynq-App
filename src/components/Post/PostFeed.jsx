import React, { useEffect, useState } from "react";
import api from "../../services/api";
import CreatePostBox from "./CreatePostBox";
import PostItem from "./PostItem";
 

const PostFeed = ({
  isOwner = false,
  userId = null,
  showCreateBox = false,
  limit = null,
  title = "Posts",
  likeConnection,
  showToast,
}) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");

      let response;

      if (isOwner) {
          response = await api.get("/Post/my?page=1&pageSize=10");
        } else if (userId) {
          response = await api.get(`/Post/user/${userId}?page=1&pageSize=10`);
        } else {
          setPosts([]);
          setLoading(false);
          return;
      }

      const fetchedPosts = response.data?.data || response.data || [];
      setPosts(Array.isArray(fetchedPosts) ? fetchedPosts : []);
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setError("Failed to load posts.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [isOwner]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((item) => (item.id === updatedPost.id ? updatedPost : item))
    );
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((item) => item.id !== deletedPostId));
  };

  const visiblePosts = limit ? posts.slice(0, limit) : posts;

  return (
    <div style={styles.wrapper}>
      {title && <div style={styles.title}>{title}</div>}

      {showCreateBox && isOwner && (
        <CreatePostBox onPostCreated={handlePostCreated} />
      )}

      {loading ? (
        <div style={styles.message}>Loading posts...</div>
      ) : error ? (
        <div style={styles.error}>{error}</div>
      ) : visiblePosts.length === 0 ? (
        <div style={styles.message}>No posts yet.</div>
      ) : (
        <div style={styles.list}>
          {visiblePosts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            showActions={isOwner}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            likeConnection={likeConnection}
            showToast={showToast}
          />
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    width: "100%",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    marginBottom: "16px",
    color: "#222",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  message: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    color: "#666",
    fontSize: "15px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  error: {
    backgroundColor: "#fff",
    border: "1px solid #f3c2c2",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    color: "#d93025",
    fontSize: "15px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default PostFeed;