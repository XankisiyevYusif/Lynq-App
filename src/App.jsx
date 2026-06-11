import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import HomePage from './pages/HomePage';
import { useDispatch } from 'react-redux';
import { useEffect,createContext } from 'react';
import {loginSuccess,authCheckDone} from './store/userSlice';
import api, { API_ROOT } from './services/api';
import NotificationPage from './pages/NotificationPage';
import * as signalR from '@microsoft/signalr';
import {
  addNotification,
  setNotifications,
} from "./store/notificationSlice";
import MessagePage from './components/Message/MessagePage';
import { incrementUnread } from './store/messageSlice';
import { RefreshProvider } from './context/RefreshContext';
import SearchPage from './components/Search/SearchPage';
import { SearchContext, SearchProvider } from './context/SearchContext';
import ProfileEditForm from './components/Profile/ProfileEditForm';
import './App.css';
import AddExperienceForm from './components/Experience/AddExperienceForm';
import MyProfilePage from './pages/MyProfilePage';
import UserProfilePage from './pages/UserProfilePage';
import { useState } from 'react'; 
import ExperienceListPage from './pages/profile/ExperienceListPage';
import ActivityListPage from './pages/ActivityListPage';
import NetworkPage from "./pages/NetworkPage";
import JobsPage from "./pages/JobsPage";
import AdminPage from "./pages/AdminPage";
import LoadingSpinner from './components/UI/LoadingSpinner';

function App() {
  const dispatch = useDispatch();
  const token = localStorage.getItem('token');
  const { user, authLoading } = useSelector((state) => state.user); 
 const [likeConnection, setLikeConnection] = useState(null);
 

useEffect(() => {
  const fetchUser = async () => {
    try {
      if (token) {
        const res = await api.get('/user/me');
        dispatch(loginSuccess(res.data));
      }
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      dispatch(authCheckDone());  
    }
  };

  fetchUser();
}, []);

console.log("user control: ",user)

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
      console.log("NotificationHub connected in App.jsx");
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
          message?.sender ||
          message?.Sender ||
          message?.senderUsername ||
          message?.SenderUsername;

        if (!senderUsername) return;

        dispatch(incrementUnread(senderUsername));
      });

      await connection.start();
      console.log("ChatHub connected in App.jsx");
    } catch (err) {
      console.error("ChatHub connection error in App.jsx:", err);
    }
  };

  connectChatHub();

  return () => {
    connection?.stop();
  };
}, [token, dispatch]);

 
useEffect(() => {
  const connectLikeHub = async () => {
    debugger;
    if (!token) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_ROOT}/likehub`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    conn.on("ReceiveLikeNotification", (data) => {
      console.log("Yeni LIKE bildirişi 🔥", data);
    });

    await conn.start();
    console.log("LikeHub Connected");

    setLikeConnection(conn);
  };

  connectLikeHub();
}, [token]);

 console.log("Like Connection in App.jsx:", likeConnection);

if (authLoading) {
  return <LoadingSpinner text="Checking authentication..." />;
}

  return (
  <Router>
    <RefreshProvider>
    <SearchProvider>
        <Routes>
           <Route path="/" element={token && user ? <Navigate to="/home" /> :  <LoginForm />} />
              <Route path="/login" element={token && user ? <Navigate to="/home" /> : <LoginForm />} />
              <Route path="/register" element={token && user ? <Navigate to="/home" /> : <RegisterForm />} />
              <Route
                 path="/home"
                 element={
                   token && user ? (
                     <HomePage likeConnection={likeConnection} />
                   ) : (
                     <Navigate to="/" />
                   )
                 }
               />
              <Route path="/search" element={token && user ? <SearchPage /> : <Navigate to="/" />} />
              <Route path="/network" element={token && user ? <NetworkPage /> : <Navigate to="/" />} />

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

              <Route path="/notifications" element={token && user ? <NotificationPage /> : <Navigate to="/" />} />
              <Route path="/messages" element={token && user ? <MessagePage /> : <Navigate to="/" />} />
              <Route path="/messages/:username" element={token && user ? <MessagePage /> : <Navigate to="/" />} />
              <Route path="/profiledit" element={<ProfileEditForm />} />
              <Route path="/AddExperienceForm" element={<AddExperienceForm />} />
              <Route
                path="/profile/:username/experience"
                element={token && user ? <ExperienceListPage /> : <Navigate to="/" />}
              />
              <Route
                path="/profile/:username/activity"
                element={token && user ? <ActivityListPage likeConnection={likeConnection}/> : <Navigate to="/" />}
              />
           <Route
              path="/jobs"
              element={token && user ? <JobsPage /> : <Navigate to="/" />}
            />

            <Route
              path="/admin"
              element={
                token && user ? <AdminPage /> : <Navigate to="/" />
              }
            />
            </Routes>
          </SearchProvider>
    </RefreshProvider>
    </Router>
  );
}

export default App;
