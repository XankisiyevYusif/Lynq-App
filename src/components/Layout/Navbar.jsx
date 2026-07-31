import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import * as signalR from "@microsoft/signalr";

import defaultAvatar from "../../assets/default-avatar.png";

import SearchModal from "../Search/SearchModal";

import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import {
  getAccountHomePath,
  isEmployerAccount,
} from "../../utils/accountType";

import { clearNavbarUnread } from "../../store/messageSlice";

import {
  setPendingReceivedCount,
  incrementConnectionUpdateCount,
  clearConnectionUpdateCount,
} from "../../store/connectionSlice";

import "./Navbar.css";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const navIconPaths = {
  home: (
    <>
      <path d="M3 10.8 12 3l9 7.8" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  network: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  jobs: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12.5a20 20 0 0 0 18 0" />
      <path d="M10 12h4" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  messages: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </>
  ),
  notifications: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
};

const NavIcon = ({ name }) => (
  <svg
    className="navbar-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {navIconPaths[name]}
  </svg>
);

const unwrapList = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.Data)) {
    return response.data.Data;
  }

  return [];
};

const formatBadgeCount = (count) => {
  const numericCount = Number(count || 0);

  if (numericCount > 99) {
    return "99+";
  }

  return numericCount;
};

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const accountMenuRef = useRef(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const user = useSelector((state) => state.user.user);
  const isEmployer = isEmployerAccount(user);
  const homePath = getAccountHomePath(user);

  const navbarUnreadCount = useSelector((state) =>
    Number(state.messages.navbarUnreadCount || 0),
  );

  const notificationUnreadCount = useSelector((state) =>
    Number(state.notifications.unreadCount || 0),
  );

  const pendingReceivedCount = useSelector((state) =>
    Number(state.connections.pendingReceivedCount || 0),
  );

  const connectionUpdateCount = useSelector((state) =>
    Number(state.connections.connectionUpdateCount || 0),
  );

  const networkBadgeCount = pendingReceivedCount + connectionUpdateCount;

  const isHome = isEmployer
    ? location.pathname === "/company/dashboard"
    : location.pathname === "/home";

  const isNetwork = isEmployer
    ? location.pathname.startsWith("/company/talent")
    : location.pathname.startsWith("/network");

  const isJobs = isEmployer
    ? location.pathname.startsWith("/company/hiring") ||
      location.pathname.startsWith("/jobs/")
    : location.pathname.startsWith("/jobs");

  const isMessages = location.pathname.startsWith("/messages");

  const isNotifications = location.pathname.startsWith("/notifications");

  const isProfile = location.pathname.startsWith("/profile");

  const profileImage =
    user?.photoUrl ||
    user?.profileImage ||
    user?.basicInfo?.profileImage ||
    user?.companyInfo?.logoUrl ||
    user?.company?.logoUrl ||
    "";

  const profileImageUrl = resolveMediaUrl(profileImage, defaultAvatar);
  const username = user?.username || user?.basicInfo?.username || "";
  const displayName =
    user?.fullName ||
    user?.basicInfo?.fullName ||
    user?.companyInfo?.name ||
    username ||
    "Nexora member";

  useEffect(() => {
    const close = (event) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  const handleMessagesClick = () => {
    /*
     * Navbar badge silinir.
     * Chat item-lərdəki unread count qalır.
     */
    dispatch(clearNavbarUnread());
  };

  /*
   * Connection request badge və SignalR.
   */
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || isEmployer) {
      return undefined;
    }

    let connection;

    const fetchPendingRequestsCount = async () => {
      try {
        const response = await api.get("/Connection/received");

        const requests = unwrapList(response);

        dispatch(setPendingReceivedCount(requests.length));
      } catch (error) {
        console.error("Failed to fetch connection request count:", error);
      }
    };

    const connect = async () => {
      await fetchPendingRequestsCount();

      connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_ROOT}/connectionhub`, {
          accessTokenFactory: () => localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .build();

      connection.on("ReceiveConnectionRequest", fetchPendingRequestsCount);

      connection.on("ReceiveConnectionCancelled", fetchPendingRequestsCount);

      connection.on("ConnectionRequestAcceptedByMe", fetchPendingRequestsCount);

      connection.on("ConnectionRequestRejectedByMe", fetchPendingRequestsCount);

      connection.on("ReceiveConnectionAccepted", () => {
        dispatch(incrementConnectionUpdateCount());
      });

      connection.on("ConnectedDirectlyByMe", () => {
        dispatch(incrementConnectionUpdateCount());
      });

      connection.onreconnected(() => {
        fetchPendingRequestsCount();
      });

      try {
        await connection.start();

        console.log("ConnectionHub connected in Navbar");
      } catch (error) {
        console.error("ConnectionHub error in Navbar:", error);
      }
    };

    connect();

    return () => {
      connection?.stop();
    };
  }, [dispatch, isEmployer]);

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to={homePath} className="navbar-logo">
            nexora<span>.</span>
          </Link>

          <div
            className={`navbar-search-wrapper ${
              location.pathname === "/search" ? "is-search-page" : ""
            }`}
          >
            <SearchModal />
          </div>
        </div>

        <div className="navbar-menu">
          <div className="navbar-item">
            <Link
              to={homePath}
              className={`navbar-link ${isHome ? "active" : ""}`}
              aria-current={isHome ? "page" : undefined}
            >
              <NavIcon name={isEmployer ? "dashboard" : "home"} />

              <span>{isEmployer ? "Dashboard" : "Home"}</span>
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to={isEmployer ? "/company/talent" : "/network"}
              className={`navbar-link ${isNetwork ? "active" : ""}`}
              onClick={() => dispatch(clearConnectionUpdateCount())}
              aria-current={isNetwork ? "page" : undefined}
            >
              <NavIcon name="network" />

              <span>{isEmployer ? "Talent" : "Network"}</span>

              {!isEmployer && networkBadgeCount > 0 && (
                <span className="navbar-badge">
                  {formatBadgeCount(networkBadgeCount)}
                </span>
              )}
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to={isEmployer ? "/company/hiring" : "/jobs"}
              className={`navbar-link ${isJobs ? "active" : ""}`}
              aria-current={isJobs ? "page" : undefined}
            >
              <NavIcon name="jobs" />

              <span>{isEmployer ? "Hiring" : "Jobs"}</span>
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/messages"
              className={`navbar-link ${isMessages ? "active" : ""}`}
              onClick={handleMessagesClick}
              aria-current={isMessages ? "page" : undefined}
            >
              <NavIcon name="messages" />

              <span>Messages</span>

              {navbarUnreadCount > 0 && (
                <span
                  className="
                    navbar-badge
                    navbar-message-badge
                  "
                  aria-label={`${navbarUnreadCount} new messages`}
                >
                  {formatBadgeCount(navbarUnreadCount)}
                </span>
              )}
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/notifications"
              className={`navbar-link ${isNotifications ? "active" : ""}`}
              aria-current={isNotifications ? "page" : undefined}
            >
              <NavIcon name="notifications" />

              <span>Notifications</span>

              {notificationUnreadCount > 0 && (
                <span className="navbar-badge">
                  {formatBadgeCount(notificationUnreadCount)}
                </span>
              )}
            </Link>
          </div>

          <div className="navbar-item navbar-account" ref={accountMenuRef}>
            <button
              type="button"
              className={`navbar-link navbar-account-trigger ${isProfile ? "active" : ""}`}
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((current) => !current)}
            >
              <img
                src={profileImageUrl}
                alt="Profile"
                className="navbar-avatar"
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
              />

              <span className="navbar-account-label">
                Profile
                <svg viewBox="0 0 12 12" aria-hidden="true"><path d="m2.5 4.5 3.5 3 3.5-3"/></svg>
              </span>
            </button>

            {accountMenuOpen && (
              <div className="navbar-account-menu">
                <div className="navbar-account-summary">
                  <img src={profileImageUrl} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} />
                  <span><strong>{displayName}</strong>{username && <small>@{username}</small>}</span>
                </div>
                <Link to="/profile" onClick={() => setAccountMenuOpen(false)} className="navbar-view-profile">{isEmployer ? "View company profile" : "View profile"}</Link>
                <div className="navbar-account-divider" />
                {isEmployer ? (
                  <Link to="/company/dashboard" onClick={() => setAccountMenuOpen(false)}>Company dashboard <span>›</span></Link>
                ) : (
                  <Link to="/analytics" onClick={() => setAccountMenuOpen(false)}>Analytics <span>›</span></Link>
                )}
                <Link to="/settings" onClick={() => setAccountMenuOpen(false)}>Settings &amp; Privacy <span>›</span></Link>
                {!isEmployer && <Link to="/saved" onClick={() => setAccountMenuOpen(false)}>Saved items <span>›</span></Link>}
                <Link to="/events" onClick={() => setAccountMenuOpen(false)}>Events <span>›</span></Link>
                <div className="navbar-account-divider" />
                <button type="button" className="navbar-signout" onClick={signOut}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
