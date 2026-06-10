import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";

const API_BASE_URL = "https://localhost:7257";

export default function EmployerFollowersSection({ isOwner }) {
  const navigate = useNavigate();

  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getResponseData = (res) => {
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.data?.data)) return res.data.data;
    if (Array.isArray(res?.data?.Data)) return res.data.Data;
    return [];
  };

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
  };

  const fetchFollowers = async () => {
    if (!isOwner) return;

    try {
      setLoading(true);
      const res = await api.get("/CompanyFollow/my-followers");
      setFollowers(getResponseData(res));
    } catch (err) {
      console.error("Fetch company followers failed:", err);
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowers();
  }, [isOwner]);

  if (!isOwner) return null;

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.title}>Followers</h2>
          <p style={styles.subText}>
            People who follow your company page.
          </p>
        </div>

        <span style={styles.count}>{followers.length}</span>
      </div>

      {loading && <p style={styles.info}>Loading followers...</p>}

      {!loading && followers.length === 0 && (
        <p style={styles.info}>No followers yet.</p>
      )}

      {!loading &&
        followers.slice(0, 6).map((follower) => (
          <div key={follower.followerId || follower.username} style={styles.item}>
            <img
              src={getImageUrl(follower.profileImage)}
              alt=""
              style={styles.avatar}
            />

            <div
              style={styles.infoBox}
              onClick={() => navigate(`/profile/${follower.username}`)}
            >
              <h3 style={styles.name}>
                {follower.fullName || follower.username}
              </h3>

              <p style={styles.headline}>
                {follower.currentPosition || "Profile"}
              </p>

              {follower.location && (
                <p style={styles.location}>{follower.location}</p>
              )}
            </div>

            <button
              type="button"
              style={styles.viewButton}
              onClick={() => navigate(`/profile/${follower.username}`)}
            >
              View
            </button>
          </div>
        ))}
    </div>
  );
}

const styles = {
  card: {
    width: "100%",
    maxWidth: 820,
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    boxSizing: "border-box",
    boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: "#222",
  },

  subText: {
    margin: "5px 0 0",
    fontSize: 14,
    color: "#666",
  },

  count: {
    minWidth: 34,
    height: 34,
    borderRadius: "50%",
    backgroundColor: "#eef3f8",
    color: "#0a66c2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
  },

  item: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderTop: "1px solid #eee",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  infoBox: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },

  name: {
    margin: "0 0 4px",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  },

  headline: {
    margin: "0 0 3px",
    fontSize: 14,
    color: "#444",
  },

  location: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },

  viewButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  info: {
    margin: "12px 0 0",
    color: "#666",
    fontSize: 14,
  },
};