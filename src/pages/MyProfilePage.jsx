import React, { useEffect, useState } from "react";
import api from "../services/api";
import ProfileView from "../components/Profile/ProfileView/ProfileView";
import EmployerProfileView from "../components/Profile/ProfileView/EmployerProfileView";

import LoadingSpinner from "../components/UI/LoadingSpinner";

const MyProfilePage = ({ likeConnection }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchMyProfile = async () => {
      try {
        const res = await api.get("/user/me");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch my profile:", err);
      }
    };

    fetchMyProfile();
  }, []);

  if (!user) {
    return <LoadingSpinner text="Loading your profile..." />;
  }

const isEmployer =
  user?.userType === "Employer" ||
  user?.role === "Employer";

if (isEmployer) {
  return (
    <EmployerProfileView
      user={user}
      setUser={setUser}
      isOwner={true}
      readOnly={false}
      likeConnection={likeConnection}
    />
  );
}
  return (
    <ProfileView
      user={user}
      setUser={setUser}
      isOwner={true}
      readOnly={false}
      likeConnection={likeConnection}
    />
  );
};

export default MyProfilePage;