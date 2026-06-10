import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import api from "../../services/api";
import PostItem from "../Post/PostItem";
import HomeJobFeedItem from "./HomeJobFeedItem";

const HomeFeed = ({ likeConnection, showToast }) => {
  const currentUser = useSelector((state) => state.user.user);

  const currentUserId =
    currentUser?.id ||
    currentUser?.userId ||
    currentUser?.basicInfo?.id ||
    currentUser?.basicInfo?.userId;

  const [feedItems, setFeedItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const getResponseData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.Data)) return res.data.Data;
    return [];
  };

  const loadFeed = async (pageToLoad = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const res = await api.get(`/Post/feed?page=${pageToLoad}&pageSize=10`);
      const list = getResponseData(res);

      setFeedItems((prev) => (append ? [...prev, ...list] : list));
      setHasMore(list.length === 10);
      setPage(pageToLoad);
    } catch (err) {
      console.error("Failed to load home feed:", err);
      showToast?.("Failed to load feed.", "error");

      if (!append) {
        setFeedItems([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(1, false);
  }, []);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    loadFeed(page + 1, true);
  };

  const handlePostUpdated = (updatedPost) => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.itemType !== "post" || !item.post) return item;

        if (Number(item.post.id) !== Number(updatedPost.id)) return item;

        return {
          ...item,
          post: {
            ...item.post,
            ...updatedPost,
          },
        };
      })
    );
  };

  const handlePostDeleted = (postId) => {
    setFeedItems((prev) =>
      prev.filter((item) => {
        if (item.itemType !== "post" || !item.post) return true;
        return Number(item.post.id) !== Number(postId);
      })
    );
  };

  const handleJobChanged = (updatedJob) => {
    setFeedItems((prev) =>
      prev.map((item) => {
        if (item.itemType !== "job" || !item.jobPost) return item;

        if (Number(item.jobPost.id) !== Number(updatedJob.id)) return item;

        return {
          ...item,
          jobPost: {
            ...item.jobPost,
            ...updatedJob,
          },
        };
      })
    );
  };

  const isMyPost = (post) => {
    const ownerId =
      post?.postOwnerId ||
      post?.userId ||
      post?.ownerId ||
      post?.authorId;

    return String(ownerId) === String(currentUserId);
  };

  if (loading) {
    return <div style={styles.messageCard}>Loading feed...</div>;
  }

  if (!feedItems.length) {
    return (
      <div style={styles.messageCard}>
        No feed items yet. Connect with people or follow companies to see posts
        and job announcements here.
      </div>
    );
  }

  return (
    <div style={styles.list}>
      {feedItems.map((item, index) => {
        if (item.itemType === "post" && item.post) {
          return (
            <PostItem
              key={`post-${item.post.id}-${index}`}
              post={item.post}
              showActions={isMyPost(item.post)}
              isEmployer={
                item.post.role === "Employer" ||
                item.post.userType === "Employer"
              }
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
              likeConnection={likeConnection}
              showToast={showToast}
            />
          );
        }

        if (item.itemType === "job" && item.jobPost) {
          return (
            <HomeJobFeedItem
              key={`job-${item.jobPost.id}-${index}`}
              job={item.jobPost}
              onJobChanged={handleJobChanged}
              showToast={showToast}
            />
          );
        }

        return null;
      })}

      {hasMore && (
        <button
          type="button"
          style={styles.loadMoreButton}
          onClick={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
};

const styles = {
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  messageCard: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    textAlign: "center",
    color: "#666",
    fontSize: "14px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  loadMoreButton: {
    width: "100%",
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: "999px",
    padding: "10px 16px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default HomeFeed;