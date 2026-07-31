import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useSelector } from "react-redux";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import HomePage from "./pages/HomePage";
import { useDispatch } from "react-redux";
import { useEffect, createContext } from "react";
import { loginSuccess, authCheckDone } from "./store/userSlice";
import api, { API_ROOT } from "./services/api";
import NotificationPage from "./pages/NotificationPage";
import * as signalR from "@microsoft/signalr";
import { addNotification, setNotifications } from "./store/notificationSlice";
import MessagePage from "./components/Message/MessagePage";
import {
  incrementUnread,
  hydrateUnreadFromChats,
  ACKNOWLEDGED_STORAGE_KEY,
} from "./store/messageSlice";
import { RefreshProvider } from "./context/RefreshContext";
import SearchPage from "./components/Search/SearchPage";
import { SearchContext, SearchProvider } from "./context/SearchContext";
import ProfileEditForm from "./components/Profile/ProfileEditForm";
import "./App.css";
import AddExperienceForm from "./components/Experience/AddExperienceForm";
import MyProfilePage from "./pages/MyProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import { useState } from "react";
import ExperienceListPage from "./pages/profile/ExperienceListPage";
import ActivityListPage from "./pages/ActivityListPage";
import NetworkPage from "./pages/NetworkPage";
import JobsPage from "./pages/JobsPage";
import AdminPage from "./pages/AdminPage";
import LoadingSpinner from "./components/UI/LoadingSpinner";
import SavedPostsPage from "./pages/SavedPostsPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import EventDetailsPage from "./pages/EventDetailsPage";
import EventsPage from "./pages/EventsPage";
import PostDetailsPage from "./pages/PostDetailsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import CompanyDashboardPage from "./pages/CompanyDashboardPage";
import CompanyTalentPage from "./pages/CompanyTalentPage";
import CompanyHiringPage from "./pages/CompanyHiringPage";
import { isEmployerAccount as checkEmployerAccount } from "./utils/accountType";
import {
  ConfirmEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
} from "./components/Auth/AccountEmailPages";

