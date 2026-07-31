import React, { useEffect, useRef, useState } from "react";
import {
  CHAT_FILE_ACCEPT,
  formatFileSize,
  getFileExtension,
  validateChatFiles,
} from "../../utils/chatFiles";

const MessageInput = ({ onSend, uploadProgress = null }) => {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [localError, setLocalError] = useState("");
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);
  const selectedFilesRef = useRef([]);

  useEffect(() => {
    selectedFilesRef.current = selectedFiles;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      selectedFilesRef.current.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const clearSelectedFiles = () => {
    selectedFiles.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    setSelectedFiles([]);
  };

  const handleFileSelect = (event) => {
    const incomingFiles = Array.from(event.target.files || []);
    event.target.value = "";

    if (incomingFiles.length === 0) return;

    const allFiles = [
      ...selectedFiles.map((item) => item.file),
      ...incomingFiles,
    ];

    const validationError = validateChatFiles(allFiles);

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    const newItems = incomingFiles.map((file) => {
      const isImage =
        file.type.startsWith("image/") ||
        [".jpg", ".jpeg", ".png", ".webp"].includes(
          getFileExtension(file.name),
        );

      return {
        id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Math.random()}`,
        file,
        previewUrl: isImage ? URL.createObjectURL(file) : "",
      };
    });

    setSelectedFiles((previous) => [...previous, ...newItems]);
    setLocalError("");
  };

  const removeFile = (id) => {
    setSelectedFiles((previous) => {
      const target = previous.find((item) => item.id === id);

      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return previous.filter((item) => item.id !== id);
    });

    setLocalError("");
  };

  const handleSend = async () => {
    const content = message.trim();
    const files = selectedFiles.map((item) => item.file);

    if (!content && files.length === 0) return;
    if (!onSend || isSending) return;

    const validationError = validateChatFiles(files);

    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      setIsSending(true);
      setLocalError("");

      const wasSent = await onSend({ content, files });

      if (wasSent === false) return;

      setMessage("");
      clearSelectedFiles();
    } catch (error) {
      console.error("MessageInput send failed:", error);
      setLocalError("The message could not be sent.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      handleSend();
    }
  };

  const isDisabled =
    isSending || (!message.trim() && selectedFiles.length === 0);

  return (
    <div className="message-composer" style={styles.wrapper}>
      {selectedFiles.length > 0 && (
        <div style={styles.previewList}>
          {selectedFiles.map((item) => (
            <div className="message-file-preview" key={item.id} style={styles.previewItem}>
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  style={styles.previewImage}
                />
              ) : (
                <div style={styles.fileIcon}>📎</div>
              )}

              <div style={styles.fileInfo}>
                <div className="message-file-name" style={styles.fileName} title={item.file.name}>
                  {item.file.name}
                </div>
                <div style={styles.fileSize}>
                  {formatFileSize(item.file.size)}
                </div>
              </div>

              <button
                type="button"
                aria-label={`Remove ${item.file.name}`}
                title="Remove file"
                style={styles.removeButton}
                onClick={() => removeFile(item.id)}
                disabled={isSending}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {localError && <div style={styles.error}>{localError}</div>}

      {uploadProgress !== null && isSending && (
        <div style={styles.progressTrack}>
          <div
            style={{
              ...styles.progressBar,
              width: `${Math.max(0, Math.min(100, uploadProgress))}%`,
            }}
          />
        </div>
      )}

      <div className="message-composer-row" style={styles.container}>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={CHAT_FILE_ACCEPT}
          onChange={handleFileSelect}
          style={styles.hiddenInput}
        />

        <button
          type="button"
          style={styles.attachButton}
          className="message-attach-button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          title="Add an image or file"
          aria-label="Add an image or file"
        >
          📎
        </button>

        <textarea
          placeholder="Write a message..."
          style={styles.input}
          className="message-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isSending}
        />

        <button
          type="button"
          style={{
            ...styles.button,
            opacity: isDisabled ? 0.55 : 1,
            cursor: isDisabled ? "not-allowed" : "pointer",
          }}
          onClick={handleSend}
          disabled={isDisabled}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    borderTop: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
  },

  previewList: {
    display: "flex",
    gap: "8px",
    padding: "10px 12px 0",
    overflowX: "auto",
  },

  previewItem: {
    minWidth: "190px",
    maxWidth: "240px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px",
    border: "1px solid #dbe3ec",
    borderRadius: "12px",
    backgroundColor: "var(--app-surface-2)",
  },

  previewImage: {
    width: "42px",
    height: "42px",
    borderRadius: "8px",
    objectFit: "cover",
    flexShrink: 0,
  },

  fileIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "8px",
    backgroundColor: "var(--app-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  fileInfo: {
    minWidth: 0,
    flex: 1,
  },

  fileName: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--app-text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  fileSize: {
    marginTop: "2px",
    fontSize: "11px",
    color: "var(--app-muted)",
  },

  removeButton: {
    width: "24px",
    height: "24px",
    border: "none",
    borderRadius: "50%",
    backgroundColor: "var(--app-border)",
    color: "var(--app-text)",
    cursor: "pointer",
    fontSize: "17px",
    lineHeight: 1,
    flexShrink: 0,
  },

  error: {
    padding: "7px 12px 0",
    color: "#b91c1c",
    fontSize: "12px",
    fontWeight: 500,
  },

  progressTrack: {
    height: "3px",
    margin: "8px 12px 0",
    borderRadius: "999px",
    backgroundColor: "#dbeafe",
    overflow: "hidden",
  },

  progressBar: {
    height: "100%",
    borderRadius: "999px",
    backgroundColor: "#0a66c2",
    transition: "width 0.15s ease",
  },

  container: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    padding: "10px",
  },

  hiddenInput: {
    display: "none",
  },

  attachButton: {
    width: "40px",
    height: "40px",
    border: "1px solid #dbe3ec",
    borderRadius: "50%",
    backgroundColor: "var(--app-surface-2)",
    cursor: "pointer",
    fontSize: "18px",
    flexShrink: 0,
  },

  input: {
    flex: 1,
    minHeight: "40px",
    maxHeight: "110px",
    resize: "none",
    padding: "10px 14px",
    fontSize: "14px",
    lineHeight: "1.4",
    borderRadius: "20px",
    border: "1px solid #cbd5e1",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },

  button: {
    minHeight: "40px",
    padding: "8px 16px",
    fontSize: "14px",
    backgroundColor: "#0a66c2",
    color: "white",
    border: "none",
    borderRadius: "20px",
    fontWeight: 600,
    flexShrink: 0,
  },
};

export default MessageInput;
