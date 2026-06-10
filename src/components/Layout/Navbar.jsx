import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import defaultAvatar from '../../assets/default-avatar.png';
import home from '../../assets/home.png';
import network from '../../assets/network.png';
import job from '../../assets/briefcase.png';
import chat from '../../assets/chat.png';
import notifications from '../../assets/notification.png';
import SearchModal from '../Search/SearchModal';

import * as signalR from '@microsoft/signalr';
import api from '../../services/api';

import { clearUnread as clearMessageUnread } from '../../store/messageSlice';
import { clearUnread as clearNotificationUnread } from '../../store/notificationSlice';

import {
  setPendingReceivedCount,
  incrementConnectionUpdateCount,
  clearConnectionUpdateCount,
} from '../../store/connectionSlice';
import './Navbar.css';

const API_ROOT = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');

const Navbar = () => {
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user.user);
  const unreadMessages = useSelector((state) => state.messages.unreadMessages);

  const notificationUnreadCount = useSelector(
    (state) => state.notifications.unreadCount
  );

  const pendingReceivedCount = useSelector(
    (state) => state.connections.pendingReceivedCount
  );

  const connectionUpdateCount = useSelector(
    (state) => state.connections.connectionUpdateCount
  );

  const networkBadgeCount = pendingReceivedCount + connectionUpdateCount;

  const navigate = useNavigate();
  const location = useLocation();

  const [modal, setModal] = useState(false);
  const modalRef = useRef(null);

  const totalUnreadCount = Object.values(unreadMessages || {}).reduce(
    (acc, count) => acc + Number(count || 0),
    0
  );

  const isHome = location.pathname === '/home';
  const isNetwork = location.pathname.startsWith('/network');
  const isJobs = location.pathname.startsWith('/jobs');
  const isMessages = location.pathname.startsWith('/messages');
  const isNotifications = location.pathname.startsWith('/notifications');
  const isProfile = location.pathname.startsWith('/profile');

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;

    const cleanPath = String(path).trim();

    if (!cleanPath) return defaultAvatar;

    if (
      cleanPath.startsWith('http://') ||
      cleanPath.startsWith('https://') ||
      cleanPath.startsWith('blob:')
    ) {
      return cleanPath;
    }

    return `${API_ROOT}/${cleanPath.replace(/^\/+/, '')}`;
  };

  const profileImage =
    user?.photoUrl ||
    user?.profileImage ||
    user?.basicInfo?.profileImage ||
    user?.companyInfo?.logoUrl ||
    user?.company?.logoUrl ||
    '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('accessToken');

    dispatch(clearMessageUnread());
    dispatch(clearNotificationUnread());
    dispatch(clearConnectionUpdateCount());

    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setModal(false);
      }
    };

    if (modal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [modal]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) return;

    const fetchPendingRequestsCount = async () => {
      try {
        const res = await api.get('/Connection/received');

        const requests = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.Data)
          ? res.data.Data
          : [];

        dispatch(setPendingReceivedCount(requests.length));
      } catch (err) {
        console.error('Failed to fetch connection request count:', err);
      }
    };

    fetchPendingRequestsCount();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ROOT}/connectionhub`, {
        accessTokenFactory: () => localStorage.getItem('token'),
      })
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveConnectionRequest', () => {
      fetchPendingRequestsCount();
    });

    connection.on('ReceiveConnectionCancelled', () => {
      fetchPendingRequestsCount();
    });

    connection.on('ConnectionRequestAcceptedByMe', () => {
      fetchPendingRequestsCount();
    });

    connection.on('ConnectionRequestRejectedByMe', () => {
      fetchPendingRequestsCount();
    });

    connection.on('ReceiveConnectionAccepted', () => {
      dispatch(incrementConnectionUpdateCount());
    });

    connection.on('ConnectedDirectlyByMe', () => {
      dispatch(incrementConnectionUpdateCount());
    });

    connection
      .start()
      .then(() => console.log('ConnectionHub connected in Navbar'))
      .catch((err) => console.error('ConnectionHub error in Navbar:', err));

    return () => {
      connection.stop();
    };
  }, [dispatch]);

  return (
    <nav className="navbar-container">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <Link to="/home" className="navbar-logo">
            lynq<span>.</span>
          </Link>

          {location.pathname !== '/search' && (
            <div ref={modalRef} className="navbar-search-wrapper">
              <SearchModal />
            </div>
          )}
        </div>

        <div className="navbar-menu">
          <div className="navbar-item">
            <Link
              to="/home"
              className={`navbar-link ${isHome ? 'active' : ''}`}
            >
              <img
                src={home}
                alt="Home"
                className="navbar-icon"
              />
              <span>Home</span>
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/network"
              className={`navbar-link ${isNetwork ? 'active' : ''}`}
              onClick={() => dispatch(clearConnectionUpdateCount())}
            >
              <img
                src={network}
                alt="Network"
                className="navbar-icon"
              />
              <span>Network</span>
              {networkBadgeCount > 0 && (
                <span className="navbar-badge">{networkBadgeCount}</span>
              )}
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/jobs"
              className={`navbar-link ${isJobs ? 'active' : ''}`}
            >
              <img
                src={job}
                alt="Jobs"
                className="navbar-icon"
              />
              <span>Jobs</span>
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/messages"
              className={`navbar-link ${isMessages ? 'active' : ''}`}
            >
              <img
                src={chat}
                alt="Messages"
                className="navbar-icon"
              />
              <span>Messages</span>
              {totalUnreadCount > 0 && (
                <span className="navbar-badge">{totalUnreadCount}</span>
              )}
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/notifications"
              className={`navbar-link ${isNotifications ? 'active' : ''}`}
            >
              <img
                src={notifications}
                alt="Notifications"
                className="navbar-icon"
              />
              <span>Notifications</span>
              {notificationUnreadCount > 0 && (
                <span className="navbar-badge">{notificationUnreadCount}</span>
              )}
            </Link>
          </div>

          <div className="navbar-item">
            <Link
              to="/profile"
              className={`navbar-link ${isProfile ? 'active' : ''}`}
            >
              <img
                src={getImageUrl(profileImage)}
                alt="Profile"
                className="navbar-avatar"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
              />
              <span>Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;