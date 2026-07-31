import React from "react";
import { useSelector } from "react-redux";

import defaultAvatar from "../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const normalizeUsername = (username) => {
  return username ? String(username).trim().toLowerCase() : "";
};

const getUsername = (item) => {
  return (
    item?.username || item?.Username || item?.userName || item?.UserName || ""
  );
};

const getAttachments = (message) => {
  const attachments = message?.attachments ?? message?.Attachments ?? [];

  return Array.isArray(attachments) ? attachments : [];
};

const isImageAttachment = (attachment) => {
  const type = attachment?.type ?? attachment?.Type;

  const contentType = attachment?.contentType ?? attachment?.ContentType ?? "";

  return (
    type === 1 ||
    type === "1" ||
    String(type).toLowerCase() === "image" ||
    String(contentType).toLowerCase().startsWith("image/")
  );
};

const isPdfAttachment = (attachment) => {
  const type = attachment?.type ?? attachment?.Type;

  const contentType = attachment?.contentType ?? attachment?.ContentType ?? "";

  const fileName =
    attachment?.originalFileName ?? attachment?.OriginalFileName ?? "";

  return (
    type === 2 ||
    type === "2" ||
    String(type).toLowerCase() === "pdf" ||
    String(contentType).toLowerCase() === "application/pdf" ||
    String(fileName).toLowerCase().endsWith(".pdf")
  );
};

const getAttachmentPreview = (attachments) => {
  if (!attachments.length) {
    return "";
  }

  if (attachments.length > 1) {
    return `📎 ${attachments.length} files`;
  }

  const attachment = attachments[0];

  if (isImageAttachment(attachment)) {
    return "📷 Image";
  }

  if (isPdfAttachment(attachment)) {
    return "📄 PDF";
  }

  return "📎 File";
};

const getLastMessageText = (item, isSearchResult) => {
  if (isSearchResult) {
    return (
      item?.currentPosition ||
      item?.CurrentPosition ||
      item?.bio ||
      item?.Bio ||
      "Start a conversation"
    );
  }

  const lastMessage = item?.lastMessage ?? item?.LastMessage;

  if (!lastMessage) {
    return "No messages yet";
  }

  const content = lastMessage?.content ?? lastMessage?.Content ?? "";

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  return getAttachmentPreview(getAttachments(lastMessage)) || "No messages yet";
};

