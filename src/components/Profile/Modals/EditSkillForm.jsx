import React, { useEffect, useState } from "react";
import api from "../../../services/api";
import Toast from "../../UI/Toast";
import pencil from "../../../assets/pencil.png";

export default function EditSkillForm({
  skill,
  setUser,
  onClose,
}) {
  const [name, setName] = useState(skill?.name || "");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({
      open: true,
      message,
      type,
    });
  };

  const closeToast = () => {
    setToast({
      open: false,
      message: "",
      type: "success",
    });
  };

  useEffect(() => {
    if (!toast.open) return;

    const timer = setTimeout(() => {
      closeToast();
    }, 3000);

    return () => clearTimeout(timer);
  }, [toast.open]);

  if (!skill) {
    return <div style={styles.emptyText}>Skill not found.</div>;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Skill is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (isLoading) return;

    if (!validateForm()) {
      showToast("Please fill in the required field.", "error");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.put(`/User/skill/${skill.id}`, {
        name: name.trim(),
      });

      const updatedSkill = response?.data?.data;

      if (updatedSkill) {
        setUser((prev) => ({
          ...prev,
          skills: (prev?.skills || []).map((item) =>
            item.id === skill.id ? updatedSkill : item
          ),
        }));
      }

      showToast("Skill updated successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to update skill.";

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleteLoading) return;

    try {
      setIsDeleteLoading(true);

      await api.delete(`/User/skill/${skill.id}`);

      setUser((prev) => ({
        ...prev,
        skills: (prev?.skills || []).filter((item) => item.id !== skill.id),
      }));

      setShowDeleteModal(false);
      showToast("Skill deleted successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to delete skill.";

      setShowDeleteModal(false);
      showToast(errorMessage, "error");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {toast.open && (
        <div style={styles.toastCenter}>
          <Toast
            message={toast.message}
            type={toast.type}
            duration={3000}
            onClose={closeToast}
          />
        </div>
      )}

      <div style={styles.headerRow}>
        <div style={styles.title}>Edit skill</div>
        <button style={styles.backBtn} onClick={onClose}>
          ← Back
        </button>
      </div>

      <div style={styles.helper}>* Indicates required fields</div>

      <div style={styles.field}>
        <label style={styles.label}>Skill*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.name ? styles.inputError : null),
          }}
          placeholder="Example: React"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }));
            }
          }}
        />
        {errors.name && <div style={styles.errorText}>{errors.name}</div>}
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.deleteBtn}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete
        </button>

        <button
          type="button"
          style={{
            ...styles.saveBtn,
            ...(isLoading ? styles.saveBtnDisabled : null),
          }}
          onClick={handleUpdate}
          disabled={isLoading}
        >
          {isLoading ? "Updating..." : "Update"}
        </button>
      </div>

      {showDeleteModal && (
        <div
          style={styles.confirmOverlay}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.confirmTitle}>Delete skill?</div>
            <div style={styles.confirmText}>
              Are you sure you want to delete this skill?
            </div>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                style={styles.confirmDeleteButton}
                onClick={handleDelete}
                disabled={isDeleteLoading}
              >
                {isDeleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  root: {
    width: "100%",
    boxSizing: "border-box",
  },

  toastCenter: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10001,
  },

  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  backBtn: {
    background: "transparent",
    border: "none",
    color: "#0a66c2",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    padding: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 0, // 🔥 FIX
  },

  helper: {
    fontSize: 12,
    color: "#777",
    marginBottom: 20,
  },

  field: {
    marginBottom: 20,
  },

  label: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    display: "block",
  },

  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.25)",
    padding: "0 12px",
    boxSizing: "border-box",
    outline: "none",
  },

  inputError: {
    border: "1px solid #d93025",
    backgroundColor: "#fff8f7",
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#d93025",
    fontWeight: 500,
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },

  deleteBtn: {
    background: "#d92d20",
    border: "none",
    color: "#fff",
    borderRadius: 20,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  saveBtn: {
    background: "#0073b1",
    color: "#fff",
    border: "none",
    borderRadius: 20,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  saveBtnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  emptyText: {
    color: "#666",
    fontSize: 14,
  },

  confirmOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
    marginBottom: 8,
  },

  confirmText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 20,
    lineHeight: 1.5,
  },

  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },

  confirmDeleteButton: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#d92d20",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
  },
};