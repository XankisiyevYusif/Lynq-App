import React, { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import Toast from "../../UI/Toast";
import ProfileLookupInput from "../../UI/ProfileLookupInput";
import OrganizationLookupInput from "../../UI/OrganizationLookupInput";

export default function EditExperienceForm({ experience, setUser, onClose }) {
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
    [],
  );

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const arr = [{ value: "", label: "Year" }];

    for (let y = now; y >= now - 70; y--) {
      arr.push({ value: String(y), label: String(y) });
    }

    return arr;
  }, []);

  const employmentTypes = [
    "Full-Time",
    "Part-Time",
    "Contract",
    "Internship",
    "Freelance",
    "Temporary",
    "Self-Employed",
    "Apprenticeship",
    "Seasonal",
  ];

  const locationTypes = ["On-site", "Hybrid", "Remote"];

  const [title, setTitle] = useState(experience?.title || "");
  const [employmentType, setEmploymentType] = useState(
    experience?.employmentType || "",
  );
  const [companyName, setCompanyName] = useState(experience?.companyName || "");
  const [companyId, setCompanyId] = useState(experience?.companyId || null);
  const [isCurrent, setIsCurrent] = useState(experience?.isCurrent || false);
  const [startMonth, setStartMonth] = useState(
    experience?.startMonth ? String(experience.startMonth) : "",
  );
  const [startYear, setStartYear] = useState(
    experience?.startYear ? String(experience.startYear) : "",
  );
  const [endMonth, setEndMonth] = useState(
    experience?.endMonth ? String(experience.endMonth) : "",
  );
  const [endYear, setEndYear] = useState(
    experience?.endYear ? String(experience.endYear) : "",
  );
  const [location, setLocation] = useState(experience?.location || "");
  const [locationType, setLocationType] = useState(
    experience?.locationType || "",
  );
  const [description, setDescription] = useState(experience?.description || "");

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

  useEffect(() => {
    if (isCurrent) {
      setEndMonth("");
      setEndYear("");
    }
  }, [isCurrent]);

  if (!experience) {
    return <div style={styles.emptyText}>Experience not found.</div>;
  }

  const validateForm = () => {
    const newErrors = {};

    if (!title.trim()) {
      newErrors.title = "Title is required.";
    }

    if (!companyName.trim()) {
      newErrors.companyName = "Company name is required.";
    }

    if (!startMonth) {
      newErrors.startMonth = "Start month is required.";
    }

    if (!startYear) {
      newErrors.startYear = "Start year is required.";
    }

    if (!isCurrent) {
      if (!endMonth) {
        newErrors.endMonth = "End month is required.";
      }

      if (!endYear) {
        newErrors.endYear = "End year is required.";
      }
    }

    if (startMonth && startYear && !isCurrent && endMonth && endYear) {
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
      title: title.trim(),
      employmentType: employmentType || null,
      companyName: companyName.trim(),
      companyId,
      isCurrent,
      startMonth: Number(startMonth),
      startYear: Number(startYear),
      endMonth: isCurrent ? null : Number(endMonth),
      endYear: isCurrent ? null : Number(endYear),
      location: location.trim() ? location.trim() : null,
      locationType: locationType || null,
      description: description.trim() ? description.trim() : null,
    };

    try {
      setIsLoading(true);

      const response = await api.put(
        `/User/experience/${experience.id}`,
        payload,
      );

      const updatedExperience = response?.data?.data;

      if (updatedExperience) {
        setUser((prev) => ({
          ...prev,
          experiences: (prev?.experiences || []).map((item) =>
            item.id === experience.id ? updatedExperience : item,
          ),
        }));
      }

      showToast("Experience updated successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to update experience.";

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleteLoading) return;

    try {
      setIsDeleteLoading(true);

      await api.delete(`/User/experience/${experience.id}`);

      setUser((prev) => ({
        ...prev,
        experiences: (prev?.experiences || []).filter(
          (item) => item.id !== experience.id,
        ),
      }));

      setShowDeleteModal(false);
      showToast("Experience deleted successfully.", "success");

      setTimeout(() => {
        onClose?.();
      }, 700);
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to delete experience.";

      setShowDeleteModal(false);
      showToast(errorMessage, "error");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <div style={styles.root}>
      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={closeToast}
        />
      )}

      <div style={styles.title}>Edit experience</div>
      <div style={styles.helper}>* Indicates required fields</div>

      <div style={styles.field}>
        <label style={styles.label}>Title*</label>
        <ProfileLookupInput
          type="Position"
          inputStyle={{
            ...styles.input,
            ...(errors.title ? styles.inputError : null),
          }}
          placeholder="Example: Backend Developer"
          value={title}
          onChange={setTitle}
        />
        {errors.title && <div style={styles.errorText}>{errors.title}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Employment type</label>
        <select
          style={styles.select}
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
        >
          <option value="">Select employment type</option>
          {employmentTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Company name*</label>
        <OrganizationLookupInput
          inputStyle={styles.input}
          errorStyle={errors.companyName ? styles.inputError : null}
          placeholder="Example: Google"
          value={companyName}
          onChange={setCompanyName}
          onSelect={(organization) => setCompanyId(organization?.id || null)}
        />
        {errors.companyName && (
          <div style={styles.errorText}>{errors.companyName}</div>
        )}
      </div>

      <div style={styles.checkboxRow}>
        <input
          id="current-role"
          type="checkbox"
          checked={isCurrent}
          onChange={(e) => setIsCurrent(e.target.checked)}
          style={styles.checkbox}
        />
        <label htmlFor="current-role" style={styles.checkboxLabel}>
          I am currently working in this role
        </label>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Start date*</label>

        <div style={styles.grid2}>
          <div>
            <div style={styles.subLabel}>Month*</div>
            <select
              style={{
                ...styles.select,
                ...(errors.startMonth ? styles.inputError : null),
              }}
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
              style={{
                ...styles.select,
                ...(errors.startYear ? styles.inputError : null),
              }}
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

      {!isCurrent && (
        <div style={styles.field}>
          <label style={styles.label}>End date*</label>

          <div style={styles.grid2}>
            <div>
              <div style={styles.subLabel}>Month*</div>
              <select
                style={{
                  ...styles.select,
                  ...(errors.endMonth ? styles.inputError : null),
                }}
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
                style={{
                  ...styles.select,
                  ...(errors.endYear ? styles.inputError : null),
                }}
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

          {errors.endDate && (
            <div style={styles.errorText}>{errors.endDate}</div>
          )}
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label}>Location</label>
        <ProfileLookupInput
          type="Location"
          inputStyle={styles.input}
          placeholder="Example: Baku, Azerbaijan"
          value={location}
          onChange={setLocation}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Location type</label>
        <select
          style={styles.select}
          value={locationType}
          onChange={(e) => setLocationType(e.target.value)}
        >
          <option value="">Select location type</option>
          {locationTypes.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          style={styles.textarea}
          rows={5}
          placeholder="Tell more about your role."
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
            style={{
              ...styles.saveBtn,
              ...(isLoading ? styles.disabledBtn : null),
            }}
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
            <div style={styles.confirmTitle}>Delete experience?</div>
            <div style={styles.confirmText}>
              Are you sure you want to delete this experience entry? This action
              cannot be undone.
            </div>

            <div style={styles.confirmActions}>
              <button
                type="button"
                style={styles.cancelBtn}
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleteLoading}
              >
                Cancel
              </button>

              <button
                type="button"
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

  emptyText: {
    fontSize: 14,
    color: "var(--app-muted)",
  },

  title: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--app-text)",
  },

  helper: {
    fontSize: 13,
    color: "var(--app-muted)",
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
    color: "var(--app-text)",
  },

  subLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--app-text-soft)",
    marginBottom: 6,
  },

  input: {
    height: 44,
    borderRadius: 10,
    border: "1px solid var(--app-border)",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "var(--app-surface)",
  },

  select: {
    width: "100%",
    height: 44,
    borderRadius: 10,
    border: "1px solid var(--app-border)",
    padding: "0 14px",
    fontSize: 14,
    outline: "none",
    background: "var(--app-surface)",
  },

  textarea: {
    borderRadius: 10,
    border: "1px solid var(--app-border)",
    padding: "12px 14px",
    fontSize: 14,
    outline: "none",
    resize: "vertical",
    minHeight: 120,
    background: "var(--app-surface)",
    fontFamily: "inherit",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: -4,
  },

  checkbox: {
    width: 16,
    height: 16,
    cursor: "pointer",
  },

  checkboxLabel: {
    fontSize: 14,
    color: "var(--app-text)",
    cursor: "pointer",
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
    border: "1px solid var(--app-border)",
    background: "var(--app-surface)",
    color: "var(--app-text)",
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
    background: "var(--app-surface)",
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
    background: "var(--app-surface)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--app-text)",
    marginBottom: 10,
  },

  confirmText: {
    fontSize: 14,
    color: "var(--app-text-soft)",
    lineHeight: "22px",
    marginBottom: 18,
  },

  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
  },
};
