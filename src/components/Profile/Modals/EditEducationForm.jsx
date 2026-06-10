import React, { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import Toast from "../../UI/Toast";

export default function EditEducationForm({
  education,
  setUser,
  onClose,
}) {
  const months = useMemo(
    () => [
      { value: "", label: "Month" },
      { value: "1", label: "January" },
      { value: "2", label: "February" },
      { value: "3", label: "March" },
      { value: "4", label: "April" },
      { value: "5", label: "May" },
      { value: "6", label: "June" },
      { value: "7", label: "July" },
      { value: "8", label: "August" },
      { value: "9", label: "September" },
      { value: "10", label: "October" },
      { value: "11", label: "November" },
      { value: "12", label: "December" },
    ],
    []
  );

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr = [{ value: "", label: "Year" }];
    for (let y = now; y >= now - 70; y--) {
      arr.push({ value: String(y), label: String(y) });
    }
    return arr;
  }, []);

  const [school, setSchool] = useState(education?.school || "");
  const [degree, setDegree] = useState(education?.degree || "");
  const [field, setField] = useState(education?.field || "");
  const [startMonth, setStartMonth] = useState(
    education?.startMonth ? String(education.startMonth) : ""
  );
  const [startYear, setStartYear] = useState(
    education?.startYear ? String(education.startYear) : ""
  );
  const [endMonth, setEndMonth] = useState(
    education?.endMonth ? String(education.endMonth) : ""
  );
  const [endYear, setEndYear] = useState(
    education?.endYear ? String(education.endYear) : ""
  );
  const [description, setDescription] = useState(education?.note || "");

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
    setToast({ open: true, message, type });
  };

  const closeToast = () => {
    setToast({ open: false, message: "", type: "success" });
  };

  useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => closeToast(), 3000);
    return () => clearTimeout(timer);
  }, [toast.open]);

  if (!education) {
    return <div style={styles.emptyText}>Education not found.</div>;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!school.trim()) newErrors.school = "School is required.";
    if (!degree.trim()) newErrors.degree = "Degree is required.";
    if (!field.trim()) newErrors.field = "Field of study is required.";
    if (!startMonth) newErrors.startMonth = "Start month is required.";
    if (!startYear) newErrors.startYear = "Start year is required.";
    if (!endMonth) newErrors.endMonth = "End month is required.";
    if (!endYear) newErrors.endYear = "End year is required.";

    if (startMonth && startYear && endMonth && endYear) {
      const startValue = Number(startYear) * 100 + Number(startMonth);
      const endValue = Number(endYear) * 100 + Number(endMonth);

      if (endValue < startValue) {
        newErrors.endDate = "End date cannot be earlier than start date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (isLoading) return;

    if (!validateForm()) {
      showToast("Please fill in the required fields correctly.", "error");
      return;
    }

    const payload = {
      school: school.trim(),
      degree: degree.trim(),
      field: field.trim(),
      startMonth: Number(startMonth),
      startYear: Number(startYear),
      endMonth: Number(endMonth),
      endYear: Number(endYear),
      note: description.trim() ? description.trim() : null,
    };

    try {
      setIsLoading(true);

      const response = await api.put(`/User/education/${education.id}`, payload);
      const updatedEducation = response?.data?.data;

      if (updatedEducation) {
        setUser((prev) => ({
          ...prev,
          educations: (prev?.educations || []).map((item) =>
            item.id === education.id ? updatedEducation : item
          ),
        }));
      }

      showToast("Education updated successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to update education.";

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleteLoading) return;

    try {
      setIsDeleteLoading(true);

      await api.delete(`/User/education/${education.id}`);

      setUser((prev) => ({
        ...prev,
        educations: (prev?.educations || []).filter(
          (item) => item.id !== education.id
        ),
      }));

      setShowDeleteModal(false);
      showToast("Education deleted successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to delete education.";

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

      <div style={styles.title}>Edit education</div>
      <div style={styles.helper}>* Indicates required fields</div>

      <div style={styles.field}>
        <label style={styles.label}>School*</label>
        <input
          style={{ ...styles.input, ...(errors.school ? styles.inputError : null) }}
          value={school}
          onChange={(e) => setSchool(e.target.value)}
        />
        {errors.school && <div style={styles.errorText}>{errors.school}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Degree*</label>
        <input
          style={{ ...styles.input, ...(errors.degree ? styles.inputError : null) }}
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
        />
        {errors.degree && <div style={styles.errorText}>{errors.degree}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Field of study*</label>
        <input
          style={{ ...styles.input, ...(errors.field ? styles.inputError : null) }}
          value={field}
          onChange={(e) => setField(e.target.value)}
        />
        {errors.field && <div style={styles.errorText}>{errors.field}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Start date*</label>

        <div style={styles.grid2}>
          <div>
            <div style={styles.subLabel}>Month*</div>
            <select
              style={{ ...styles.select, ...(errors.startMonth ? styles.inputError : null) }}
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {errors.startMonth && (
              <div style={styles.errorText}>{errors.startMonth}</div>
            )}
          </div>

          <div>
            <div style={styles.subLabel}>Year*</div>
            <select
              style={{ ...styles.select, ...(errors.startYear ? styles.inputError : null) }}
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            {errors.startYear && (
              <div style={styles.errorText}>{errors.startYear}</div>
            )}
          </div>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>End date*</label>

        <div style={styles.grid2}>
          <div>
            <div style={styles.subLabel}>Month*</div>
            <select
              style={{ ...styles.select, ...(errors.endMonth ? styles.inputError : null) }}
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {errors.endMonth && (
              <div style={styles.errorText}>{errors.endMonth}</div>
            )}
          </div>

          <div>
            <div style={styles.subLabel}>Year*</div>
            <select
              style={{ ...styles.select, ...(errors.endYear ? styles.inputError : null) }}
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            {errors.endYear && (
              <div style={styles.errorText}>{errors.endYear}</div>
            )}
          </div>
        </div>

        {errors.endDate && <div style={styles.errorText}>{errors.endDate}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          style={styles.textarea}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.deleteBtn}
          onClick={() => setShowDeleteModal(true)}
          disabled={isLoading || isDeleteLoading}
        >
          Delete
        </button>

        <div style={styles.rightActions}>
          <button
            type="button"
            style={styles.cancelBtn}
            onClick={onClose}
            disabled={isLoading || isDeleteLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            style={{ ...styles.saveBtn, ...(isLoading ? styles.disabledBtn : null) }}
            onClick={handleUpdate}
            disabled={isLoading || isDeleteLoading}
          >
            {isLoading ? "Updating..." : "Update"}
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div
          style={styles.confirmOverlay}
          onClick={() => setShowDeleteModal(false)}
        >
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmTitle}>Delete education?</div>
            <div style={styles.confirmText}>
              Are you sure you want to delete this education entry? This action
              cannot be undone.
            </div>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleteLoading}
              >
                Cancel
              </button>

              <button
                style={styles.confirmDeleteBtn}
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
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  toastCenter: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10000,
  },

  emptyText: {
    fontSize: 14,
    color: "#666",
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "#191919",
  },

  helper: {
    fontSize: 13,
    color: "rgba(0,0,0,0.6)",
    marginTop: -6,
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: "#191919",
  },

  subLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "rgba(0,0,0,0.7)",
    marginBottom: 6,
  },

  input: {
    height: 44,
    borderRadius: 10,
    border: "1px solid #cfd8dc",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },

  select: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid #cfd8dc",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "#fff",
  },

  textarea: {
    borderRadius: 10,
    border: "1px solid #cfd8dc",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    minHeight: 110,
    background: "#fff",
    fontFamily: "inherit",
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  actions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },

  rightActions: {
    display: "flex",
    gap: 12,
  },

  cancelBtn: {
    border: "1px solid #cfd8dc",
    background: "#fff",
    color: "#191919",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  saveBtn: {
    border: "none",
    background: "#0a66c2",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  deleteBtn: {
    border: "1px solid #d32f2f",
    background: "#fff",
    color: "#d32f2f",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  confirmDeleteBtn: {
    border: "none",
    background: "#d32f2f",
    color: "#fff",
    borderRadius: 999,
    padding: "10px 18px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  disabledBtn: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  inputError: {
    border: "1px solid #d32f2f",
  },

  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginTop: -2,
  },

  confirmOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10000,
    padding: 16,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#191919",
    marginBottom: 10,
  },

  confirmText: {
    fontSize: 14,
    color: "rgba(0,0,0,0.7)",
    lineHeight: "22px",
    marginBottom: 18,
  },

  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
};