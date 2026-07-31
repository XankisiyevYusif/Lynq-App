import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import EditPostModal from "../../Post/EditPostModal";

import defaultAvatar from "../../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import ProfileIcon from "../ProfileIcon";
import RichPostContent from "../../Post/RichPostContent";

const ActivityPreviewCard = ({
  post,
  likeConnection,
  onPostUpdated,
  onPostDeleted,
  showToast,
  onOpenComments,
  showActions = false,
  isEmployer = false,
}) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(!!post.isLikedByCurrentUser);

  useEffect(() => {
    setLocalLikeCount(post.likeCount || 0);
    setIsLiked(!!post.isLikedByCurrentUser);
  }, [post.likeCount, post.isLikedByCurrentUser]);

  const {
    id,
    username,
    userPhoto,
    role,
    content,
    imageUrl,
    videoUrl,
    createdAt,
    commentCount,
  } = post;

  const handleLike = async () => {
    if (!likeConnection) {
      showToast?.("The like connection is not ready.", "error");
      return;
    }

    const previousLiked = isLiked;
    const previousCount = localLikeCount;

    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(previousCount - 1, 0)
      : previousCount + 1;

    setIsLiked(nextLiked);
    setLocalLikeCount(nextCount);

    try {
      await likeConnection.invoke("ToggleLike", id);

      onPostUpdated?.({
        ...post,
        likeCount: nextCount,
        isLikedByCurrentUser: nextLiked,
      });
    } catch (error) {
      console.error("Preview like failed:", error);

      setIsLiked(previousLiked);
      setLocalLikeCount(previousCount);

      showToast?.("The like action failed.", "error");
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const profileImageSrc = resolveMediaUrl(userPhoto, defaultAvatar);
  const postImageSrc = resolveMediaUrl(imageUrl) || null;
  const postVideoSrc = resolveMediaUrl(videoUrl) || null;

  const shortContent =
    content?.length > 120 ? `${content.slice(0, 120)}...` : content;

  return (
    <>
      <div className="activity-preview-card" style={styles.card}>
        <div style={styles.header}>
          <div style={styles.authorSection}>
            <img
              src={profileImageSrc}
              alt={username || "User"}
              style={{
                ...styles.avatar,
                borderRadius: isEmployer ? "8px" : "50%",
              }}
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
            />

            <div style={styles.authorInfo}>
              <div className="activity-preview-author" style={styles.authorName}>{username || "Unknown User"}</div>
              <div className="activity-preview-meta" style={styles.authorMeta}>
                {role || "Member"}
                {formattedDate ? ` • ${formattedDate}` : ""}
              </div>
            </div>
          </div>

          {showActions && (
            <button
              type="button"
              className="profile-icon-button"
              style={styles.pencilButton}
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit post"
            >
              <ProfileIcon name="edit" size={18} />
            </button>
          )}
        </div>

        <div className="activity-preview-content" style={styles.contentArea}>
          {shortContent && (
            <RichPostContent content={shortContent} style={styles.content} />
          )}

          {(postImageSrc || postVideoSrc) && (
            <div className="activity-preview-media" style={styles.mediaBox}>
              {postImageSrc && (
                <img src={postImageSrc} alt="Post" style={styles.postImage} />
              )}

              {postVideoSrc && (
                <video controls style={styles.postVideo}>
                  <source src={postVideoSrc} />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </div>

        <div className="activity-preview-stats" style={styles.stats}>
          <span>{localLikeCount || 0} likes</span>

          <button
            className="comment-count-button"
            type="button"
            style={styles.commentCountButton}
            onClick={() => onOpenComments?.(id)}
          >
            {commentCount || 0} comments
          </button>
        </div>

        <div style={styles.footer}>
          <button
            type="button"
            className="post-footer-button"
            style={{
              ...styles.footerButton,
              color: isLiked ? "#e11d48" : "var(--app-text-soft)",
            }}
            onClick={handleLike}
          >
            <ProfileIcon name="heart" size={18} filled={isLiked} />
            <span>{isLiked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            className="post-footer-button"
            style={styles.footerButton}
            onClick={() => onOpenComments?.(id)}
          >
            <ProfileIcon name="comment" size={18} />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="post-footer-button"
            style={styles.footerButton}
          >
            <ProfileIcon name="share" size={18} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {isEditOpen &&
        createPortal(
          <EditPostModal
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            post={post}
            showToast={showToast}
            onUpdated={(updatedPost) => {
              onPostUpdated?.({
                ...post,
                ...updatedPost,
                id: post.id,
              });

              setIsEditOpen(false);
            }}
            onDeleted={(deletedPostId) => {
              onPostDeleted?.(deletedPostId);
              setIsEditOpen(false);
            }}
          />,
          document.body,
        )}
    </>
  );
};

const styles = {
  card: {
    width: "100%",
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    padding: 14,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },

  authorSection: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },

  authorInfo: {
    minWidth: 0,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid var(--app-border)",
    flexShrink: 0,
  },

  authorName: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--app-text)",
  },

  authorMeta: {
    fontSize: 13,
    color: "var(--app-muted)",
    marginTop: 2,
  },

  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  content: {
    fontSize: 14,
    lineHeight: 1.5,
    color: "var(--app-text-soft)",
    marginBottom: 12,
    minHeight: 48,
    maxHeight: 48,
    overflow: "hidden",
  },

  mediaBox: {
    height: 190,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "var(--app-surface-2)",
    border: "1px solid var(--app-border)",
  },

  postImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
  },

  postVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    backgroundColor: "#000",
    display: "block",
  },

  stats: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 13,
    color: "var(--app-muted)",
    paddingTop: 12,
    paddingBottom: 12,
    borderBottom: "1px solid var(--app-border)",
  },

  commentCountButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    fontSize: 13,
    color: "var(--app-muted)",
    cursor: "pointer",
  },

  footer: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
  },

  footerButton: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--app-text-soft)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
  },

  pencilButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--app-muted)",
  },
};

export default ActivityPreviewCard;
