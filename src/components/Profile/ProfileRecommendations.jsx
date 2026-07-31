import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import defaultAvatar from "../../assets/default-avatar.png";
import api from "../../services/api";
import { getRecommendedUsers } from "../../services/searchApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import ProfileIcon from "./ProfileIcon";

export default function ProfileRecommendations({
  excludedUsername,
  showToast,
  maxItems = 5,
}) {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState({});
  const [showMore, setShowMore] = useState(false);
  const [page, setPage] = useState(1);

  const currentUsername =
    currentUser?.username ||
    currentUser?.Username ||
    currentUser?.basicInfo?.username ||
    "";

  const getUsername = (user) =>
    user?.username || user?.Username || user?.userName || user?.UserName || "";

  const getName = (user) =>
    user?.fullName ||
    user?.FullName ||
    user?.name ||
    user?.Name ||
    getUsername(user) ||
    "Member";

  const isEmployer = (user) =>
    user?.userType === "Employer" ||
    user?.UserType === "Employer" ||
    user?.role === "Employer" ||
    user?.Role === "Employer" ||
    !!user?.companyInfo ||
    !!user?.CompanyInfo;

  const getHeadline = (user) =>
    user?.currentPosition ||
    user?.CurrentPosition ||
    user?.headline ||
    user?.Headline ||
    user?.bio ||
    user?.Bio ||
    (isEmployer(user) ? "Company" : "Member");

  const getImage = (user) =>
    user?.profileImage ||
    user?.ProfileImage ||
    user?.profileImageUrl ||
    user?.ProfileImageUrl ||
    user?.logoUrl ||
    user?.LogoUrl;

  const unwrap = (response) => {
    const payload = response?.data;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.Data)) return payload.Data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.Items)) return payload.Items;
    return [];
  };

  const collectUsernames = (items, selectors) => {
    const usernames = new Set();

    items.forEach((item) => {
      const candidates = selectors.flatMap((selector) => {
        const value = selector(item);
        return Array.isArray(value) ? value : [value];
      });

      candidates.forEach((candidate) => {
        const username =
          typeof candidate === "string" ? candidate : getUsername(candidate);
        if (username) usernames.add(username.toLowerCase());
      });
    });

    return usernames;
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const [result, connectionsResponse, sentResponse, followedResponse] =
          await Promise.all([
            getRecommendedUsers(1, 30),
            api.get("/Connection/my-connections").catch(() => ({ data: [] })),
            api.get("/Connection/sent").catch(() => ({ data: [] })),
            api
              .get("/CompanyFollow/my-followed-companies")
              .catch(() => ({ data: [] })),
          ]);
        if (!active) return;

        const excluded = new Set(
          [currentUsername, excludedUsername]
            .filter(Boolean)
            .map((value) => value.toLowerCase()),
        );

        const relatedUsernames = [
          ...collectUsernames(unwrap(connectionsResponse), [
            (item) => item,
            (item) => item?.user,
            (item) => item?.User,
          ]),
          ...collectUsernames(unwrap(sentResponse), [
            (item) => item?.receiver,
            (item) => item?.Receiver,
          ]),
          ...collectUsernames(unwrap(followedResponse), [
            (item) => item,
            (item) => item?.company,
            (item) => item?.Company,
          ]),
        ];
        relatedUsernames.forEach((username) => excluded.add(username));

        setRecommendations(
          result
            .filter((user) => {
              const username = getUsername(user);
              return username && !excluded.has(username.toLowerCase());
            })
            .slice(0, 30),
        );
      } catch (error) {
        console.error("Profile recommendations failed:", error);
        if (active) setRecommendations([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [currentUsername, excludedUsername]);

  const handleAction = async (user) => {
    const username = getUsername(user);
    if (!username || actions[username]) return;

    setActions((current) => ({ ...current, [username]: "loading" }));

    try {
      if (isEmployer(user)) {
        await api.post(`/CompanyFollow/follow/${username}`);
        showToast?.(`Following ${getName(user)}.`, "success");
      } else {
        await api.post(`/Connection/send/${username}`);
        showToast?.("Connection request sent.", "success");
      }

      setRecommendations((current) =>
        current.filter(
          (item) => getUsername(item).toLowerCase() !== username.toLowerCase(),
        ),
      );
      setActions((current) => {
        const next = { ...current };
        delete next[username];
        return next;
      });
    } catch (error) {
      console.error("Profile recommendation action failed:", error);
      setActions((current) => ({ ...current, [username]: null }));
      showToast?.("The action could not be completed.", "error");
    }
  };

  if (!loading && recommendations.length === 0) return null;

  const totalPages = Math.max(1, Math.ceil(recommendations.length / maxItems));
  const safePage = Math.min(page, totalPages);
  const visibleRecommendations = showMore
    ? recommendations.slice((safePage - 1) * maxItems, safePage * maxItems)
    : recommendations.slice(0, maxItems);

  return (
    <aside className="profile-recommendations-card">
      <div className="profile-recommendations-heading">
        <div>
          <span>Discover people</span>
          <h2>Add to your feed</h2>
        </div>
        <div className="profile-recommendations-icon" aria-hidden="true">
          <ProfileIcon name="plus" size={17} strokeWidth={2.4} />
        </div>
      </div>

      {loading ? (
        <div className="profile-recommendations-loading">
          {[1, 2, 3].map((item) => (
            <div key={item} className="profile-recommendation-skeleton" />
          ))}
        </div>
      ) : (
        <div className="profile-recommendations-list">
          {visibleRecommendations.map((user) => {
            const username = getUsername(user);
            const state = actions[username];
            const employer = isEmployer(user);

            return (
              <div key={username} className="profile-recommendation-item">
                <img
                  src={resolveMediaUrl(getImage(user), defaultAvatar)}
                  alt={getName(user)}
                  style={{ borderRadius: employer ? 9 : "50%" }}
                  onError={(event) => {
                    event.currentTarget.src = defaultAvatar;
                  }}
                  onClick={() => navigate(`/profile/${username}`)}
                />

                <div className="profile-recommendation-copy">
                  <button
                    type="button"
                    className="profile-recommendation-name"
                    onClick={() => navigate(`/profile/${username}`)}
                  >
                    {getName(user)}
                  </button>
                  <p>{getHeadline(user)}</p>
                  <button
                    type="button"
                    className={`profile-recommendation-action ${
                      state === "pending" || state === "following"
                        ? "is-complete"
                        : ""
                    }`}
                    onClick={() => handleAction(user)}
                    disabled={!!state}
                  >
                    {state === "loading"
                      ? "Adding..."
                      : state === "pending"
                        ? "Pending"
                        : state === "following"
                          ? "Following"
                          : employer
                            ? "+ Follow"
                            : "+ Connect"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && recommendations.length > maxItems && (
        <div className="profile-recommendations-footer">
          {!showMore ? (
            <button
              type="button"
              onClick={() => {
                setShowMore(true);
                setPage(1);
              }}
            >
              View more recommendations
              <ProfileIcon name="arrowRight" size={16} />
            </button>
          ) : (
            <div className="profile-recommendations-pagination">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous recommendations"
              >
                <ProfileIcon name="chevronLeft" size={18} />
              </button>
              <span>
                {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                aria-label="Next recommendations"
              >
                <ProfileIcon name="chevronRight" size={18} />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
