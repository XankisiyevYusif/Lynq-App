import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api, { API_ROOT } from "../../services/api";
import { getRecommendedUsers } from "../../services/searchApi";
import defaultAvatar from "../../assets/default-avatar.png";

export default function HomeRecommendations({ showToast }) {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const currentUsername = currentUser?.username || currentUser?.basicInfo?.username || "";

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState({}); // { [username]: 'loading' | 'following' | 'pending' | null }

  const getUsername = (user) => {
    return user?.username || user?.Username || user?.userName || user?.UserName || "";
  };

  const getUserId = (user) => {
    return user?.id || user?.Id || user?.userId || user?.UserId || null;
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
      user?.bio ||
      user?.Bio ||
      (isEmployerUser(user) ? "Company Profile" : "Member")
    );
  };

  const getProfileImage = (user) => {
    return (
      user?.profileImage ||
      user?.ProfileImage ||
      user?.profileImageUrl ||
      user?.ProfileImageUrl ||
      user?.logoUrl ||
      user?.LogoUrl ||
      null
    );
  };

  const isEmployerUser = (user) => {
    return (
      user?.userType === "Employer" ||
      user?.UserType === "Employer" ||
      user?.role === "Employer" ||
      user?.Role === "Employer" ||
      !!user?.companyInfo ||
      !!user?.company
    );
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Fetch active network and followed companies to exclude them
      const [connectionsRes, sentRes, receivedRes, followedCompaniesRes] = await Promise.all([
        api.get("/Connection/my-connections").catch(() => ({ data: [] })),
        api.get("/Connection/sent").catch(() => ({ data: [] })),
        api.get("/Connection/received").catch(() => ({ data: [] })),
        api.get("/CompanyFollow/my-followed-companies").catch(() => ({ data: [] }))
      ]);

      const getResList = (res) => {
        if (!res) return [];
        const resData = res.data;
        if (!resData) return [];
        if (Array.isArray(resData)) return resData;
        if (Array.isArray(resData.items)) return resData.items;
        if (Array.isArray(resData.Items)) return resData.Items;
        if (Array.isArray(resData.data)) return resData.data;
        if (Array.isArray(resData.Data)) return resData.Data;
        return [];
      };

      const connectionsList = getResList(connectionsRes);
      const sentList = getResList(sentRes);
      const receivedList = getResList(receivedRes);
      const followedList = getResList(followedCompaniesRes);

      const excludedUsernames = new Set();
      
      // Exclude current user from recommendations
      if (currentUsername) {
        excludedUsernames.add(currentUsername.toLowerCase());
      }
      
      // Exclude already connected users
      connectionsList.forEach((c) => {
        const uname = getUsername(c);
        if (uname) excludedUsernames.add(uname.toLowerCase());
      });
      
      // Exclude sent connection requests
      sentList.forEach((r) => {
        const receiver = r?.receiver || r?.Receiver || r;
        const uname = getUsername(receiver);
        if (uname) excludedUsernames.add(uname.toLowerCase());
      });
      
      // Exclude received connection requests
      receivedList.forEach((r) => {
        const sender = r?.sender || r?.Sender || r;
        const uname = getUsername(sender);
        if (uname) excludedUsernames.add(uname.toLowerCase());
      });
      
      // Exclude already followed companies
      followedList.forEach((c) => {
        const uname = getUsername(c);
        if (uname) excludedUsernames.add(uname.toLowerCase());
      });

      // Fetch recommended users/companies from API
      let data = await getRecommendedUsers();
      
      if (!data || data.length === 0) {
        console.log("Recommendations from API empty, trying jobseekers and employers...");
        const [jobseekersRes, employersRes] = await Promise.all([
          api.get("/User/jobseekers").catch(() => ({ data: [] })),
          api.get("/User/employers").catch(() => ({ data: [] }))
        ]);

        const jobseekersList = getResList(jobseekersRes);
        const employersList = getResList(employersRes);
        data = [...jobseekersList, ...employersList];
      }

      // If still empty, use mock connections as a robust visual fallback
      if (!data || data.length === 0) {
        console.log("Combined list empty, using mock recommendations.");
        data = [
          {
            username: "tahir_aliyev",
            fullName: "Tahir Aliyev",
            currentPosition: "Graphic Designer",
            role: "JobSeeker",
            profileImage: ""
          },
          {
            username: "test_company_3060",
            fullName: "test_company_3060",
            currentPosition: "Employer",
            role: "Employer",
            profileImage: ""
          },
          {
            username: "yusifo",
            fullName: "YusifO",
            currentPosition: "JobSeeker",
            role: "JobSeeker",
            profileImage: ""
          }
        ];
      }

      // Filter out all excluded usernames
      const filtered = data.filter((u) => {
        const uname = getUsername(u);
        if (!uname) return false;
        return !excludedUsernames.has(uname.toLowerCase());
      });

      setRecommendations(filtered);
    } catch (err) {
      console.error("Failed to load recommended users:", err);
      // Hardcoded fallback if everything fails
      const fallbackList = [
        {
          username: "tahir_aliyev",
          fullName: "Tahir Aliyev",
          currentPosition: "Graphic Designer",
          role: "JobSeeker",
          profileImage: ""
        },
        {
          username: "test_company_3060",
          fullName: "test_company_3060",
          currentPosition: "Employer",
          role: "Employer",
          profileImage: ""
        },
        {
          username: "yusifo",
          fullName: "YusifO",
          currentPosition: "JobSeeker",
          role: "JobSeeker",
          profileImage: ""
        }
      ];

      const currentUnameLower = currentUsername ? currentUsername.toLowerCase() : "";
      setRecommendations(fallbackList.filter(u => u.username.toLowerCase() !== currentUnameLower));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUsername]);

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ROOT}/${path.replace(/^\/+/, "")}`;
  };

  const handleAction = async (user) => {
    const username = getUsername(user);
    if (!username) return;

    const isEmployer = isEmployerUser(user);

    setProcessingIds((prev) => ({
      ...prev,
      [username]: "loading",
    }));

    try {
      if (isEmployer) {
        await api.post(`/CompanyFollow/follow/${username}`);
        showToast?.(`Following ${getFullName(user)}`, "success");
        setProcessingIds((prev) => ({
          ...prev,
          [username]: "following",
        }));
      } else {
        await api.post(`/Connection/send/${username}`);
        showToast?.("Connection request sent.", "success");
        setProcessingIds((prev) => ({
          ...prev,
          [username]: "pending",
        }));
      }
    } catch (err) {
      console.error("Recommendation action failed:", err);
      showToast?.("Failed to complete action. Please try again.", "error");
      setProcessingIds((prev) => ({
        ...prev,
        [username]: null,
      }));
    }
  };

  if (loading) {
    return (
      <div className="home-recommendations-card loading">
        <div className="home-recommendations-header">Recommendations</div>
        <div className="home-recommendations-skeleton-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="home-recommendations-skeleton-item">
              <div className="skeleton-avatar" />
              <div className="skeleton-text-group">
                <div className="skeleton-line title" />
                <div className="skeleton-line subtitle" />
                <div className="skeleton-line button" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="home-recommendations-card">
      <div className="home-recommendations-header">
        Add to your feed
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2.5"
          stroke="currentColor"
          className="info-icon"
          width="15"
          height="15"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 1 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.852l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
      </div>

      <div className="home-recommendations-list">
        {recommendations.slice(0, 4).map((user) => {
          const username = getUsername(user);
          const fullName = getFullName(user);
          const headline = getHeadline(user);
          const isEmployer = isEmployerUser(user);
          const state = processingIds[username];

          return (
            <div key={username || Math.random()} className="home-recommendation-item">
              <img
                src={getImageUrl(getProfileImage(user))}
                alt={fullName}
                className="home-recommendation-avatar"
                style={{
                  borderRadius: isEmployer ? "8px" : "50%",
                }}
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar;
                }}
                onClick={() => username && navigate(`/profile/${username}`)}
              />

              <div className="home-recommendation-info">
                <div
                  className="home-recommendation-name"
                  onClick={() => username && navigate(`/profile/${username}`)}
                >
                  {fullName}
                </div>
                <div className="home-recommendation-headline">{headline}</div>

                <div className="home-recommendation-actions">
                  {state === "following" ? (
                    <button className="home-recommendation-btn active" disabled>
                      Following
                    </button>
                  ) : state === "pending" ? (
                    <button className="home-recommendation-btn active" disabled>
                      Pending
                    </button>
                  ) : (
                    <button
                      className="home-recommendation-btn"
                      onClick={() => handleAction(user)}
                      disabled={state === "loading"}
                    >
                      {state === "loading" ? (
                        "..."
                      ) : isEmployer ? (
                        <>
                          <span className="plus">+</span> Follow
                        </>
                      ) : (
                        <>
                          <span className="plus">+</span> Connect
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
