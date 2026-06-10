import React, { useMemo, useState } from "react";
import api from "../../services/api";

const CreatePostBox = ({
  onPostCreated,
  placeholder = "Share something...",
}) => {
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [mediaType, setMediaType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

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

    const response = await api.post("/Post/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    const createdPost = response.data?.data || response.data;

    setContent("");
    setSelectedFile(null);
    setMediaType("");

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

      <textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          if (error) setError("");
        }}
        placeholder={placeholder}
        style={styles.textarea}
        rows={4}
        maxLength={1000}
      />

      <div style={styles.mediaActions}>
        <label style={styles.uploadButton}>
          Add photo or video
          <input
            type="file"
            accept="image/*,video/*"
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
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "16px",
    padding: "16px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    marginBottom: "20px",
  },
  header: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#222",
    marginBottom: "12px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    resize: "vertical",
    borderRadius: "12px",
    border: "1px solid #d0d7de",
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
  uploadButton: {
    backgroundColor: "#f3f6f8",
    color: "#222",
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
    backgroundColor: "#fdeaea",
    color: "#c62828",
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
    objectFit: "cover",
    borderRadius: "14px",
    border: "1px solid #eee",
    marginBottom: "8px",
  },
  previewVideo: {
    width: "100%",
    maxHeight: "380px",
    borderRadius: "14px",
    border: "1px solid #eee",
    marginBottom: "8px",
    backgroundColor: "#000",
  },
  fileName: {
    fontSize: "13px",
    color: "#666",
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
    color: "#666",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  submitButton: {
    backgroundColor: "#0a66c2",
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