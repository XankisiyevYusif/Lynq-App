import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import defaultAvatar from "../assets/default-avatar.png";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const AdminPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [reports, setReports] = useState([]);

  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);

  const [loading, setLoading] = useState(false);

  const getData = (res) => {
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.data?.data)) return res.data.data;
    if (Array.isArray(res.data?.Data)) return res.data.Data;
    return res.data?.data || res.data?.Data || res.data || null;
  };

  const pick = (obj, camel, pascal) => {
    if (!obj) return 0;
    return obj[camel] ?? obj[pascal] ?? 0;
  };

  const value = (obj, camel, pascal) => {
    if (!obj) return undefined;
    return obj[camel] ?? obj[pascal];
  };

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;

    const cleanPath = String(path).trim();
    if (!cleanPath) return defaultAvatar;

    if (
      cleanPath.startsWith("http://") ||
      cleanPath.startsWith("https://") ||
      cleanPath.startsWith("blob:")
    ) {
      return cleanPath;
    }

    return `${API_ROOT}/${cleanPath.replace(/^\/+/, "")}`;
  };

  const getUserImageUrl = (user) => {
    return getImageUrl(
      value(user, "profileImage", "ProfileImage") ||
        value(user, "companyLogo", "CompanyLogo") ||
        value(user, "logoUrl", "LogoUrl") ||
        value(user, "userPhoto", "UserPhoto") ||
        value(user, "photoUrl", "PhotoUrl")
    );
  };

  const getJobLogoUrl = (job) => {
    return getImageUrl(
      value(job, "companyLogo", "CompanyLogo") ||
        value(job, "employerProfileImage", "EmployerProfileImage") ||
        value(job, "profileImage", "ProfileImage") ||
        value(job, "companyProfileImage", "CompanyProfileImage") ||
        value(job, "logoUrl", "LogoUrl") ||
        value(job, "userPhoto", "UserPhoto") ||
        value(job, "authorPhoto", "AuthorPhoto")
    );
  };

  const loadDashboard = async () => {
    const res = await api.get("/Admin/dashboard");
    setDashboard(getData(res));
  };

  const loadUsers = async () => {
    const res = await api.get("/Admin/users");
    setUsers(getData(res) || []);
  };

  const loadPosts = async () => {
    const res = await api.get("/Admin/posts");
    setPosts(getData(res) || []);
  };

  const loadJobs = async () => {
    const res = await api.get("/Admin/job-posts");
    setJobs(getData(res) || []);
  };

  const loadReports = async () => {
    const res = await api.get("/Admin/reports");
    setReports(getData(res) || []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);

      await Promise.all([
        loadDashboard(),
        loadUsers(),
        loadPosts(),
        loadJobs(),
        loadReports(),
      ]);
    } catch (err) {
      console.error("Admin data failed:", err);
      console.error("Status:", err.response?.status);
      console.error("Data:", err.response?.data);

      alert(
        `Admin data could not be loaded. Status: ${
          err.response?.status || "unknown"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedPost && !selectedJob) return;

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, [selectedPost, selectedJob]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("accessToken");

    navigate("/login", { replace: true });
  };

  const blockUser = async (userId) => {
    const reason = window.prompt("Reason for blocking this user?");
    if (reason === null) return;

    await api.post(`/Admin/users/${userId}/block`, {
      reason: reason || "Blocked by admin",
    });

    await loadUsers();
    await loadDashboard();
  };

  const unblockUser = async (userId) => {
    await api.post(`/Admin/users/${userId}/unblock`);

    await loadUsers();
    await loadDashboard();
  };

  const blockPost = async (postId) => {
    const reason = window.prompt("Reason for blocking this post?");
    if (reason === null) return;

    await api.post(`/Admin/posts/${postId}/block`, {
      reason: reason || "Blocked by admin",
    });

    setSelectedPost((prev) =>
      prev && Number(value(prev, "id", "Id")) === Number(postId)
        ? {
            ...prev,
            isBlocked: true,
            IsBlocked: true,
            blockReason: reason || "Blocked by admin",
            BlockReason: reason || "Blocked by admin",
          }
        : prev
    );

    await loadPosts();
    await loadReports();
    await loadDashboard();
  };

  const unblockPost = async (postId) => {
    await api.post(`/Admin/posts/${postId}/unblock`);

    setSelectedPost((prev) =>
      prev && Number(value(prev, "id", "Id")) === Number(postId)
        ? {
            ...prev,
            isBlocked: false,
            IsBlocked: false,
            blockReason: null,
            BlockReason: null,
          }
        : prev
    );

    await loadPosts();
    await loadReports();
    await loadDashboard();
  };

  const blockJob = async (jobId) => {
    const reason = window.prompt("Reason for blocking this job post?");
    if (reason === null) return;

    await api.post(`/Admin/job-posts/${jobId}/block`, {
      reason: reason || "Blocked by admin",
    });

    setSelectedJob((prev) =>
      prev && Number(value(prev, "id", "Id")) === Number(jobId)
        ? {
            ...prev,
            isBlocked: true,
            IsBlocked: true,
            blockReason: reason || "Blocked by admin",
            BlockReason: reason || "Blocked by admin",
          }
        : prev
    );

    await loadJobs();
    await loadDashboard();
  };

  const unblockJob = async (jobId) => {
    await api.post(`/Admin/job-posts/${jobId}/unblock`);

    setSelectedJob((prev) =>
      prev && Number(value(prev, "id", "Id")) === Number(jobId)
        ? {
            ...prev,
            isBlocked: false,
            IsBlocked: false,
            blockReason: null,
            BlockReason: null,
          }
        : prev
    );

    await loadJobs();
    await loadDashboard();
  };

  const reviewReport = async (reportId) => {
    await api.post(`/Admin/reports/${reportId}/review`);

    await loadReports();
    await loadDashboard();
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleDateString();
  };

  const shortText = (text, max = 80) => {
    if (!text) return "-";
    return text.length > max ? `${text.slice(0, max)}...` : text;
  };

  const monthlyRegistrations =
    dashboard?.monthlyRegistrations || dashboard?.MonthlyRegistrations || [];

  return (
    <>
      <div style={styles.adminTopbar}>
        <div style={styles.topbarInner}>
          <div>
            <div style={styles.brand}>Admin Panel</div>
            <div style={styles.brandSub}>WorkHub management dashboard</div>
          </div>

          <div style={styles.topbarActions}>
            <button type="button" style={styles.refreshButton} onClick={loadAll}>
              Refresh
            </button>

            <button type="button" style={styles.logoutButton} onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </div>

      <div style={styles.page}>
        <div style={styles.container}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>Admin Dashboard</h1>
              <p style={styles.subtitle}>
                Manage users, posts, job posts and reports.
              </p>
            </div>
          </div>

          <div style={styles.tabs}>
            {["dashboard", "users", "posts", "jobs", "reports"].map((tab) => (
              <button
                key={tab}
                type="button"
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab ? styles.activeTab : {}),
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "dashboard"
                  ? "Dashboard"
                  : tab === "users"
                  ? "Users"
                  : tab === "posts"
                  ? "Posts"
                  : tab === "jobs"
                  ? "Jobs"
                  : "Reports"}
              </button>
            ))}
          </div>

          {loading && <div style={styles.card}>Loading...</div>}

          {!loading && activeTab === "dashboard" && (
            <div>
              <div style={styles.statsGrid}>
                <StatCard
                  title="Users"
                  value={pick(dashboard, "totalUsers", "TotalUsers")}
                />
                <StatCard
                  title="Posts"
                  value={pick(dashboard, "totalPosts", "TotalPosts")}
                />
                <StatCard
                  title="Job Posts"
                  value={pick(dashboard, "totalJobPosts", "TotalJobPosts")}
                />
                <StatCard
                  title="Reports"
                  value={pick(dashboard, "totalReports", "TotalReports")}
                />
                <StatCard
                  title="Blocked Users"
                  value={pick(dashboard, "blockedUsers", "BlockedUsers")}
                />
                <StatCard
                  title="Blocked Posts"
                  value={pick(dashboard, "blockedPosts", "BlockedPosts")}
                />
                <StatCard
                  title="Blocked Jobs"
                  value={pick(dashboard, "blockedJobPosts", "BlockedJobPosts")}
                />
              </div>

              <div style={styles.card}>
                <h3 style={styles.sectionTitle}>Monthly registrations</h3>

                {monthlyRegistrations.length > 0 ? (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Month</th>
                        <th style={styles.th}>Registrations</th>
                      </tr>
                    </thead>

                    <tbody>
                      {monthlyRegistrations.map((item, index) => (
                        <tr key={index}>
                          <td style={styles.td}>
                            {item.month ?? item.Month}/{item.year ?? item.Year}
                          </td>
                          <td style={styles.td}>{item.count ?? item.Count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p style={styles.empty}>No registration data.</p>
                )}
              </div>
            </div>
          )}

          {!loading && activeTab === "users" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Users</h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>User</th>
                    <th style={styles.th}>Email</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => {
                    const id = value(u, "id", "Id");
                    const username = value(u, "username", "Username");
                    const isBlocked = value(u, "isBlocked", "IsBlocked");

                    return (
                      <tr key={id}>
                        <td style={styles.td}>
                          <div style={styles.userCell}>
                            <img
                              src={getUserImageUrl(u)}
                              alt=""
                              style={styles.avatar}
                            />

                            <div>
                              <strong>{value(u, "fullName", "FullName") || "-"}</strong>
                              <div style={styles.muted}>@{username}</div>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>{value(u, "email", "Email")}</td>
                        <td style={styles.td}>{value(u, "userType", "UserType")}</td>
                        <td style={styles.td}>
                          {formatDate(value(u, "createdAt", "CreatedAt"))}
                        </td>

                        <td style={styles.td}>
                          {isBlocked ? (
                            <span style={styles.blocked}>Blocked</span>
                          ) : (
                            <span style={styles.active}>Active</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.blueButton}
                            onClick={() => navigate(`/profile/${username}`)}
                          >
                            View Profile
                          </button>

                          {isBlocked ? (
                            <button
                              type="button"
                              style={styles.greenButton}
                              onClick={() => unblockUser(id)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.redButton}
                              onClick={() => blockUser(id)}
                            >
                              Block
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {users.length === 0 && <p style={styles.empty}>No users.</p>}
            </div>
          )}

          {!loading && activeTab === "posts" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Posts</h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Author</th>
                    <th style={styles.th}>Content</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {posts.map((p) => {
                    const id = value(p, "id", "Id");
                    const isBlocked = value(p, "isBlocked", "IsBlocked");

                    return (
                      <tr key={id}>
                        <td style={styles.td}>
                          <strong>{value(p, "authorName", "AuthorName") || "-"}</strong>
                          <div style={styles.muted}>
                            @{value(p, "authorUsername", "AuthorUsername")}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {shortText(value(p, "content", "Content"), 100)}
                        </td>

                        <td style={styles.td}>
                          {formatDate(value(p, "createdAt", "CreatedAt"))}
                        </td>

                        <td style={styles.td}>
                          {isBlocked ? (
                            <span style={styles.blocked}>Blocked</span>
                          ) : (
                            <span style={styles.active}>Visible</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.blueButton}
                            onClick={() => setSelectedPost(p)}
                          >
                            Preview
                          </button>

                          {isBlocked ? (
                            <button
                              type="button"
                              style={styles.greenButton}
                              onClick={() => unblockPost(id)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.redButton}
                              onClick={() => blockPost(id)}
                            >
                              Block
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {posts.length === 0 && <p style={styles.empty}>No posts.</p>}
            </div>
          )}

          {!loading && activeTab === "jobs" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Job Posts</h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Company</th>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Created</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {jobs.map((j) => {
                    const id = value(j, "id", "Id");
                    const isBlocked = value(j, "isBlocked", "IsBlocked");

                    return (
                      <tr key={id}>
                        <td style={styles.td}>
                          <strong>{value(j, "companyName", "CompanyName") || "-"}</strong>
                          <div style={styles.muted}>
                            @{value(j, "companyUsername", "CompanyUsername")}
                          </div>
                        </td>

                        <td style={styles.td}>{value(j, "title", "Title")}</td>

                        <td style={styles.td}>
                          {formatDate(value(j, "createdAt", "CreatedAt"))}
                        </td>

                        <td style={styles.td}>
                          {isBlocked ? (
                            <span style={styles.blocked}>Blocked</span>
                          ) : (
                            <span style={styles.active}>Visible</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.blueButton}
                            onClick={() => setSelectedJob(j)}
                          >
                            Preview
                          </button>

                          {isBlocked ? (
                            <button
                              type="button"
                              style={styles.greenButton}
                              onClick={() => unblockJob(id)}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.redButton}
                              onClick={() => blockJob(id)}
                            >
                              Block
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {jobs.length === 0 && <p style={styles.empty}>No job posts.</p>}
            </div>
          )}

          {!loading && activeTab === "reports" && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Reports</h3>

              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Reporter</th>
                    <th style={styles.th}>Post Owner</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Post</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {reports.map((r) => {
                    const id = value(r, "id", "Id");
                    const postId = value(r, "postId", "PostId");
                    const isReviewed = value(r, "isReviewed", "IsReviewed");
                    const postIsBlocked = value(r, "postIsBlocked", "PostIsBlocked");

                    return (
                      <tr key={id}>
                        <td style={styles.td}>
                          <strong>
                            {value(r, "reporterName", "ReporterName") || "-"}
                          </strong>
                          <div style={styles.muted}>
                            @{value(r, "reporterUsername", "ReporterUsername")}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {value(r, "postOwnerName", "PostOwnerName") || "-"}
                          </strong>
                          <div style={styles.muted}>
                            @{value(r, "postOwnerUsername", "PostOwnerUsername")}
                          </div>
                        </td>

                        <td style={styles.td}>{value(r, "reason", "Reason")}</td>

                        <td style={styles.td}>
                          {shortText(value(r, "postContent", "PostContent"), 80)}
                        </td>

                        <td style={styles.td}>
                          {isReviewed ? (
                            <span style={styles.active}>Reviewed</span>
                          ) : (
                            <span style={styles.pending}>Pending</span>
                          )}
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={styles.blueButton}
                            onClick={() =>
                              navigate(
                                `/profile/${value(
                                  r,
                                  "postOwnerUsername",
                                  "PostOwnerUsername"
                                )}`
                              )
                            }
                          >
                            View Owner
                          </button>

                          {!isReviewed && (
                            <button
                              type="button"
                              style={styles.blueButton}
                              onClick={() => reviewReport(id)}
                            >
                              Review
                            </button>
                          )}

                          {postIsBlocked ? (
                            <button
                              type="button"
                              style={styles.greenButton}
                              onClick={() => unblockPost(postId)}
                            >
                              Unblock Post
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={styles.redButton}
                              onClick={() => blockPost(postId)}
                            >
                              Block Post
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {reports.length === 0 && (
                <p style={styles.empty}>No reports yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostPreviewModal
          post={selectedPost}
          getImageUrl={getImageUrl}
          value={value}
          navigate={navigate}
          onClose={() => setSelectedPost(null)}
          onBlock={blockPost}
          onUnblock={unblockPost}
        />
      )}

      {selectedJob && (
        <JobPreviewModal
          job={selectedJob}
          getJobLogoUrl={getJobLogoUrl}
          value={value}
          navigate={navigate}
          onClose={() => setSelectedJob(null)}
          onBlock={blockJob}
          onUnblock={unblockJob}
        />
      )}
    </>
  );
};

const StatCard = ({ title, value }) => {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value ?? 0}</div>
    </div>
  );
};

const PostPreviewModal = ({
  post,
  getImageUrl,
  value,
  navigate,
  onClose,
  onBlock,
  onUnblock,
}) => {
  const id = value(post, "id", "Id");
  const isBlocked = value(post, "isBlocked", "IsBlocked");

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.postModal} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={styles.modalClose} onClick={onClose}>
          ×
        </button>

        <h3 style={styles.modalTitle}>Post Preview</h3>

        <div style={styles.modalAuthor}>
          <strong>{value(post, "authorName", "AuthorName") || "-"}</strong>
          <span>@{value(post, "authorUsername", "AuthorUsername")}</span>
        </div>

        <p style={styles.modalContentText}>
          {value(post, "content", "Content") || "No text content"}
        </p>

        {value(post, "imageUrl", "ImageUrl") && (
          <img
            src={getImageUrl(value(post, "imageUrl", "ImageUrl"))}
            alt="Post"
            style={styles.modalImage}
          />
        )}

        {value(post, "videoUrl", "VideoUrl") && (
          <video
            src={getImageUrl(value(post, "videoUrl", "VideoUrl"))}
            controls
            style={styles.modalImage}
          />
        )}

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.blueButton}
            onClick={() =>
              navigate(`/profile/${value(post, "authorUsername", "AuthorUsername")}`)
            }
          >
            View Author Profile
          </button>

          {isBlocked ? (
            <button
              type="button"
              style={styles.greenButton}
              onClick={() => onUnblock(id)}
            >
              Unblock Post
            </button>
          ) : (
            <button
              type="button"
              style={styles.redButton}
              onClick={() => onBlock(id)}
            >
              Block Post
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const JobPreviewModal = ({
  job,
  getJobLogoUrl,
  value,
  navigate,
  onClose,
  onBlock,
  onUnblock,
}) => {
  const id = value(job, "id", "Id");
  const isBlocked = value(job, "isBlocked", "IsBlocked");

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.jobModal} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={styles.modalClose} onClick={onClose}>
          ×
        </button>

        <h3 style={styles.modalTitle}>Job Post Preview</h3>

        <div style={styles.jobHeader}>
          <img
            src={getJobLogoUrl(job)}
            alt=""
            style={styles.companyLogo}
          />

          <div>
            <h2 style={styles.jobTitle}>{value(job, "title", "Title")}</h2>
            <div style={styles.companyName}>
              {value(job, "companyName", "CompanyName") || "Company"}
            </div>
            <div style={styles.muted}>
              @{value(job, "companyUsername", "CompanyUsername")}
            </div>
          </div>
        </div>

        <div style={styles.jobInfoGrid}>
          <InfoItem label="Location" value={value(job, "location", "Location")} />
          <InfoItem
            label="Workplace"
            value={value(job, "workplaceType", "WorkplaceType")}
          />
          <InfoItem
            label="Employment"
            value={value(job, "employmentType", "EmploymentType")}
          />
          <InfoItem
            label="Created"
            value={
              value(job, "createdAt", "CreatedAt")
                ? new Date(value(job, "createdAt", "CreatedAt")).toLocaleDateString()
                : "-"
            }
          />
          <InfoItem
            label="Expires"
            value={
              value(job, "expiresAt", "ExpiresAt")
                ? new Date(value(job, "expiresAt", "ExpiresAt")).toLocaleDateString()
                : "-"
            }
          />
          <InfoItem
            label="Status"
            value={
              isBlocked
                ? "Blocked"
                : value(job, "isActive", "IsActive")
                ? "Active"
                : "Closed"
            }
          />
        </div>

        <div style={styles.jobDescriptionBox}>
          <h4 style={styles.smallTitle}>Description</h4>
          <p style={styles.modalContentText}>
            {value(job, "description", "Description") || "No description"}
          </p>
        </div>

        {value(job, "applyUrl", "ApplyUrl") && (
          <div style={styles.applyBox}>
            <strong>Apply URL:</strong>
            <div style={styles.urlText}>{value(job, "applyUrl", "ApplyUrl")}</div>
          </div>
        )}

        <div style={styles.modalActions}>
          <button
            type="button"
            style={styles.blueButton}
            onClick={() =>
              navigate(`/profile/${value(job, "companyUsername", "CompanyUsername")}`)
            }
          >
            View Company Profile
          </button>

          {isBlocked ? (
            <button
              type="button"
              style={styles.greenButton}
              onClick={() => onUnblock(id)}
            >
              Unblock Job
            </button>
          ) : (
            <button
              type="button"
              style={styles.redButton}
              onClick={() => onBlock(id)}
            >
              Block Job
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoItem = ({ label, value }) => {
  return (
    <div style={styles.infoItem}>
      <div style={styles.infoLabel}>{label}</div>
      <div style={styles.infoValue}>{value || "-"}</div>
    </div>
  );
};

const styles = {
  adminTopbar: {
    height: "64px",
    backgroundColor: "#111827",
    color: "#fff",
    borderBottom: "1px solid #1f2937",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },

  topbarInner: {
    width: "1120px",
    maxWidth: "calc(100% - 32px)",
    height: "100%",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    fontSize: "20px",
    fontWeight: 800,
    letterSpacing: "0.2px",
  },

  brandSub: {
    fontSize: "12px",
    color: "#cbd5e1",
    marginTop: "2px",
  },

  topbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    padding: "24px 0 50px",
  },

  container: {
    width: "1120px",
    maxWidth: "calc(100% - 32px)",
    margin: "0 auto",
  },

  header: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "14px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#191919",
  },

  subtitle: {
    margin: "6px 0 0",
    color: "#666",
    fontSize: "14px",
  },

  refreshButton: {
    border: "1px solid #60a5fa",
    backgroundColor: "transparent",
    color: "#fff",
    borderRadius: "999px",
    padding: "9px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  logoutButton: {
    border: "none",
    backgroundColor: "#dc2626",
    color: "#fff",
    borderRadius: "999px",
    padding: "10px 18px",
    fontWeight: 700,
    cursor: "pointer",
  },

  tabs: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "10px",
    marginBottom: "14px",
    display: "flex",
    gap: "8px",
  },

  tabButton: {
    border: "none",
    backgroundColor: "transparent",
    color: "#555",
    borderRadius: "999px",
    padding: "9px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  activeTab: {
    backgroundColor: "#0a66c2",
    color: "#fff",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "12px",
    marginBottom: "14px",
  },

  statCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "18px",
  },

  statTitle: {
    color: "#666",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "10px",
  },

  statValue: {
    color: "#191919",
    fontSize: "28px",
    fontWeight: 800,
  },

  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "18px",
    overflowX: "auto",
  },

  sectionTitle: {
    margin: "0 0 14px",
    fontSize: "20px",
    color: "#191919",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },

  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e5e5",
    padding: "10px",
    color: "#555",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },

  td: {
    borderBottom: "1px solid #f0f0f0",
    padding: "10px",
    verticalAlign: "top",
    color: "#222",
  },

  userCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "1px solid #e0e0e0",
  },

  muted: {
    color: "#777",
    fontSize: "12px",
    marginTop: "3px",
  },

  active: {
    color: "#057642",
    fontWeight: 700,
  },

  blocked: {
    color: "#c0392b",
    fontWeight: 700,
  },

  pending: {
    color: "#b7791f",
    fontWeight: 700,
  },

  redButton: {
    border: "none",
    backgroundColor: "#d93025",
    color: "#fff",
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: 700,
    cursor: "pointer",
    marginRight: "6px",
    marginBottom: "6px",
  },

  greenButton: {
    border: "none",
    backgroundColor: "#057642",
    color: "#fff",
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: 700,
    cursor: "pointer",
    marginRight: "6px",
    marginBottom: "6px",
  },

  blueButton: {
    border: "none",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: "999px",
    padding: "7px 12px",
    fontWeight: 700,
    cursor: "pointer",
    marginRight: "6px",
    marginBottom: "6px",
  },

  empty: {
    color: "#777",
    fontSize: "14px",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    paddingTop: "70px",
    zIndex: 9999,
    overflowY: "auto",
  },

  postModal: {
    width: "620px",
    maxWidth: "calc(100% - 32px)",
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "22px",
    position: "relative",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    marginBottom: "60px",
  },

  jobModal: {
    width: "760px",
    maxWidth: "calc(100% - 32px)",
    backgroundColor: "#fff",
    borderRadius: "14px",
    padding: "24px",
    position: "relative",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    marginBottom: "60px",
  },

  modalClose: {
    position: "absolute",
    top: "12px",
    right: "14px",
    border: "none",
    backgroundColor: "transparent",
    fontSize: "26px",
    cursor: "pointer",
    color: "#555",
  },

  modalTitle: {
    margin: "0 0 16px",
    fontSize: "20px",
    color: "#191919",
  },

  modalAuthor: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
    marginBottom: "14px",
    color: "#333",
  },

  modalContentText: {
    fontSize: "15px",
    lineHeight: 1.5,
    color: "#222",
    whiteSpace: "pre-wrap",
  },

  modalImage: {
    width: "100%",
    maxHeight: "420px",
    objectFit: "contain",
    borderRadius: "12px",
    border: "1px solid #e5e5e5",
    marginTop: "12px",
    backgroundColor: "#f8f8f8",
  },

  modalActions: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "18px",
  },

  jobHeader: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },

  companyLogo: {
    width: "64px",
    height: "64px",
    borderRadius: "12px",
    objectFit: "cover",
    border: "1px solid #e0e0e0",
  },

  jobTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#0a66c2",
  },

  companyName: {
    marginTop: "5px",
    fontSize: "15px",
    fontWeight: 700,
    color: "#222",
  },

  jobInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "16px",
  },

  infoItem: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px",
  },

  infoLabel: {
    fontSize: "12px",
    color: "#64748b",
    fontWeight: 700,
    marginBottom: "5px",
  },

  infoValue: {
    fontSize: "14px",
    color: "#111827",
    fontWeight: 600,
  },

  jobDescriptionBox: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "14px",
  },

  smallTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
    color: "#111827",
  },

  applyBox: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px",
    marginTop: "14px",
  },

  urlText: {
    marginTop: "4px",
    color: "#0a66c2",
    fontSize: "13px",
    wordBreak: "break-all",
  },
};

export default AdminPage;