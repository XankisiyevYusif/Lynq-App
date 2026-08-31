import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import api from "../../../services/api";
import ProfileIcon from "../ProfileIcon";
import { ReportProfileModal } from "../ProfileSafetyModals";

export default function EmployerHeader({
  user,
  isOwner,
  readOnly,
  onEdit,
  followButton,
  followerCount = 0,
  showToast,

  imageMenu,
  menuRef,
  onOpenProfileImageMenu,
  onOpenBackgroundImageMenu,
  onUploadProfileImage,
  onUploadBackgroundImage,
  onDeleteProfileImage,
  onDeleteBackgroundImage,
}) {
  const navigate = useNavigate();
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);
  const [chatInvitation, setChatInvitation] = useState(null);
  const companyMenuRef = useRef(null);

  const basic = user?.basicInfo || {};
  const company = user?.companyInfo || {};

  const companyName = company.name || basic.fullName || "Company";
  const username = basic.username || "";
  const industry = company.industry || "";
  const location = company.location || basic.location || "";
  const tagline = company.tagline || "";
  const getImageUrl = (path) => resolveMediaUrl(path, "");

  const logoUrl = company.logoUrl || basic.profileImage;
  const fallbackLogoUrl =
    basic.profileImage && basic.profileImage !== logoUrl
      ? getImageUrl(basic.profileImage)
      : defaultAvatar;
  const coverUrl = basic.backgroundImage;

  const hasLogo = !!logoUrl;
  const hasBackground = !!coverUrl;

  useEffect(() => {
    if (!companyMenuOpen) return;

    const closeOnOutsideClick = (event) => {
      if (
        companyMenuRef.current &&
        !companyMenuRef.current.contains(event.target)
      ) {
        setCompanyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, [companyMenuOpen]);

  useEffect(() => {
    if (!username || isOwner) {
      setChatInvitation(null);
      return;
    }

    api.get(`/chat/invitation/${encodeURIComponent(username)}`)
      .then((response) => {
        setChatInvitation(response?.data?.data ?? response?.data ?? null);
      })
      .catch(() => setChatInvitation(null));
  }, [username, isOwner]);

  const messagingBlocked = ["blocked", "unavailable"].includes(
    chatInvitation?.status,
  );

  const getMessageButtonText = () => {
    if (chatInvitation?.status === "accepted") return "Message";
    if (chatInvitation?.status === "pending") {
      return chatInvitation?.invitedByMe
        ? "Invitation pending"
        : "Review invitation";
    }
    if (chatInvitation?.status === "rejected") return "Invitation declined";
    if (messagingBlocked) return "Messaging unavailable";
    return chatInvitation?.requiresAcceptance ? "Invite to chat" : "Message";
  };

  const openCompanyChat = () => {
    if (!username || messagingBlocked) {
      if (messagingBlocked) {
        showToast?.(
          chatInvitation?.message || "Messaging is not available.",
          "error",
        );
      }
      return;
    }

    navigate(`/messages/${username}`);
  };

  const blockCompany = async () => {
    if (!username || blockLoading) return;
    try {
      setBlockLoading(true);
      await api.post(`/privacy/block/${username}`);
      showToast?.("Company blocked.", "success");
      navigate("/home", { replace: true });
    } catch (error) {
      showToast?.(
        error?.response?.data?.message || "Company could not be blocked.",
        "error",
      );
    } finally {
      setBlockLoading(false);
      setBlockModalOpen(false);
    }
  };

  return (
    <>
      <div className="employer-header-card" style={styles.card}>
      <div className="employer-header-cover" style={styles.coverWrap}>
        {!hasBackground && (
          <span
            className="employer-header-cover-mark"
            style={styles.nexoraCoverMark}
            aria-hidden="true"
          >
            N
          </span>
        )}
        {hasBackground && (
          <img
            src={getImageUrl(coverUrl)}
            alt="Company cover"
            style={styles.coverImage}
          />
        )}

        {isOwner && !readOnly && (
          <div
            style={styles.backgroundActionButton}
            onClick={(e) => {
              e.stopPropagation();
              onOpenBackgroundImageMenu?.();
            }}
            title="Background"
          >
            <ProfileIcon name="camera" size={17} strokeWidth={2.2} />
          </div>
        )}

        {imageMenu?.open && imageMenu?.type === "background" && (
          <div className="employer-image-menu" ref={menuRef} style={styles.coverMenu}>
            {!hasBackground ? (
              <div className="employer-image-menu-item" style={styles.menuItem} onClick={onUploadBackgroundImage}>
                Upload photo
              </div>
            ) : (
              <>
                <div className="employer-image-menu-item" style={styles.menuItem} onClick={onUploadBackgroundImage}>
                  Update
                </div>

                <div
                  className="employer-image-menu-item is-danger"
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

      <div className="employer-header-logo-box" style={styles.logoBox}>
        <img
          src={hasLogo ? getImageUrl(logoUrl) : defaultAvatar}
          alt="Company logo"
          style={styles.logo}
          onError={(event) => {
            if (event.currentTarget.src !== fallbackLogoUrl) {
              event.currentTarget.src = fallbackLogoUrl;
            } else {
              event.currentTarget.src = defaultAvatar;
            }
          }}
        />

        {isOwner && !readOnly && (
          <button
            type="button"
            className="profile-icon-button"
            style={styles.logoActionButton}
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfileImageMenu?.();
            }}
            title="Company logo"
            aria-label={hasLogo ? "Change company logo" : "Add company logo"}
          >
            {hasLogo ? (
              <ProfileIcon name="camera" size={16} strokeWidth={2.2} />
            ) : (
              <ProfileIcon name="plus" size={19} strokeWidth={2.4} />
            )}
          </button>
        )}

        {imageMenu?.open && imageMenu?.type === "profile" && (
          <div className="employer-image-menu" ref={menuRef} style={styles.logoMenu}>
            {!hasLogo ? (
              <div className="employer-image-menu-item" style={styles.menuItem} onClick={onUploadProfileImage}>
                Upload photo
              </div>
            ) : (
              <>
                <div className="employer-image-menu-item" style={styles.menuItem} onClick={onUploadProfileImage}>
                  Update
                </div>

                <div
                  className="employer-image-menu-item is-danger"
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

      <div className="employer-header-body" style={styles.body}>
        <div className="employer-header-content" style={styles.content}>
          <div className="employer-header-info" style={styles.topRow}>
            <div>
              <h1 className="employer-header-name" style={styles.name}>{companyName}</h1>

              {tagline && <p className="employer-header-description" style={styles.description}>{tagline}</p>}

              <p className="employer-header-meta" style={styles.meta}>
                {industry || "Industry not provided"}
                {location ? ` · ${location}` : ""}
                {username ? ` · @${username}` : ""}
              </p>

              <p className="employer-header-followers" style={styles.followers}>
                {followerCount} {followerCount === 1 ? "follower" : "followers"}
              </p>
            </div>
          </div>

          <div className="employer-header-actions" style={styles.actions}>
            {isOwner && !readOnly ? (
              <>
                <button
                  type="button"
                  className="employer-header-primary-action"
                  onClick={() => navigate("/company/dashboard")}
                >
                  Manage page
                </button>
                <button
                  type="button"
                  className="employer-header-secondary-action"
                  onClick={() => onEdit?.()}
                >
                  <ProfileIcon name="edit" size={17} />
                  Edit page
                </button>
              </>
            ) : (
              <>
              {followButton}

                <button
                  type="button"
                  className="employer-header-primary-action"
                  style={{
                    ...styles.messageBtn,
                    opacity: messagingBlocked ? 0.55 : 1,
                    cursor: messagingBlocked ? "not-allowed" : "pointer",
                  }}
                  onClick={openCompanyChat}
                  disabled={messagingBlocked}
                >
                  {getMessageButtonText()}
                </button>

                {company.website && (
                  <a
                    className="employer-header-secondary-action"
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Visit website
                  </a>
                )}

                <div ref={companyMenuRef} style={styles.moreWrap}>
                  <button
                    className="employer-header-more-action"
                    type="button"
                    aria-label="Company profile actions"
                    aria-expanded={companyMenuOpen}
                    onClick={() => setCompanyMenuOpen((current) => !current)}
                  >
                    •••
                  </button>

                  {companyMenuOpen && (
                    <div className="employer-header-action-menu" style={styles.moreMenu}>
                      <button
                        type="button"
                        className="employer-header-report-action"
                        style={styles.reportAction}
                        onClick={() => {
                          setCompanyMenuOpen(false);
                          setReportModalOpen(true);
                        }}
                      >
                        <span style={styles.reportIcon} aria-hidden="true">!</span>
                        <span>
                          <strong>Report company</strong>
                          <small>Send a private report to moderation</small>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="employer-header-report-action"
                        style={styles.reportAction}
                        onClick={() => {
                          setCompanyMenuOpen(false);
                          setBlockModalOpen(true);
                        }}
                      >
                        <span style={styles.blockIcon} aria-hidden="true">⊘</span>
                        <span>
                          <strong>Block company</strong>
                          <small>Hide this page and prevent messaging</small>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </div>

      {reportModalOpen && username && !isOwner && (
        <ReportProfileModal
          username={username}
          targetLabel={companyName}
          targetKind="company"
          onClose={() => setReportModalOpen(false)}
          showToast={showToast}
        />
      )}
      {blockModalOpen && username && !isOwner && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !blockLoading) {
              setBlockModalOpen(false);
            }
          }}
        >
          <section style={styles.modal} role="dialog" aria-modal="true">
            <h2 style={styles.modalTitle}>Block {companyName}?</h2>
            <p style={styles.modalText}>
              You will no longer see this company profile, its feed posts or messages.
              Existing follow and connection relationships will be removed.
            </p>
            <div style={styles.modalActions}>
              <button type="button" style={styles.cancelButton} onClick={() => setBlockModalOpen(false)} disabled={blockLoading}>Cancel</button>
              <button type="button" style={styles.blockButton} onClick={blockCompany} disabled={blockLoading}>
                {blockLoading ? "Blocking…" : "Block company"}
              </button>
            </div>
          </section>
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
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    overflow: "visible",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    fontFamily: font,
  },

  coverWrap: {
    position: "relative",
    height: 170,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    background:
      "radial-gradient(circle at 14% 18%, rgba(255,255,255,0.2) 0 2px, transparent 3px), radial-gradient(circle at 88% 20%, rgba(245,158,11,0.36) 0 42px, transparent 43px), linear-gradient(132deg, #312e81 0%, #4f46e5 52%, #7c3aed 100%)",
    overflow: "visible",
  },

  nexoraCoverMark: {
    position: "absolute",
    right: 34,
    bottom: -43,
    zIndex: 0,
    color: "rgba(255,255,255,0.11)",
    fontFamily: '"Outfit", sans-serif',
    fontSize: 190,
    fontWeight: 850,
    lineHeight: 1,
    letterSpacing: -18,
    pointerEvents: "none",
    userSelect: "none",
  },

  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },

  backgroundActionButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: "50%",
    backgroundColor: "var(--app-surface)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: 16,
    zIndex: 8,
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
    zIndex: 20,
  },

  logoBox: {
    position: "absolute",
    left: 24,
    top: 95,
    width: 120,
    height: 120,
    zIndex: 10,
  },

  logo: {
    width: 120,
    height: 120,
    borderRadius: 8,
    objectFit: "cover",
    backgroundColor: "var(--app-surface-2)",
    border: "6px solid #fff",
    boxSizing: "border-box",
  },

  logoActionButton: {
    position: "absolute",
    top: 92,
    left: 90,
    width: 32,
    height: 32,
    borderRadius: "50%",
    backgroundColor: "#0a66c2",
    border: 0,
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    fontSize: 16,
    zIndex: 12,
    userSelect: "none",
  },

  moreWrap: {
    position: "relative",
  },

  moreMenu: {
    position: "absolute",
    zIndex: 30,
    top: 43,
    right: 0,
    width: 270,
    padding: 7,
    border: "1px solid var(--app-border)",
    borderRadius: 13,
    background: "var(--app-surface)",
    boxShadow: "0 16px 45px rgba(15,23,42,.18)",
  },

  reportAction: {
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

  reportIcon: {
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

  blockIcon: {
    display: "grid",
    width: 32,
    height: 32,
    flex: "0 0 32px",
    placeItems: "center",
    borderRadius: 9,
    background: "#fef2f2",
    color: "#b91c1c",
    fontWeight: 900,
  },

  modalOverlay: {
    position: "fixed",
    zIndex: 16000,
    inset: 0,
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "rgba(15,23,42,.62)",
  },

  modal: {
    width: "min(440px, 100%)",
    padding: 22,
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    background: "var(--app-surface)",
    color: "var(--app-text)",
    boxShadow: "0 24px 70px rgba(15,23,42,.3)",
  },

  modalTitle: { margin: 0, fontSize: 20 },
  modalText: { margin: "10px 0 20px", color: "var(--app-text-soft)", lineHeight: 1.55 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: 9 },
  cancelButton: { border: "1px solid var(--app-border)", borderRadius: 999, background: "var(--app-surface)", color: "var(--app-text)", padding: "8px 14px", fontWeight: 700, cursor: "pointer" },
  blockButton: { border: 0, borderRadius: 999, background: "#b91c1c", color: "#fff", padding: "9px 15px", fontWeight: 750, cursor: "pointer" },

  logoMenu: {
    position: "absolute",
    left: 95,
    top: 126,
    minWidth: 150,
    backgroundColor: "var(--app-surface)",
    borderRadius: 12,
    boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 30,
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

  body: {
    position: "relative",
    paddingTop: 70,
    paddingLeft: 24,
    paddingRight: 24,
    paddingBottom: 20,
  },

  content: {
    width: "100%",
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
  },

  name: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "var(--app-text)",
    fontFamily: font,
  },

  description: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "var(--app-text-soft)",
    lineHeight: 1.4,
    fontFamily: font,
  },

  meta: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "var(--app-muted)",
    fontFamily: font,
  },

  followers: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "var(--app-muted)",
    fontFamily: font,
  },

  actions: {
    marginTop: 20,
    display: "flex",
    gap: 8,
    alignItems: "center",
  },

  messageBtn: {
    backgroundColor: "#0a66c2",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "8px 28px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
    fontFamily: font,
  },

  followBtn: {
    backgroundColor: "var(--app-surface)",
    color: "#0a66c2",
    border: "1px solid #0a66c2",
    borderRadius: 999,
    padding: "7px 18px",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 15,
    fontFamily: font,
  },

  moreBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    border: "1px solid #777",
    backgroundColor: "var(--app-surface)",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "18px",
    fontFamily: font,
  },
};
