import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { API_ROOT } from "../../services/api";
import * as signalR from "@microsoft/signalr";
import defaultAvatar from "../../assets/default-avatar.png";
import connectIcon from "../../assets/connectIcon.png";
import acceptConnect from "../../assets/acceptConnect.png";
import pendingConnect from "../../assets/pendingConnect.png";
import SendMessageIcon from "../../assets/SendMessageIcon.png";
import { useSelector } from "react-redux";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import ContactInfoModal from "./ContactInfoModal";
import ProfileIcon from "./ProfileIcon";
import { ReportProfileModal } from "./ProfileSafetyModals";

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
  imageOperation,
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
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState("none");
  const [connectionRequestId, setConnectionRequestId] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const API_BASE_URL = API_ROOT;

  const profileUsername = user?.basicInfo?.username;

  const hasProfileImage = !!user?.basicInfo?.profileImage;
  const hasBackgroundImage = !!user?.basicInfo?.backgroundImage;

  const canShowConnectionActions = !isOwner && !currentUserIsEmployer;
  const canReportProfile = !isOwner && Boolean(profileUsername);

  const getImageUrl = (path) => resolveMediaUrl(path, "");

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
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [profileMenuOpen]);

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
        console.error("ConnectionHub error in ProfileCard:", err),
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
          user.basicInfo.backgroundImage,
        )}) center/cover no-repeat`,
      }
    : {
        ...styles.cover,
      };

  return (
    <>
      <div className="jobseeker-profile-card" style={styles.card}>
        <div style={coverStyle}>
          {!hasBackgroundImage && (
            <span style={styles.nexoraCoverMark} aria-hidden="true">N</span>
          )}
          {imageOperation?.type === "background" && (
            <div className="profile-image-progress profile-cover-progress">
              <span className="profile-image-spinner" />
              <span>
                {imageOperation.action === "delete"
                  ? "Removing cover..."
                  : "Updating cover..."}
              </span>
            </div>
          )}

          {isOwner && (
            <button
              type="button"
              className="profile-icon-button profile-cover-action"
              style={styles.backgroundActionButton}
              onClick={(e) => {
                e.stopPropagation();
                if (!imageOperation) onOpenBackgroundImageMenu?.();
              }}
              title="Background"
              aria-label="Change cover image"
            >
              <ProfileIcon name="camera" size={18} strokeWidth={2} />
            </button>
          )}

          {isOwner && imageMenu?.open && imageMenu?.type === "background" && (
            <div ref={menuRef} style={styles.coverMenu}>
              {!hasBackgroundImage ? (
                <div style={styles.menuItem} onClick={onUploadBackgroundImage}>
                  Upload photo
                </div>
              ) : (
                <>
                  <div
                    style={styles.menuItem}
                    onClick={onUploadBackgroundImage}
                  >
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
            onError={(event) => {
              event.currentTarget.src = defaultAvatar;
            }}
          />

          {imageOperation?.type === "profile" && (
            <div className="profile-image-progress profile-avatar-progress">
              <span className="profile-image-spinner" />
              <span className="profile-image-progress-label">
                {imageOperation.action === "delete" ? "Removing" : "Updating"}
              </span>
            </div>
          )}

          {isOwner && (
            <button
              type="button"
              className="profile-icon-button profile-avatar-action"
              style={styles.avatarActionButton}
              onClick={(e) => {
                e.stopPropagation();
                if (!imageOperation) onOpenProfileImageMenu?.();
              }}
              title="Profile image"
              aria-label={
                hasProfileImage ? "Change profile image" : "Add profile image"
              }
            >
              {hasProfileImage ? (
                <ProfileIcon name="camera" size={17} strokeWidth={2.2} />
              ) : (
                <ProfileIcon name="plus" size={20} strokeWidth={2.4} />
              )}
            </button>
          )}

          {isOwner && imageMenu?.open && imageMenu?.type === "profile" && (
            <div ref={menuRef} style={styles.avatarMenu}>
              {!hasProfileImage ? (
                <div style={styles.menuItem} onClick={onUploadProfileImage}>
                  Upload photo
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
          <>
            <button
              type="button"
              aria-label="Edit profile"
              className="profile-edit-button"
              style={{
                ...styles.editIcon,
                backgroundColor: editHover
                  ? "var(--app-surface-2)"
                  : "transparent",
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
            >
              <ProfileIcon name="edit" size={19} />
            </button>
          </>
        )}

        {canReportProfile && (
          <div ref={profileMenuRef} style={styles.profileMenuWrap}>
            <button
              type="button"
              className="profile-more-button"
              aria-label="Profile actions"
              aria-expanded={profileMenuOpen}
              style={styles.profileMoreButton}
              onClick={() => setProfileMenuOpen((current) => !current)}
            >
              <span aria-hidden="true">•••</span>
            </button>

            {profileMenuOpen && (
              <div style={styles.profileMenu}>
                <button
                  type="button"
                  className="profile-report-menu-item"
                  style={styles.profileMenuItem}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setReportModalOpen(true);
                  }}
                >
                  <span style={styles.reportMenuIcon} aria-hidden="true">!</span>
                  <span>
                    <strong>Report profile</strong>
                    <small>Send a private report to moderation</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="jobseeker-profile-info" style={styles.info}>
          <div style={styles.nameBlock}>
            <div className="jobseeker-profile-name" style={styles.fullname}>
              {user?.basicInfo?.fullName}
            </div>
            <div
              className="jobseeker-profile-position"
              style={styles.specialty}
            >
              {user?.basicInfo?.currentPosition}
            </div>
            <div className="jobseeker-profile-meta" style={styles.location}>
              {user?.basicInfo?.location}
            </div>
            <div className="jobseeker-profile-meta" style={styles.username}>
              @{user?.basicInfo?.username}
            </div>
            <button
              type="button"
              className="profile-contact-button"
              style={styles.contactInfoButton}
              onClick={() => setIsContactInfoOpen(true)}
            >
              Contact info
            </button>
          </div>

          {canShowConnectionActions && (
            <div style={styles.actionsRow}>
              <div
                style={{
                  ...styles.connectionButton,
                  backgroundColor: getConnectionButtonBackground(),
                  opacity: connectionLoading ? 0.7 : 1,
                  transform: connectHover
                    ? "translateY(-1px)"
                    : "translateY(0)",
                  transition:
                    "background-color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={() => setConnectHover(true)}
                onMouseLeave={() => setConnectHover(false)}
                onClick={handleConnectionClick}
              >
                <img
                  className="profile-connection-icon"
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
                      : "var(--app-surface)",
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
                  className="profile-message-icon"
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
          <div style={styles.removeModal} onClick={(e) => e.stopPropagation()}>
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

      {isContactInfoOpen && (
        <ContactInfoModal
          contactInfo={user?.contactInfo}
          onClose={() => setIsContactInfoOpen(false)}
        />
      )}

      {reportModalOpen && canReportProfile && (
        <ReportProfileModal
          username={profileUsername}
          targetLabel={user?.basicInfo?.fullName || `@${profileUsername}`}
          targetKind="profile"
          onClose={() => setReportModalOpen(false)}
          showToast={showToast}
        />
      )}
    </>
  );
}

const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

const styles = {
  card: {
    position: "relative",
    width: "100%",
    maxWidth: "none",
    borderRadius: 12,
    overflow: "visible",
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  },

  cover: {
    position: "relative",
    height: 170,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    background:
      "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.2) 0 2px, transparent 3px), radial-gradient(circle at 88% 20%, rgba(245,158,11,0.36) 0 42px, transparent 43px), linear-gradient(132deg, #312e81 0%, #4f46e5 52%, #7c3aed 100%)",
    overflow: "hidden",
  },

  nexoraCoverMark: {
    position: "absolute",
    right: 34,
    bottom: -43,
    color: "rgba(255,255,255,0.11)",
    fontFamily: '"Outfit", sans-serif',
    fontSize: 190,
    fontWeight: 850,
    lineHeight: 1,
    letterSpacing: -18,
    pointerEvents: "none",
    userSelect: "none",
  },

  backgroundActionButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "var(--app-surface)",
    border: "1px solid rgba(226,232,240,0.9)",
    color: "var(--app-text)",
    padding: 0,
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
    backgroundColor: "var(--app-surface)",
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
    backgroundColor: "var(--app-surface-2)",
    border: "6px solid var(--app-surface)",
  },

  avatarActionButton: {
    position: "absolute",
    top: 95,
    left: 90,
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "#0a66c2",
    border: "3px solid var(--app-surface)",
    padding: 0,
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
    backgroundColor: "var(--app-surface)",
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
    backgroundColor: "var(--app-surface)",
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
    border: "none",
    background: "transparent",
    color: "var(--app-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    cursor: "pointer",
    boxSizing: "border-box",
    zIndex: 3,
  },

  profileMenuWrap: {
    position: "absolute",
    right: 16,
    top: 182,
    zIndex: 12,
  },

  profileMoreButton: {
    display: "grid",
    width: 36,
    height: 36,
    placeItems: "center",
    padding: 0,
    borderRadius: 10,
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text-soft)",
    fontWeight: 800,
    fontSize: 13,
    cursor: "pointer",
    fontFamily: font,
  },

  profileMenu: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 260,
    padding: 7,
    border: "1px solid var(--app-border)",
    borderRadius: 13,
    background: "var(--app-surface)",
    boxShadow: "0 16px 45px rgba(15,23,42,.18)",
  },

  profileMenuItem: {
    display: "flex",
    width: "100%",
    alignItems: "center",
    gap: 11,
    padding: "10px 11px",
    border: 0,
    borderRadius: 9,
    background: "transparent",
    color: "var(--app-text)",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: font,
  },

  reportMenuIcon: {
    display: "grid",
    width: 32,
    height: 32,
    flex: "0 0 32px",
    placeItems: "center",
    borderRadius: 9,
    background: "#fff1f2",
    color: "#be123c",
    fontWeight: 900,
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
    color: "var(--app-text)",
    fontFamily: font,
  },

  specialty: {
    fontSize: 14,
    color: "var(--app-text-soft)",
    fontWeight: 400,
    fontFamily: font,
  },

  location: {
    fontSize: 12,
    color: "var(--app-muted)",
    fontWeight: 400,
    fontFamily: font,
  },

  username: {
    fontSize: 12,
    color: "var(--app-muted)",
    fontWeight: 400,
    fontFamily: font,
  },

  contactInfoButton: {
    alignSelf: "flex-start",
    marginTop: 2,
    padding: 0,
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: font,
    cursor: "pointer",
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
    backgroundColor: "var(--app-surface)",
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
    backgroundColor: "var(--app-surface)",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
    fontFamily: font,
  },

  removeModalTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
    color: "var(--app-text)",
    fontFamily: font,
  },

  removeModalText: {
    marginTop: 10,
    marginBottom: 18,
    fontSize: 14,
    color: "var(--app-text-soft)",
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
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text-soft)",
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
