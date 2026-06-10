import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";

import api from "../../services/api";
import EditPostModal from "./EditPostModal";
import pencil from "../../assets/pencil.png";
import CommentWindow from "../comment/commentWindow";
import "./Post.css";

const API_BASE_URL = "https://localhost:7257";

const PostItem = ({
  post,
  showActions = false,
  isEmployer = false,
  onPostUpdated,
  onPostDeleted,
  showToast,
  likeConnection,
  defaultCommentsOpen = false,
}) => {
  const commentCountConnectionRef = useRef(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isLiked, setIsLiked] = useState(!!post.isLikedByCurrentUser);
  const [isCommentsOpen, setIsCommentsOpen] = useState(defaultCommentsOpen);  
  const [localCommentCount, setLocalCommentCount] = useState(
    post.commentCount || 0
  );

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
    setLocalLikeCount(post.likeCount || 0);
    setIsLiked(!!post.isLikedByCurrentUser);
  }, [post.likeCount, post.isLikedByCurrentUser]);

  useEffect(() => {
    setLocalCommentCount(post.commentCount || 0);
  }, [post.commentCount]);
  
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

          onPostUpdated?.({
            ...post,
            commentCount: count,
          });
        });

        connection.onreconnected(() => {
          connection
            .invoke("JoinPostCounter", id)
            .catch((err) =>
              console.error("JoinPostCounter after reconnect failed:", err)
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
  }, [id, onPostUpdated, post]);

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
      console.warn("HTTP Like action failed, attempting SignalR fallback:", error);
      
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

  return (
    <>
      <div className="post-card">
        <div className="post-header">
          <div className="post-author-section">
            <img
              src={profileImageSrc}
              alt={username || "User"}
              className="post-avatar"
              style={{
                borderRadius: isEmployer ? "8px" : "50%",
              }}
            />

            <div>
              <div className="post-author-name">{username || "Unknown User"}</div>
              <div className="post-author-meta">
                {role || "Member"}
                {formattedDate ? ` • ${formattedDate}` : ""}
              </div>
            </div>
          </div>

          {showActions && (
            <button
              type="button"
              className="post-pencil-btn"
              onClick={() => setIsEditOpen(true)}
            >
              <img src={pencil} alt="Edit post" className="post-pencil-icon" />
            </button>
          )}
        </div>

        {content && <div className="post-content">{content}</div>}

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
            {isLiked ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="18" height="18">
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.579 5.579 0 0112 5.052 5.579 5.579 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            )}
            <span>Like</span>
          </button>

          <button
            type="button"
            className="post-footer-btn"
            onClick={() => setIsCommentsOpen((prev) => !prev)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641l-.318 1.235c-.149.578.43 1.09 1.01.916l1.3-.393a2.077 2.077 0 0 1 1.621.13c1.119.589 2.394.887 3.728.887Z" />
            </svg>
            <span>Comment</span>
          </button>

          <button type="button" className="post-footer-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            <span>Share</span>
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
    </>
  );
};

export default PostItem;