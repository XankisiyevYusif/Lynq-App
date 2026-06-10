import React, { useEffect, useState } from "react";
import api from "../../../services/api";

const EmployerFollowButton = ({
  username,
  isOwner = false,
  showToast,
  onChanged,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [canFollow, setCanFollow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getResponseData = (res) => {
    if (res?.data?.data) return res.data.data;
    if (res?.data?.Data) return res.data.Data;
    return res?.data;
  };

  const fetchStatus = async () => {
    if (!username || isOwner) return;

    try {
      const res = await api.get(`/CompanyFollow/status/${username}`);
      const data = getResponseData(res);

      setIsFollowing(data?.isFollowing ?? data?.IsFollowing ?? false);
      setCanFollow(data?.canFollow ?? data?.CanFollow ?? true);

      onChanged?.({
        isFollowing: data?.isFollowing ?? data?.IsFollowing ?? false,
        followerCount: data?.followerCount ?? data?.FollowerCount,
      });
    } catch (err) {
      console.error("Failed to fetch company follow status:", err);
      setIsFollowing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [username, isOwner]);

  useEffect(() => {
    if (isConfirmOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isConfirmOpen]);

  const handleFollow = async () => {
    if (!username || loading) return;

    try {
      setLoading(true);

      const res = await api.post(`/CompanyFollow/follow/${username}`);
      const data = getResponseData(res);

      setIsFollowing(true);

      onChanged?.({
        isFollowing: true,
        followerCount: data?.followerCount ?? data?.FollowerCount,
      });

      showToast?.("You are now following this company.", "success");
    } catch (err) {
      console.error("Follow company failed:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        "Failed to follow company.";

      showToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!username || loading) return;

    try {
      setLoading(true);

      const res = await api.delete(`/CompanyFollow/unfollow/${username}`);
      const data = getResponseData(res);

      setIsFollowing(false);
      setIsConfirmOpen(false);

      onChanged?.({
        isFollowing: false,
        followerCount: data?.followerCount ?? data?.FollowerCount,
      });

      showToast?.("Company unfollowed.", "success");
    } catch (err) {
      console.error("Unfollow company failed:", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        "Failed to unfollow company.";

      showToast?.(message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (isOwner || !canFollow) return null;

  return (
    <>
      <button
        type="button"
        style={{
          ...styles.button,
          ...(isFollowing ? styles.followingButton : styles.followButton),
        }}
        disabled={loading}
        onClick={() => {
          if (isFollowing) {
            setIsConfirmOpen(true);
          } else {
            handleFollow();
          }
        }}
      >
        {loading ? "Loading..." : isFollowing ? "Following" : "Follow"}
      </button>

      {isConfirmOpen && (
        <div style={styles.overlay} onClick={() => setIsConfirmOpen(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Unfollow company?</h3>

            <p style={styles.modalText}>
              You will stop following this company. You can follow it again later.
            </p>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.cancelButton}
                disabled={loading}
                onClick={() => setIsConfirmOpen(false)}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.removeButton}
                disabled={loading}
                onClick={handleUnfollow}
              >
                {loading ? "Removing..." : "Unfollow"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const styles = {
  button: {
    borderRadius: "999px",
    padding: "8px 18px",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  followButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
  },

  followingButton: {
    border: "1px solid #057642",
    backgroundColor: "#e6f4ea",
    color: "#057642",
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
    lineHeight: 1.5,
    color: "#555",
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

  removeButton: {
    border: "1px solid #b24020",
    backgroundColor: "#b24020",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default EmployerFollowButton;