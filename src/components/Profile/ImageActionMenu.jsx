export default function ImageActionMenu({
  isOpen,
  onClose,
  hasImage,
  onUpload,
  onDelete,
  top,
  right,
}) {
  if (!isOpen) return null;

  return (
    <div style={{ ...styles.menu, top, right }}>
      <div
        style={styles.item}
        onClick={onUpload}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7fa")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        {hasImage ? "Update photo" : "Upload photo"}
      </div>

      {hasImage && (
        <div
          style={{ ...styles.item, ...styles.deleteItem }}
          onClick={onDelete}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#fff5f5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
        >
          Delete photo
        </div>
      )}

      <div
        style={{ ...styles.item, borderBottom: "none" }}
        onClick={onClose}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f7fa")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#fff")}
      >
        Cancel
      </div>
    </div>
  );
}

const styles = {
  menu: {
    position: "absolute",
    minWidth: 170,
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
    border: "1px solid rgba(0,0,0,0.08)",
    overflow: "hidden",
    zIndex: 100,
  },

  item: {
    padding: "12px 14px",
    fontSize: 14,
    cursor: "pointer",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    transition: "0.15s",
    userSelect: "none",
  },

  deleteItem: {
    color: "#b42318",
    fontWeight: 500,
  },
};