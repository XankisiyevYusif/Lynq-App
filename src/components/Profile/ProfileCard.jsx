import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import * as signalR from "@microsoft/signalr";
import defaultAvatar from "../../assets/default-avatar.png";
import connectIcon from "../../assets/connectIcon.png";
import acceptConnect from "../../assets/acceptConnect.png";
import pendingConnect from "../../assets/pendingConnect.png";
import SendMessageIcon from "../../assets/sendMessageIcon.png";
import pencil from "../../assets/pencil.png";
import backgroundImage from "../../assets/backgroundImage.png";
import { useSelector } from "react-redux";

export default function ProfileCard({
  user,
  isOwner,
  readOnly,
  showToast,
  onEdit,
  onOpenProfileImageMenu,
  onOpenBackgroundImageMenu,
  imageMenu,
  onUploadProfileImage,
  onUploadBackgroundImage,
  onDeleteProfileImage,
  onDeleteBackgroundImage,
  menuRef,
}) {
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.user.user);

  const currentUserIsEmployer =
    currentUser?.userType === "Employer" ||
    currentUser?.UserType === "Employer" ||
    currentUser?.role === "Employer" ||
    currentUser?.Role === "Employer";

  const [connectHover, setConnectHover] = useState(false);
  const [messageHover, setMessageHover] = useState(false);
  const [editHover, setEditHover] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const [connectionStatus, setConnectionStatus] = useState("none");
  const [connectionRequestId, setConnectionRequestId] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const API_BASE_URL = "https://localhost:7257";

  const profileUsername = user?.basicInfo?.username;

  const hasProfileImage = !!user?.basicInfo?.profileImage;
  const hasBackgroundImage = !!user?.basicInfo?.backgroundImage;

  const canShowConnectionActions = !isOwner && !currentUserIsEmployer;

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const normalizeConnectionStatus = (payload) => {
    const data = payload?.data || payload || {};

    return {
      status: data.status || data.Status || "none",
      requestId: data.requestId ?? data.RequestId ?? null,
    };
  };

  const fetchConnectionStatus = async () => {
    if (!profileUsername || isOwner || currentUserIsEmployer) return;

    try {
      const res = await api.get(`/Connection/status/${profileUsername}`);
      const normalized = normalizeConnectionStatus(res.data);

      setConnectionStatus(normalized.status);
      setConnectionRequestId(normalized.requestId);
    } catch (err) {
      console.error("Connection status fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, [profileUsername, isOwner, currentUserIsEmployer]);

  useEffect(() => {
    if (!isRemoveModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isRemoveModalOpen]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || !profileUsername || isOwner || currentUserIsEmployer) return;

    const sameUser = (targetUser) => {
      return (
        targetUser?.username?.toLowerCase() === profileUsername?.toLowerCase()
      );
    };

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/connectionhub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveConnectionRequest", (request) => {
      if (sameUser(request?.sender)) {
        setConnectionStatus("pending_received");
        setConnectionRequestId(request?.id ?? null);
      }
    });

    connection.on("ConnectionRequestSent", (request) => {
      if (sameUser(request?.receiver)) {
        setConnectionStatus("pending_sent");
        setConnectionRequestId(request?.id ?? null);
      }
    });

    connection.on("ReceiveConnectionAccepted", (request) => {
      if (sameUser(request?.receiver)) {
        setConnectionStatus("connected");
        setConnectionRequestId(null);
      }
    });

    connection.on("ConnectionRequestAcceptedByMe", (request) => {
      if (sameUser(request?.sender)) {
        setConnectionStatus("connected");
        setConnectionRequestId(null);
      }
    });

    connection.on("ReceiveConnectionRejected", (request) => {
      if (sameUser(request?.receiver)) {
        setConnectionStatus("none");
        setConnectionRequestId(null);
      }
    });

    connection.on("ConnectionRequestRejectedByMe", (request) => {
      if (sameUser(request?.sender)) {
        setConnectionStatus("none");
        setConnectionRequestId(null);
      }
    });

    connection.on("ReceiveConnectionCancelled", (request) => {
      if (sameUser(request?.sender)) {
        setConnectionStatus("none");
        setConnectionRequestId(null);
      }
    });

    connection.on("ConnectionRequestCancelledByMe", (request) => {
      if (sameUser(request?.receiver)) {
        setConnectionStatus("none");
        setConnectionRequestId(null);
      }
    });

    connection.on("ConnectedDirectlyByMe", (targetUser) => {
      if (sameUser(targetUser)) {
        setConnectionStatus("connected");
        setConnectionRequestId(null);
      }
    });

    connection.on("ReceiveDirectConnection", (targetUser) => {
      if (sameUser(targetUser)) {
        setConnectionStatus("connected");
        setConnectionRequestId(null);
      }
    });

    connection.on("ConnectionRemovedByMe", (removedUser) => {
      if (sameUser(removedUser)) {
        setConnectionStatus("none");
        setConnectionRequestId(null);
      }
    });

    connection.on("ReceiveConnectionRemoved", () => {
      fetchConnectionStatus();
    });

    connection
      .start()
      .then(() => console.log("ConnectionHub connected in ProfileCard"))
      .catch((err) =>
        console.error("ConnectionHub error in ProfileCard:", err)
      );

    return () => {
      connection.stop();
    };
  }, [profileUsername, isOwner, currentUserIsEmployer]);

  const getConnectionButtonText = () => {
    if (connectionLoading) return "Loading...";

    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "pending_sent":
        return "Pending";
      case "pending_received":
        return "Accept";
      default:
        return "Connect";
    }
  };

  const getConnectionIcon = () => {
    if (connectionStatus === "connected") {
      return acceptConnect;
    }

    if (connectionStatus === "pending_received") {
      return acceptConnect;
    }

    if (connectionStatus === "pending_sent") {
      return pendingConnect;
    }

    return connectIcon;
  };

  const getConnectionButtonBackground = () => {
    if (connectionStatus === "connected") {
      return connectHover ? "#4f8f5f" : "#5f9f6f";
    }

    if (connectionStatus === "pending_sent") {
      return connectHover ? "#7f8b95" : "#8F9CA7";
    }

    if (connectionStatus === "pending_received") {
      return connectHover ? "#087f5b" : "#0a8f67";
    }

    return connectHover ? "#006097" : "#0073b1";
  };

  const handleConnectionClick = async () => {
    if (!profileUsername || connectionLoading || currentUserIsEmployer) {
      return;
    }

    try {
      setConnectionLoading(true);

      if (connectionStatus === "none") {
        await api.post(`/Connection/send/${profileUsername}`);

        await fetchConnectionStatus();
        return;
      }

      if (connectionStatus === "pending_sent") {
        if (!connectionRequestId) {
          await fetchConnectionStatus();
          return;
        }

        await api.post(`/Connection/cancel/${connectionRequestId}`);

        setConnectionStatus("none");
        setConnectionRequestId(null);
        return;
      }

      if (connectionStatus === "pending_received") {
        if (!connectionRequestId) {
          await fetchConnectionStatus();
          return;
        }

        await api.post(`/Connection/accept/${connectionRequestId}`);

        setConnectionStatus("connected");
        setConnectionRequestId(null);
        return;
      }

      if (connectionStatus === "connected") {
        setIsRemoveModalOpen(true);
        return;
      }
    } catch (err) {
      console.error("Connection action failed:", err);
      showToast?.("Connection action failed.", "error");
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleConfirmRemoveConnection = async () => {
    if (!profileUsername || connectionLoading || currentUserIsEmployer) {
      return;
    }

    try {
      setConnectionLoading(true);

      await api.post(`/Connection/remove/${profileUsername}`);

      setConnectionStatus("none");
      setConnectionRequestId(null);
      setIsRemoveModalOpen(false);
    } catch (err) {
      console.error("Remove connection failed:", err);
      showToast?.("Connection could not be removed.", "error");
    } finally {
      setConnectionLoading(false);
    }
  };

  const handleMessageClick = () => {
    if (currentUserIsEmployer) return;

    if (connectionStatus !== "connected") {
      showToast?.("You can message only connected users.", "error");
      return;
    }

    navigate(`/messages/${profileUsername}`);
  };

  const coverStyle = hasBackgroundImage
    ? {
        ...styles.cover,
        background: `url(${getImageUrl(
          user.basicInfo.backgroundImage
        )}) center/cover no-repeat`,
      }
    : {
        ...styles.cover,
      };

  return (
    <>
      <div style={styles.card}>
        <div style={coverStyle}>
          {isOwner && (
            <div
              style={styles.backgroundActionButton}
              onClick={(e) => {
                e.stopPropagation();
                onOpenBackgroundImageMenu?.();
              }}
              title="Background"
            >
              <img
                style={{ width: 16, height: 16 }}
                src={backgroundImage}
                alt="edit"
              />
            </div>
          )}

          {isOwner && imageMenu?.open && imageMenu?.type === "background" && (
            <div ref={menuRef} style={styles.coverMenu}>
              {!hasBackgroundImage ? (
                <div style={styles.menuItem} onClick={onUploadBackgroundImage}>
                  Fotoğraf yükle
                </div>
              ) : (
                <>
                  <div style={styles.menuItem} onClick={onUploadBackgroundImage}>
                    Update
                  </div>
                  <div
                    style={{ ...styles.menuItem, ...styles.deleteItem }}
                    onClick={onDeleteBackgroundImage}
                  >
                    Delete
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div style={styles.avatarWrapper}>
          <img
            style={styles.avatar}
            src={
              hasProfileImage
                ? getImageUrl(user.basicInfo.profileImage)
                : defaultAvatar
            }
            alt="profile"
          />

          {isOwner && (
            <div
              style={styles.avatarActionButton}
              onClick={(e) => {
                e.stopPropagation();
                onOpenProfileImageMenu?.();
              }}
              title="Profile image"
            >
              {hasProfileImage ? (
                <span style={{ fontSize: 20 }}>✎</span>
              ) : (
                <span style={{ fontSize: 32, translate: "0 -3px" }}>+</span>
              )}
            </div>
          )}

          {isOwner && imageMenu?.open && imageMenu?.type === "profile" && (
            <div ref={menuRef} style={styles.avatarMenu}>
              {!hasProfileImage ? (
                <div style={styles.menuItem} onClick={onUploadProfileImage}>
                  Fotoğraf yükle
                </div>
              ) : (
                <>
                  <div style={styles.menuItem} onClick={onUploadProfileImage}>
                    Update
                  </div>
                  <div
                    style={{ ...styles.menuItem, ...styles.deleteItem }}
                    onClick={onDeleteProfileImage}
                  >
                    Delete
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {isOwner && (
          <img
            src={pencil}
            alt="edit"
            style={{
              ...styles.editIcon,
              backgroundColor: editHover ? "rgba(0,0,0,0.06)" : "transparent",
              transform: editHover
                ? "translateY(-1px) scale(1.03)"
                : "translateY(0) scale(1)",
              boxShadow: editHover ? "0 2px 8px rgba(0,0,0,0.12)" : "none",
              transition:
                "background-color 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={() => setEditHover(true)}
            onMouseLeave={() => setEditHover(false)}
            onClick={() => onEdit?.()}
          />
        )}

        <div style={styles.info}>
          <div style={styles.nameBlock}>
            <div style={styles.fullname}>{user?.basicInfo?.fullName}</div>
            <div style={styles.specialty}>
              {user?.basicInfo?.currentPosition}
            </div>
            <div style={styles.location}>{user?.basicInfo?.location}</div>
            <div style={styles.username}>@{user?.basicInfo?.username}</div>
          </div>

          {canShowConnectionActions && (
            <div style={styles.actionsRow}>
              <div
                style={{
                  ...styles.connectionButton,
                  backgroundColor: getConnectionButtonBackground(),
                  opacity: connectionLoading ? 0.7 : 1,
                  transform: connectHover ? "translateY(-1px)" : "translateY(0)",
                  transition: "background-color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={() => setConnectHover(true)}
                onMouseLeave={() => setConnectHover(false)}
                onClick={handleConnectionClick}
              >
                <img
                  style={styles.connectIcon}
                  src={getConnectionIcon()}
                  alt="connect"
                />
                <span style={styles.connectText}>
                  {getConnectionButtonText()}
                </span>
              </div>

              <div
                style={{
                  ...styles.messageButton,
                  backgroundColor:
                    connectionStatus === "connected" && messageHover
                      ? "rgba(0,115,177,0.08)"
                      : "#fff",
                  borderColor:
                    connectionStatus === "connected" && messageHover
                      ? "#006097"
                      : "#0073b1",
                  opacity: connectionStatus === "connected" ? 1 : 0.55,
                  transform:
                    connectionStatus === "connected" && messageHover
                      ? "translateY(-1px)"
                      : "translateY(0)",
                  transition:
                    "background-color 0.2s ease, border-color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={() => setMessageHover(true)}
                onMouseLeave={() => setMessageHover(false)}
                onClick={handleMessageClick}
              >
                <span
                  style={{
                    ...styles.messageText,
                    color:
                      connectionStatus === "connected" && messageHover
                        ? "#006097"
                        : "#0073b1",
                    transition: "color 0.2s ease",
                  }}
                >
                  Message
                </span>
                <img
                  style={styles.sendMessageIcon}
                  src={SendMessageIcon}
                  alt="message"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {isRemoveModalOpen && canShowConnectionActions && (
        <div
          style={styles.removeModalOverlay}
          onClick={() => setIsRemoveModalOpen(false)}
        >
          <div
            style={styles.removeModal}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.removeModalTitle}>Remove connection?</h3>

            <p style={styles.removeModalText}>
              Do you want to remove this connection?
            </p>

            <div style={styles.removeModalActions}>
              <button
                style={styles.removeCancelBtn}
                onClick={() => setIsRemoveModalOpen(false)}
                disabled={connectionLoading}
              >
                Cancel
              </button>

              <button
                style={styles.removeConfirmBtn}
                onClick={handleConfirmRemoveConnection}
                disabled={connectionLoading}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

const styles = {
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 820,
    borderRadius: 12,
    overflow: "visible",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  cover: {
    position: "relative",
    height: 170,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background:
      "linear-gradient(135deg, rgba(155,205,235,0.8), rgba(40,125,190,0.85))",
  },

  backgroundActionButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: 16,
    zIndex: 5,
    userSelect: "none",
  },

  coverMenu: {
    position: "absolute",
    right: 16,
    top: 58,
    minWidth: 150,
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 6,
  },

  avatarWrapper: {
    position: "absolute",
    left: 24,
    top: 115,
    width: 120,
    height: 120,
    zIndex: 4,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#eee",
    border: "6px solid #fff",
  },

  avatarActionButton: {
    position: "absolute",
    top: 95,
    left: 90,
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "#0a66c2",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: 16,
    zIndex: 5,
    userSelect: "none",
  },

  avatarMenu: {
    position: "absolute",
    left: 95,
    top: 126,
    minWidth: 150,
    backgroundColor: "#fff",
    borderRadius: 12,
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 8,
  },

  menuItem: {
    padding: "11px 14px",
    fontSize: 14,
    cursor: "pointer",
    backgroundColor: "#fff",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    fontFamily: font,
  },

  deleteItem: {
    color: "#d11124",
    fontWeight: 600,
  },

  editIcon: {
    position: "absolute",
    right: 16,
    top: 182,
    width: 35,
    height: 35,
    padding: 6,
    borderRadius: 10,
    cursor: "pointer",
    boxSizing: "border-box",
    zIndex: 3,
  },

  info: {
    paddingTop: 70,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 20,
  },

  nameBlock: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },

  fullname: {
    fontSize: 24,
    fontWeight: 700,
    color: "rgba(0,0,0,0.92)",
    fontFamily: font,
  },

  specialty: {
    fontSize: 14,
    color: "rgba(0,0,0,0.75)",
    fontWeight: 400,
    fontFamily: font,
  },

  location: {
    fontSize: 12,
    color: "#6b6f73",
    fontWeight: 400,
    fontFamily: font,
  },

  username: {
    fontSize: 12,
    color: "#6b6f73",
    fontWeight: 400,
    fontFamily: font,
  },

  actionsRow: {
    display: "flex",
    gap: 10,
    marginTop: 14,
  },

  connectionButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "7px 14px",
    minWidth: 110,
    borderRadius: 999,
    cursor: "pointer",
    backgroundColor: "#0073b1",
  },

  connectIcon: {
    width: 16,
    height: 16,
  },

  connectText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: 600,
    fontFamily: font,
  },

  messageButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "7px 14px",
    minWidth: 110,
    borderRadius: 999,
    border: "1px solid #0073b1",
    cursor: "pointer",
    backgroundColor: "#fff",
  },

  messageText: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: font,
    color: "#0073b1",
  },

  sendMessageIcon: {
    width: 16,
    height: 16,
  },

  removeModalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  removeModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
    fontFamily: font,
  },

  removeModalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "#191919",
    fontFamily: font,
  },

  removeModalText: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 14,
    color: "#555",
    lineHeight: 1.5,
    fontFamily: font,
  },

  removeModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  removeCancelBtn: {
    border: "1px solid #999",
    backgroundColor: "#fff",
    color: "#555",
    padding: "8px 14px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: font,
  },

  removeConfirmBtn: {
    border: "none",
    backgroundColor: "#d93025",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: 18,
    cursor: "pointer",
    fontWeight: 600,
    fontFamily: font,
  },
};