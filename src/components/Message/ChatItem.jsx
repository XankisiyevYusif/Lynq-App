import React from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import { useDispatch } from "react-redux";
import { clearUnreadForUser } from "../../store/messageSlice";

const API_BASE_URL = "https://localhost:7257";

const ChatItem = ({ item, onSelect, isSelected, isSearchResult }) => {
  const dispatch = useDispatch();

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const username = item.username;
  const displayName =
    item.fullName ||
    item.name ||
    item.companyName ||
    item.username ||
    "Unknown user";

  const displayPhoto =
    item.profileImage ||
    item.logoUrl ||
    item.companyLogo ||
    null;

  const lastMessage = isSearchResult
    ? item.currentPosition || item.bio || item.userType || "Start a conversation"
    : item.lastMessage?.content || "No messages yet";

  const unreadCount = item.unreadCount || 0;

  const handleClick = () => {
    if (username) {
      dispatch(clearUnreadForUser(username));
    }

    onSelect?.();
  };

  return (
    <div
      style={{
        ...styles.item,
        backgroundColor: isSelected ? "#f9f9f9" : "transparent",
        boxShadow: isSelected ? "0px 2px 8px rgba(0, 0, 0, 0.05)" : "none",
        borderLeft: isSelected ? "4px solid #007bff" : "4px solid transparent",
      }}
      onClick={handleClick}
    >
      <img
        src={getImageUrl(displayPhoto)}
        alt="avatar"
        style={styles.avatar}
      />

      <div style={styles.info}>
        <p style={styles.name}>{displayName}</p>
        <p style={styles.message}>{lastMessage}</p>
      </div>

      {unreadCount > 0 && (
        <span style={styles.badge}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </div>
  );
};

export default ChatItem;

const styles = {
  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "14px",
    cursor: "pointer",
    userSelect: "none",
    borderBottom: "1px solid #e0e0e0ff",
    transition: "background-color 0.15s ease, box-shadow 0.15s ease",
  },

  avatar: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
    boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
  },

  info: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    overflow: "hidden",
    flex: 1,
  },

  name: {
    fontSize: "14.5px",
    fontWeight: 600,
    color: "#111827",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  message: {
    fontSize: "13px",
    color: "#6b7280",
    margin: 0,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  badge: {
    minWidth: "18px",
    height: "18px",
    padding: "0 5px",
    borderRadius: "999px",
    backgroundColor: "#e11d48",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};