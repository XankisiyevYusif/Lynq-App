import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../Layout/Navbar";
import ProfileCard from "../ProfileCard";
import AboutCard from "../Sections/AboutCard";
import ExperienceCard from "../Sections/ExperienceCard";
import EducationCard from "../Sections/EducationCard";
import SkillsCard from "../Sections/SkillsCard";
import ProfileEditModal from "../Modals/ProfileEditModal";
import Toast from "../../UI/Toast";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import ActivitiesCarousel from "../Sections/ActivitiesCarousel";
import InterestsSection from "../Sections/InterestsSection";
import ProfileRecommendations from "../ProfileRecommendations";
import ProfileAnalyticsCard from "../ProfileAnalyticsCard";
import OpenToWorkCard from "../OpenToWorkCard";
import ProfileEventsSection from "../../Events/ProfileEventsSection";
import "../ProfilePolish.css";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../../store/userSlice";

const ProfileView = ({ user, setUser, isOwner, readOnly, likeConnection }) => {
  const dispatch = useDispatch();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const navigate = useNavigate();

  const [imageMenu, setImageMenu] = useState({
    open: false,
    type: null,
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // profile | background
  });

  const [imageOperation, setImageOperation] = useState(null);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const menuRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

  useEffect(() => {
    if (isOwner) return;
    const username =
      user?.basicInfo?.username || user?.username || user?.userName;
    if (!username) return;

    api.post("/Analytics/track/profile-view", { username }).catch((error) => {
      console.error("Profile analytics tracking failed:", error);
    });
  }, [isOwner, user?.basicInfo?.username, user?.username, user?.userName]);

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

  const refreshProfile = async () => {
    const response = await api.get("/User/me");
    const refreshed =
      response?.data?.data ?? response?.data?.Data ?? response?.data;
    if (refreshed) {
      setUser(refreshed);
      dispatch(loginSuccess(refreshed));
    }
    return refreshed;
  };

  const openEdit = (section) => {
    if (readOnly) return;
    setActiveSection(section);
    setIsEditOpen(true);
  };

  const openEditExperience = (experience) => {
    if (readOnly) return;
    setSelectedExperience(experience);
    setActiveSection("experience-edit");
    setIsEditOpen(true);
  };

  const openEditEducation = (education) => {
    if (readOnly) return;
    setSelectedEducation(education);
    setActiveSection("education-edit");
    setIsEditOpen(true);
  };

  const openEditSkill = (skill) => {
    if (readOnly) return;
    setSelectedSkill(skill);
    setActiveSection("skill-edit");
    setIsEditOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditOpen(false);
    setSelectedExperience(null);
    setSelectedEducation(null);
    setSelectedSkill(null);
  };

  const openProfileImageMenu = () => {
    if (readOnly || !isOwner) return;
    setImageMenu({ open: true, type: "profile" });
  };

  const openBackgroundImageMenu = () => {
    if (readOnly || !isOwner) return;
    setImageMenu({ open: true, type: "background" });
  };

  const closeImageMenu = () => {
    setImageMenu({ open: false, type: null });
  };

  const openDeleteConfirm = (type) => {
    closeImageMenu();
    setConfirmModal({
      open: true,
      type,
    });
  };

  const closeDeleteConfirm = () => {
    if (imageOperation?.action === "delete") return;

    setConfirmModal({
      open: false,
      type: null,
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!imageMenu.open) return;
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeImageMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [imageMenu.open]);

  const handleOpenProfileImagePicker = () => {
    profileImageInputRef.current?.click();
    closeImageMenu();
  };

  const handleOpenBackgroundImagePicker = () => {
    backgroundImageInputRef.current?.click();
    closeImageMenu();
  };

  const handleProfileImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isUpdate = !!user?.basicInfo?.profileImage;
    const previousImage = user?.basicInfo?.profileImage || null;
    const previewUrl = URL.createObjectURL(file);

    setImageOperation({ type: "profile", action: "upload" });
    setUser((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        profileImage: previewUrl,
      },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.put("/User/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await refreshProfile();

      showToast(
        isUpdate
          ? "Profile image updated successfully."
          : "Profile image uploaded successfully.",
        "success",
      );
    } catch (error) {
      console.error("Profile image upload error:", error);
      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          profileImage: previousImage,
        },
      }));
      showToast("The profile image action failed.", "error");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setImageOperation(null);
      e.target.value = "";
    }
  };

  const handleBackgroundImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isUpdate = !!user?.basicInfo?.backgroundImage;
    const previousImage = user?.basicInfo?.backgroundImage || null;
    const previewUrl = URL.createObjectURL(file);

    setImageOperation({ type: "background", action: "upload" });
    setUser((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        backgroundImage: previewUrl,
      },
    }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.put("/User/background-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await refreshProfile();

      showToast(
        isUpdate
          ? "Background image updated successfully."
          : "Background image uploaded successfully.",
        "success",
      );
    } catch (error) {
      console.error("Background image upload error:", error);
      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          backgroundImage: previousImage,
        },
      }));
      showToast("The background image action failed.", "error");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setImageOperation(null);
      e.target.value = "";
    }
  };

  const handleDeleteProfileImage = async () => {
    const previousImage = user?.basicInfo?.profileImage || null;

    setImageOperation({ type: "profile", action: "delete" });
    setUser((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        profileImage: null,
      },
    }));
    closeImageMenu();

    try {
      await api.delete("/User/profile-image");
      await refreshProfile();
      showToast("Profile image deleted successfully.", "success");
    } catch (error) {
      console.error("Delete profile image error:", error);
      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          profileImage: previousImage,
        },
      }));
      showToast("Profile image could not be deleted.", "error");
    } finally {
      setImageOperation(null);
      setConfirmModal({ open: false, type: null });
    }
  };

  const handleDeleteBackgroundImage = async () => {
    const previousImage = user?.basicInfo?.backgroundImage || null;

    setImageOperation({ type: "background", action: "delete" });
    setUser((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        backgroundImage: null,
      },
    }));
    closeImageMenu();

    try {
      await api.delete("/User/background-image");
      await refreshProfile();
      showToast("Background image deleted successfully.", "success");
    } catch (error) {
      console.error("Delete background image error:", error);
      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          backgroundImage: previousImage,
        },
      }));
      showToast("Background image could not be deleted.", "error");
    } finally {
      setImageOperation(null);
      setConfirmModal({ open: false, type: null });
    }
  };

  const handleConfirmDelete = () => {
    if (imageOperation) return;

    if (confirmModal.type === "profile") {
      handleDeleteProfileImage();
    } else if (confirmModal.type === "background") {
      handleDeleteBackgroundImage();
    }
  };

  if (!user) {
    return <div style={{ textAlign: "center", marginTop: 50 }}>Loading...</div>;
  }

  return (
    <>
      <Navbar />

      <input
        ref={profileImageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleProfileImageChange}
      />

      <input
        ref={backgroundImageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleBackgroundImageChange}
      />

      <div className="jobseeker-profile-page" style={styles.page}>
        <div className="jobseeker-profile-layout">
          <main
            className="jobseeker-profile-container"
            style={styles.container}
          >
            <ProfileCard
              user={user}
              isOwner={isOwner}
              readOnly={readOnly}
              showToast={showToast}
              onEdit={() => openEdit("basic")}
              onOpenProfileImageMenu={openProfileImageMenu}
              onOpenBackgroundImageMenu={openBackgroundImageMenu}
              imageMenu={imageMenu}
              onUploadProfileImage={handleOpenProfileImagePicker}
              onUploadBackgroundImage={handleOpenBackgroundImagePicker}
              onDeleteProfileImage={() => openDeleteConfirm("profile")}
              onDeleteBackgroundImage={() => openDeleteConfirm("background")}
              menuRef={menuRef}
              imageOperation={imageOperation}
            />

            <div style={styles.section}>
              <OpenToWorkCard
                preference={user.openToWork || user.OpenToWork}
                isOwner={isOwner}
                onChanged={(openToWork) =>
                  setUser((current) => ({ ...current, openToWork }))
                }
              />
            </div>

            {isOwner && (
              <div style={styles.section}>
                <ProfileAnalyticsCard />
              </div>
            )}

            <div style={styles.section}>
              <AboutCard
                about={user.about}
                isOwner={isOwner}
                readOnly={readOnly}
                onEdit={() => openEdit("about")}
              />
            </div>

            <div style={styles.section}>
              <ActivitiesCarousel
                posts={user.activitiesPreview?.recentPosts || []}
                postsCount={user.activitiesPreview?.postsCount}
                username={user?.basicInfo?.username}
                isOwner={isOwner}
                showToast={showToast}
                likeConnection={likeConnection}
                userId={
                  user?.id || user?.basicInfo?.userId || user?.basicInfo?.id
                }
                onPostCreated={(createdPost) => {
                  setUser((prev) => {
                    const prevActivitiesPreview = prev?.activitiesPreview || {};
                    const prevPreview = prevActivitiesPreview.recentPosts || [];

                    return {
                      ...prev,
                      activitiesPreview: {
                        ...prevActivitiesPreview,
                        postsCount: (prevActivitiesPreview.postsCount || 0) + 1,
                        recentPosts: [createdPost, ...prevPreview].slice(0, 5),
                      },
                    };
                  });

                  showToast("Post published successfully.", "success");
                }}
                onPostUpdated={(updatedPost) => {
                  setUser((prev) => {
                    const prevActivitiesPreview = prev?.activitiesPreview || {};
                    const prevPreview = prevActivitiesPreview.recentPosts || [];

                    return {
                      ...prev,
                      activitiesPreview: {
                        ...prevActivitiesPreview,
                        recentPosts: prevPreview.map((post) =>
                          post.id === updatedPost.id
                            ? { ...post, ...updatedPost }
                            : post,
                        ),
                      },
                    };
                  });
                }}
                onPostDeleted={(deletedPostId) => {
                  setUser((prev) => {
                    const prevActivitiesPreview = prev?.activitiesPreview || {};
                    const prevPreview = prevActivitiesPreview.recentPosts || [];

                    return {
                      ...prev,
                      activitiesPreview: {
                        ...prevActivitiesPreview,
                        postsCount: Math.max(
                          (prevActivitiesPreview.postsCount || 0) - 1,
                          0,
                        ),
                        recentPosts: prevPreview.filter(
                          (post) => post.id !== deletedPostId,
                        ),
                      },
                    };
                  });
                }}
              />
            </div>

            <div style={styles.section}>
              <ExperienceCard
                experiences={user.experiences || []}
                isOwner={isOwner}
                readOnly={readOnly}
                onAddExperience={() => openEdit("experience")}
                onEditExperience={openEditExperience}
                onViewAllExperiences={() =>
                  navigate(`/profile/${user?.basicInfo?.username}/experience`, {
                    state: { isOwner },
                  })
                }
              />
            </div>

            <div style={styles.section}>
              <SkillsCard
                skills={user.skills || []}
                isOwner={isOwner}
                readOnly={readOnly}
                onEdit={() => openEdit("skills")}
              />
            </div>

            <div style={styles.section}>
              <EducationCard
                educations={user.educations || []}
                isOwner={isOwner}
                readOnly={readOnly}
                onAddEducation={() => openEdit("education")}
                onEditEducation={openEditEducation}
              />
            </div>

            <div style={styles.section}>
              <InterestsSection isOwner={isOwner} showToast={showToast} />
            </div>

            <div style={styles.section}>
              <ProfileEventsSection
                username={
                  user?.basicInfo?.username ||
                  user?.basicInfo?.userName ||
                  user?.username ||
                  user?.userName ||
                  user?.Username ||
                  user?.UserName
                }
                isOwner={isOwner}
                showToast={showToast}
              />
            </div>
          </main>

          <div className="jobseeker-profile-sidebar">
            <ProfileRecommendations
              excludedUsername={user?.basicInfo?.username}
              showToast={showToast}
              maxItems={5}
            />
          </div>
        </div>
      </div>

      {confirmModal.open && (
        <div
          className="profile-confirm-overlay"
          style={styles.confirmOverlay}
          onClick={closeDeleteConfirm}
        >
          <div
            className="profile-confirm-dialog"
            style={styles.confirmModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.confirmTitle}>
              Delete {confirmModal.type === "profile" ? "profile" : "cover"}{" "}
              image?
            </div>
            <div style={styles.confirmText}>
              This image will be removed from your profile. This action cannot
              be undone.
            </div>

            <div style={styles.confirmActions}>
              <button
                style={styles.cancelButton}
                onClick={closeDeleteConfirm}
                disabled={imageOperation?.action === "delete"}
              >
                Cancel
              </button>
              <button
                style={{
                  ...styles.deleteButton,
                  opacity: imageOperation?.action === "delete" ? 0.7 : 1,
                }}
                onClick={handleConfirmDelete}
                disabled={imageOperation?.action === "delete"}
              >
                {imageOperation?.action === "delete" ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast.open && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={3000}
          onClose={closeToast}
        />
      )}

      {!readOnly && (
        <ProfileEditModal
          isOpen={isEditOpen}
          onClose={handleCloseEditModal}
          activeSection={activeSection}
          onChangeSection={setActiveSection}
          user={user}
          setUser={setUser}
          selectedExperience={selectedExperience}
          selectedEducation={selectedEducation}
          selectedSkill={selectedSkill}
          onEditSkill={openEditSkill}
        />
      )}
    </>
  );
};

const styles = {
  page: {
    backgroundColor: "var(--app-bg)",
    minHeight: "100vh",
    padding: "56px 24px 24px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  container: {
    width: "100%",
    maxWidth: 840,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  section: {},

  confirmOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  confirmModal: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "var(--app-surface)",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  },

  confirmTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--app-text)",
    marginBottom: 8,
  },

  confirmText: {
    fontSize: 14,
    color: "var(--app-text-soft)",
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
    borderRadius: 999,
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text)",
    fontWeight: 600,
    cursor: "pointer",
  },

  deleteButton: {
    padding: "10px 16px",
    borderRadius: 999,
    border: "none",
    backgroundColor: "#d11124",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
};

export default ProfileView;
