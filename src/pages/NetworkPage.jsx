import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";

import Navbar from "../components/Layout/Navbar";
import api, { API_ROOT } from "../services/api";
import defaultAvatar from "../assets/default-avatar.png";
import { resolveMediaUrl } from "../utils/mediaUrl";
import "./NetworkPage.css";

// API_ROOT is imported from api.js

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

  const [jobseekers, setJobseekers] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [followedCompanies, setFollowedCompanies] = useState([]);
  const [recommendedConnections, setRecommendedConnections] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [jobseekersLoading, setJobseekersLoading] = useState(false);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [followedCompaniesLoading, setFollowedCompaniesLoading] =
    useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 2500);
  };

  const getResponseArray = (res) => {
    const data = res?.data;
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.Items)) return data.Items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.Data)) return data.Data;
    if (data.data && Array.isArray(data.data.items)) return data.data.items;
    if (data.data && Array.isArray(data.data.Items)) return data.data.Items;
    if (data.Data && Array.isArray(data.Data.items)) return data.Data.items;
    if (data.Data && Array.isArray(data.Data.Items)) return data.Data.Items;
    return [];
  };

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

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
      user?.industry ||
      user?.Industry ||
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
    return (
      request?.id || request?.Id || request?.requestId || request?.RequestId
    );
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

    const exists = list.some(
      (item) => Number(getRequestId(item)) === Number(requestId),
    );
    if (exists) return list;

    return [request, ...list];
  };

  const removeRequestById = (list, requestId) => {
    return list.filter(
      (item) => Number(getRequestId(item)) !== Number(requestId),
    );
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

  const fetchJobseekers = async () => {
    try {
      setJobseekersLoading(true);
      const res = await api.get("/User/jobseekers");
      setJobseekers(getResponseArray(res));
    } catch (err) {
      console.error("Fetch jobseekers failed:", err);
      setJobseekers([]);
    } finally {
      setJobseekersLoading(false);
    }
  };

  const fetchEmployers = async () => {
    try {
      setEmployersLoading(true);
      const res = await api.get("/User/employers");
      setEmployers(getResponseArray(res));
    } catch (err) {
      console.error("Fetch employers failed:", err);
      setEmployers([]);
    } finally {
      setEmployersLoading(false);
    }
  };

  const fetchFollowedCompanies = async () => {
    if (currentUserIsEmployer) return;
    try {
      setFollowedCompaniesLoading(true);
      const res = await api.get("/CompanyFollow/my-followed-companies");
      setFollowedCompanies(getResponseArray(res));
    } catch (err) {
      console.error("Fetch followed companies failed:", err);
      setFollowedCompanies([]);
    } finally {
      setFollowedCompaniesLoading(false);
    }
  };

  const fetchRecommendedConnections = async () => {
    if (currentUserIsEmployer) return;
    try {
      setRecommendationsLoading(true);
      const [recommendedResponse, fallbackResponse, receivedResponse, sentResponse, connectionsResponse] = await Promise.all([
        api.get("/User/recommended", { params: { pageNumber: 1, pageSize: 12 } }).catch(() => null),
        api.get("/User/jobseekers").catch(() => null),
        api.get("/Connection/received").catch(() => null),
        api.get("/Connection/sent").catch(() => null),
        api.get("/Connection/my-connections").catch(() => null),
      ]);
      const received = getResponseArray(receivedResponse);
      const sent = getResponseArray(sentResponse);
      const connected = getResponseArray(connectionsResponse);
      const isExcluded = (candidate) =>
        sameUser(candidate, currentUser) ||
        connected.some((item) => sameUser(item, candidate)) ||
        sent.some((item) => sameUser(getReceiver(item), candidate)) ||
        received.some((item) => sameUser(getSender(item), candidate));

      const ranked = getResponseArray(recommendedResponse);
      const fallback = getResponseArray(fallbackResponse);
      const source = [...ranked, ...fallback].filter((candidate, index, list) =>
        list.findIndex((item) => sameUser(item, candidate)) === index,
      );
      const list = source.filter((candidate) => {
        const type = candidate?.userType || candidate?.UserType || "";
        const status = candidate?.connectionStatus || candidate?.ConnectionStatus || "none";
        const connected = candidate?.isConnected || candidate?.IsConnected;
        return type !== "Employer" && !connected && status === "none" && !isExcluded(candidate);
      });
      setRecommendedConnections(list.slice(0, 6));
    } catch (error) {
      console.error("Fetch recommended connections failed:", error);
      setRecommendedConnections([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const getConnectionStatusForUser = (user) => {
    if (sameUser(user, currentUser)) return "self";
    if (connections.some((c) => sameUser(c, user))) return "connected";
    if (sentRequests.some((r) => sameUser(getReceiver(r), user)))
      return "pending_sent";
    if (receivedRequests.some((r) => sameUser(getSender(r), user)))
      return "pending_received";
    return "none";
  };

  const handleConnectUser = async (targetUser) => {
    const username = getUsername(targetUser);
    if (!username) return;

    try {
      await api.post(`/Connection/send/${username}`);
      showToast("Connection request sent.", "success");
      setRecommendedConnections((current) => removeUser(current, targetUser));
      fetchNetworkData();
    } catch (err) {
      console.error("Connect action failed:", err);
      showToast("Failed to send connection request.", "error");
    }
  };

  const handleCancelRequestForUser = async (targetUser) => {
    const req = sentRequests.find((r) => sameUser(getReceiver(r), targetUser));
    const requestId = getRequestId(req);
    if (!requestId) return;

    try {
      await api.post(`/Connection/cancel/${requestId}`);
      showToast("Connection request cancelled.", "success");
      fetchNetworkData();
    } catch (err) {
      console.error("Cancel action failed:", err);
      showToast("Failed to cancel connection request.", "error");
    }
  };

  const handleAcceptRequestForUser = async (targetUser) => {
    const req = receivedRequests.find((r) =>
      sameUser(getSender(r), targetUser),
    );
    const requestId = getRequestId(req);
    if (!requestId) return;

    try {
      await api.post(`/Connection/accept/${requestId}`);
      showToast("Connection request accepted.", "success");
      fetchNetworkData();
    } catch (err) {
      console.error("Accept action failed:", err);
      showToast("Failed to accept connection request.", "error");
    }
  };

  const handleFollowCompany = async (company) => {
    const username = getUsername(company);
    if (!username) return;

    try {
      await api.post(`/CompanyFollow/follow/${username}`);
      showToast(`Following ${getFullName(company)}`, "success");
      fetchFollowedCompanies();
    } catch (err) {
      console.error("Follow company failed:", err);
      showToast("Failed to follow company.", "error");
    }
  };

  const handleUnfollowCompany = async (company) => {
    const username = getUsername(company);
    if (!username) return;

    try {
      await api.delete(`/CompanyFollow/unfollow/${username}`);
      showToast(`Unfollowed ${getFullName(company)}`, "success");
      fetchFollowedCompanies();
    } catch (err) {
      console.error("Unfollow company failed:", err);
      showToast("Failed to unfollow company.", "error");
    }
  };

  useEffect(() => {
    if (currentUserIsEmployer) {
      fetchCompanyFollowers();
      setActiveTab("followers");
    } else {
      fetchNetworkData();
      setActiveTab("received");
    }
  }, [currentUserIsEmployer]);

  useEffect(() => {
    fetchRecommendedConnections();
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
        removeRequestById(prev, getRequestId(request)),
      );
      setConnections((prev) => addUniqueUser(prev, getSender(request)));
    });

    connection.on("ReceiveConnectionRejected", (request) => {
      setSentRequests((prev) => removeRequestById(prev, getRequestId(request)));
    });

    connection.on("ConnectionRequestRejectedByMe", (request) => {
      setReceivedRequests((prev) =>
        removeRequestById(prev, getRequestId(request)),
      );
    });

    connection.on("ReceiveConnectionCancelled", (request) => {
      setReceivedRequests((prev) =>
        removeRequestById(prev, getRequestId(request)),
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
      <div
        key={getUserId(user) || username || Math.random()}
        className="network-person-row"
        style={styles.personRow}
      >
        <img
          src={getImageUrl(getProfileImage(user))}
          alt=""
          style={styles.avatar}
          onError={(e) => {
            e.currentTarget.src = defaultAvatar;
          }}
        />

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
            <button
              style={styles.acceptButton}
              onClick={() => handleAccept(request)}
            >
              Accept
            </button>

            <button
              style={styles.rejectButton}
              onClick={() => handleReject(request)}
            >
              Reject
            </button>
          </>
        ),
      }),
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
          <button
            style={styles.cancelButton}
            onClick={() => handleCancel(request)}
          >
            Cancel
          </button>
        ),
      }),
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
      }),
    );
  };

  const tabs = [
    ...(currentUserIsEmployer
      ? [
          {
            key: "followers",
            label: "Followers",
            count: followers.length,
          },
        ]
      : [
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
        ]),
  ];

  const renderJobseekers = () => {
    if (jobseekersLoading)
      return <p style={styles.emptyText}>Loading users...</p>;

    if (!jobseekers.length) {
      return <p style={styles.emptyText}>No users found.</p>;
    }

    return jobseekers.map((user) => {
      let actions = null;
      if (currentUserIsEmployer) {
        actions = (
          <button
            style={styles.viewButton}
            onClick={() => navigate(`/profile/${getUsername(user)}`)}
          >
            View Profile
          </button>
        );
      } else {
        const status = getConnectionStatusForUser(user);
        if (status === "self") {
          actions = (
            <span style={{ color: "var(--app-muted)", fontSize: 13, fontWeight: 600 }}>
              You
            </span>
          );
        } else if (status === "connected") {
          actions = (
            <button
              style={styles.connectedButton}
              onClick={() => setRemoveTarget(user)}
            >
              Connected
            </button>
          );
        } else if (status === "pending_sent") {
          actions = (
            <button
              style={styles.cancelButton}
              onClick={() => handleCancelRequestForUser(user)}
            >
              Pending
            </button>
          );
        } else if (status === "pending_received") {
          actions = (
            <button
              style={styles.acceptButton}
              onClick={() => handleAcceptRequestForUser(user)}
            >
              Accept
            </button>
          );
        } else {
          actions = (
            <button
              style={styles.viewButton}
              onClick={() => handleConnectUser(user)}
            >
              Connect
            </button>
          );
        }
      }

      return renderPersonRow({
        user,
        meta: null,
        actions,
      });
    });
  };

  const renderEmployers = () => {
    if (employersLoading)
      return <p style={styles.emptyText}>Loading companies...</p>;

    if (!employers.length) {
      return <p style={styles.emptyText}>No companies found.</p>;
    }

    return employers.map((company) => {
      let actions = null;
      if (currentUserIsEmployer) {
        actions = (
          <button
            style={styles.viewButton}
            onClick={() => navigate(`/profile/${getUsername(company)}`)}
          >
            View Profile
          </button>
        );
      } else {
        const isFollowing = followedCompanies.some(
          (c) => getUsername(c) === getUsername(company),
        );

        if (isFollowing) {
          actions = (
            <button
              style={styles.connectedButton}
              onClick={() => handleUnfollowCompany(company)}
            >
              Following
            </button>
          );
        } else {
          actions = (
            <button
              style={styles.viewButton}
              onClick={() => handleFollowCompany(company)}
            >
              Follow
            </button>
          );
        }
      }

      return renderPersonRow({
        user: company,
        meta: company.industry || company.Industry || null,
        actions,
      });
    });
  };

  const renderRecommendedConnections = () => {
    if (currentUserIsEmployer) return null;

    return (
      <section className="network-recommendations-card">
        <div className="network-recommendations-heading">
          <div><span>Grow your network</span><h2>People you may know</h2></div>
          <small>Based on skills, education, experience and location</small>
        </div>

        {recommendationsLoading ? (
          <div className="network-recommendation-loading">Loading recommendations...</div>
        ) : recommendedConnections.length ? (
          <div className="network-recommendation-grid">
            {recommendedConnections.map((candidate) => {
              const username = getUsername(candidate);
              const reason = candidate?.recommendationReason || candidate?.RecommendationReason || "Recommended for you";
              return (
                <article className="network-recommendation-card" key={getUserId(candidate) || username}>
                  <button className="network-recommendation-profile" type="button" onClick={() => username && navigate(`/profile/${username}`)}>
                    <img src={getImageUrl(getProfileImage(candidate))} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} />
                    <strong>{getFullName(candidate)}</strong>
                    <span>{getHeadline(candidate)}</span>
                    <small>{reason}</small>
                  </button>
                  <button className="network-recommendation-connect" type="button" onClick={() => handleConnectUser(candidate)}>Connect</button>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="network-recommendation-empty">Complete your skills, experience and location to get better connection suggestions.</div>
        )}
      </section>
    );
  };

  return (
    <>
      <Navbar />

      <div className="network-page" style={styles.page}>
        <div className="network-layout" style={styles.networkLayout}>
          <aside className="network-sidebar" style={styles.sidebar}>
            <h2 style={styles.sidebarTitle}>
              {currentUserIsEmployer ? "Talent" : "Network"}
            </h2>

            <div style={styles.tabs}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`network-tab ${activeTab === tab.key ? "is-active" : ""}`}
                  style={{
                    ...styles.tabButton,
                    ...(activeTab === tab.key ? styles.activeTab : {}),
                  }}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.label}</span>

                  {tab.count > 0 && (
                    <span
                      className={`network-tab-count ${
                        tab.key === "connections" ? "is-connections" : ""
                      }`}
                      style={styles.tabCount}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </aside>

          <main className="network-main" style={styles.main}>
            <div className="network-header-card" style={styles.headerCard}>
              <span className="network-eyebrow">
                {currentUserIsEmployer
                  ? "Company talent workspace"
                  : "Manage your network"}
              </span>
              <h2 style={styles.title}>
                {activeTab === "received" && "Received requests"}
                {activeTab === "sent" && "Sent requests"}
                {activeTab === "connections" && "Connections"}
                {activeTab === "followers" && "Followers"}
              </h2>

              <p style={styles.subtitle}>
                {activeTab === "received" &&
                  "People who want to connect with you."}
                {activeTab === "sent" && "Connection requests you have sent."}
                {activeTab === "connections" &&
                  "People you are connected with."}
                {activeTab === "followers" &&
                  "People who follow your company page."}
              </p>
            </div>

            <div className="network-content-card" style={styles.contentCard}>
              {activeTab === "received" && renderReceived()}
              {activeTab === "sent" && renderSent()}
              {activeTab === "connections" && renderConnections()}
              {activeTab === "followers" &&
                (followersLoading ? (
                  <p style={styles.emptyText}>Loading followers...</p>
                ) : !followers.length ? (
                  <p style={styles.emptyText}>No followers yet.</p>
                ) : (
                  followers.map((follower) =>
                    renderPersonRow({
                      user: {
                        id: follower.followerId || follower.FollowerId,
                        username: follower.username || follower.Username,
                        fullName: follower.fullName || follower.FullName,
                        currentPosition:
                          follower.currentPosition || follower.CurrentPosition,
                        profileImage:
                          follower.profileImage || follower.ProfileImage,
                        location: follower.location || follower.Location,
                      },
                      meta: formatTimeAgo(
                        follower.followedAt || follower.FollowedAt,
                      ),
                      actions: (
                        <button
                          style={styles.viewButton}
                          onClick={() =>
                            navigate(
                              `/profile/${follower.username || follower.Username}`,
                            )
                          }
                        >
                          View
                        </button>
                      ),
                    }),
                  )
                ))}
            </div>

            {renderRecommendedConnections()}
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
            ...(toast.type === "error"
              ? styles.toastError
              : styles.toastSuccess),
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
    backgroundColor: "var(--app-bg)",
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
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
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
    color: "var(--app-text)",
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
    color: "var(--app-text-soft)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "var(--app-accent-soft)",
    color: "var(--app-accent)",
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
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },

  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "var(--app-text)",
  },

  subtitle: {
    margin: "6px 0 0",
    fontSize: 14,
    color: "var(--app-muted)",
  },

  contentCard: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 12,
    overflow: "hidden",
  },

  personRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    borderBottom: "1px solid var(--app-border)",
  },

  avatar: {
    width: 58,
    height: 58,
    borderRadius: "50%",
    objectFit: "cover",
    backgroundColor: "var(--app-surface-2)",
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
    color: "var(--app-text)",
  },

  personHeadline: {
    margin: "0 0 3px",
    fontSize: 14,
    color: "var(--app-text-soft)",
  },

  personMeta: {
    margin: 0,
    fontSize: 13,
    color: "var(--app-muted)",
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
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text-soft)",
    borderRadius: 999,
    padding: "7px 15px",
    fontWeight: 700,
    cursor: "pointer",
  },

  cancelButton: {
    border: "1px solid #b24020",
    backgroundColor: "var(--app-surface)",
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
    backgroundColor: "var(--app-surface)",
    color: "#0a66c2",
    borderRadius: 999,
    padding: "7px 16px",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyText: {
    padding: 18,
    color: "var(--app-muted)",
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
    backgroundColor: "var(--app-surface)",
    borderRadius: 12,
    padding: 22,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },

  modalTitle: {
    margin: "0 0 10px",
    fontSize: 20,
    fontWeight: 700,
    color: "var(--app-text)",
  },

  modalText: {
    margin: "0 0 20px",
    fontSize: 14,
    color: "var(--app-muted)",
    lineHeight: 1.5,
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
  },

  modalCancelButton: {
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-text-soft)",
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
