import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";

import Navbar from "../components/Layout/Navbar";
import api from "../services/api";
import defaultAvatar from "../assets/default-avatar.png";

const API_ROOT = (api.defaults.baseURL || "https://localhost:7257/api").replace(
  /\/api\/?$/,
  ""
);

export default function NetworkPage() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);

  const currentUserIsEmployer =
    currentUser?.userType === "Employer" ||
    currentUser?.UserType === "Employer" ||
    currentUser?.role === "Employer" ||
    currentUser?.Role === "Employer";

  const [activeTab, setActiveTab] = useState("received");

  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [connections, setConnections] = useState([]);

  const [followers, setFollowers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

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

  const getUserId = (user) => {
    return user?.id || user?.Id || user?.userId || user?.UserId || null;
  };

  const getUsername = (user) => {
    return user?.username || user?.Username || user?.userName || user?.UserName;
  };

  const getFullName = (user) => {
    return (
      user?.fullName ||
      user?.FullName ||
      user?.name ||
      user?.Name ||
      getUsername(user) ||
      "User"
    );
  };

  const getHeadline = (user) => {
    return (
      user?.currentPosition ||
      user?.CurrentPosition ||
      user?.headline ||
      user?.Headline ||
      "Profile"
    );
  };

  const getLocation = (user) => {
    return user?.location || user?.Location || "";
  };

  const getProfileImage = (user) => {
    return (
      user?.profileImage ||
      user?.ProfileImage ||
      user?.profileImageUrl ||
      user?.ProfileImageUrl ||
      user?.userProfileUrl ||
      user?.UserProfileUrl ||
      null
    );
  };

  const getRequestId = (request) => {
    return request?.id || request?.Id || request?.requestId || request?.RequestId;
  };

  const getSender = (request) => {
    return request?.sender || request?.Sender || {};
  };

  const getReceiver = (request) => {
    return request?.receiver || request?.Receiver || {};
  };

  const sameUser = (a, b) => {
    const aId = getUserId(a);
    const bId = getUserId(b);

    if (aId && bId) return String(aId) === String(bId);

    const aUsername = getUsername(a);
    const bUsername = getUsername(b);

    if (aUsername && bUsername) {
      return aUsername.toLowerCase() === bUsername.toLowerCase();
    }

    return false;
  };

  const addUniqueUser = (list, user) => {
    if (!user) return list;

    const exists = list.some((item) => sameUser(item, user));
    if (exists) return list;

    return [user, ...list];
  };

  const removeUser = (list, user) => {
    return list.filter((item) => !sameUser(item, user));
  };

  const addUniqueRequest = (list, request) => {
    const requestId = getRequestId(request);

    if (!requestId) return [request, ...list];

    const exists = list.some((item) => Number(getRequestId(item)) === Number(requestId));
    if (exists) return list;

    return [request, ...list];
  };

  const removeRequestById = (list, requestId) => {
    return list.filter((item) => Number(getRequestId(item)) !== Number(requestId));
  };

  const parseUtcDate = (dateValue) => {
    if (!dateValue) return null;

    if (dateValue instanceof Date) return dateValue;

    const value = String(dateValue);

    if (value.endsWith("Z") || value.includes("+")) {
      return new Date(value);
    }

    return new Date(`${value}Z`);
  };

  const formatTimeAgo = (dateValue) => {
    const date = parseUtcDate(dateValue);

    if (!date || Number.isNaN(date.getTime())) return "";

    const diffMs = Date.now() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return "now";

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} min ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} d ago`;

    return date.toLocaleDateString();
  };

  const getDateValue = (item) => {
    return (
      item?.createdAt ||
      item?.CreatedAt ||
      item?.connectedAt ||
      item?.ConnectedAt ||
      item?.followedAt ||
      item?.FollowedAt
    );
  };

  const fetchCompanyFollowers = async () => {
    if (!currentUserIsEmployer) return;

    try {
      setFollowersLoading(true);

      const res = await api.get("/CompanyFollow/my-followers");
      setFollowers(getResponseArray(res));
    } catch (err) {
      console.error("Fetch company followers failed:", err);
      setFollowers([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const fetchNetworkData = async () => {
    if (currentUserIsEmployer) return;

    try {
      setLoading(true);

      const [receivedRes, sentRes, connectionsRes] = await Promise.all([
        api.get("/Connection/received"),
        api.get("/Connection/sent"),
        api.get("/Connection/my-connections"),
      ]);

      setReceivedRequests(getResponseArray(receivedRes));
      setSentRequests(getResponseArray(sentRes));
      setConnections(getResponseArray(connectionsRes));
    } catch (err) {
      console.error("Fetch network data failed:", err);
      setReceivedRequests([]);
      setSentRequests([]);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserIsEmployer) {
      fetchCompanyFollowers();
    } else {
      fetchNetworkData();
    }
  }, [currentUserIsEmployer]);

  useEffect(() => {
    if (currentUserIsEmployer) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ROOT}/connectionhub`, {
        accessTokenFactory: () => localStorage.getItem("token"),
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveConnectionRequest", (request) => {
      setReceivedRequests((prev) => addUniqueRequest(prev, request));
    });

    connection.on("ConnectionRequestSent", (request) => {
      setSentRequests((prev) => addUniqueRequest(prev, request));
    });

    connection.on("ReceiveConnectionAccepted", (request) => {
      setSentRequests((prev) => removeRequestById(prev, getRequestId(request)));
      setConnections((prev) => addUniqueUser(prev, getReceiver(request)));
      showToast("Connection request accepted.", "success");
    });

    connection.on("ConnectionRequestAcceptedByMe", (request) => {
      setReceivedRequests((prev) =>
        removeRequestById(prev, getRequestId(request))
      );
      setConnections((prev) => addUniqueUser(prev, getSender(request)));
    });

    connection.on("ReceiveConnectionRejected", (request) => {
      setSentRequests((prev) => removeRequestById(prev, getRequestId(request)));
    });

    connection.on("ConnectionRequestRejectedByMe", (request) => {
      setReceivedRequests((prev) =>
        removeRequestById(prev, getRequestId(request))
      );
    });

    connection.on("ReceiveConnectionCancelled", (request) => {
      setReceivedRequests((prev) =>
        removeRequestById(prev, getRequestId(request))
      );
    });

    connection.on("ConnectionRequestCancelledByMe", (request) => {
      setSentRequests((prev) => removeRequestById(prev, getRequestId(request)));
    });

    connection.on("ConnectionRemovedByMe", (removedUser) => {
      setConnections((prev) => removeUser(prev, removedUser));
    });

    connection.on("ReceiveConnectionRemoved", (removedUser) => {
      setConnections((prev) => removeUser(prev, removedUser));
    });

    connection
      .start()
      .catch((err) => console.error("ConnectionHub Network error:", err));

    return () => {
      connection.stop();
    };
  }, [currentUserIsEmployer]);

  useEffect(() => {
    if (!removeTarget) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [removeTarget]);

  const handleAccept = async (request) => {
    const requestId = getRequestId(request);

    if (!requestId) return;

    try {
      await api.post(`/Connection/accept/${requestId}`);

      setReceivedRequests((prev) => removeRequestById(prev, requestId));
      setConnections((prev) => addUniqueUser(prev, getSender(request)));
    } catch (err) {
      console.error("Accept request failed:", err);
      showToast("Failed to accept request.", "error");
    }
  };

  const handleReject = async (request) => {
    const requestId = getRequestId(request);

    if (!requestId) return;

    try {
      await api.post(`/Connection/reject/${requestId}`);
      setReceivedRequests((prev) => removeRequestById(prev, requestId));
    } catch (err) {
      console.error("Reject request failed:", err);
      showToast("Failed to reject request.", "error");
    }
  };

  const handleCancel = async (request) => {
    const requestId = getRequestId(request);

    if (!requestId) return;

    try {
      await api.post(`/Connection/cancel/${requestId}`);
      setSentRequests((prev) => removeRequestById(prev, requestId));
    } catch (err) {
      console.error("Cancel request failed:", err);
      showToast("Failed to cancel request.", "error");
    }
  };

  const handleRemoveConnection = async () => {
    if (!removeTarget) return;

    const username = getUsername(removeTarget);

    if (!username) return;

    try {
      await api.post(`/Connection/remove/${username}`);

      setConnections((prev) => removeUser(prev, removeTarget));
      setRemoveTarget(null);
    } catch (err) {
      console.error("Remove connection failed:", err);
      showToast("Failed to remove connection.", "error");
    }
  };

  const renderPersonRow = ({ user, meta, actions }) => {
    const username = getUsername(user);

    return (
      <div key={getUserId(user) || username || Math.random()} style={styles.personRow}>
        <img src={getImageUrl(getProfileImage(user))} alt="" style={styles.avatar} />

        <div
          style={styles.personInfo}
          onClick={() => username && navigate(`/profile/${username}`)}
        >
          <h3 style={styles.personName}>{getFullName(user)}</h3>

          <p style={styles.personHeadline}>{getHeadline(user)}</p>

          <p style={styles.personMeta}>
            {getLocation(user)}
            {meta ? `${getLocation(user) ? " · " : ""}${meta}` : ""}
          </p>
        </div>

        <div style={styles.rowActions}>{actions}</div>
      </div>
    );
  };

  const renderReceived = () => {
    if (loading) return <p style={styles.emptyText}>Loading requests...</p>;

    if (!receivedRequests.length) {
      return <p style={styles.emptyText}>No received requests.</p>;
    }

    return receivedRequests.map((request) =>
      renderPersonRow({
        user: getSender(request),
        meta: formatTimeAgo(getDateValue(request)),
        actions: (
          <>
            <button style={styles.acceptButton} onClick={() => handleAccept(request)}>
              Accept
            </button>

            <button style={styles.rejectButton} onClick={() => handleReject(request)}>
              Reject
            </button>
          </>
        ),
      })
    );
  };

  const renderSent = () => {
    if (loading) return <p style={styles.emptyText}>Loading requests...</p>;

    if (!sentRequests.length) {
      return <p style={styles.emptyText}>No sent requests.</p>;
    }

    return sentRequests.map((request) =>
      renderPersonRow({
        user: getReceiver(request),
        meta: formatTimeAgo(getDateValue(request)),
        actions: (
          <button style={styles.cancelButton} onClick={() => handleCancel(request)}>
            Cancel
          </button>
        ),
      })
    );
  };

  const renderConnections = () => {
    if (loading) return <p style={styles.emptyText}>Loading connections...</p>;

    if (!connections.length) {
      return <p style={styles.emptyText}>No connections yet.</p>;
    }

    return connections.map((connectionUser) =>
      renderPersonRow({
        user: connectionUser,
        meta: formatTimeAgo(getDateValue(connectionUser)),
        actions: (
          <button
            style={styles.connectedButton}
            onClick={() => setRemoveTarget(connectionUser)}
          >
            Connected
          </button>
        ),
      })
    );
  };

  const tabs = [
    {
      key: "received",
      label: "Received",
      count: receivedRequests.length,
    },
    {
      key: "sent",
      label: "Sent",
      count: sentRequests.length,
    },
    {
      key: "connections",
      label: "Connections",
      count: connections.length,
    },
  ];

  if (currentUserIsEmployer) {
    return (
      <>
        <Navbar />

        <div style={styles.page}>
          <div style={styles.employerContainer}>
            <div style={styles.headerCard}>
              <h2 style={styles.title}>Followers</h2>

              <p style={styles.subtitle}>
                People who follow your company page.
              </p>
            </div>

            <div style={styles.contentCard}>
              {followersLoading && (
                <p style={styles.emptyText}>Loading followers...</p>
              )}

              {!followersLoading && followers.length === 0 && (
                <p style={styles.emptyText}>No followers yet.</p>
              )}

              {!followersLoading &&
                followers.map((follower) =>
                  renderPersonRow({
                    user: {
                      id: follower.followerId || follower.FollowerId,
                      username: follower.username || follower.Username,
                      fullName: follower.fullName || follower.FullName,
                      currentPosition:
                        follower.currentPosition || follower.CurrentPosition,
                      profileImage: follower.profileImage || follower.ProfileImage,
                      location: follower.location || follower.Location,
                    },
                    meta: formatTimeAgo(follower.followedAt || follower.FollowedAt),
                    actions: (
                      <button
                        style={styles.viewButton}
                        onClick={() =>
                          navigate(
                            `/profile/${follower.username || follower.Username}`
                          )
                        }
                      >
                        View
                      </button>
                    ),
                  })
                )}
            </div>
          </div>
        </div>

        {toast && (
          <div
            style={{
              ...styles.toast,
              ...(toast.type === "error" ? styles.toastError : styles.toastSuccess),
            }}
          >
            {toast.message}
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.networkLayout}>
          <aside style={styles.sidebar}>
            <h2 style={styles.sidebarTitle}>Network</h2>

            <div style={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.key ? styles.activeTab : {}),
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>

                  {tab.count > 0 && (
                    <span style={styles.tabCount}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <main style={styles.main}>
            <div style={styles.headerCard}>
              <h2 style={styles.title}>
                {activeTab === "received" && "Received requests"}
                {activeTab === "sent" && "Sent requests"}
                {activeTab === "connections" && "Connections"}
              </h2>

              <p style={styles.subtitle}>
                {activeTab === "received" &&
                  "People who want to connect with you."}
                {activeTab === "sent" &&
                  "Connection requests you have sent."}
                {activeTab === "connections" &&
                  "People you are connected with."}
              </p>
            </div>

            <div style={styles.contentCard}>
              {activeTab === "received" && renderReceived()}
              {activeTab === "sent" && renderSent()}
              {activeTab === "connections" && renderConnections()}
            </div>
          </main>
        </div>
      </div>

      {removeTarget && (
        <div style={styles.modalOverlay} onClick={() => setRemoveTarget(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Remove connection?</h3>

            <p style={styles.modalText}>
              Do you want to remove this connection?
            </p>

            <div style={styles.modalActions}>
              <button
                type="button"
                style={styles.modalCancelButton}
                onClick={() => setRemoveTarget(null)}
              >
                Cancel
              </button>

              <button
                type="button"
                style={styles.modalRemoveButton}
                onClick={handleRemoveConnection}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          style={{
            ...styles.toast,
            ...(toast.type === "error" ? styles.toastError : styles.toastSuccess),
          }}
        >
          {toast.message}
        </div>
      )}
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f3f2ef",
    padding: "24px 0 60px",
  },

  networkLayout: {
    width: "1120px",
    maxWidth: "1120px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: 18,
  },

  employerContainer: {
    width: "820px",
    maxWidth: "820px",
    margin: "0 auto",
  },

  sidebar: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 16,
    height: "fit-content",
    position: "sticky",
    top: 84,
  },

  sidebarTitle: {
    margin: "0 0 16px",
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
  },

  tabs: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  tabButton: {
    border: "none",
    backgroundColor: "transparent",
    borderRadius: 8,
    padding: "11px 12px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 700,
    color: "#222",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#eef3f8",
    color: "#0a66c2",
  },

  tabCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#d11124",
    color: "#fff",
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 6px",
  },

  main: {
    minWidth: 0,
  },

  headerCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#111",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "#666",
  },

  contentCard: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 12,
    overflow: "hidden",
  },

  personRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderBottom: "1px solid #eee",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  personInfo: {
    flex: 1,
    minWidth: 0,
    cursor: "pointer",
  },

  personName: {
    margin: "0 0 4px",
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  },

  personHeadline: {
    margin: "0 0 3px",
    fontSize: 14,
    color: "#444",
  },

  personMeta: {
    margin: 0,
    fontSize: 13,
    color: "#777",
  },

  rowActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  acceptButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#0a66c2",
    color: "#fff",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  rejectButton: {
    border: "1px solid #999",
    backgroundColor: "#fff",
    color: "#444",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  cancelButton: {
    border: "1px solid #b24020",
    backgroundColor: "#fff",
    color: "#b24020",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  connectedButton: {
    border: "1px solid #057642",
    backgroundColor: "#e6f4ea",
    color: "#057642",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  viewButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    borderRadius: 999,
    padding: "7px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyText: {
    padding: 18,
    color: "#666",
    fontSize: 14,
  },

  modalOverlay: {
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
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
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

  modalCancelButton: {
    border: "1px solid #ccc",
    backgroundColor: "#fff",
    color: "#333",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  modalRemoveButton: {
    border: "1px solid #b24020",
    backgroundColor: "#b24020",
    color: "#fff",
    borderRadius: 999,
    padding: "8px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  toast: {
    position: "fixed",
    top: 80,
    left: "50%",
    transform: "translateX(-50%)",
    borderRadius: 999,
    padding: "10px 18px",
    color: "#fff",
    fontWeight: 700,
    fontSize: 14,
    zIndex: 99999,
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
  },

  toastSuccess: {
    backgroundColor: "#057642",
  },

  toastError: {
    backgroundColor: "#b24020",
  },
};