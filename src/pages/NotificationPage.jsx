import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import Navbar from "../components/Layout/Navbar";
import ProfileIcon from "../components/Profile/ProfileIcon";
import defaultAvatar from "../assets/default-avatar.png";
import api from "../services/api";
import {
  markNotificationRead,
  removeNotification,
  setNotifications,
} from "../store/notificationSlice";
import { resolveMediaUrl } from "../utils/mediaUrl";
import "./NotificationPage.css";

const memberFilters = [
  ["all", "All"],
  ["jobs", "Jobs"],
  ["posts", "My posts"],
  ["mentions", "Mentions"],
  ["events", "Events"],
];

const companyFilters = [
  ["all", "All"],
  ["activity", "Activity"],
  ["mentions", "Mentions"],
  ["events", "Events"],
];

const unwrap = (response) => {
  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data;
  return Array.isArray(payload) ? payload : [];
};

const get = (item, camel, pascal) => item?.[camel] ?? item?.[pascal];
const notificationId = (item) => get(item, "id", "Id");

const safeDate = (value) => {
  if (!value) return null;
  let source = String(value).replace(/\.(\d{3})\d+/, ".$1");
  if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(source)) source += "Z";
  const result = new Date(source);
  return Number.isNaN(result.getTime()) ? null : result;
};

const typeOf = (item) => {
  const raw = get(item, "type", "Type");
  if (typeof raw === "string") return raw.toLowerCase();
  return ({
    1: "comment",
    2: "like",
    3: "follow",
    4: "followrequest",
    5: "followaccepted",
    6: "postmoderationwarning",
    7: "event",
    8: "companymention",
    9: "eventattendance",
    10: "jobinvitation",
  })[raw] || "";
};

const bucketOf = (item) => {
  const type = typeOf(item);
  if (["event", "eventattendance"].includes(type)) return "events";
  if (type.includes("job")) return "jobs";
  if (type.includes("mention")) return "mentions";
  if (["comment", "like", "follow", "postmoderationwarning"].includes(type)) {
    return "activity";
  }
  return "all";
};

const messageOf = (item) => {
  const type = typeOf(item);
  const preview = get(item, "contentPreview", "ContentPreview");
  if (type === "event") return preview || "created an event suitable for you";
  if (type === "eventattendance") return preview || "joined your event";
  if (type === "companymention") {
    return preview || "mentioned your company in a post";
  }
  if (type === "jobinvitation") {
    return preview || "invited you to view a job";
  }
  if (type === "like") return "liked your post";
  if (type === "comment") return "commented on your post";
  if (type === "follow") return "started following your company";
  if (type === "followrequest") return "sent you a connection request";
  if (type === "followaccepted") return "accepted your connection request";
  if (type === "postmoderationwarning") return preview || "Your post needs attention";
  return preview || "sent you a notification";
};

