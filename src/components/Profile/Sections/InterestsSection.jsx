import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";

const API_ROOT = (api.defaults.baseURL || "https://localhost:7257/api").replace(
  /\/api\/?$/,
  ""
);

export default function InterestsSection({ isOwner, showToast }) {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmCompany, setConfirmCompany] = useState(null);

  const getResponseArray = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.Data)) return res.data.Data;
    return [];
  };

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ROOT}/${path.replace(/^\/+/, "")}`;
  };

  const getUsername = (company) => {
    return company?.username || company?.Username;
  };

  const getCompanyName = (company) => {
    return (
      company?.companyName ||
      company?.CompanyName ||
      getUsername(company) ||
      "Company"
    );
  };

  const getIndustry = (company) => {
    return company?.industry || company?.Industry || "Company";
  };

  const getLogo = (company) => {
    return company?.logoUrl || company?.LogoUrl;
  };

  const getLocation = (company) => {
    return company?.location || company?.Location;
  };

  const fetchFollowedCompanies = async () => {
    if (!isOwner) return;

    try {
      setLoading(true);

      const res = await api.get("/CompanyFollow/my-followed-companies");
      setCompanies(getResponseArray(res));
    } catch (err) {
      console.error("Fetch followed companies failed:", err);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowedCompanies();
  }, [isOwner]);

  useEffect(() => {
    if (!confirmCompany) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [confirmCompany]);

  const handleUnfollow = async () => {
    const username = getUsername(confirmCompany);

    if (!username) return;

    try {
      await api.delete(`/CompanyFollow/unfollow/${username}`);

      setCompanies((prev) =>
        prev.filter((company) => getUsername(company) !== username)
      );

      setConfirmCompany(null);
      showToast?.("Company unfollowed.", "success");
    } catch (err) {
      console.error("Unfollow company failed:", err);
      showToast?.("Failed to unfollow company.", "error");
    }
  };

  if (!isOwner) return null;

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Interests</h2>
          <p style={styles.subText}>Companies you follow</p>
        </div>

        {loading && <p style={styles.info}>Loading interests...</p>}

        {!loading && companies.length === 0 && (
          <p style={styles.info}>You are not following any companies yet.</p>
        )}

        {!loading &&
          companies.map((company) => {
            const username = getUsername(company);

            return (
              <div
                key={company.employerId || company.EmployerId || username}
                style={styles.item}
              >
                <img
                  src={getImageUrl(getLogo(company))}
                  alt=""
                  style={styles.logo}
                />

                <div
                  style={styles.companyInfo}
                  onClick={() => username && navigate(`/profile/${username}`)}
                >
                  <h3 style={styles.companyName}>{getCompanyName(company)}</h3>

                  <p style={styles.industry}>{getIndustry(company)}</p>

                  {getLocation(company) && (
                    <p style={styles.location}>{getLocation(company)}</p>
                  )}
                </div>

                <button
                  type="button"
                  style={styles.followingButton}
                  onClick={() => setConfirmCompany(company)}
                >
                  Following
                </button>
              </div>
            );
          })}
      </div>

      {confirmCompany && (
        <div style={styles.overlay} onClick={() => setConfirmCompany(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Unfollow company?</h3>

            <p style={styles.modalText}>
              Do you want to unfollow{" "}
              <strong>{getCompanyName(confirmCompany)}</strong>?
            </p>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                onClick={() => setConfirmCompany(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.unfollowButton}
                onClick={handleUnfollow}
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  card: {
    width: "100%",
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    boxSizing: "border-box",
  },

  header: {
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: "#222",
  },

  subText: {
    margin: "5px 0 0",
    color: "#666",
    fontSize: 14,
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "13px 0",
    borderTop: "1px solid #eee",
  },

  logo: {
    width: 56,
    height: 56,
    borderRadius: 10,
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  companyInfo: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },

  companyName: {
    margin: "0 0 4px",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  },

  industry: {
    margin: "0 0 3px",
    fontSize: 14,
    color: "#444",
  },

  location: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },

  followingButton: {
    border: "1px solid #057642",
    backgroundColor: "#e6f4ea",
    color: "#057642",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  info: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: 14,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },

  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 12px 34px rgba(0,0,0,0.22)",
  },

  modalTitle: {
    margin: "0 0 10px",
    fontSize: 20,
    fontWeight: 700,
    color: "#111",
  },

  modalText: {
    margin: "0 0 20px",
    fontSize: 14,
    color: "#555",
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  cancelButton: {
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#333",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  unfollowButton: {
    border: "1px solid #b24020",
    backgroundColor: "#b24020",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};