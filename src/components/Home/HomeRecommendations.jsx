import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { getRecommendedUsers } from "../../services/searchApi";
import defaultAvatar from "../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function HomeRecommendations({ showToast }) {
  const navigate = useNavigate();

  const currentUser = useSelector((state) => state.user.user);

  const currentUsername =
    currentUser?.username ||
    currentUser?.Username ||
    currentUser?.basicInfo?.username ||
    currentUser?.basicInfo?.Username ||
    "";

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // { [username]: "loading" | "following" | "pending" }
  const [processingIds, setProcessingIds] = useState({});

  const getUsername = (user) => {
    return (
      user?.username || user?.Username || user?.userName || user?.UserName || ""
    );
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

  const isEmployerUser = (user) => {
    return (
      user?.userType === "Employer" ||
      user?.UserType === "Employer" ||
      user?.role === "Employer" ||
      user?.Role === "Employer" ||
      !!user?.companyInfo ||
      !!user?.CompanyInfo ||
      !!user?.company ||
      !!user?.Company
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

  // API bəzən birbaşa array, bəzən pagination object qaytara bilər.
  const normalizeRecommendedList = (result) => {
    const payload = result?.data ?? result?.Data ?? result;

    if (Array.isArray(payload)) {
      return payload;
    }

    return (
      payload?.items || payload?.Items || payload?.data || payload?.Data || []
    );
  };

  const getResponseList = (response) => {
    const payload = response?.data ?? response?.Data ?? response;

    if (Array.isArray(payload)) {
      return payload;
    }

    return (
      payload?.items || payload?.Items || payload?.data || payload?.Data || []
    );
  };

  const fetchRecommendations = async () => {
    try {
      setLoading(true);

      // Mövcud connection və request-ləri alırıq ki,
      // onlar recommendation siyahısında görünməsin.
      const [
        connectionsRes,
        sentRequestsRes,
        receivedRequestsRes,
        followedCompaniesRes,
        recommendedRes,
      ] = await Promise.all([
        api.get("/Connection/my-connections").catch(() => ({ data: [] })),
        api.get("/Connection/sent").catch(() => ({ data: [] })),
        api.get("/Connection/received").catch(() => ({ data: [] })),
        api
          .get("/CompanyFollow/my-followed-companies")
          .catch(() => ({ data: [] })),
        getRecommendedUsers().catch(() => []),
      ]);

      const connectionsList = getResponseList(connectionsRes);
      const sentRequestsList = getResponseList(sentRequestsRes);
      const receivedRequestsList = getResponseList(receivedRequestsRes);
      const followedCompaniesList = getResponseList(followedCompaniesRes);

      const excludedUsernames = new Set();

      // Özümüz recommendation olaraq görünməyək.
      if (currentUsername) {
        excludedUsernames.add(currentUsername.toLowerCase());
      }

      // Əvvəldən connection olanlar görünməsin.
      connectionsList.forEach((connection) => {
        const username = getUsername(connection);

        if (username) {
          excludedUsernames.add(username.toLowerCase());
        }
      });

      // Göndərilmiş connection request olanlar görünməsin.
      sentRequestsList.forEach((request) => {
        const receiver =
          request?.receiver ||
          request?.Receiver ||
          request?.user ||
          request?.User ||
          request;

        const username = getUsername(receiver);

        if (username) {
          excludedUsernames.add(username.toLowerCase());
        }
      });

      // Gələn connection request olanlar görünməsin.
      receivedRequestsList.forEach((request) => {
        const sender =
          request?.sender ||
          request?.Sender ||
          request?.user ||
          request?.User ||
          request;

        const username = getUsername(sender);

        if (username) {
          excludedUsernames.add(username.toLowerCase());
        }
      });

      // Follow etdiyimiz şirkətlər görünməsin.
      followedCompaniesList.forEach((company) => {
        const username = getUsername(company);

        if (username) {
          excludedUsernames.add(username.toLowerCase());
        }
      });

      // Yalnız backend-in qaytardığı real recommendation-lar.
      const recommendationList = normalizeRecommendedList(recommendedRes);

      const filteredRecommendations = recommendationList.filter((user) => {
        const username = getUsername(user);

        if (!username) {
          return false;
        }

        return !excludedUsernames.has(username.toLowerCase());
      });

      setRecommendations(filteredRecommendations);
    } catch (error) {
      console.error("Failed to load recommendations:", error);

      // Xəta olarsa fake user göstərmirik.
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [currentUsername]);

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

  const handleAction = async (user) => {
    const username = getUsername(user);

    if (!username) {
      return;
    }

    const isEmployer = isEmployerUser(user);

    setProcessingIds((previous) => ({
      ...previous,
      [username]: "loading",
    }));

    try {
      if (isEmployer) {
        await api.post(`/CompanyFollow/follow/${username}`);

        showToast?.(`Following ${getFullName(user)}`, "success");
      } else {
        await api.post(`/Connection/send/${username}`);

        showToast?.("Connection request sent.", "success");
      }

      // Once followed/requested, it is no longer a valid recommendation.
      setRecommendations((current) =>
        current.filter(
          (item) =>
            getUsername(item).toLowerCase() !== username.toLowerCase(),
        ),
      );
      setProcessingIds((previous) => ({ ...previous, [username]: null }));
    } catch (error) {
      console.error("Recommendation action failed:", error);

      showToast?.("Failed to complete action. Please try again.", "error");

      setProcessingIds((previous) => ({
        ...previous,
        [username]: null,
      }));
    }
  };

  if (loading) {
    return (
      <div className="home-recommendations-card loading">
        <div className="home-recommendations-header">Recommendations</div>

        <div className="home-recommendations-skeleton-list">
          {[1, 2, 3].map((item) => (
            <div key={item} className="home-recommendations-skeleton-item">
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

  // API boşdursa recommendation kartı ümumiyyətlə görünməsin.
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
          const currentState = processingIds[username];

          return (
            <div key={username} className="home-recommendation-item">
              <img
                src={getImageUrl(getProfileImage(user))}
                alt={fullName}
                className="home-recommendation-avatar"
                style={{
                  borderRadius: isEmployer ? "8px" : "50%",
                }}
                onError={(event) => {
                  event.currentTarget.src = defaultAvatar;
                }}
                onClick={() => navigate(`/profile/${username}`)}
              />

              <div className="home-recommendation-info">
                <div
                  className="home-recommendation-name"
                  onClick={() => navigate(`/profile/${username}`)}
                >
                  {fullName}
                </div>

                <div className="home-recommendation-headline">{headline}</div>

                <div className="home-recommendation-actions">
                  {currentState === "following" ? (
                    <button className="home-recommendation-btn active" disabled>
                      Following
                    </button>
                  ) : currentState === "pending" ? (
                    <button className="home-recommendation-btn active" disabled>
                      Pending
                    </button>
                  ) : (
                    <button
                      className="home-recommendation-btn"
                      onClick={() => handleAction(user)}
                      disabled={currentState === "loading"}
                    >
                      {currentState === "loading" ? (
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
