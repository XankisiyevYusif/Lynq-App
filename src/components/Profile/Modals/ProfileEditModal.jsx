import React, { useEffect } from "react";
import EducationForm from "./Sections/EducationForm";
import EditEducationForm from "./EditEducationForm";
import BasicInfoForm from "./Sections/BasicInfoForm";
import AboutForm from "./Sections/AboutForm";
import ContactInfoForm from "./Sections/ContactForm";
import ExperienceForm from "./Sections/ExperienceForm";
import EditExperienceForm from "./EditExperienceForm";
import SkillsForm from "./Sections/SkillsForm";
import EditSkillForm from "./EditSkillForm";

export default function ProfileEditModal({
  isOpen,
  onClose,
  activeSection,
  onChangeSection,
  user,
  setUser,
  selectedExperience,
  selectedEducation,
  selectedSkill,
  onEditSkill,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { key: "basic", label: "Basic information" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact information" },
    { key: "experience", label: "Experience" },
    { key: "education", label: "Education" },
    { key: "skills", label: "Skills" },
  ];

  const goToSkills = () => {
    onChangeSection?.("skills");
  };

  return (
    <div className="profile-edit-backdrop" style={s.overlay} onMouseDown={onClose}>
      <div className="profile-edit-shell" style={s.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div className="profile-edit-header" style={s.header}>
          <div style={s.title}>
            {activeSection === "experience-edit"
              ? "Edit experience"
              : activeSection === "education-edit"
                ? "Edit education"
                : activeSection === "skill-edit"
                  ? "Edit skill"
                  : "Edit profile"}
          </div>

          <button style={s.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div style={s.content}>
          <div className="profile-edit-sidebar" style={s.left}>
            {items.map((item) => (
              <button
                key={item.key}
                className={`profile-edit-nav-item ${
                  activeSection === item.key ? "is-active" : ""
                }`}
                onClick={() => onChangeSection?.(item.key)}
                style={{
                  ...s.menuItem,
                  ...(activeSection === item.key ? s.menuActive : null),
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="profile-edit-content" style={s.right}>
            {activeSection === "basic" && (
              <BasicInfoForm user={user} setUser={setUser} />
            )}

            {activeSection === "about" && (
              <AboutForm user={user} setUser={setUser} onClose={onClose} />
            )}

            {activeSection === "contact" && (
              <ContactInfoForm user={user} setUser={setUser} />
            )}

            {activeSection === "experience" && (
              <ExperienceForm user={user} setUser={setUser} onClose={onClose} />
            )}

            {activeSection === "experience-edit" && (
              <EditExperienceForm
                experience={selectedExperience}
                setUser={setUser}
                onClose={onClose}
              />
            )}

            {activeSection === "education" && (
              <EducationForm user={user} setUser={setUser} onClose={onClose} />
            )}

            {activeSection === "education-edit" && (
              <EditEducationForm
                education={selectedEducation}
                setUser={setUser}
                onClose={onClose}
              />
            )}

            {activeSection === "skills" && (
              <SkillsForm
                user={user}
                setUser={setUser}
                onClose={onClose}
                onEditSkill={onEditSkill}
              />
            )}

            {activeSection === "skill-edit" && (
              <EditSkillForm
                skill={selectedSkill}
                setUser={setUser}
                onClose={goToSkills}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "100%",
    maxWidth: 900,
    background: "var(--app-surface)",
    borderRadius: 14,
    boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
    overflow: "hidden",
    maxHeight: "90vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid var(--app-border)",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "var(--app-text)",
  },
  closeBtn: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: 18,
    padding: 6,
    borderRadius: 10,
    color: "var(--app-text)",
  },
  content: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    minHeight: 420,
  },
  left: {
    borderRight: "1px solid var(--app-border)",
    padding: 12,
    background: "var(--app-surface-2)",
  },
  menuItem: {
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    fontSize: 13,
    marginBottom: 8,
    color: "var(--app-text-soft)",
  },
  menuActive: {
    background: "rgba(0,115,177,0.08)",
    border: "1px solid rgba(0,115,177,0.25)",
    fontWeight: 700,
    color: "#006097",
  },
  right: {
    padding: 16,
    maxHeight: "calc(85vh - 56px)",
    overflowY: "auto",
    color: "var(--app-text)",
  },
};