const formatMessageTime = (item) => {
  const lastMessage = item?.lastMessage ?? item?.LastMessage;

  const value =
    lastMessage?.dateTime ??
    lastMessage?.DateTime ??
    lastMessage?.createdAt ??
    lastMessage?.CreatedAt;

  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const ChatItem = ({
  item,
  onSelect,
  isSelected = false,
  isSearchResult = false,
}) => {
  const username = getUsername(item);

  const normalizedUsername = normalizeUsername(username);

  const unreadCount = useSelector((state) => {
    if (!normalizedUsername || isSearchResult) {
      return 0;
    }

    return Number(state.messages?.unreadMessages?.[normalizedUsername] || 0);
  });

  const displayName =
    item?.fullName ||
    item?.FullName ||
    item?.name ||
    item?.Name ||
    item?.companyName ||
    item?.CompanyName ||
    username ||
    "Unknown user";

  const profileImage =
    item?.profileImage ||
    item?.ProfileImage ||
    item?.basicInfo?.profileImage ||
    item?.BasicInfo?.ProfileImage ||
    item?.companyInfo?.logoUrl ||
    item?.CompanyInfo?.LogoUrl ||
    item?.userPhoto ||
    item?.UserPhoto ||
    item?.photoUrl ||
    item?.PhotoUrl ||
    item?.logoUrl ||
    item?.LogoUrl ||
    null;

  const messageText = getLastMessageText(item, isSearchResult);

  const messageTime = isSearchResult ? "" : formatMessageTime(item);

  const hasUnread = unreadCount > 0;

  return (
    <button
      className={`chat-list-item ${hasUnread ? "has-unread" : ""} ${isSelected ? "is-selected" : ""}`}
      type="button"
      onClick={onSelect}
      style={{
        ...styles.item,

        ...(hasUnread ? styles.unreadItem : {}),

        ...(isSelected ? styles.selectedItem : {}),
      }}
    >
      <div style={styles.avatarWrapper}>
        <img
          className="chat-list-avatar"
          src={resolveMediaUrl(profileImage, defaultAvatar)}
          alt={displayName}
          style={styles.avatar}
          onError={(event) => {
            event.currentTarget.src = defaultAvatar;
          }}
        />

        {hasUnread && !isSelected && <span style={styles.unreadDot} />}
      </div>

      <div style={styles.content}>
        <div style={styles.topRow}>
          <span
            className="chat-list-name"
            style={{
              ...styles.name,

              ...(hasUnread ? styles.unreadName : {}),
            }}
          >
            {displayName}
          </span>

          {messageTime && (
            <span
              style={{
                ...styles.time,

                ...(hasUnread ? styles.unreadTime : {}),
              }}
            >
              {messageTime}
            </span>
          )}
        </div>

        <div style={styles.bottomRow}>
          <span
            className="chat-list-message"
            style={{
              ...styles.message,

              ...(hasUnread ? styles.unreadMessage : {}),
            }}
          >
            {messageText}
          </span>

          {hasUnread && (
            <span
              style={{
                ...styles.badge,

                ...(isSelected ? styles.selectedBadge : {}),
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ChatItem;

const styles = {
  item: {
    width: "100%",
    minHeight: "72px",
    padding: "11px 12px",

    display: "flex",
    alignItems: "center",
    gap: "12px",

    border: "none",
    borderBottom: "1px solid var(--app-border)",
    borderLeft: "4px solid transparent",
    borderRadius: "13px",

    backgroundColor: "transparent",
    cursor: "pointer",
    textAlign: "left",

    transition:
      "background-color 0.18s ease, " +
      "border-color 0.18s ease, " +
      "box-shadow 0.18s ease, " +
      "transform 0.18s ease",
  },

  unreadItem: {
    backgroundColor: "#f8fbff",
    borderLeftColor: "#93c5fd",

    boxShadow: "inset 3px 0 0 rgba(147, 197, 253, 0.32)",
  },

  selectedItem: {
    backgroundColor: "#eef2ff",
    borderLeftColor: "#4f46e5",

    boxShadow: "inset 4px 0 0 #4f46e5, " + "0 5px 16px rgba(79, 70, 229, 0.12)",
  },

  avatarWrapper: {
    position: "relative",

    width: "48px",
    height: "48px",

    flexShrink: 0,
  },

  avatar: {
    width: "48px",
    height: "48px",

    borderRadius: "50%",
    objectFit: "cover",

    border: "2px solid #ffffff",

    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.12)",
  },

  unreadDot: {
    position: "absolute",

    right: "-1px",
    bottom: "2px",

    width: "11px",
    height: "11px",

    borderRadius: "50%",

    backgroundColor: "#3b82f6",
    border: "2px solid #ffffff",

    boxShadow: "0 2px 7px rgba(59, 130, 246, 0.45)",
  },

  content: {
    minWidth: 0,
    flex: 1,

    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  topRow: {
    minWidth: 0,

    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  bottomRow: {
    minWidth: 0,

    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  name: {
    minWidth: 0,
    flex: 1,

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    color: "var(--app-text)",
    fontSize: "14px",
    fontWeight: 600,
  },

  unreadName: {
    color: "var(--app-text)",
    fontWeight: 750,
  },

  message: {
    minWidth: 0,
    flex: 1,

    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",

    color: "var(--app-muted)",
    fontSize: "13px",
    fontWeight: 400,
  },

  unreadMessage: {
    color: "var(--app-text)",
    fontWeight: 600,
  },

  time: {
    flexShrink: 0,

    color: "var(--app-muted)",
    fontSize: "10.5px",
    fontWeight: 500,
  },

  unreadTime: {
    color: "#3b82f6",
    fontWeight: 700,
  },

  badge: {
    minWidth: "22px",
    height: "22px",
    padding: "0 7px",

    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: "999px",

    background: "linear-gradient(135deg, #3b82f6, #2563eb)",

    color: "#ffffff",
    fontSize: "10.5px",
    fontWeight: 800,

    boxShadow: "0 5px 12px rgba(59, 130, 246, 0.28)",

    flexShrink: 0,
  },

  selectedBadge: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",

    boxShadow: "0 5px 12px rgba(79, 70, 229, 0.3)",
  },
};
