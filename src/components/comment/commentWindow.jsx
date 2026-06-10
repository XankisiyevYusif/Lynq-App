import { useCallback, useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { jwtDecode } from "jwt-decode";
import api from "../../services/api";

import CommentInput from "./commentInput";
import CommentItem from "./commentItem";

const PAGE_SIZE = 5;

export default function CommentWindow({
  postId,
  isPostOwner,
  onCommentCreated,
  onCommentDeleted,
  showToast,
}) {
  const connectionRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const token = localStorage.getItem("token");

  const normalizeComment = (comment) => {
    return {
      ...comment,
      commentId:
        comment.commentId ??
        comment.CommentId ??
        comment.id ??
        comment.Id,

      postId: comment.postId ?? comment.PostId,

      content:
        comment.content ??
        comment.Content ??
        comment.text ??
        comment.Text,

      text:
        comment.text ??
        comment.Text ??
        comment.content ??
        comment.Content,

      createdAt: comment.createdAt ?? comment.CreatedAt,
      updatedAt: comment.updatedAt ?? comment.UpdatedAt,

      username: comment.username ?? comment.Username,

      userProfileUrl:
        comment.userProfileUrl ??
        comment.UserProfileUrl ??
        comment.userPhoto ??
        comment.UserPhoto,

      userPhoto:
        comment.userPhoto ??
        comment.UserPhoto ??
        comment.userProfileUrl ??
        comment.UserProfileUrl,

      userId: comment.userId ?? comment.UserId,
    };
  };

  const extractComments = (payload) => {
    const body = payload?.data ?? payload;

    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.items)) return body.items;
    if (Array.isArray(body?.comments)) return body.comments;
    if (Array.isArray(body?.Data)) return body.Data;
    if (Array.isArray(body?.Items)) return body.Items;
    if (Array.isArray(body?.Comments)) return body.Comments;

    return [];
  };

  const extractHasMore = (payload, items) => {
    const body = payload?.data ?? payload;

    if (typeof body?.hasMore === "boolean") return body.hasMore;
    if (typeof body?.HasMore === "boolean") return body.HasMore;

    const totalCount = body?.totalCount ?? body?.TotalCount;
    const currentPage = body?.page ?? body?.Page ?? page;
    const pageSize = body?.pageSize ?? body?.PageSize ?? PAGE_SIZE;

    if (typeof totalCount === "number") {
      return currentPage * pageSize < totalCount;
    }

    return items.length === PAGE_SIZE;
  };

  const fetchComments = useCallback(
    async (pageToLoad = 1) => {
      if (!postId) return;

      try {
        if (pageToLoad === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const res = await api.get(
          `/Comment/comments/${postId}?page=${pageToLoad}&pageSize=${PAGE_SIZE}`
        );

        const rawComments = extractComments(res.data);
        const normalizedComments = rawComments.map(normalizeComment);

        setComments((prev) => {
          if (pageToLoad === 1) {
            return normalizedComments;
          }

          const existingIds = new Set(prev.map((c) => c.commentId));

          const newItems = normalizedComments.filter(
            (c) => !existingIds.has(c.commentId)
          );

          return [...prev, ...newItems];
        });

        setPage(pageToLoad);
        setHasMore(extractHasMore(res.data, rawComments));
      } catch (err) {
        console.error("Failed to fetch comments:", err);

        if (pageToLoad === 1) {
          setComments([]);
        }

        showToast?.("Commentlər yüklənmədi.", "error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [postId, showToast]
  );

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);

      const userId =
        decoded?.nameid ||
        decoded?.userId ||
        decoded?.sub ||
        decoded?.[
          "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
        ];

      setCurrentUserId(userId);
    } catch (error) {
      console.error("Token decode failed in CommentWindow:", error);
    }
  }, [token]);

  useEffect(() => {
    setComments([]);
    setPage(1);
    setHasMore(false);
    fetchComments(1);
  }, [postId, fetchComments]);

  useEffect(() => {
    if (!postId) return;

    let isMounted = true;

    const connect = async () => {
      try {
        const connection = new signalR.HubConnectionBuilder()
          .withUrl("https://linkedinapi-xvld.onrender.com/commenthub", {
            accessTokenFactory: () => localStorage.getItem("token"),
          })
          .withAutomaticReconnect()
          .build();

        connection.on("ReceiveComment", (comment) => {
          if (!isMounted) return;

          const normalizedComment = normalizeComment(comment);

          setComments((prev) => {
            const exists = prev.some(
              (c) => c.commentId === normalizedComment.commentId
            );

            if (exists) return prev;

            onCommentCreated?.();

            return [...prev, normalizedComment];
          });
        });

        connection.on("ReceiveCommentDeleted", (commentId) => {
          if (!isMounted) return;

          setComments((prev) => {
            const exists = prev.some((c) => c.commentId === commentId);

            if (!exists) return prev;

            onCommentDeleted?.();

            return prev.filter((c) => c.commentId !== commentId);
          });
        });

        connection.on("ReceiveCommentUpdated", (updatedComment) => {
          if (!isMounted) return;
                
          const normalized = normalizeComment(updatedComment);
                
          setComments((prev) =>
            prev.map((c) => {
              if (c.commentId !== normalized.commentId) {
                return c;
              }
            
              const newText = normalized.content ?? normalized.text ?? c.content ?? c.text;
            
              return {
                ...c,
              
                // yalnız dəyişən text sahələrini update edirik
                content: newText,
                text: newText,
              
                // undefined field-lərlə köhnə user/date datasını pozmuruq
                updatedAt: normalized.updatedAt ?? c.updatedAt,
                createdAt: c.createdAt,
                username: c.username,
                userId: c.userId,
                userPhoto: c.userPhoto,
                userProfileUrl: c.userProfileUrl,
              };
            })
          );
        });

        connection.onreconnected(() => {
          connection
            .invoke("JoinPost", postId)
            .catch((err) =>
              console.error("JoinPost after reconnect failed:", err)
            );
        });

        await connection.start();
        await connection.invoke("JoinPost", postId);

        connectionRef.current = connection;
      } catch (error) {
        console.error("Comment hub connection failed:", error);
        showToast?.("Comment connection is not ready.", "error");
      }
    };

    connect();

    return () => {
      isMounted = false;

      const connection = connectionRef.current;

      if (connection) {
        connection
          .invoke("LeavePost", postId)
          .catch((err) => console.error("LeavePost failed:", err))
          .finally(() => {
            connection.stop().catch((err) => {
              console.error("Comment hub stop failed:", err);
            });
          });
      }

      connectionRef.current = null;
    };
  }, [postId, onCommentCreated, onCommentDeleted, showToast]);

  const sendComment = async (text) => {
    const trimmed = text?.trim();

    if (!trimmed) {
      showToast?.("Comment cannot be empty.", "error");
      return;
    }

    try {
      // Try HTTP POST API first (very standard REST conventions)
      try {
        const response = await api.post("/Comment/comment", { 
          postId, 
          text: trimmed,
          content: trimmed // just in case the backend property is content
        });
        
        const rawComment = response.data?.data ?? response.data;
        const normalized = normalizeComment(rawComment);
        
        setComments((prev) => {
          const exists = prev.some((c) => c.commentId === normalized.commentId);
          if (exists) return prev;
          onCommentCreated?.();
          return [...prev, normalized];
        });
        
        showToast?.("Comment added successfully.", "success");
        return;
      } catch (httpErr) {
        console.warn("HTTP Comment creation failed or not implemented, trying SignalR:", httpErr);
        
        // Fallback to SignalR SendComment
        if (!connectionRef.current) {
          showToast?.("Comment connection is not ready.", "error");
          return;
        }

        await connectionRef.current.invoke("SendComment", postId, trimmed);
        showToast?.("Comment added successfully.", "success");
      }
    } catch (error) {
      console.error("Send comment failed:", error);
      showToast?.("Failed to add comment.", "error");
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await api.delete(`/Comment/comment/${commentId}`);

      // Manually update local state in case SignalR is not active
      setComments((prev) => prev.filter((c) => c.commentId !== commentId));
      onCommentDeleted?.();

      showToast?.("Comment deleted successfully.", "success");
    } catch (err) {
      console.error("Delete failed:", err);
      showToast?.("Failed to delete comment.", "error");
    }
  };

  const handleUpdate = async ({ commentId, text }) => {
    const trimmed = text?.trim();

    if (!trimmed) {
      showToast?.("Comment cannot be empty.", "error");
      return;
    }

    try {
      await api.put(`/Comment/comment/${commentId}`, {
        text: trimmed,
        content: trimmed // just in case the backend property is content
      });

      // Manually update local state in case SignalR is not active
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId
            ? { ...c, content: trimmed, text: trimmed, updatedAt: new Date().toISOString() }
            : c
        )
      );

      showToast?.("Comment updated successfully.", "success");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err);
      showToast?.("Failed to update comment.", "error");
    }
  };

 

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.title}>Comments</h3>

      <div style={styles.commentsList}>
        {loading ? (
          <div style={styles.emptyText}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={styles.emptyText}>No comments yet.</div>
        ) : (
          comments.map((c) => (
            <CommentItem
              key={c.commentId}
              comment={c}
              isOwner={c.userId === currentUserId}
              isPostOwner={isPostOwner}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))
        )}
      </div>

      {hasMore && !loading && (
        <button
          type="button"
          style={styles.loadMoreButton}
          onClick={() => fetchComments(page + 1)}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading..." : "Load more comments"}
        </button>
      )}

      <CommentInput onSend={sendComment} />
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
  },

  title: {
    fontSize: "16px",
    fontWeight: 700,
    margin: "0 0 12px",
    color: "#222",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  commentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "10px",
  },

  emptyText: {
    fontSize: "13px",
    color: "#777",
    padding: "6px 0",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  loadMoreButton: {
    border: "1px solid #d0d7de",
    background: "#fff",
    borderRadius: "999px",
    padding: "8px 14px",
    margin: "2px 0 10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
    color: "#0a66c2",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};