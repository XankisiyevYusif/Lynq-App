import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../services/api";
import ProfileView from "../components/Profile/ProfileView/ProfileView";
import EmployerProfileView from "../components/Profile/ProfileView/EmployerProfileView";

import LoadingSpinner from "../components/UI/LoadingSpinner";

const UserProfilePage = ({ likeConnection }) => {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const currentUsername = useMemo(() => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token);
      return decoded?.unique_name || decoded?.username || null;
    } catch (err) {
      console.error("Token decode error:", err);
      return null;
    }
  }, [token]);

  const isOwner =
    currentUsername?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);

        let res;

        if (isOwner) {
          res = await api.get("/User/me");
        } else {
          res = await api.get(`/User/${username}`);
        }

        setUser(res.data || null);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username, isOwner]);

  if (loading) {
    return <LoadingSpinner text="Loading member profile..." />;
  }

  if (!user) {
    return (
      <div style={{ textAlign: "center", marginTop: 50 }}>
        User not found.
      </div>
    );
  }

const isEmployer =
  user?.userType === "Employer" ||
  user?.role === "Employer";

if (isEmployer) {
  return (
    <EmployerProfileView
      user={user}
      setUser={setUser}
      isOwner={isOwner}
      readOnly={!isOwner}
      likeConnection={likeConnection}
    />
  );
}

  return (
    <ProfileView
      user={user}
      setUser={setUser}
      isOwner={isOwner}
      readOnly={!isOwner}
      likeConnection={likeConnection}
    />
  );
};

export default UserProfilePage;