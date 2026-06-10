import React, { useEffect, useMemo, useState } from "react";
import api from "../../../../services/api";
import Toast from "../../../UI/Toast";
import pencil from "../../../../assets/pencil.png";

export default function SkillsForm({
  user,
  setUser,
  onClose,
  onEditSkill,
}) {
  const [skillInput, setSkillInput] = useState("");
  const [pendingSkills, setPendingSkills] = useState([]);
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

  const existingSkillNames = useMemo(() => {
    return (user?.skills || [])
      .map((skill) => {
        if (typeof skill === "string") return skill.trim().toLowerCase();
        if (skill && typeof skill === "object") {
          return (skill.name || "").trim().toLowerCase();
        }
        return "";
      })
      .filter(Boolean);
  }, [user?.skills]);

  const normalizeInputToSkills = (value) => {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const getUniqueSkillsFromInput = (value, currentPendingSkills = pendingSkills) => {
    const parsedSkills = normalizeInputToSkills(value);
    const pendingLower = currentPendingSkills.map((x) => x.toLowerCase());
    const seen = new Set();

    return parsedSkills.filter((item) => {
      const lower = item.toLowerCase();

      if (!lower) return false;
      if (existingSkillNames.includes(lower)) return false;
      if (pendingLower.includes(lower)) return false;
      if (seen.has(lower)) return false;

      seen.add(lower);
      return true;
    });
  };

  const addTypedSkillsToPending = () => {
    const uniqueNewSkills = getUniqueSkillsFromInput(skillInput);

    if (normalizeInputToSkills(skillInput).length === 0) {
      setErrors({ skill: "Skill is required." });
      showToast("Please enter at least one skill.", "error");
      return false;
    }

    if (uniqueNewSkills.length === 0) {
      setErrors({ skill: "This skill already exists." });
      showToast("This skill already exists.", "error");
      return false;
    }

    setPendingSkills((prev) => [...prev, ...uniqueNewSkills]);
    setSkillInput("");
    setErrors({});
    return true;
  };

  const removePendingSkill = (name) => {
    setPendingSkills((prev) => prev.filter((item) => item !== name));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTypedSkillsToPending();
    }
  };

  const handleSave = async () => {
    if (isLoading) return;

    const typedSkills = getUniqueSkillsFromInput(skillInput, pendingSkills);
    const finalSkills = [...pendingSkills, ...typedSkills];

    if (finalSkills.length === 0) {
      setErrors({ skill: "Skill is required." });
      showToast("Please enter at least one skill.", "error");
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        skills: finalSkills.map((name) => ({ name })),
      };

      const response = await api.post("/User/skills", payload);

      const createdSkills = response?.data?.data || [];

      if (createdSkills.length > 0) {
        setUser((prev) => ({
          ...prev,
          skills: [...(prev?.skills || []), ...createdSkills],
        }));
      }

      setPendingSkills([]);
      setSkillInput("");
      setErrors({});
      showToast("Skills added successfully.", "success");

      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 700);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        "Failed to add skills.";

      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const normalizedCurrentSkills = Array.isArray(user?.skills)
    ? user.skills.filter(Boolean)
    : [];

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

      <div style={styles.title}>Add skills</div>
      <div style={styles.helper}>* Indicates required fields</div>

      <div style={styles.field}>
        <label style={styles.label}>Skill*</label>

        <input
          style={{
            ...styles.input,
            ...(errors.skill ? styles.inputError : null),
          }}
          placeholder="Example: React, ASP.NET Core, SQL"
          value={skillInput}
          onChange={(e) => {
            setSkillInput(e.target.value);
            if (errors.skill) {
              setErrors((prev) => ({ ...prev, skill: "" }));
            }
          }}
          onKeyDown={handleInputKeyDown}
        />

        {errors.skill && <div style={styles.errorText}>{errors.skill}</div>}

        <div style={styles.inputHelper}>
          You can add multiple skills by separating them with commas.
        </div>
      </div>

      <div style={styles.addRow}>
        <button
          type="button"
          style={styles.secondaryBtn}
          onClick={addTypedSkillsToPending}
        >
          Add to list
        </button>
      </div>

      {pendingSkills.length > 0 && (
        <div style={styles.block}>
          <div style={styles.blockTitle}>New skills to add</div>

          <div style={styles.skillsWrap}>
            {pendingSkills.map((skill) => (
              <div key={skill} style={styles.skillBadge}>
                <span>{skill}</span>
                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removePendingSkill(skill)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.block}>
        <div style={styles.blockTitle}>Current skills</div>

        {normalizedCurrentSkills.length === 0 ? (
          <div style={styles.emptyText}>No skills added yet.</div>
        ) : (
          <div style={styles.currentList}>
            {normalizedCurrentSkills.map((skill, index) => {
              const skillName =
                typeof skill === "string" ? skill : skill?.name || "";

              return (
                <div key={`${skillName}-${index}`} style={styles.currentItem}>
                  <div style={styles.currentItemText}>{skillName}</div>

                <button
                      type="button"
                      style={styles.iconBtn}
                      onClick={() => onEditSkill?.(skill)}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      <img src={pencil} alt="edit" style={styles.iconImg} />
                </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={styles.actions}>
        <button
          style={{
            ...styles.saveBtn,
            ...(isLoading ? styles.saveBtnDisabled : null),
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
  },

  toastCenter: {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10001,
  },

  title: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
  },

  helper: {
    fontSize: 12,
    color: "#777",
    marginBottom: 20,
  },

  field: {
    marginBottom: 14,
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

  inputHelper: {
    marginTop: 8,
    fontSize: 12,
    color: "#666",
  },

  addRow: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 20,
  },

  secondaryBtn: {
    background: "#fff",
    color: "#0a66c2",
    border: "1px solid #0a66c2",
    borderRadius: 20,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  block: {
    marginTop: 10,
    marginBottom: 18,
  },

  blockTitle: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 10,
    color: "#1d2226",
  },

  skillsWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },

  skillBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#eef3f8",
    color: "#1d2226",
    padding: "8px 12px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
  },

  removeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#666",
    padding: 0,
    lineHeight: 1,
  },

  currentList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  currentItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    border: "1px solid #e0e0e0",
    borderRadius: 10,
    padding: "10px 12px",
    backgroundColor: "#fff",
  },

  currentItemText: {
    fontSize: 14,
    color: "#1d2226",
    fontWeight: 500,
  },

  editBtn: {
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14,
  },

  emptyText: {
    color: "#666",
    fontSize: 14,
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 22,
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

iconBtn: {
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 6,
  borderRadius: 50,
},

iconImg: {
  width: 16,
  height: 16,
  objectFit: "contain",
},
  
};