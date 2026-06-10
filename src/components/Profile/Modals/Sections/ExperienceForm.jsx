import { useEffect, useMemo, useState } from "react";
import api from "../../../../services/api";
import Toast from "../../../UI/Toast";

export default function ExperienceForm({ user, setUser, onClose }) {
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

  const [title, setTitle] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const [startMonth, setStartMonth] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [endYear, setEndYear] = useState("");

  const [location, setLocation] = useState("");
  const [locationType, setLocationType] = useState("");
  const [description, setDescription] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    setTitle("");
    setEmploymentType("");
    setCompanyName("");
    setIsCurrent(false);
    setStartMonth("");
    setStartYear("");
    setEndMonth("");
    setEndYear("");
    setLocation("");
    setLocationType("");
    setDescription("");
    setErrors({});
  };

  const handleCurrentChange = () => {
    const nextValue = !isCurrent;
    setIsCurrent(nextValue);

    if (nextValue) {
      setEndMonth("");
      setEndYear("");
      setErrors((prev) => ({
        ...prev,
        endMonth: "",
        endYear: "",
        endDate: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const trimmedTitle = title.trim();
    const trimmedCompanyName = companyName.trim();

    if (!trimmedTitle) {
      newErrors.title = "Title cannot be empty.";
    }

    if (!employmentType) {
      newErrors.employmentType = "Please select an employment type.";
    }

    if (!trimmedCompanyName) {
      newErrors.companyName = "Company name cannot be empty.";
    }

    if (!startMonth) {
      newErrors.startMonth = "Start month is required.";
    }

    if (!startYear) {
      newErrors.startYear = "Start year is required.";
    }

    if (!locationType) {
      newErrors.locationType = "Please select a location type.";
    }

    if (!isCurrent && !endMonth) {
      newErrors.endMonth = "End month is required.";
    }

    if (!isCurrent && !endYear) {
      newErrors.endYear = "End year is required.";
    }

    if (startMonth && startYear && !isCurrent && endMonth && endYear) {
      const startDateValue = Number(startYear) * 100 + Number(startMonth);
      const endDateValue = Number(endYear) * 100 + Number(endMonth);

      if (endDateValue < startDateValue) {
        newErrors.endDate = "End date cannot be earlier than start date.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
  if (isLoading) return;

  if (!validateForm()) {
    showToast("Please fill in the required fields.", "error");
    return;
  }

  const payload = {
    title: title.trim(),
    employmentType: employmentType || null,
    companyName: companyName.trim(),
    isCurrent,
    startMonth: startMonth ? Number(startMonth) : null,
    startYear: startYear ? Number(startYear) : null,
    endMonth: isCurrent ? null : endMonth ? Number(endMonth) : null,
    endYear: isCurrent ? null : endYear ? Number(endYear) : null,
    location: location.trim() ? location.trim() : null,
    locationType: locationType || null,
    description: description.trim() ? description.trim() : null,
  };

  try {
    setIsLoading(true);

    const response = await api.post("/user/experience", payload);
    const result = response.data;
    const createdExperience = result?.data;

    if (createdExperience) {
      setUser((prev) => ({
        ...prev,
        experiences: [...(prev?.experiences || []), createdExperience],
      }));
    } else {
      setUser((prev) => ({
        ...prev,
        experiences: [
          ...(prev?.experiences || []),
          {
            id: Date.now(),
            title: payload.title,
            employmentType: payload.employmentType,
            companyName: payload.companyName,
            isCurrent: payload.isCurrent,
            startMonth: payload.startMonth,
            startYear: payload.startYear,
            endMonth: payload.endMonth,
            endYear: payload.endYear,
            location: payload.location,
            locationType: payload.locationType,
            description: payload.description,
          },
        ],
      }));
    }

    showToast("Experience added successfully.", "success");
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
      "Failed to add experience.";

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

      <div style={styles.title}>Add experience</div>

      <div style={styles.field}>
        <label style={styles.label}>Title*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.title ? styles.inputError : {}),
          }}
          placeholder="Example: Backend Developer"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) {
              setErrors((prev) => ({ ...prev, title: "" }));
            }
          }}
        />
        {errors.title && <div style={styles.errorText}>{errors.title}</div>}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Employment type*</label>
        <select
          style={{
            ...styles.select,
            ...(errors.employmentType ? styles.inputError : {}),
          }}
          value={employmentType}
          onChange={(e) => {
            setEmploymentType(e.target.value);
            if (errors.employmentType) {
              setErrors((prev) => ({ ...prev, employmentType: "" }));
            }
          }}
        >
          <option value="">Please select</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
          <option value="Self-employed">Self-employed</option>
          <option value="Freelance">Freelance</option>
          <option value="Contract">Contract</option>
          <option value="Internship">Internship</option>
          <option value="Apprenticeship">Apprenticeship</option>
          <option value="Seasonal">Seasonal</option>
        </select>
        {errors.employmentType && (
          <div style={styles.errorText}>{errors.employmentType}</div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Company or organization*</label>
        <input
          style={{
            ...styles.input,
            ...(errors.companyName ? styles.inputError : {}),
          }}
          placeholder="Example: Microsoft"
          value={companyName}
          onChange={(e) => {
            setCompanyName(e.target.value);
            if (errors.companyName) {
              setErrors((prev) => ({ ...prev, companyName: "" }));
            }
          }}
        />
        {errors.companyName && (
          <div style={styles.errorText}>{errors.companyName}</div>
        )}
      </div>

      <div style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={isCurrent}
          onChange={handleCurrentChange}
          style={styles.checkbox}
        />
        <span>I am currently working in this role</span>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Start date*</label>
        <div style={styles.row}>
          <div style={styles.col}>
            <select
              style={{
                ...styles.select,
                ...(errors.startMonth ? styles.inputError : {}),
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

          <div style={styles.col}>
            <select
              style={{
                ...styles.select,
                ...(errors.startYear ? styles.inputError : {}),
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

      {!isCurrent && (
        <div style={styles.field}>
          <label style={styles.label}>End date*</label>
          <div style={styles.row}>
            <div style={styles.col}>
              <select
                style={{
                  ...styles.select,
                  ...(errors.endMonth ? styles.inputError : {}),
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

            <div style={styles.col}>
              <select
                style={{
                  ...styles.select,
                  ...(errors.endYear ? styles.inputError : {}),
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
          {errors.endDate && (
            <div style={styles.errorText}>{errors.endDate}</div>
          )}
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label}>Location</label>
        <input
          style={styles.input}
          placeholder="Example: Baku, Azerbaijan"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Location type*</label>
        <select
          style={{
            ...styles.select,
            ...(errors.locationType ? styles.inputError : {}),
          }}
          value={locationType}
          onChange={(e) => {
            setLocationType(e.target.value);
            if (errors.locationType) {
              setErrors((prev) => ({ ...prev, locationType: "" }));
            }
          }}
        >
          <option value="">Please select</option>
          <option value="On-site">On-site</option>
          <option value="Hybrid">Hybrid</option>
          <option value="Remote">Remote</option>
        </select>
        {errors.locationType && (
          <div style={styles.errorText}>{errors.locationType}</div>
        )}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Description</label>
        <textarea
          style={styles.textarea}
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your work, achievements, or technologies used"
        />
        <div style={styles.counter}>{description.length}/2000</div>
      </div>

      <div style={styles.actions}>
        <button
          style={{
            ...styles.saveBtn,
            ...(isLoading ? styles.saveBtnDisabled : {}),
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
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif',
  },

  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 20,
    color: "#191919",
  },

  field: {
    marginBottom: 18,
  },

  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 600,
    color: "#444",
  },

  input: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fff",
  },

  select: {
    width: "100%",
    height: 44,
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    padding: "0 12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    backgroundColor: "#fff",
  },

  textarea: {
    width: "100%",
    minHeight: 120,
    borderRadius: 8,
    border: "1px solid #d0d0d0",
    padding: "12px",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    resize: "vertical",
    backgroundColor: "#fff",
  },

  row: {
    display: "flex",
    gap: 12,
  },

  col: {
    flex: 1,
    minWidth: 0,
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    fontSize: 14,
    color: "#333",
  },

  checkbox: {
    width: 18,
    height: 18,
    cursor: "pointer",
  },

  counter: {
    marginTop: 6,
    textAlign: "right",
    fontSize: 12,
    color: "#777",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 24,
  },

  saveBtn: {
    border: "none",
    borderRadius: 22,
    padding: "10px 18px",
    backgroundColor: "#0a66c2",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },

  saveBtnDisabled: {
    opacity: 0.7,
    cursor: "not-allowed",
  },

  inputError: {
    border: "1px solid #dc2626",
  },

  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 1.4,
  },
};