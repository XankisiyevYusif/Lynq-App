import React, { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import MessageInput from "./MessageInput";
import api, { API_ROOT } from "../../services/api";
import { jwtDecode } from "jwt-decode";
import { useDispatch } from "react-redux";
import { setActiveChat, clearUnreadForUser } from "../../store/messageSlice";
import defaultAvatar from "../../assets/default-avatar.png";
import { useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
  formatFileSize,
  getAttachmentKind,
  normalizeChatAttachment,
} from "../../utils/chatFiles";

const API_BASE_URL = API_ROOT;

const ChatWindow = ({ receiver }) => {
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadProgress, setUploadProgress] = useState(null);
  const [openMessageMenuId, setOpenMessageMenuId] = useState(null);
  const [messagePendingDelete, setMessagePendingDelete] = useState(null);
  const [isDeletingMessage, setIsDeletingMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const receivedIdsRef = useRef(new Set());

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  let currentUsername = null;

  if (token) {
    try {
      const decoded = jwtDecode(token);

      currentUsername =
        decoded["unique_name"] ||
        decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] ||
        decoded["name"];
    } catch {
      currentUsername = null;
    }
  }

  const normalizeUsername = (value) => {
    if (!value) return "";
    return value.toString().toLowerCase();
  };

  const unwrapResponse = (response) => {
    return response?.data?.data || response?.data || null;
  };

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

  const normalizeMessage = (message) => {
    const rawAttachments = message?.attachments ?? message?.Attachments ?? [];

    return {
      id: message?.id ?? message?.Id ?? null,
      chatId: message?.chatId ?? message?.ChatId ?? null,

      sender:
        message?.sender ??
        message?.Sender ??
        message?.senderUsername ??
        message?.SenderUsername,

      senderId: message?.senderId ?? message?.SenderId,

      senderProfileImage:
        message?.senderProfileImage ??
        message?.SenderProfileImage ??
        message?.userPhoto ??
        message?.UserPhoto ??
        message?.profileImage ??
        message?.ProfileImage,

      receiver:
        message?.receiver ??
        message?.Receiver ??
        message?.receiverUsername ??
        message?.ReceiverUsername ??
        receiver,

      receiverId: message?.receiverId ?? message?.ReceiverId,

      content: message?.content ?? message?.Content ?? "",
      isImage: message?.isImage ?? message?.IsImage ?? false,

      dateTime:
        message?.dateTime ??
        message?.DateTime ??
        message?.timestamp ??
        message?.Timestamp ??
        new Date().toISOString(),

      hasSeen: message?.hasSeen ?? message?.HasSeen ?? false,

      attachments: Array.isArray(rawAttachments)
        ? rawAttachments.map(normalizeChatAttachment).filter(Boolean)
        : [],
    };
  };

  const getMessageKey = (message) => {
    if (message.id !== null && message.id !== undefined) {
      return `id-${message.id}`;
    }

    const attachmentKey = (message.attachments || [])
      .map((attachment) => attachment.id || attachment.url)
      .join("|");

    return `${message.sender}-${message.receiver}-${message.content}-${attachmentKey}-${message.dateTime}`;
  };

  const addMessageSafely = (message) => {
    const normalized = normalizeMessage(message);
    const key = getMessageKey(normalized);

    if (receivedIdsRef.current.has(key)) return;

    receivedIdsRef.current.add(key);
    setMessages((previous) => [...previous, normalized]);
  };

  const getDeletedMessageId = (payload) => {
    const value =
      payload?.messageId ??
      payload?.MessageId ??
      payload?.data?.messageId ??
      payload?.data?.MessageId ??
      payload?.Data?.messageId ??
      payload?.Data?.MessageId;

    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const removeMessageLocally = (messageId) => {
    if (!messageId) return;

    setMessages((previous) => {
      const target = previous.find(
        (message) => Number(message.id) === Number(messageId),
      );

      if (target) {
        receivedIdsRef.current.delete(getMessageKey(target));
      }

      return previous.filter(
        (message) => Number(message.id) !== Number(messageId),
      );
    });

    setOpenMessageMenuId(null);

    setMessagePendingDelete((current) =>
      Number(current?.id) === Number(messageId) ? null : current,
    );
  };

  const getReceiverImageFromMessages = () => {
    const receiverMessage = messages.find(
      (message) =>
        normalizeUsername(message.sender) === normalizeUsername(receiver),
    );

    return receiverMessage?.senderProfileImage || null;
  };

  const getUserImage = () => {
    const imagePath =
      userData?.profileImage ||
      userData?.ProfileImage ||
      userData?.profilePhoto ||
      userData?.ProfilePhoto ||
      userData?.userPhoto ||
      userData?.UserPhoto ||
      userData?.basicInfo?.profileImage ||
      userData?.BasicInfo?.ProfileImage ||
      userData?.basicInfo?.profilePhoto ||
      userData?.companyInfo?.logoUrl ||
      userData?.CompanyInfo?.LogoUrl ||
      userData?.logoUrl ||
      userData?.LogoUrl ||
      userData?.companyLogo ||
      userData?.CompanyLogo ||
      getReceiverImageFromMessages();

    return getImageUrl(imagePath);
  };

  const getDisplayName = () => {
    return (
      userData?.fullName ||
      userData?.FullName ||
      userData?.basicInfo?.fullName ||
      userData?.BasicInfo?.FullName ||
      userData?.companyName ||
      userData?.CompanyName ||
      userData?.companyInfo?.name ||
      userData?.CompanyInfo?.Name ||
      userData?.userName ||
      userData?.UserName ||
      userData?.username ||
      userData?.Username ||
      userData?.basicInfo?.username ||
      receiver
    );
  };

  const getSubInfo = () => {
    return (
      userData?.currentPosition ||
      userData?.CurrentPosition ||
      userData?.basicInfo?.currentPosition ||
      userData?.BasicInfo?.CurrentPosition ||
      userData?.companyInfo?.industry ||
      userData?.CompanyInfo?.Industry ||
      userData?.bio ||
      userData?.Bio ||
      userData?.about?.bio ||
      ""
    );
  };

  const markChatAsSeen = async () => {
    if (!receiver) return;

    try {
      await api.post(`/chat/mark-as-seen/${encodeURIComponent(receiver)}`);
      dispatch(clearUnreadForUser(receiver));
    } catch (error) {
      console.error("Mark as seen failed:", error);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleClickProfile = () => {
    if (!receiver) return;
    navigate(`/profile/${receiver}`);
  };

  const getApiErrorMessage = (error) => {
    if (error?.response?.status === 413) {
      return "The selected files exceed the server limit.";
    }

    const responseData = error?.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    return (
      responseData?.message ||
      responseData?.error ||
      "The message could not be sent."
    );
  };

  const openDeleteConfirmation = (message) => {
    if (!message?.id) return;

    setOpenMessageMenuId(null);
    setMessagePendingDelete(message);
    setErrorMessage("");
  };

  const closeDeleteConfirmation = () => {
    if (isDeletingMessage) return;
    setMessagePendingDelete(null);
  };

  const confirmDeleteMessage = async () => {
    const messageId = Number(messagePendingDelete?.id);

    if (!Number.isInteger(messageId) || messageId <= 0 || isDeletingMessage) {
      return;
    }

    try {
      setIsDeletingMessage(true);
      setErrorMessage("");

      await api.delete(`/chat/messages/${messageId}`);

      // SignalR normally removes it on both clients. This local removal is
      // also kept as a fallback if the sender misses the realtime event.
      removeMessageLocally(messageId);
    } catch (error) {
      console.error("Delete message failed:", error);

      const responseData = error?.response?.data;
      setErrorMessage(
        responseData?.message ||
          responseData?.error ||
          "The message could not be deleted.",
      );
    } finally {
      setIsDeletingMessage(false);
    }
  };

  useEffect(() => {
    if (openMessageMenuId === null) return undefined;

    const handleOutsideClick = (event) => {
      if (!event.target.closest("[data-message-options]")) {
        setOpenMessageMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [openMessageMenuId]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!receiver) return;

      try {
        const response = await api.get(`/User/${encodeURIComponent(receiver)}`);
        setUserData(unwrapResponse(response));
      } catch (error) {
        console.error("User fetch error:", error);
        setUserData(null);
      }
    };

    fetchUserData();
  }, [receiver]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!receiver) return;

      try {
        setMessages([]);
        receivedIdsRef.current = new Set();

        const response = await api.get(
          `/chat/messages/${encodeURIComponent(receiver)}`,
        );

        const rawMessages = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
            ? response.data.data
            : [];

        const normalizedMessages = rawMessages.map(normalizeMessage);

        normalizedMessages.forEach((message) => {
          receivedIdsRef.current.add(getMessageKey(message));
        });

        setMessages(normalizedMessages);
        await markChatAsSeen();
      } catch (error) {
        console.error("Messages fetch error:", error);
        setMessages([]);
      }
    };

    fetchMessages();
  }, [receiver]);

  useEffect(() => {
    let connection;

    const connect = async () => {
      if (!receiver) return;

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/chathub`, {
          accessTokenFactory: () => localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveMessage", async (message) => {
        const normalized = normalizeMessage(message);

        const senderMatches =
          normalizeUsername(normalized.sender) === normalizeUsername(receiver);

        const receiverMatches =
          normalizeUsername(normalized.receiver) ===
          normalizeUsername(currentUsername);

        if (senderMatches && receiverMatches) {
          addMessageSafely(normalized);
          await markChatAsSeen();
        }
      });

      connection.on("ReceiveOwnMessage", (message) => {
        const normalized = normalizeMessage(message);

        const senderMatches =
          normalizeUsername(normalized.sender) ===
          normalizeUsername(currentUsername);

        const receiverMatches =
          normalizeUsername(normalized.receiver) ===
          normalizeUsername(receiver);

        if (senderMatches && receiverMatches) {
          addMessageSafely(normalized);
        }
      });

      connection.on("MessageError", (message) => {
        setErrorMessage(message || "The message could not be sent.");

        window.setTimeout(() => {
          setErrorMessage("");
        }, 3500);
      });

      connection.on("MessageDeleted", (payload) => {
        const deletedMessageId = getDeletedMessageId(payload);

        if (deletedMessageId) {
          removeMessageLocally(deletedMessageId);
        }
      });

      try {
        await connection.start();
        console.log("ChatWindow ChatHub connected");
      } catch (error) {
        console.error("ChatWindow SignalR connection error:", error);
      }
    };

    dispatch(setActiveChat(receiver));

    connect();

    return () => {
      dispatch(setActiveChat(null));
      connection?.stop();
    };
  }, [receiver, currentUsername, dispatch]);

  const handleSend = async ({ content, files }) => {
    const trimmedContent = content?.trim() || "";
    const normalizedFiles = Array.from(files || []);

    if (!receiver || (!trimmedContent && normalizedFiles.length === 0)) {
      return false;
    }

    const formData = new FormData();

    if (trimmedContent) {
      formData.append("Content", trimmedContent);
    }

    normalizedFiles.forEach((file) => {
      formData.append("Files", file);
    });

    try {
      setErrorMessage("");
      setUploadProgress(0);

      const response = await api.post(
        `/chat/messages/${encodeURIComponent(receiver)}`,
        formData,
        {
          onUploadProgress: (progressEvent) => {
            if (!progressEvent.total) return;

            setUploadProgress(
              Math.round((progressEvent.loaded * 100) / progressEvent.total),
            );
          },
        },
      );

      const savedMessage = unwrapResponse(response);

      if (savedMessage && typeof savedMessage === "object") {
        addMessageSafely(savedMessage);
      }

      return true;
    } catch (error) {
      console.error("Send message failed:", error);
      setErrorMessage(getApiErrorMessage(error));
      return false;
    } finally {
      setUploadProgress(null);
    }
  };

  const renderAttachment = (attachment, messageId, index) => {
    const normalized = normalizeChatAttachment(attachment);

    if (!normalized) return null;

    const url = resolveMediaUrl(normalized.url, "");
    const kind = getAttachmentKind(normalized);
    const key = normalized.id || `${messageId}-${normalized.url}-${index}`;

    if (!url) {
      return (
        <div className="chat-unavailable-attachment" key={key} style={styles.unavailableAttachment}>
          The file link is unavailable
        </div>
      );
    }

    if (kind === "image") {
      return (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          style={styles.imageLink}
          title={normalized.originalFileName}
        >
          <img
            src={url}
            alt={normalized.originalFileName}
            style={styles.attachmentImage}
            loading="lazy"
          />
        </a>
      );
    }

    return (
      <a
        className="chat-file-card"
        key={key}
        href={url}
        target="_blank"
        rel="noreferrer"
        download={normalized.originalFileName}
        style={styles.fileCard}
        title={normalized.originalFileName}
      >
        <div style={styles.fileCardIcon}>{kind === "pdf" ? "📄" : "📎"}</div>

        <div style={styles.fileCardInfo}>
          <div style={styles.fileCardName}>{normalized.originalFileName}</div>
          <div style={styles.fileCardMeta}>
            {kind === "pdf" ? "PDF" : "File"} ·{" "}
            {formatFileSize(normalized.sizeBytes)}
          </div>
        </div>

        <div style={styles.openFileIcon}>↗</div>
      </a>
    );
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="chat-window" style={styles.wrapper}>
      <div className="chat-window-header" style={styles.header}>
        <img
          src={getUserImage()}
          alt={`${getDisplayName()} profile`}
          style={styles.avatar}
          onError={(event) => {
            event.currentTarget.src = defaultAvatar;
          }}
        />

        <div style={styles.headerInfo}>
          <div className="chat-window-username" style={styles.username} onClick={handleClickProfile}>
            {getDisplayName()}
          </div>

          <div className="chat-window-subinfo" style={styles.subInfo}>{getSubInfo()}</div>
        </div>
      </div>

      {errorMessage && <div style={styles.errorBox}>{errorMessage}</div>}

      <div className="chat-messages" style={styles.messages}>
        {messages.length === 0 && (
          <div style={styles.emptyMessage}>No messages yet.</div>
        )}

        {messages.map((message, index) => {
          const isMe =
            normalizeUsername(message.sender) ===
            normalizeUsername(currentUsername);

          const messageId = Number(message.id);
          const canDelete =
            isMe && Number.isInteger(messageId) && messageId > 0;
          const isMenuOpen =
            canDelete && Number(openMessageMenuId) === messageId;

          return (
            <div
              key={
                message.id || `${message.sender}-${message.dateTime}-${index}`
              }
              style={{
                ...styles.messageRow,
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              {canDelete && (
                <div data-message-options style={styles.messageOptionsWrapper}>
                  {!isMenuOpen && (
                    <button
                      type="button"
                      aria-label="Message options"
                      title="Message options"
                      style={styles.messageOptionsButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMessageMenuId(messageId);
                      }}
                    >
                      ⋮
                    </button>
                  )}

                  {isMenuOpen && (
                    <div className="chat-message-menu" style={styles.messageMenu}>
                      <button
                        type="button"
                        style={styles.deleteMenuItem}
                        onClick={() => openDeleteConfirmation(message)}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div
                className={`chat-message-bubble ${isMe ? "is-mine" : "is-theirs"}`}
                style={{
                  ...styles.messageBubble,
                  backgroundColor: isMe ? "#dbeafe" : "#f1f5f9",
                }}
              >
                {message.attachments.length > 0 && (
                  <div style={styles.attachmentsList}>
                    {message.attachments.map((attachment, attachmentIndex) =>
                      renderAttachment(attachment, message.id, attachmentIndex),
                    )}
                  </div>
                )}

                {message.content && (
                  <div className="chat-message-text" style={styles.messageText}>{message.content}</div>
                )}

                <div className="chat-message-time" style={styles.messageTime}>
                  {formatTime(message.dateTime)}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {messagePendingDelete && (
        <div
          style={styles.modalOverlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDeleteConfirmation();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-message-title"
            className="chat-confirm-modal"
            style={styles.confirmModal}
          >
            <h3 id="delete-message-title" style={styles.modalTitle}>
              Delete this message?
            </h3>

            <p style={styles.modalText}>
              Are you sure you want to delete this message for everyone?
            </p>

            <div style={styles.modalActions}>
              <button
                type="button"
                className="chat-cancel-button"
                style={styles.cancelButton}
                onClick={closeDeleteConfirmation}
                disabled={isDeletingMessage}
              >
                Cancel
              </button>

              <button
                type="button"
                style={{
                  ...styles.confirmDeleteButton,
                  opacity: isDeletingMessage ? 0.65 : 1,
                  cursor: isDeletingMessage ? "not-allowed" : "pointer",
                }}
                onClick={confirmDeleteMessage}
                disabled={isDeletingMessage}
              >
                {isDeletingMessage ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MessageInput
        key={receiver}
        onSend={handleSend}
        uploadProgress={uploadProgress}
      />
    </div>
  );
};

export default ChatWindow;

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "var(--app-surface)",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 16px",
    borderBottom: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
  },

  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  headerInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  username: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--app-text)",
    cursor: "pointer",
  },

  subInfo: {
    fontSize: "12px",
    color: "var(--app-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  errorBox: {
    margin: "10px 16px 0",
    padding: "10px 12px",
    borderRadius: "10px",
    backgroundColor: "#fee2e2",
    color: "#991b1b",
    fontSize: "13px",
    fontWeight: 500,
  },

  messages: {
    flex: 1,
    padding: "20px",
    backgroundColor: "var(--app-surface-2)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    overflowY: "auto",
  },

  emptyMessage: {
    margin: "auto",
    color: "var(--app-muted)",
    fontSize: "14px",
    fontStyle: "italic",
  },

  messageRow: {
    width: "100%",
    display: "flex",
    alignItems: "flex-start",
    gap: "3px",
  },

  messageOptionsWrapper: {
    position: "relative",
    width: "20px",
    minWidth: "20px",
    flexShrink: 0,
    alignSelf: "flex-end",
    marginBottom: "1px",
    marginRight: "-1px",
    zIndex: 20,
  },

  messageOptionsButton: {
    width: "20px",
    height: "20px",
    padding: 0,
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    color: "var(--app-muted)",
    fontSize: "15px",
    lineHeight: 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.18s ease, color 0.18s ease",
  },

  messageMenu: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: "96px",
    padding: "5px",
    borderRadius: "11px",
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
    zIndex: 30,
  },

  deleteMenuItem: {
    width: "100%",
    padding: "9px 10px",
    border: "none",
    borderRadius: "8px",
    backgroundColor: "transparent",
    color: "#dc2626",
    fontSize: "13px",
    fontWeight: 650,
    textAlign: "left",
    cursor: "pointer",
    display: "block",
  },

  messageBubble: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "10px 12px",
    borderRadius: "18px",
    maxWidth: "min(70%, 560px)",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    wordBreak: "break-word",
  },

  attachmentsList: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  imageLink: {
    display: "block",
    textDecoration: "none",
  },

  attachmentImage: {
    display: "block",
    width: "100%",
    maxWidth: "420px",
    maxHeight: "360px",
    borderRadius: "12px",
    objectFit: "cover",
    backgroundColor: "var(--app-border)",
  },

  fileCard: {
    minWidth: "230px",
    maxWidth: "360px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    borderRadius: "12px",
    border: "1px solid rgba(100, 116, 139, 0.22)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    color: "var(--app-text)",
    textDecoration: "none",
  },

  fileCardIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    backgroundColor: "var(--app-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    flexShrink: 0,
  },

  fileCardInfo: {
    minWidth: 0,
    flex: 1,
  },

  fileCardName: {
    fontSize: "13px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  fileCardMeta: {
    marginTop: "3px",
    fontSize: "11px",
    color: "var(--app-muted)",
  },

  openFileIcon: {
    color: "#0a66c2",
    fontSize: "16px",
    flexShrink: 0,
  },

  unavailableAttachment: {
    padding: "9px 10px",
    borderRadius: "10px",
    backgroundColor: "rgba(255, 255, 255, 0.65)",
    color: "var(--app-muted)",
    fontSize: "12px",
  },

  messageText: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "var(--app-text)",
    whiteSpace: "pre-wrap",
  },

  messageTime: {
    alignSelf: "flex-end",
    marginTop: "1px",
    fontSize: "11px",
    opacity: 0.55,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    backgroundColor: "rgba(15, 23, 42, 0.46)",
    backdropFilter: "blur(3px)",
  },

  confirmModal: {
    width: "min(100%, 390px)",
    padding: "26px",
    borderRadius: "18px",
    backgroundColor: "var(--app-surface)",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
    textAlign: "center",
  },

  modalTitle: {
    margin: 0,
    color: "var(--app-text)",
    fontSize: "19px",
    fontWeight: 750,
  },

  modalText: {
    margin: "10px 0 22px",
    color: "var(--app-muted)",
    fontSize: "13.5px",
    lineHeight: 1.55,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },

  cancelButton: {
    minWidth: "94px",
    padding: "10px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "10px",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
  },

  confirmDeleteButton: {
    minWidth: "112px",
    padding: "10px 15px",
    border: "none",
    borderRadius: "10px",
    backgroundColor: "#dc2626",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: 700,
  },
};
