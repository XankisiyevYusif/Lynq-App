import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import EditPostModal from "../../Post/EditPostModal";

import pencil from "../../../assets/pencil.png";
import likeActiveIcon from "../../../assets/LikeActive.png";
import likeDeactiveIcon from "../../../assets/LikeDeactive.png";
import commentIcon from "../../../assets/comment.png";
import shareIcon from "../../../assets/share.png";

const API_BASE_URL = "https://localhost:7257";

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
      showToast?.("Like connection hazır deyil.", "error");
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

      showToast?.("Like əməliyyatı uğursuz oldu.", "error");
    }
  };

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const profileImageSrc = userPhoto
    ? `${API_BASE_URL}${userPhoto}`
    : "https://via.placeholder.com/48";

  const postImageSrc = imageUrl ? `${API_BASE_URL}${imageUrl}` : null;
  const postVideoSrc = videoUrl ? `${API_BASE_URL}${videoUrl}` : null;

  const shortContent =
    content?.length > 120 ? `${content.slice(0, 120)}...` : content;

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.authorSection}>
            <img
              src={profileImageSrc}
              alt={username || "User"}
              style={{
              ...styles.avatar,
              borderRadius: isEmployer ? "8px" : "50%",
            }}
            />

            <div style={styles.authorInfo}>
              <div style={styles.authorName}>{username || "Unknown User"}</div>
              <div style={styles.authorMeta}>
                {role || "Member"}
                {formattedDate ? ` • ${formattedDate}` : ""}
              </div>
            </div>
          </div>

          {showActions && (
            <button
              type="button"
              style={styles.pencilButton}
              onClick={() => setIsEditOpen(true)}
            >
              <img src={pencil} alt="Edit post" style={styles.pencilIcon} />
            </button>
          )}
        </div>

        <div style={styles.contentArea}>
          {shortContent && <div style={styles.content}>{shortContent}</div>}

          <div style={styles.mediaBox}>
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
        </div>

        <div style={styles.stats}>
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
            style={styles.footerButton}
            onClick={handleLike}
          >
            <img
              src={isLiked ? likeActiveIcon : likeDeactiveIcon}
              alt={isLiked ? "Liked" : "Like"}
              style={styles.footerIcon}
            />
            <span>{isLiked ? "Liked" : "Like"}</span>
          </button>

          <button
            type="button"
            className="post-footer-button"
            style={styles.footerButton}
            onClick={() => onOpenComments?.(id)}
          >
            <img src={commentIcon} alt="Comment" style={styles.footerIcon} />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="post-footer-button"
            style={styles.footerButton}
          >
            <img src={shareIcon} alt="Share" style={styles.footerIcon} />
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
          document.body
        )}
    </>
  );
};

const styles = {
  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 16,
    padding: 16,
    height: 620,
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
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
    width: 48,
    height: 48,
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #ddd",
    flexShrink: 0,
  },

  authorName: {
    fontSize: 16,
    fontWeight: 600,
    color: "#222",
  },

  authorMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  contentArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
  },

  content: {
    fontSize: 15,
    lineHeight: 1.5,
    color: "#222",
    marginBottom: 12,
    minHeight: 48,
    maxHeight: 48,
    overflow: "hidden",
  },

  mediaBox: {
    flex: 1,
    minHeight: 0,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#f7f7f7",
    border: "1px solid #eee",
  },

  postImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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
    color: "#666",
    paddingTop: 12,
    paddingBottom: 12,
    borderBottom: "1px solid #eee",
  },

  commentCountButton: {
    border: "none",
    background: "transparent",
    padding: 0,
    margin: 0,
    fontSize: 13,
    color: "#666",
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
    color: "#444",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    transition: "background-color 0.2s ease, opacity 0.2s ease",
  },

  footerIcon: {
    width: 18,
    height: 18,
    objectFit: "contain",
  },

  pencilButton: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  pencilIcon: {
    width: 18,
    height: 18,
    objectFit: "contain",
  },
};

export default ActivityPreviewCard;