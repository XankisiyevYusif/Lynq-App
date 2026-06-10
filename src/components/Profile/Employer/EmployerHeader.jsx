import React, { useState } from "react";
import defaultAvatar from "../../../assets/default-avatar.png";
import backgroundImage from "../../../assets/backgroundImage.png";
import pencil from "../../../assets/pencil.png";

const API_BASE_URL = "https://localhost:7257";

export default function EmployerHeader({
  user,
  isOwner,
  readOnly,
  onEdit,
  followButton,
  followerCount = 0,

  imageMenu,
  menuRef,
  onOpenProfileImageMenu,
  onOpenBackgroundImageMenu,
  onUploadProfileImage,
  onUploadBackgroundImage,
  onDeleteProfileImage,
  onDeleteBackgroundImage,
}) {
  const [editHover, setEditHover] = useState(false);

  const basic = user?.basicInfo || {};
  const company = user?.companyInfo || {};

  const companyName = company.name || basic.fullName || "Company";
  const username = basic.username || "";
  const industry = company.industry || "";
  const location = company.location || basic.location || "";
  const tagline = company.tagline || "";

  const logoUrl = company.logoUrl || basic.profileImage;
  const coverUrl = basic.backgroundImage;

  const hasLogo = !!logoUrl;
  const hasBackground = !!coverUrl;

  const getImageUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  return (
    <div style={styles.card}>
      <div style={styles.coverWrap}>
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
            <img
              style={{ width: 16, height: 16 }}
              src={backgroundImage}
              alt="edit"
            />
          </div>
        )}

        {imageMenu?.open && imageMenu?.type === "background" && (
          <div ref={menuRef} style={styles.coverMenu}>
            {!hasBackground ? (
              <div style={styles.menuItem} onClick={onUploadBackgroundImage}>
                Upload photo
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

      <div style={styles.logoBox}>
        <img
          src={hasLogo ? getImageUrl(logoUrl) : defaultAvatar}
          alt="Company logo"
          style={styles.logo}
        />

        {isOwner && !readOnly && (
          <div
            style={styles.logoActionButton}
            onClick={(e) => {
              e.stopPropagation();
              onOpenProfileImageMenu?.();
            }}
            title="Company logo"
          >
            {hasLogo ? (
              <span style={{ fontSize: 18 }}>✎</span>
            ) : (
              <span style={{ fontSize: 28, translate: "0 -3px" }}>+</span>
            )}
          </div>
        )}

        {imageMenu?.open && imageMenu?.type === "profile" && (
          <div ref={menuRef} style={styles.logoMenu}>
            {!hasLogo ? (
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

      {isOwner && !readOnly && (
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

      <div style={styles.body}>
        <div style={styles.content}>
          <div style={styles.topRow}>
            <div>
              <h1 style={styles.name}>{companyName}</h1>

              {tagline && <p style={styles.description}>{tagline}</p>}

              <p style={styles.meta}>
                {industry || "Industry not provided"}
                {location ? ` · ${location}` : ""}
                {username ? ` · @${username}` : ""}
              </p>

             <p style={styles.followers}>
                {followerCount} {followerCount === 1 ? "follower" : "followers"}
            </p>
            </div>
          </div>

        {!isOwner && (
          <div style={styles.actions}>
            {followButton}

            <button style={styles.moreBtn}>...</button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

const styles = {
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 820,
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
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
      "linear-gradient(135deg, rgba(155,205,235,0.8), rgba(40,125,190,0.85))",
    overflow: "visible",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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
    backgroundColor: "#eee",
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

  logoMenu: {
    position: "absolute",
    left: 95,
    top: 126,
    minWidth: 150,
    backgroundColor: "#fff",
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
    zIndex: 8,
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
    color: "rgba(0,0,0,0.92)",
    fontFamily: font,
  },

  description: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "rgba(0,0,0,0.75)",
    lineHeight: 1.4,
    fontFamily: font,
  },

  meta: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#6b6f73",
    fontFamily: font,
  },

  followers: {
    margin: "8px 0 0",
    fontSize: 14,
    color: "#6b6f73",
    fontFamily: font,
  },

  actions: {
    marginTop: 16,
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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: 18,
    lineHeight: "18px",
    fontFamily: font,
  },
};