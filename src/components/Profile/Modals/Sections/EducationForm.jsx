import React, { useEffect, useMemo, useState } from "react";
import api from "../../../../services/api";
import Toast from "../../../UI/Toast";

export default function EducationForm({ user, setUser, onClose }) {
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

  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [field, setField] = useState("");
  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

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

  const resetForm = () => {
    setSchool("");
    setDegree("");
    setField("");
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
    setDescription("");
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!school.trim()) {
      newErrors.school = "School is required.";
    }

    if (!degree.trim()) {
      newErrors.degree = "Degree is required.";
    }

    if (!field.trim()) {
      newErrors.field = "Field of study is required.";
    }

    if (!startMonth) {
      newErrors.startMonth = "Start month is required.";
    }

    if (!startYear) {
      newErrors.startYear = "Start year is required.";
    }

    if (!endMonth) {
      newErrors.endMonth = "End month is required.";
    }

    if (!endYear) {
      newErrors.endYear = "End year is required.";
    }

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

  const handleSave = async () => {
    if (isLoading) return;

    if (!validateForm()) {
      showToast("Please fill in the required fields correctly.", "error");
      return;
    }

    const payload = {
      school: school.trim(),
      degree: degree.trim(),
      field: field.trim(),
      startMonth: startMonth ? Number(startMonth) : null,
      startYear: startYear ? Number(startYear) : null,
      endMonth: endMonth ? Number(endMonth) : null,
      endYear: endYear ? Number(endYear) : null,
      note: description.trim() ? description.trim() : null,
    };

    try {
      setIsLoading(true);

      const response = await api.post("/User/education", payload);
      const createdEducation = response?.data?.data;

      if (createdEducation) {
        setUser((prev) => ({
          ...prev,
          educations: [...(prev?.educations || []), createdEducation],
        }));
      }

      showToast("Education added successfully.", "success");
      resetForm();

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to add education.";

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
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

      <div style={styles.title}>Add education</div>
      <div style={styles.helper}>* Indicates required fields</div>

      <div style={styles.field}>
        <label style={styles.label}>School*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.school ? styles.inputError : null),
          }}
          placeholder="Example: Harvard University"
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            if (errors.school) {
              setErrors((prev) => ({ ...prev, school: "" }));
            }
          }}
        />
        {errors.school && <div style={styles.errorText}>{errors.school}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Degree*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.degree ? styles.inputError : null),
          }}
          placeholder="Example: Bachelor's degree"
          value={degree}
          onChange={(e) => {
            setDegree(e.target.value);
            if (errors.degree) {
              setErrors((prev) => ({ ...prev, degree: "" }));
            }
          }}
        />
        {errors.degree && <div style={styles.errorText}>{errors.degree}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Field of study*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.field ? styles.inputError : null),
          }}
          placeholder="Example: Computer Science"
          value={field}
          onChange={(e) => {
            setField(e.target.value);
            if (errors.field) {
              setErrors((prev) => ({ ...prev, field: "" }));
            }
          }}
        />
        {errors.field && <div style={styles.errorText}>{errors.field}</div>}
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
              onChange={(e) => {
                setStartMonth(e.target.value);
                if (errors.startMonth) {
                  setErrors((prev) => ({ ...prev, startMonth: "" }));
                }
                if (errors.endDate) {
                  setErrors((prev) => ({ ...prev, endDate: "" }));
                }
              }}
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
              onChange={(e) => {
                setStartYear(e.target.value);
                if (errors.startYear) {
                  setErrors((prev) => ({ ...prev, startYear: "" }));
                }
                if (errors.endDate) {
                  setErrors((prev) => ({ ...prev, endDate: "" }));
                }
              }}
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
              style={{
                ...styles.select,
                ...(errors.endMonth ? styles.inputError : null),
              }}
              value={endMonth}
              onChange={(e) => {
                setEndMonth(e.target.value);
                if (errors.endMonth) {
                  setErrors((prev) => ({ ...prev, endMonth: "" }));
                }
                if (errors.endDate) {
                  setErrors((prev) => ({ ...prev, endDate: "" }));
                }
              }}
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
              onChange={(e) => {
                setEndYear(e.target.value);
                if (errors.endYear) {
                  setErrors((prev) => ({ ...prev, endYear: "" }));
                }
                if (errors.endDate) {
                  setErrors((prev) => ({ ...prev, endDate: "" }));
                }
              }}
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
          placeholder="Write a short description about your education."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      <div style={styles.actions}>
        <button
          type="button"
          style={styles.cancelBtn}
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </button>

        <button
          type="button"
          style={{
            ...styles.saveBtn,
            ...(isLoading ? styles.disabledBtn : null),
          }}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
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
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 8,
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
};