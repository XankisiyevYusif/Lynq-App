import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

import api, { API_ROOT } from "../../services/api";
import EditPostModal from "./EditPostModal";
import CommentWindow from "../comment/commentWindow";
import defaultAvatar from "../../assets/default-avatar.png";
import "./Post.css";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import ProfileIcon from "../Profile/ProfileIcon";
import RichPostContent from "./RichPostContent";
import ReportPostModal from "./ReportPostModal";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = API_ROOT;

const PostItem = ({
  post,
  showActions = false,
  isEmployer = false,
  onPostUpdated,
  onPostDeleted,
  showToast,
  likeConnection,
  defaultCommentsOpen = false,
  highlighted = false,
  onSavedChange,
}) => {
  const navigate = useNavigate();
  const commentCountConnectionRef = useRef(null);
  const postRef = useRef(null);
  const postMenuRef = useRef(null);
  const latestPostRef = useRef(post);
  const onPostUpdatedRef = useRef(onPostUpdated);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(!!post.isLikedByCurrentUser);
  const [isCommentsOpen, setIsCommentsOpen] = useState(defaultCommentsOpen);
  const [localCommentCount, setLocalCommentCount] = useState(
    post.commentCount || 0,
  );
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [localSaveCount, setLocalSaveCount] = useState(
    Number(post.saveCount ?? post.savedCount ?? post.SaveCount ?? post.SavedCount ?? 0),
  );

  latestPostRef.current = post;
  onPostUpdatedRef.current = onPostUpdated;

  useEffect(() => {
    if (highlighted && postRef.current) {
      const timer = setTimeout(() => {
        postRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [highlighted]);

  useEffect(() => {
    if (!postMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target)) {
        setPostMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [postMenuOpen]);

  const {
    id,
    username,
    userPhoto,
    role,
    content,
    imageUrl,
    videoUrl,
    createdAt,
  } = post;

  useEffect(() => {
    if (!id || !postRef.current || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const storageKey = `nexora-post-view-${id}`;
    if (sessionStorage.getItem(storageKey)) return undefined;

    let visibleTimer;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(visibleTimer);
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.6) return;

        visibleTimer = window.setTimeout(() => {
          sessionStorage.setItem(storageKey, "1");
          api.post(`/Analytics/track/post-view/${id}`).catch((error) => {
            sessionStorage.removeItem(storageKey);
            console.error("Post analytics tracking failed:", error);
          });
          observer.disconnect();
        }, 1000);
      },
      { threshold: [0.6] },
    );

    observer.observe(postRef.current);
    return () => {
      window.clearTimeout(visibleTimer);
      observer.disconnect();
    };
  }, [id]);

  useEffect(() => {
    setLocalLikeCount(post.likeCount || 0);
    setIsLiked(!!post.isLikedByCurrentUser);
  }, [post.likeCount, post.isLikedByCurrentUser]);

  useEffect(() => {
    setLocalCommentCount(post.commentCount || 0);
  }, [post.commentCount]);

  useEffect(() => {
    setIsSaved(!!post.isSaved);
  }, [post.isSaved]);

  useEffect(() => {
    setLocalSaveCount(
      Number(post.saveCount ?? post.savedCount ?? post.SaveCount ?? post.SavedCount ?? 0),
    );
  }, [post.saveCount, post.savedCount, post.SaveCount, post.SavedCount]);

  useEffect(() => {
    if (defaultCommentsOpen) {
      setIsCommentsOpen(true);
    }
  }, [defaultCommentsOpen]);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const connectCommentCounter = async () => {
      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_BASE_URL}/commenthub`, {
            accessTokenFactory: () => localStorage.getItem("token"),
          })
          .withAutomaticReconnect()
          .build();

        connection.on("ReceiveCommentCountUpdated", (updatedPostId, count) => {
          if (!isMounted) return;

          if (Number(updatedPostId) !== Number(id)) return;

          setLocalCommentCount(count);

          onPostUpdatedRef.current?.({
            ...latestPostRef.current,
            commentCount: count,
          });
        });

        connection.onreconnected(() => {
          connection
            .invoke("JoinPostCounter", id)
            .catch((err) =>
              console.error("JoinPostCounter after reconnect failed:", err),
            );
        });

        await connection.start();
        await connection.invoke("JoinPostCounter", id);

        commentCountConnectionRef.current = connection;
      } catch (error) {
        console.error("Comment count connection failed:", error);
      }
    };

    connectCommentCounter();

    return () => {
      isMounted = false;

      const connection = commentCountConnectionRef.current;

      if (connection) {
        connection
          .invoke("LeavePostCounter", id)
          .catch((err) => console.error("LeavePostCounter failed:", err))
          .finally(() => {
            connection.stop().catch((err) => {
              console.error("Comment count connection stop failed:", err);
            });
          });
      }

      commentCountConnectionRef.current = null;
    };
  }, [id]);

  const handleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = localLikeCount;

    const nextLiked = !previousLiked;
    const nextCount = previousLiked
      ? Math.max(previousCount - 1, 0)
      : previousCount + 1;

    setIsLiked(nextLiked);
    setLocalLikeCount(nextCount);

    try {
      if (previousLiked) {
        // HTTP DELETE request to unlike
        await api.delete(`/Like/${id}`);
      } else {
        // HTTP POST request to like
        await api.post(`/Like/${id}`);
      }

      onPostUpdated?.({
        ...post,
        likeCount: nextCount,
        isLikedByCurrentUser: nextLiked,
      });
    } catch (error) {
      console.warn(
        "HTTP Like action failed, attempting SignalR fallback:",
        error,
      );

      if (likeConnection) {
        try {
          await likeConnection.invoke("ToggleLike", id);
          onPostUpdated?.({
            ...post,
            likeCount: nextCount,
            isLikedByCurrentUser: nextLiked,
          });
          return;
        } catch (hubErr) {
          console.error("SignalR ToggleLike failed:", hubErr);
        }
      }

      // Revert local state if both failed
      setIsLiked(previousLiked);
      setLocalLikeCount(previousCount);

      showToast?.("Like action failed.", "error");
    }
  };

  const handleCommentCreated = () => {
    // Comment count is updated automatically via SignalR in ReceiveCommentCountUpdated
  };

  const handleCommentDeleted = () => {
    // Comment count is updated automatically via SignalR in ReceiveCommentCountUpdated
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile/${username}/activity?postId=${id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${username || "User"}'s Post`,
          text: content || "Check out this post on Nexora!",
          url: shareUrl,
        });
        showToast?.("Shared successfully!", "success");
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Native share failed, falling back to copy:", err);
          try {
            await navigator.clipboard.writeText(shareUrl);
            showToast?.("Link copied to clipboard!", "success");
          } catch (clipErr) {
            console.error("Clipboard copy failed:", clipErr);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast?.("Link copied to clipboard!", "success");
      } catch (clipErr) {
        console.error("Clipboard copy failed:", clipErr);
      }
    }
  };

  const handleSave = async () => {
    const previous = isSaved;
    const nextSaved = !previous;
    const previousCount = localSaveCount;
    const nextCount = Math.max(0, previousCount + (nextSaved ? 1 : -1));
    setIsSaved(nextSaved);
    setLocalSaveCount(nextCount);

    try {
      if (previous) {
        await api.delete(`/SavedPost/${id}`);
      } else {
        await api.post(`/SavedPost/${id}`);
      }
      onSavedChange?.(id, nextSaved, nextCount);
      onPostUpdated?.({
        ...post,
        isSaved: nextSaved,
        saveCount: nextCount,
        savedCount: nextCount,
      });
      window.dispatchEvent(
        new CustomEvent("nexora:saved-post-changed", {
          detail: { postId: id, isSaved: nextSaved, saveCount: nextCount },
        }),
      );
    } catch (error) {
      setIsSaved(previous);
      setLocalSaveCount(previousCount);
      showToast?.("Saved post action failed.", "error");
    }
  };

  const openAuthorProfile = () => {
    if (username) navigate(`/profile/${username}`);
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

  return (
    <>
      <div
        className={`post-card ${highlighted ? "highlighted-post" : ""}`}
        ref={postRef}
      >
        <div className="post-header">
          <div className="post-author-section">
            <img
              src={profileImageSrc}
              alt={username || "User"}
              className="post-avatar"
              style={{
                borderRadius: isEmployer ? "8px" : "50%",
              }}
              onError={(e) => {
                e.currentTarget.src = defaultAvatar;
              }}
              onClick={openAuthorProfile}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openAuthorProfile();
                }
              }}
              role="button"
              tabIndex={0}
            />

            <div>
              <button
                type="button"
                className="post-author-name post-author-link"
                onClick={openAuthorProfile}
              >
                {username || "Unknown User"}
              </button>
              <div className="post-author-meta">
                {role || "Member"}
                {formattedDate ? ` • ${formattedDate}` : ""}
              </div>
            </div>
          </div>

          {showActions ? (
            <button
              type="button"
              className="post-pencil-btn profile-icon-button"
              onClick={() => setIsEditOpen(true)}
              aria-label="Edit post"
            >
              <ProfileIcon name="edit" size={18} />
            </button>
          ) : (
            <div className="post-more-wrap" ref={postMenuRef}>
              <button
                type="button"
                className="post-more-button"
                aria-label="Post actions"
                aria-expanded={postMenuOpen}
                onClick={() => setPostMenuOpen((current) => !current)}
              >
                •••
              </button>

              {postMenuOpen && (
                <div className="post-action-menu">
                  <button
                    type="button"
                    onClick={() => {
                      setPostMenuOpen(false);
                      setReportOpen(true);
                    }}
                  >
                    <span aria-hidden="true">!</span>
                    <div>
                      <strong>Report post</strong>
                      <small>Send a private report to moderation</small>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {content && (
          <RichPostContent content={content} className="post-content" />
        )}

        {postImageSrc && (
          <img src={postImageSrc} alt="Post" className="post-image" />
        )}

        {postVideoSrc && (
          <video controls className="post-video">
            <source src={postVideoSrc} />
            Your browser does not support the video tag.
          </video>
        )}

        <div className="post-stats">
          <span>{localLikeCount || 0} likes</span>

          <button
            type="button"
            className="post-comment-count-btn"
            onClick={() => setIsCommentsOpen((prev) => !prev)}
          >
            {localCommentCount || 0} comments
          </button>
        </div>

        <div className="post-footer">
          <button
            type="button"
            className={`post-footer-btn ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
          >
            <ProfileIcon name="heart" size={18} filled={isLiked} />
            <span>Like</span>
          </button>

          <button
            type="button"
            className="post-footer-btn"
            onClick={() => setIsCommentsOpen((prev) => !prev)}
          >
            <ProfileIcon name="comment" size={18} />
            <span>Comment</span>
          </button>

          <button
            type="button"
            className="post-footer-btn"
            onClick={handleShare}
          >
            <ProfileIcon name="share" size={18} />
            <span>Share</span>
          </button>

          <button
            type="button"
            className={`post-footer-btn ${isSaved ? "saved" : ""}`}
            onClick={handleSave}
          >
            <ProfileIcon name="bookmark" size={18} filled={isSaved} />
            <span>{isSaved ? "Saved" : "Save"}</span>
          </button>
        </div>

        {isCommentsOpen && (
          <div className="post-comments-box">
            <CommentWindow
              postId={id}
              isPostOwner={showActions}
              onCommentCreated={handleCommentCreated}
              onCommentDeleted={handleCommentDeleted}
              showToast={showToast}
            />
          </div>
        )}
      </div>

      {isEditOpen && (
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
        />
      )}

      {reportOpen && (
        <ReportPostModal
          postId={id}
          onClose={() => setReportOpen(false)}
          showToast={showToast}
        />
      )}
    </>
  );
};

export default PostItem;
