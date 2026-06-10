import React, { useEffect, useRef, useState } from "react";
import api from "../../../services/api";
import Navbar from "../../Layout/Navbar";
import EmployerHeader from "../Employer/EmployerHeader";
import EmployerTabs from "../Employer/EmployerTabs";
import EmployerHome from "../Employer/EmployerHome";
import EmployerAbout from "../Employer/EmployerAbout";
import EmployerJobPosts from "../../Post/JobPosts/JobPostFeed";
import EmployerEditModal from "../Employer/EmployerEditModal";
import Toast from "../../UI/Toast";
import ActivitiesCarousel from "../Sections/ActivitiesCarousel";
import EmployerFollowButton from "../Employer/EmployerFollowButton";
import EmployerFollowersSection from "../Employer/EmployerFollowersSection";
const EmployerProfileView = ({
  user,
  setUser,
  isOwner,
  readOnly,
  likeConnection,
}) => {
  const [employer, setEmployer] = useState(user || null);
  const [activeTab, setActiveTab] = useState("home");
  const [showModal, setShowModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState("company");
  const [toast, setToast] = useState(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const [imageMenu, setImageMenu] = useState({
    open: false,
    type: null,
  });

  const [form, setForm] = useState({
    bio: "",
    industry: "",
    website: "",
    location: "",
  });

  const menuRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const backgroundImageInputRef = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    setEmployer(user || null);

    const company = user?.companyInfo || {};
    const basic = user?.basicInfo || {};

    setForm({
      bio: company.bio || user?.about?.bio || "",
      industry: company.industry || "",
      website: company.website || user?.contactInfo?.website || "",
      location: company.location || basic.location || "",
    });
  }, [user]);

  useEffect(() => {
    if (!imageMenu.open) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setImageMenu({ open: false, type: null });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [imageMenu.open]);

  if (!employer) {
    return <div style={{ textAlign: "center", marginTop: 50 }}>Loading...</div>;
  }

  const getResponseData = (res) => {
  if (res?.data?.data) return res.data.data;
  if (res?.data?.Data) return res.data.Data;
  return res?.data;
};

const fetchFollowerCount = async () => {
  const username =
    employer?.basicInfo?.username ||
    employer?.username ||
    employer?.userName;

  if (!username) return;

  try {
    const res = await api.get(`/CompanyFollow/followers-count/${username}`);
    const data = getResponseData(res);

    setFollowerCount(data?.followerCount ?? data?.FollowerCount ?? 0);
  } catch (err) {
    console.error("Fetch follower count failed:", err);
  }
};

useEffect(() => {
  fetchFollowerCount();
}, [employer?.basicInfo?.username]);

  const refreshProfile = async () => {
    const res = await api.get("/User/me");

    setEmployer(res.data);

    if (setUser) {
      setUser(res.data);
    }
  };

  const handleInputChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdate = async () => {
    try {
      await api.put("/User/employer/about", form);
      await refreshProfile();
      setShowModal(false);
    } catch (err) {
      console.error("Employer update failed:", err);
      alert("Update failed!");
    }
  };

  const handleFollow = () => {
    alert("Follow sistemi sonra əlavə olunacaq.");
  };

  const openProfileImageMenu = () => {
    setImageMenu({
      open: true,
      type: "profile",
    });
  };

  const openBackgroundImageMenu = () => {
    setImageMenu({
      open: true,
      type: "background",
    });
  };

  const handleUploadProfileImage = () => {
    profileImageInputRef.current?.click();
  };

  const handleUploadBackgroundImage = () => {
    backgroundImageInputRef.current?.click();
  };

  const handleProfileImageSelected = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.put("/User/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshProfile();

      setImageMenu({ open: false, type: null });
      showToast("Logo updated successfully.", "success");
    } catch (err) {
      console.error("Logo upload failed:", err);
      showToast("Logo upload failed.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleBackgroundImageSelected = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      await api.put("/User/background-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await refreshProfile();

      setImageMenu({ open: false, type: null });
      showToast("Background image updated successfully.", "success");
    } catch (err) {
      console.error("Background upload failed:", err);
      showToast("Background image upload failed.", "error");
    } finally {
      e.target.value = "";
    }
  };

  const handleDeleteProfileImage = async () => {
    try {
      await api.delete("/User/profile-image");

      await refreshProfile();

      setImageMenu({ open: false, type: null });
      showToast("Logo deleted successfully.", "success");
    } catch (err) {
      console.error("Logo delete failed:", err);
      showToast("Logo delete failed.", "error");
    }
  };

  const handleDeleteBackgroundImage = async () => {
    try {
      await api.delete("/User/background-image");

      await refreshProfile();

      setImageMenu({ open: false, type: null });
      showToast("Background image deleted successfully.", "success");
    } catch (err) {
      console.error("Background delete failed:", err);
      showToast("Background image delete failed.", "error");
    }
  };

  return (
    <>
      <Navbar />

      <input
        ref={profileImageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleProfileImageSelected}
      />

      <input
        ref={backgroundImageInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleBackgroundImageSelected}
      />

      <div style={styles.page}>
        <EmployerHeader
  user={employer}
  isOwner={isOwner}
  readOnly={readOnly}
  onEdit={() => {
    setActiveEditSection("company");
    setIsEditOpen(true);
  }}
  followerCount={followerCount}
  followButton={
    <EmployerFollowButton
      username={
        employer?.basicInfo?.username ||
        employer?.username ||
        employer?.userName
      }
      isOwner={isOwner}
      showToast={showToast}
      onChanged={(data) => {
        if (
          data?.followerCount !== undefined &&
          data?.followerCount !== null
        ) {
          setFollowerCount(data.followerCount);
        } else {
          fetchFollowerCount();
        }
      }}
    />
      }
      imageMenu={imageMenu}
      menuRef={menuRef}
      onOpenProfileImageMenu={openProfileImageMenu}
      onOpenBackgroundImageMenu={openBackgroundImageMenu}
      onUploadProfileImage={handleUploadProfileImage}
      onUploadBackgroundImage={handleUploadBackgroundImage}
      onDeleteProfileImage={handleDeleteProfileImage}
      onDeleteBackgroundImage={handleDeleteBackgroundImage}
    />

        <EmployerTabs activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "home" && (
          <>
            <EmployerHome
              user={employer}
              onOpenAbout={() => setActiveTab("about")}
            />
        
            <EmployerFollowersSection isOwner={isOwner} />
          </>
        )}

        {activeTab === "about" && (
          <EmployerAbout
            user={employer}
            isOwner={isOwner}
            readOnly={readOnly}
            onEdit={() => setShowModal(true)}
          />
        )}


        {activeTab === "posts" && (
          <div style={styles.postsWrapper}>
            <ActivitiesCarousel
             posts={employer?.activitiesPreview?.recentPosts || []}
             username={employer?.basicInfo?.username}
             isOwner={isOwner}
             isEmployer={true}
             showToast={showToast}
             likeConnection={likeConnection}
              userId={
                employer?.id ||
                employer?.basicInfo?.userId ||
                employer?.basicInfo?.id
              }
              onPostCreated={(createdPost) => {
                setEmployer((prev) => {
                  const prevActivitiesPreview = prev?.activitiesPreview || {};
                  const prevPreview = prevActivitiesPreview.recentPosts || [];
                
                  const next = {
                    ...prev,
                    activitiesPreview: {
                      ...prevActivitiesPreview,
                      postsCount: (prevActivitiesPreview.postsCount || 0) + 1,
                      recentPosts: [createdPost, ...prevPreview].slice(0, 5),
                    },
                  };
                
                  setUser?.(next);
                  return next;
                });
              
                showToast("Post paylaşıldı.", "success");
              }}
              onPostUpdated={(updatedPost) => {
                setEmployer((prev) => {
                  const prevActivitiesPreview = prev?.activitiesPreview || {};
                  const prevPreview = prevActivitiesPreview.recentPosts || [];
                
                  const next = {
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
                
                  setUser?.(next);
                  return next;
                });
              }}
              onPostDeleted={(deletedPostId) => {
                setEmployer((prev) => {
                  const prevActivitiesPreview = prev?.activitiesPreview || {};
                  const prevPreview = prevActivitiesPreview.recentPosts || [];
                
                  const next = {
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
                
                  setUser?.(next);
                  return next;
                });
              }}
            />
          </div>
        )}

      
        {activeTab === "jobs" && (
          <div style={styles.jobsWrapper}>
            <EmployerJobPosts
              key={jobsRefreshKey}
              username={employer?.basicInfo?.username}
              isOwner={isOwner}
              onJobCreated={() => setJobsRefreshKey((prev) => prev + 1)}
            />
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Edit Company Info</h3>

            <label style={styles.label}>Bio</label>
            <textarea
              name="bio"
              value={form.bio}
              onChange={handleInputChange}
              style={{ ...styles.input, height: 120, resize: "vertical" }}
            />

            <label style={styles.label}>Industry</label>
            <input
              name="industry"
              value={form.industry}
              onChange={handleInputChange}
              style={styles.input}
            />

            <label style={styles.label}>Website</label>
            <input
              name="website"
              value={form.website}
              onChange={handleInputChange}
              style={styles.input}
            />

            <label style={styles.label}>Location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleInputChange}
              style={styles.input}
            />

            <div style={styles.modalActions}>
              <button
                onClick={() => setShowModal(false)}
                style={styles.cancelButton}
              >
                Cancel
              </button>

              <button onClick={handleUpdate} style={styles.saveButton}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && (
        <EmployerEditModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          activeSection={activeEditSection}
          onChangeSection={setActiveEditSection}
          user={employer}
          showToast={showToast}
          setUser={(updatedUser) => {
            if (typeof updatedUser === "function") {
              setEmployer((prev) => {
                const next = updatedUser(prev);
                setUser?.(next);
                return next;
              });

              return;
            }

            setEmployer(updatedUser);
            setUser?.(updatedUser);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default EmployerProfileView;

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    padding: "28px 0 60px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },

  contentCard: {
    width: "804px",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "20px",
    boxSizing: "border-box",
  },

  jobsWrapper: {
    width: "820px",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  muted: {
    color: "#666",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },

  modalContent: {
    backgroundColor: "white",
    padding: 22,
    borderRadius: 12,
    width: "430px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
  },

  modalTitle: {
    margin: "0 0 16px",
  },

  label: {
    fontWeight: 600,
    marginBottom: 5,
  },

  input: {
    marginBottom: 12,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid #ccc",
    fontSize: 14,
    fontFamily: "inherit",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 8,
  },

  cancelButton: {
    backgroundColor: "#eee",
    border: "none",
    color: "#333",
    borderRadius: 8,
    padding: "8px 14px",
    cursor: "pointer",
  },

  saveButton: {
    backgroundColor: "#0a66c2",
    border: "none",
    color: "white",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },
  postsWrapper: {
  width: "820px",
  maxWidth: "820px",
  boxSizing: "border-box",
},
};