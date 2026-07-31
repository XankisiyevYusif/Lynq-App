import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../services/api";
import MentionTagTextarea from "./MentionTagTextarea";

const CreatePostBox = ({
  onPostCreated,
  placeholder = "Share something...",
  autoOpenMedia = "",
}) => {
  const fileInputRef = useRef(null);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mentionedCompany, setMentionedCompany] = useState(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!autoOpenMedia) return;
    const timer = window.setTimeout(() => fileInputRef.current?.click(), 80);
    return () => window.clearTimeout(timer);
  }, [autoOpenMedia]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Only image or video files are allowed.");
      return;
    }

    setError("");
    setSelectedFile(file);
    setMediaType(isImage ? "image" : "video");
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setMediaType("");
  };

  const handleSubmit = async () => {
    const trimmedContent = content.trim();

    if (!trimmedContent && !selectedFile) {
      setError("Please add text, image, or video.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const formData = new FormData();
      formData.append("content", trimmedContent);

      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (mentionedCompany?.id) {
        formData.append("mentionedCompanyId", mentionedCompany.id);
      }

      const response = await api.post("/Post/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const createdPost = response.data?.data || response.data;

      setContent("");
      setSelectedFile(null);
      setMediaType("");
      setMentionedCompany(null);

      if (onPostCreated) {
        onPostCreated(createdPost);
      }
    } catch (err) {
      console.error("Failed to create post:", err);
      setError("Failed to share post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>Create a post</div>

      <MentionTagTextarea
        value={content}
        onChange={(nextValue) => {
          setContent(nextValue);
          if (
            mentionedCompany?.username &&
            !nextValue
              .toLowerCase()
              .includes(`@${mentionedCompany.username.toLowerCase()}`)
          ) {
            setMentionedCompany(null);
          }
          if (error) setError("");
        }}
        onSuggestionSelected={(item, symbol) => {
          if (symbol !== "@") return;

          const userType =
            item?.userType || item?.UserType || item?.role || item?.Role;
          const companyId = item?.companyId || item?.CompanyId;
          const username =
            item?.username || item?.Username || item?.userName || item?.UserName;
          const name =
            item?.companyName ||
            item?.CompanyName ||
            item?.fullName ||
            item?.FullName ||
            username;

          if (userType === "Employer" && companyId) {
            setMentionedCompany({ id: companyId, username, name });
          }
        }}
        placeholder={placeholder}
        style={styles.textarea}
        rows={4}
        maxLength={1000}
      />

      <div style={styles.composerHelper}>
        Use <strong>@</strong> to mention a profile and <strong>#</strong> to
        add a topic.
      </div>

      {mentionedCompany && (
        <div style={styles.companyMention}>
          Mentioned company: @{mentionedCompany.username}
          <button
            type="button"
            onClick={() => setMentionedCompany(null)}
            style={styles.companyMentionRemove}
            aria-label="Remove company mention"
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.mediaActions}>
        <label style={styles.uploadButton}>
          Add photo or video
          <input
            ref={fileInputRef}
            type="file"
            accept={
              autoOpenMedia === "image"
                ? "image/*"
                : autoOpenMedia === "video"
                  ? "video/*"
                  : "image/*,video/*"
            }
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>

        {selectedFile && (
          <button
            type="button"
            onClick={removeSelectedFile}
            style={styles.removeButton}
          >
            Remove media
          </button>
        )}
      </div>

      {selectedFile && (
        <div style={styles.previewWrapper}>
          {mediaType === "image" ? (
            <img src={previewUrl} alt="Preview" style={styles.previewImage} />
          ) : (
            <video src={previewUrl} controls style={styles.previewVideo} />
          )}

          <div style={styles.fileName}>{selectedFile.name}</div>
        </div>
      )}

      <div style={styles.footer}>
        <span style={styles.counter}>{content.length}/1000</span>

        <button
          onClick={handleSubmit}
          disabled={loading || (!content.trim() && !selectedFile)}
          style={{
            ...styles.submitButton,
            opacity: loading || (!content.trim() && !selectedFile) ? 0.6 : 1,
            cursor:
              loading || (!content.trim() && !selectedFile)
                ? "not-allowed"
                : "pointer",
          }}
        >
          {loading ? "Sharing..." : "Post"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    marginBottom: "20px",
  },
  header: {
    fontSize: "18px",
    fontWeight: "600",
    color: "var(--app-text)",
    marginBottom: "12px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical",
    borderRadius: "12px",
    border: "1px solid var(--app-border)",
    padding: "12px 14px",
    fontSize: "15px",
    outline: "none",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: "border-box",
    marginBottom: "12px",
  },
  mediaActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px",
  },
  composerHelper: {
    margin: "-4px 2px 12px",
    color: "var(--app-muted)",
    fontSize: "12px",
  },
  companyMention: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    margin: "0 0 12px",
    padding: "7px 10px",
    borderRadius: "999px",
    backgroundColor: "var(--app-accent-soft)",
    color: "var(--app-accent)",
    fontSize: "13px",
    fontWeight: 600,
  },
  companyMentionRemove: {
    border: "none",
    background: "transparent",
    color: "var(--app-accent)",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1,
    padding: 0,
  },
  uploadButton: {
    backgroundColor: "var(--app-surface-2)",
    color: "var(--app-text)",
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  removeButton: {
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    color: "#dc2626",
    border: "none",
    borderRadius: "999px",
    padding: "10px 14px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  previewWrapper: {
    marginBottom: "14px",
  },
  previewImage: {
    width: "100%",
    maxHeight: "380px",
    objectFit: "contain",
    backgroundColor: "var(--app-surface-2)",
    borderRadius: "14px",
    border: "1px solid var(--app-border)",
    marginBottom: "8px",
  },
  previewVideo: {
    width: "100%",
    maxHeight: "380px",
    borderRadius: "14px",
    border: "1px solid var(--app-border)",
    marginBottom: "8px",
    backgroundColor: "#000",
  },
  fileName: {
    fontSize: "13px",
    color: "var(--app-muted)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counter: {
    fontSize: "13px",
    color: "var(--app-muted)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  submitButton: {
    backgroundColor: "var(--app-accent)",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 18px",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    transition: "0.2s ease",
  },
  error: {
    marginTop: "10px",
    color: "#d93025",
    fontSize: "14px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export default CreatePostBox;
