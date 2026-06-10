import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
 

const API_BASE_URL = "https://linkedinapi-xvld.onrender.com";

export default function EditPostModal({
  isOpen,
  onClose,
  post,
  onUpdated,
  onDeleted,
  showToast,
}) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [removeMedia, setRemoveMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showRemoveMediaConfirm, setShowRemoveMediaConfirm] = useState(false);
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);

  useEffect(() => {
    if (!isOpen || !post) return;

    setContent(post.content ?? "");
    setFile(null);
    setRemoveMedia(false);
    setShowRemoveMediaConfirm(false);
    setShowDeletePostConfirm(false);
  }, [isOpen, post]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const previewUrl = useMemo(() => {
    if (!post) return null;
    if (file) return URL.createObjectURL(file);
    if (removeMedia) return null;

    if (post.imageUrl) return `${API_BASE_URL}${post.imageUrl}`;
    if (post.videoUrl) return `${API_BASE_URL}${post.videoUrl}`;
    return null;
  }, [file, removeMedia, post]);

  useEffect(() => {
    return () => {
      if (file && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  if (!isOpen || !post) return null;

  const isExistingVideo = !file && !removeMedia && !!post.videoUrl;
  const isNewVideo = !!file && file.type.startsWith("video/");
  const isVideoPreview = isExistingVideo || isNewVideo;

  const handlePickFile = (e) => {
    const pickedFile = e.target.files?.[0];
    if (!pickedFile) return;

    const isImage = pickedFile.type.startsWith("image/");
    const isVideo = pickedFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      showToast?.("Only image or video files are allowed.", "error");
      return;
    }

    setFile(pickedFile);
    setRemoveMedia(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("Content", content ?? "");
      formData.append("DeleteMedia", removeMedia ? "true" : "false");

      if (file) {
        formData.append("File", file);
      }

      const response = await api.put(`/Post/posts/${post.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedPost = response.data?.data || response.data;

      onUpdated?.(updatedPost);
      showToast?.("Post updated successfully.", "success");
      onClose?.();
    } catch (error) {
      console.error("Update post failed:", error);
      showToast?.("Post update failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    debugger;
    try {
      setDeleting(true);

      await api.delete(`/Post/posts/${post.id}`);

      onDeleted?.(post.id);
      showToast?.("Post deleted successfully.", "success");
      setShowDeletePostConfirm(false);
      onClose?.();
    } catch (error) {
      console.error("Delete post failed:", error);
      showToast?.("Post delete failed.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div style={styles.header}>
            <h3 style={styles.title}>Edit post</h3>
            <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Write something..."
            style={styles.textarea}
          />

          <div style={styles.mediaSection}>
            {previewUrl ? (
              <div style={styles.previewWrap}>
                <button
                  type="button"
                  style={styles.removeMediaIconBtn}
                  onClick={() => setShowRemoveMediaConfirm(true)}
                  aria-label="Remove media"
                >
                  ✕
                </button>

                {isVideoPreview ? (
                  <video controls style={styles.previewMedia}>
                    <source src={previewUrl} />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img src={previewUrl} alt="Preview" style={styles.previewMedia} />
                )}

                <div style={styles.previewActions}>
                  <label style={styles.secondaryBtn}>
                    Change file
                    <input
                      type="file"
                      accept="image/*,video/*"
                      hidden
                      onChange={handlePickFile}
                    />
                  </label>
                </div>

                {removeMedia && (
                  <div style={styles.note}>
                    Media will be removed when you save the post.
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.noMediaBox}>
                <div style={styles.noMediaText}>No media</div>
                <label style={styles.secondaryBtn}>
                  Upload file
                  <input
                    type="file"
                    accept="image/*,video/*"
                    hidden
                    onChange={handlePickFile}
                  />
                </label>
              </div>
            )}
          </div>

          <div style={styles.footer}>
            <button
              type="button"
              style={styles.deletePostBtn}
              onClick={() => {
                console.log("Delete post clicked");
                setShowDeletePostConfirm(true);
              }}
              disabled={saving || deleting}
            >
              Delete post
            </button>

            <div style={styles.footerRight}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || deleting}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showRemoveMediaConfirm && (
        <ConfirmDeleteModal
          isOpen={showRemoveMediaConfirm}
          title="Remove media"
          message="Are you sure you want to remove this media?"
          onCancel={() => setShowRemoveMediaConfirm(false)}
          onConfirm={() => {
            setFile(null);
            setRemoveMedia(true);
            setShowRemoveMediaConfirm(false);
          }}
        />
      )}

      {showDeletePostConfirm && (
        <ConfirmDeleteModal
          isOpen={showDeletePostConfirm}
          title="Delete post"
          message="Are you sure you want to delete this post?"
          onCancel={() => setShowDeletePostConfirm(false)}
          onConfirm={handleDeletePost}
        />
      )}
    </>
  );
}

const styles = {
   overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10050,
  },
  modal: {
    width: "100%",
    maxWidth: 620,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#111827",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    fontSize: 22,
    cursor: "pointer",
    color: "#444",
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    resize: "vertical",
    outline: "none",
    minHeight: 130,
  },
  mediaSection: {
    marginTop: 16,
  },
  previewWrap: {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  previewMedia: {
    width: "100%",
    maxHeight: 360,
    objectFit: "cover",
    display: "block",
    backgroundColor: "#000",
  },
  removeMediaIconBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "none",
    backgroundColor: "rgba(0,0,0,0.65)",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  previewActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: 12,
    borderTop: "1px solid #f1f5f9",
  },
  note: {
    padding: 12,
    fontSize: 13,
    color: "#6b7280",
    borderTop: "1px solid #f1f5f9",
  },
  noMediaBox: {
    border: "1px dashed #cbd5e1",
    borderRadius: 12,
    padding: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  noMediaText: {
    fontSize: 14,
    color: "#666",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTop: "1px solid #f1f5f9",
  },
  footerRight: {
    display: "flex",
    gap: 10,
  },
  saveBtn: {
    background: "#0a66c2",
    color: "#fff",
    border: "none",
    borderRadius: 999,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
  cancelBtn: {
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
  secondaryBtn: {
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  deletePostBtn: {
    background: "#fff",
    color: "#d11124",
    border: "1px solid #f3b4bb",
    borderRadius: 999,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 14,
  },
};