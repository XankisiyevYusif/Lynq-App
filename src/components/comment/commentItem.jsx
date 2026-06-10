import { useEffect, useRef, useState } from "react";
import defaultAvatar from "../../assets/default-avatar.png";
import { formatDistanceToNow } from "date-fns";
import EditCommentModal from "./EditCommentModal";

export default function CommentItem({
  comment,
  isOwner,      // comment owner
  isPostOwner,  // post owner
  onDelete,
  onUpdate,
}) {
  if (!comment) return null;


 

  const {
    commentId,
    username = "Unknown user",
    content,
    text,
    userProfileUrl,
    createdAt,
  } = comment;

  const message = content ?? text;

  // Permissions
  const canEdit = !!isOwner; // only comment owner
  const canDelete = !!isOwner || !!isPostOwner; // comment owner OR post owner
  const canManage = canEdit || canDelete;

  const [openMenu, setOpenMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const menuRef = useRef(null);

  /* ===============================
     🕒 SAFE DATE
  =============================== */
  const getTime = () => {
    if (!createdAt) return null;

    let s = String(createdAt);
    s = s.replace(/\.(\d{3})\d+/, ".$1");

    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(s)) {
      s += "Z";
    }

    const d = new Date(s);
    if (isNaN(d.getTime())) return null;

    return formatDistanceToNow(d, { addSuffix: true });
  };

  const time = getTime();

  /* ===============================
     🖱 CLICK OUTSIDE → CLOSE MENU
  =============================== */
  useEffect(() => {
    if (!openMenu) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenu]);

  return (
    <div style={styles.wrapper}>
      <img
        src={userProfileUrl || defaultAvatar}
        alt={`${username} avatar`}
        style={styles.avatar}
        onError={(e) => (e.currentTarget.src = defaultAvatar)}
      />

      <div style={styles.body}>
        <div style={styles.header}>
          <strong style={styles.username}>{username}</strong>
          {time && <span style={styles.time}>· {time}</span>}

          {/* ⋯ MENU */}
          {canManage && (
            <div style={styles.menuWrapper} ref={menuRef}>
              <button
                style={styles.menuButton}
                onClick={() => setOpenMenu((p) => !p)}
                aria-label="Comment actions"
              >
                ⋯
              </button>

              {openMenu && (
                <div style={styles.menu}>
                  {canEdit && (
                    <button
                      style={styles.menuItem}
                      onClick={() => {
                        setOpenMenu(false);
                        setIsEditing(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      style={{ ...styles.menuItem, ...styles.deleteItem }}
                      onClick={() => {
                        setOpenMenu(false);
                        onDelete?.(commentId);
                      }}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {message && <p style={styles.text}>{message}</p>}
      </div>

      {/* ✅ MODAL */}
      {canEdit && (
        <EditCommentModal
          isOpen={isEditing}
          initialText={message}
          onClose={() => setIsEditing(false)}
          onSave={(newText) => {
            const trimmed = newText?.trim();
            if (!trimmed) return;

            setIsEditing(false);
            onUpdate?.({
              commentId,
              text: trimmed,
            });
          }}
        />
      )}
    </div>
  );
}

/* ===============================
   🎨 PROFESSIONAL STYLES
=============================== */
const styles = {
  wrapper: {
    display: "flex",
    gap: "12px",
    padding: "12px",
    background: "#ffffff",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    flexShrink: 0,
  },

  body: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  username: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
  },

  time: {
    fontSize: "12px",
    color: "#6b7280",
  },

  text: {
    margin: 0,
    fontSize: "14px",
    color: "#374151",
    lineHeight: 1.5,
    marginTop: "4px",
  },

  /* MENU */
  menuWrapper: {
    marginLeft: "auto",
    position: "relative",
  },

  menuButton: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: "18px",
    padding: "2px 6px",
    color: "#6b7280",
  },

  menu: {
    position: "absolute",
    right: 0,
    top: "24px",
    background: "#ffffff",
    borderRadius: "8px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    border: "1px solid #e5e7eb",
    zIndex: 20,
    minWidth: "140px",
    overflow: "hidden",
  },

  menuItem: {
    width: "100%",
    padding: "10px 14px",
    fontSize: "14px",
    cursor: "pointer",
    background: "transparent",
    border: "none",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },

  deleteItem: {
    color: "#dc2626",
    borderTop: "1px solid #f1f5f9",
  },
};
