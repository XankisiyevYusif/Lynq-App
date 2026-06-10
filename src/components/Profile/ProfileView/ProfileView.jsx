import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../Layout/Navbar";
import ProfileCard from "../ProfileCard";
import AboutCard from "../Sections/AboutCard";
import ActivitiesCard from "../Sections/ActivitiesCard";
import ActivitiesEmpty from "../Sections/ActivitiesEmpty";
import ExperienceCard from "../Sections/ExperienceCard";
import EducationCard from "../Sections/EducationCard";
import SkillsCard from "../Sections/SkillsCard";
import ProfileEditModal from "../Modals/ProfileEditModal";
import Toast from "../../UI/Toast";
import api from "../../../services/api";
import { useNavigate } from "react-router-dom";
import ActivitiesCarousel from "../Sections/ActivitiesCarousel";
import CreatePostBox from "../../Post/CreatePostBox";
import InterestsSection from "../Sections/InterestsSection";

const ProfileView = ({ user, setUser, isOwner, readOnly, likeConnection }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const navigate = useNavigate();


  console.log("ProfileView render - user:", user);  

  const [imageMenu, setImageMenu] = useState({
    open: false,
    type: null,
  });

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: null, // profile | background
  });

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const menuRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

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

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.put("/User/profile-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedImagePath =
        response.data?.data?.profileImage ||
        response.data?.data?.imagePath ||
        response.data?.data?.path ||
        response.data?.data;

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          profileImage: uploadedImagePath,
        },
      }));

      showToast(
        isUpdate
          ? "Profil şəkli yeniləndi."
          : "Profil şəkli yükləndi.",
        "success"
      );
    } catch (error) {
      console.error("Profile image upload error:", error);
      showToast("Profil şəkli əməliyyatı uğursuz oldu.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleBackgroundImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isUpdate = !!user?.basicInfo?.backgroundImage;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.put("/User/background-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedImagePath =
        response.data?.data?.backgroundImage ||
        response.data?.data?.imagePath ||
        response.data?.data?.path ||
        response.data?.data;

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          backgroundImage: uploadedImagePath,
        },
      }));

      showToast(
        isUpdate
          ? "Background şəkli yeniləndi."
          : "Background şəkli yükləndi.",
        "success"
      );
    } catch (error) {
      console.error("Background image upload error:", error);
      showToast("Background şəkli əməliyyatı uğursuz oldu.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      await api.delete("/User/profile-image");

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          profileImage: null,
        },
      }));

      closeDeleteConfirm();
      showToast("Profil şəkli silindi.", "success");
    } catch (error) {
      console.error("Delete profile image error:", error);
      closeDeleteConfirm();
      showToast("Profil şəkli silinmədi.", "error");
    }
  };

  const handleDeleteBackgroundImage = async () => {
    try {
      await api.delete("/User/background-image");

      setUser((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          backgroundImage: null,
        },
      }));

      closeDeleteConfirm();
      showToast("Background şəkli silindi.", "success");
    } catch (error) {
      console.error("Delete background image error:", error);
      closeDeleteConfirm();
      showToast("Background şəkli silinmədi.", "error");
    }
  };

  const handleConfirmDelete = () => {
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

      <div style={styles.page}>
        <div style={styles.container}>
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
          />

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
              username={user?.basicInfo?.username}
              isOwner={isOwner}
              showToast={showToast}
              likeConnection={likeConnection}
              userId={user?.id || user?.basicInfo?.userId || user?.basicInfo?.id}
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
              
                showToast("Post paylaşıldı.", "success");
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
                          : post
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
                        0
                      ),
                      recentPosts: prevPreview.filter(
                        (post) => post.id !== deletedPostId
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
        </div>
      </div>

      {confirmModal.open && (
        <div style={styles.confirmOverlay} onClick={closeDeleteConfirm}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.confirmTitle}>Silmək istəyirsiniz?</div>
            <div style={styles.confirmText}>
              Bu əməliyyatı geri qaytarmaq olmayacaq.
            </div>

            <div style={styles.confirmActions}>
              <button style={styles.cancelButton} onClick={closeDeleteConfirm}>
                Ləğv et
              </button>
              <button style={styles.deleteButton} onClick={handleConfirmDelete}>
                Sil
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
    backgroundColor: "#f3f2ef",
    minHeight: "100vh",
    padding: "56px 24px 24px",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },

  container: {
    width: "100%",
    maxWidth: 820,
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
    borderRadius: 999,
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#333",
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