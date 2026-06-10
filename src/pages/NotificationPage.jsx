import React, { useEffect } from "react";
import Navbar from "../components/Layout/Navbar";
import defaultAvatar from "../assets/default-avatar.png";
import api from "../services/api";
import {
  clearUnread,
  setNotifications,
} from "../store/notificationSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const NotificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const notifications = useSelector((state) => state.notifications.items);

  const getArrayData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.Data)) return res.data.Data;
    return [];
  };

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;

    const cleanPath = String(path).trim();

    if (!cleanPath) return defaultAvatar;

    if (
      cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://") ||
      cleanPath.startsWith("blob:")
    ) {
      return cleanPath;
    }

    return `${API_ROOT}/${cleanPath.replace(/^\/+/, "")}`;
  };

  const toSafeDate = (value) => {
    if (!value) return null;

    let s = String(value);
    s = s.replace(/\.(\d{3})\d+/, ".$1");

    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) {
      s += "Z";
    }

    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const getActivityDate = (n) =>
    toSafeDate(n?.lastTriggeredAt ?? n?.LastTriggeredAt) ||
    toSafeDate(n?.createdAt ?? n?.CreatedAt);

  const sortByActivity = (list) =>
    [...list].sort((a, b) => {
      const da = getActivityDate(a)?.getTime() ?? 0;
      const db = getActivityDate(b)?.getTime() ?? 0;
      return db - da;
    });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get("/Notifications/notifications");
        const list = getArrayData(res);

        dispatch(setNotifications(sortByActivity(list)));

        await api.post("/Notifications/mark-all-as-read");

        dispatch(clearUnread());
      } catch (err) {
        console.error("Failed to fetch or mark notifications as read:", err);
      }
    };

    fetchNotifications();
  }, [dispatch]);

  const getType = (n) => {
    const raw = n?.type ?? n?.Type;

    if (typeof raw === "string") {
      return raw.toLowerCase();
    }

    if (raw === 0) return "like";
    if (raw === 1) return "comment";
    if (raw === 2) return "follow";

    return "";
  };

  const getMessage = (n) => {
    const type = getType(n);

    if (type === "like") return "liked your post";
    if (type === "comment") return "commented on your post";
    if (type === "follow") return "started following your company";

    return n?.contentPreview ?? n?.ContentPreview ?? "";
  };

  const getDisplayTime = (n) => {
    const d = getActivityDate(n);

    if (!d) return "just now";

    return formatDistanceToNow(d, { addSuffix: true });
  };

  const getSenderUsername = (n) =>
    n?.senderUsername ??
    n?.SenderUsername ??
    "Someone";

  const getSenderProfilePhoto = (n) =>
    n?.senderProfilePhoto ??
    n?.SenderProfilePhoto ??
    "";

  const handleNotificationClick = (n) => {
    const username = getSenderUsername(n);

    if (username && username !== "Someone") {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <h2 style={styles.title}>Notifications</h2>

          {notifications.length > 0 ? (
            sortByActivity(notifications).map((n) => (
              <div
                key={n.id ?? n.Id}
                style={styles.notificationItem}
                onClick={() => handleNotificationClick(n)}
              >
                <img
                  src={getImageUrl(getSenderProfilePhoto(n))}
                  alt="Profile"
                  style={styles.avatar}
                  onError={(e) => {
                    e.currentTarget.src = defaultAvatar;
                  }}
                />

                <div style={styles.content}>
                  <span style={styles.text}>
                    <strong>{getSenderUsername(n)}</strong>{" "}
                    {getMessage(n)}
                  </span>

                  {(n.contentPreview || n.ContentPreview) &&
                    getType(n) === "comment" && (
                      <span style={styles.preview}>
                        “{n.contentPreview ?? n.ContentPreview}”
                      </span>
                    )}

                  <span style={styles.time}>{getDisplayTime(n)}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.empty}>No notifications yet.</p>
          )}
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    backgroundColor: "#f3f2ef",
    minHeight: "100vh",
    padding: "24px 0 40px",
  },

  container: {
    width: "700px",
    maxWidth: "calc(100% - 32px)",
    margin: "0 auto",
  },

  title: {
    margin: "0 0 16px",
    fontSize: "24px",
    fontWeight: 700,
    color: "#191919",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  notificationItem: {
    backgroundColor: "#fff",
    padding: "14px 18px",
    borderRadius: "12px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "flex-start",
    gap: "13px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  avatar: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e0e0e0",
    flexShrink: 0,
  },

  content: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  },

  text: {
    fontSize: "14px",
    color: "#191919",
    lineHeight: 1.4,
  },

  preview: {
    fontSize: "13px",
    color: "#666",
    lineHeight: 1.4,
  },

  time: {
    fontSize: "12px",
    color: "#777",
  },

  empty: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "24px",
    color: "#777",
    textAlign: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default NotificationPage;