function App() {
  const dispatch = useDispatch();
  const token = localStorage.getItem("token");
  const { user, authLoading } = useSelector((state) => state.user);
  const acknowledgedUnread = useSelector(
    (state) => state.messages.acknowledgedUnread,
  );
  const [likeConnection, setLikeConnection] = useState(null);
  const isEmployerAccount = checkEmployerAccount(user);
  const authenticatedHome = isEmployerAccount
    ? "/company/dashboard"
    : "/home";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (token) {
          const res = await api.get("/user/me");
          dispatch(loginSuccess(res.data));
        }
      } catch (err) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
      } finally {
        dispatch(authCheckDone());
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        ACKNOWLEDGED_STORAGE_KEY,
        JSON.stringify(acknowledgedUnread || {}),
      );
    } catch (error) {
      console.error("Failed to persist message badge state:", error);
    }
  }, [acknowledgedUnread]);

  useEffect(() => {
    let connection;

    const connectSignalR = async () => {
      try {
        if (!token) return;

        try {
          const res = await api.get("/Notifications/notifications");

          const list = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.data)
              ? res.data.data
              : Array.isArray(res.data?.Data)
                ? res.data.Data
                : [];

          dispatch(setNotifications(list));
        } catch (err) {
          console.error("Failed to fetch initial notifications:", err);
        }

        connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_ROOT}/notificationhub`, {
            accessTokenFactory: () => localStorage.getItem("token"),
          })
          .withAutomaticReconnect()
          .build();

        connection.on("ReceiveNotification", (data) => {
          dispatch(addNotification(data));
        });

        await connection.start();
      } catch (err) {
        console.error("NotificationHub connection error:", err);
      }
    };

    connectSignalR();

    return () => {
      connection?.stop();
    };
  }, [token, dispatch]);

  useEffect(() => {
    let connection;

    const getChatsFromResponse = (response) => {
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

    const syncUnreadCounts = async () => {
      try {
        const response = await api.get("/chat/user-chats");

        const chats = getChatsFromResponse(response);

        dispatch(hydrateUnreadFromChats(chats));
      } catch (error) {
        console.error("Failed to sync unread message counts:", error);
      }
    };

    const connectChatHub = async () => {
      try {
        if (!token) return;

        connection = new signalR.HubConnectionBuilder()
          .withUrl(`${API_ROOT}/chathub`, {
            accessTokenFactory: () => localStorage.getItem("token"),
          })
          .withAutomaticReconnect()
          .build();

        connection.on("ReceiveMessage", (message) => {
          const senderUsername =
            message?.sender ??
            message?.Sender ??
            message?.senderUsername ??
            message?.SenderUsername;

          if (!senderUsername) return;

          dispatch(incrementUnread(senderUsername));
        });

        connection.on("MessageDeleted", async () => {
          // A deleted unread message must also disappear from navbar/item counts.
          await syncUnreadCounts();
        });

        connection.onreconnected(async () => {
          await syncUnreadCounts();
        });

        await connection.start();

        // Sync messages that arrived while the client was offline.
        await syncUnreadCounts();
      } catch (error) {
        console.error("ChatHub connection error in App.jsx:", error);
      }
    };

    connectChatHub();

    return () => {
      connection?.stop();
    };
  }, [token, dispatch]);

  useEffect(() => {
    let conn;

    const connectLikeHub = async () => {
      if (!token) return;

      conn = new signalR.HubConnectionBuilder()
        .withUrl(`${API_ROOT}/likehub`, {
          accessTokenFactory: () => localStorage.getItem("token"),
        })
        .withAutomaticReconnect()
        .build();

      try {
        await conn.start();
        setLikeConnection(conn);
      } catch (error) {
        console.error("LikeHub connection failed:", error);
      }
    };

    connectLikeHub();

    return () => {
      setLikeConnection(null);
      conn?.stop().catch(() => {});
    };
  }, [token]);

  if (authLoading) {
    return <LoadingSpinner text="Checking authentication..." />;
  }

  return (
    <Router>
      <RefreshProvider>
        <SearchProvider>
          <Routes>
            <Route
              path="/"
              element={
                token && user ? (
                  <Navigate to={authenticatedHome} replace />
                ) : (
                  <LoginForm />
                )
              }
            />
            <Route
              path="/login"
              element={
                token && user ? (
                  <Navigate to={authenticatedHome} replace />
                ) : (
                  <LoginForm />
                )
              }
            />
            <Route
              path="/register"
              element={
                token && user ? (
                  <Navigate to={authenticatedHome} replace />
                ) : (
                  <RegisterForm />
                )
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/confirm-email" element={<ConfirmEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/home"
              element={
                token && user ? (
                  !isEmployerAccount ? (
                    <HomePage likeConnection={likeConnection} />
                  ) : (
                    <Navigate to="/company/dashboard" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/search"
              element={token && user ? <SearchPage /> : <Navigate to="/" />}
            />
            <Route
              path="/network"
              element={
                token && user ? (
                  !isEmployerAccount ? (
                    <NetworkPage />
                  ) : (
                    <Navigate to="/company/talent" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/company/dashboard"
              element={
                token && user ? (
                  isEmployerAccount ? (
                    <CompanyDashboardPage />
                  ) : (
                    <Navigate to="/home" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/company/talent"
              element={
                token && user ? (
                  isEmployerAccount ? (
                    <CompanyTalentPage />
                  ) : (
                    <Navigate to="/network" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/company/hiring"
              element={
                token && user ? (
                  isEmployerAccount ? (
                    <CompanyHiringPage />
                  ) : (
                    <Navigate to="/jobs" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/profile"
              element={
                token && user ? (
                  <MyProfilePage likeConnection={likeConnection} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/profile/:username"
              element={
                token && user ? (
                  <UserProfilePage likeConnection={likeConnection} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            <Route
              path="/notifications"
              element={
                token && user ? <NotificationPage /> : <Navigate to="/" />
              }
            />
            <Route
              path="/events"
              element={token && user ? <EventsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/events/:eventId"
              element={token && user ? <EventDetailsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/posts/:postId"
              element={
                token && user ? (
                  <PostDetailsPage likeConnection={likeConnection} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/messages"
              element={token && user ? <MessagePage /> : <Navigate to="/" />}
            />
            <Route
              path="/messages/:username"
              element={token && user ? <MessagePage /> : <Navigate to="/" />}
            />
            <Route path="/profiledit" element={<ProfileEditForm />} />
            <Route path="/AddExperienceForm" element={<AddExperienceForm />} />
            <Route
              path="/profile/:username/experience"
              element={
                token && user ? <ExperienceListPage /> : <Navigate to="/" />
              }
            />
            <Route
              path="/profile/:username/activity"
              element={
                token && user ? (
                  <ActivityListPage likeConnection={likeConnection} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/jobs"
              element={
                token && user ? (
                  !isEmployerAccount ? (
                    <JobsPage />
                  ) : (
                    <Navigate to="/company/hiring" replace />
                  )
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/jobs/:jobId"
              element={token && user ? <JobDetailsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/saved"
              element={
                token && user ? (
                  <SavedPostsPage likeConnection={likeConnection} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
            <Route
              path="/settings"
              element={token && user ? <SettingsPage /> : <Navigate to="/" />}
            />
            <Route
              path="/analytics"
              element={token && user ? <AnalyticsPage /> : <Navigate to="/" />}
            />

            <Route
              path="/admin"
              element={token && user ? <AdminPage /> : <Navigate to="/" />}
            />
          </Routes>
        </SearchProvider>
      </RefreshProvider>
    </Router>
  );
}

export default App;