export default function NotificationPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector((state) => state.notifications.items);
  const user = useSelector((state) => state.user.user);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const openMenuRef = useRef(null);
  const isEmployer =
    user?.userType === "Employer" ||
    user?.UserType === "Employer" ||
    user?.role === "Employer" ||
    user?.Role === "Employer" ||
    !!user?.companyInfo ||
    !!user?.company;
  const filters = isEmployer ? companyFilters : memberFilters;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api.get("/Notifications/notifications");
        dispatch(setNotifications(unwrap(response)));
      } catch {
        setError("Notifications could not be loaded.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dispatch]);

  useEffect(() => {
    if (openMenuId === null) return;

    const closeOnOutsideClick = (event) => {
      if (openMenuRef.current && !openMenuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [openMenuId]);

  const sorted = useMemo(() => (
    [...notifications]
      .filter((item) => {
        if (activeFilter === "all") return true;
        const bucket = bucketOf(item);
        if (activeFilter === "posts") return bucket === "activity";
        return bucket === activeFilter;
      })
      .sort((a, b) => {
        const aDate = safeDate(get(a, "lastTriggeredAt", "LastTriggeredAt") || get(a, "createdAt", "CreatedAt"));
        const bDate = safeDate(get(b, "lastTriggeredAt", "LastTriggeredAt") || get(b, "createdAt", "CreatedAt"));
        return (bDate?.getTime() || 0) - (aDate?.getTime() || 0);
      })
  ), [notifications, activeFilter]);

  const markRead = async (item) => {
    const id = notificationId(item);
    const isRead = !!get(item, "isRead", "IsRead");
    if (!id || isRead) return;
    dispatch(markNotificationRead(id));
    try {
      await api.post(`/Notifications/${id}/mark-as-read`);
    } catch {
      const response = await api.get("/Notifications/notifications");
      dispatch(setNotifications(unwrap(response)));
    }
  };

  const openNotification = async (item) => {
    await markRead(item);
    const type = typeOf(item);
    const eventId = get(item, "eventId", "EventId");
    const postId = get(item, "postId", "PostId");
    const jobPostId = get(item, "jobPostId", "JobPostId");
    const username = get(item, "senderUsername", "SenderUsername");

    if (["event", "eventattendance"].includes(type) && eventId) {
      return navigate(`/events/${eventId}`, {
        state: { notificationPreview: item },
      });
    }
    if (["like", "comment", "companymention"].includes(type) && postId) {
      return navigate(`/posts/${postId}`);
    }
    if (type.includes("job") && jobPostId) {
      return navigate(`/jobs/${jobPostId}`);
    }
    if (username) navigate(`/profile/${username}`);
  };

  const deleteItem = async (item) => {
    const id = notificationId(item);
    if (!id) return;
    dispatch(removeNotification(id));
    setOpenMenuId(null);
    try {
      await api.delete(`/Notifications/${id}`);
    } catch {
      const response = await api.get("/Notifications/notifications");
      dispatch(setNotifications(unwrap(response)));
    }
  };

  return (
    <>
      <Navbar />
      <main className="notification-page">
        <section className="notification-shell">
          <header className="notification-header">
            <div>
              <span>Stay up to date</span>
              <h1>Notifications</h1>
            </div>
            <span className="notification-total">{notifications.length}</span>
          </header>

          <nav className="notification-filters" aria-label="Notification filters">
            {filters.map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={activeFilter === key ? "is-active" : ""}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
          </nav>

          {loading ? (
            <div className="notification-state">Loading notifications...</div>
          ) : error ? (
            <div className="notification-state is-error">{error}</div>
          ) : sorted.length === 0 ? (
            <div className="notification-state">
              <ProfileIcon name="calendar" size={34} />
              <strong>No notifications here</strong>
              <span>New activity will appear in this list.</span>
            </div>
          ) : (
            <div className="notification-list">
              {sorted.map((item) => {
                const id = notificationId(item);
                const isRead = !!get(item, "isRead", "IsRead");
                const activityDate = safeDate(
                  get(item, "lastTriggeredAt", "LastTriggeredAt") ||
                  get(item, "createdAt", "CreatedAt"),
                );
                const photo = get(item, "senderProfilePhoto", "SenderProfilePhoto");
                const username = get(item, "senderUsername", "SenderUsername") || "Nexora";
                const type = typeOf(item);
                const senderIsCompany =
                  Boolean(get(item, "senderIsCompany", "SenderIsCompany")) ||
                  ["event", "jobinvitation"].includes(type);

                return (
                  <article
                    key={id}
                    className={`notification-row ${isRead ? "" : "is-unread"}`}
                    onClick={() => openNotification(item)}
                  >
                    <div
                      className={`notification-type-icon is-${type} ${
                        senderIsCompany ? "is-company" : "is-member"
                      }`}
                    >
                      <img
                        src={resolveMediaUrl(photo, defaultAvatar)}
                        alt=""
                        onError={(event) => { event.currentTarget.src = defaultAvatar; }}
                      />
                      {["event", "eventattendance"].includes(type) && (
                        <span><ProfileIcon name="calendar" size={13} /></span>
                      )}
                    </div>

                    <div className="notification-copy">
                      <p><strong>{username}</strong> {messageOf(item)}</p>
                      <time>{activityDate ? formatDistanceToNow(activityDate, { addSuffix: true }) : "just now"}</time>
                    </div>

                    {!isRead && <span className="notification-unread-dot" aria-label="Unread" />}

                    <div
                      className="notification-menu"
                      ref={openMenuId === id ? openMenuRef : null}
                    >
                      <button
                        type="button"
                        aria-label="Notification actions"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenMenuId(openMenuId === id ? null : id);
                        }}
                      >
                        •••
                      </button>
                      {openMenuId === id && (
                        <div onClick={(event) => event.stopPropagation()}>
                          {!isRead && <button type="button" onClick={() => { markRead(item); setOpenMenuId(null); }}>Mark as read</button>}
                          <button type="button" className="is-danger" onClick={() => deleteItem(item)}>Delete notification</button>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
