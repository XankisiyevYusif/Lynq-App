import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import Navbar from "../../Layout/Navbar";
import EmployerHeader from "../Employer/EmployerHeader";
import EmployerTabs from "../Employer/EmployerTabs";
import EmployerHome from "../Employer/EmployerHome";
import EmployerAbout from "../Employer/EmployerAbout";
import EmployerJobPosts from "../../Post/JobPosts/JobPostFeed";
import EmployerEditModal from "../Employer/EmployerEditModal";
import Toast from "../../UI/Toast";
import EmployerFollowButton from "../Employer/EmployerFollowButton";
import EmployerFollowersSection from "../Employer/EmployerFollowersSection";
import EmployerDiscovery from "../Employer/EmployerDiscovery";
import ProfileAnalyticsCard from "../ProfileAnalyticsCard";
import ProfileEventsSection from "../../Events/ProfileEventsSection";
import EmployerCommunity from "../Employer/EmployerCommunity";
import EmployerPeople from "../Employer/EmployerPeople";
import "../ProfilePolish.css";
import "../Employer/EmployerProfile.css";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../../store/userSlice";
const EmployerProfileView = ({
  user,
  setUser,
  isOwner,
  readOnly,
  likeConnection,
}) => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [employer, setEmployer] = useState(user || null);
  const requestedTab = searchParams.get("tab");
  const normalizedRequestedTab =
    requestedTab === "home"
      ? "overview"
      : requestedTab === "community"
        ? "posts"
        : requestedTab;
  const [activeTab, setActiveTab] = useState(
    ["overview", "about", "posts", "jobs", "people", "events"].includes(
      normalizedRequestedTab,
    )
      ? normalizedRequestedTab
      : "overview",
  );
  const [showModal, setShowModal] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeEditSection, setActiveEditSection] = useState("company");
  const [toast, setToast] = useState(null);
  const [jobsRefreshKey, setJobsRefreshKey] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);

  const changeTab = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") next.delete("tab");
    else next.set("tab", tab);
    if (tab !== "posts") next.delete("view");
    setSearchParams(next, { replace: true });
  };

  const openMentions = () => {
    setActiveTab("posts");
    const next = new URLSearchParams(searchParams);
    next.set("tab", "posts");
    next.set("view", "mentions");
    setSearchParams(next, { replace: true });
  };

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

  useEffect(() => {
    if (isOwner) return;
    const username =
      user?.basicInfo?.username || user?.username || user?.userName;
    if (!username) return;

    api.post("/Analytics/track/profile-view", { username }).catch((error) => {
      console.error("Company profile analytics tracking failed:", error);
    });
  }, [isOwner, user?.basicInfo?.username, user?.username, user?.userName]);

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
      employer?.basicInfo?.username || employer?.username || employer?.userName;

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
    dispatch(loginSuccess(res.data));

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
    alert("The follow system will be added later.");
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

      <div className="employer-profile-page" style={styles.page}>
        <EmployerHeader
          user={employer}
          isOwner={isOwner}
          readOnly={readOnly}
          showToast={showToast}
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

        <EmployerTabs activeTab={activeTab} onChange={changeTab} />

        {activeTab === "overview" && (
          <div className="company-profile-overview-shell">
            {isOwner && (
              <div className="company-profile-private-analytics">
                <ProfileAnalyticsCard />
              </div>
            )}

            <div className="company-profile-overview-grid">
              <main className="company-profile-overview-main">
                <EmployerHome
                  user={employer}
                  onOpenAbout={() => changeTab("about")}
                  onOpenMentions={openMentions}
                />

                <ProfileEventsSection
                  username={
                    employer?.basicInfo?.username ||
                    employer?.basicInfo?.userName ||
                    employer?.username ||
                    employer?.userName ||
                    employer?.Username ||
                    employer?.UserName
                  }
                  isOwner={isOwner}
                  showToast={showToast}
                />
              </main>

              <aside className="company-profile-overview-aside">
                <EmployerDiscovery
                  username={
                    employer?.basicInfo?.username ||
                    employer?.username ||
                    employer?.userName
                  }
                />

                <EmployerFollowersSection isOwner={isOwner} />
              </aside>
            </div>
          </div>
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
          <div className="company-profile-tab-content" style={styles.postsWrapper}>
            <EmployerCommunity
              username={
                employer?.basicInfo?.username ||
                employer?.basicInfo?.userName ||
                employer?.username ||
                employer?.userName ||
                employer?.Username ||
                employer?.UserName
              }
              isOwner={isOwner}
              showToast={showToast}
              likeConnection={likeConnection}
              defaultType={
                searchParams.get("view") === "mentions"
                  ? "mentions"
                  : "official"
              }
            />
          </div>
        )}

        {activeTab === "people" && (
          <div className="company-profile-tab-content" style={styles.postsWrapper}>
            <EmployerPeople
              username={
                employer?.basicInfo?.username ||
                employer?.basicInfo?.userName ||
                employer?.username ||
                employer?.userName
              }
            />
          </div>
        )}

        {activeTab === "jobs" && (
          <div className="company-profile-tab-content" style={styles.jobsWrapper}>
            <EmployerJobPosts
              key={jobsRefreshKey}
              username={employer?.basicInfo?.username}
              isOwner={isOwner}
              onJobCreated={() => setJobsRefreshKey((prev) => prev + 1)}
            />
          </div>
        )}

        {activeTab === "events" && (
          <div className="company-profile-tab-content">
            <ProfileEventsSection
              username={
                employer?.basicInfo?.username ||
                employer?.basicInfo?.userName ||
                employer?.username ||
                employer?.userName
              }
              isOwner={isOwner}
              showToast={showToast}
              showEmptyState
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
    backgroundColor: "var(--app-bg)",
    padding: "32px 20px 72px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },

  contentCard: {
    width: "804px",
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: "10px",
    padding: "20px",
    boxSizing: "border-box",
  },

  jobsWrapper: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "22px",
  },

  muted: {
    color: "var(--app-muted)",
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
    backgroundColor: "var(--app-surface)",
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
    border: "1px solid var(--app-border)",
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
    backgroundColor: "var(--app-surface-2)",
    border: "none",
    color: "var(--app-text)",
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
