import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import defaultAvatar from "../../assets/default-avatar.png";
import { getRecommendedUsers } from "../../services/searchApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import api from "../../services/api";

const unwrap = (response) => {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.Data)) return data.Data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.Items)) return data.Items;
  return [];
};

export default function TopCompanyCard() {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const [company, setCompany] = useState(null);

  const currentUsername =
    currentUser?.username ||
    currentUser?.Username ||
    currentUser?.basicInfo?.username ||
    "";

  useEffect(() => {
    Promise.all([
      api.get("/User/employers").catch(() => ({ data: [] })),
      getRecommendedUsers(1, 50).catch(() => []),
      api
        .get("/CompanyFollow/my-followed-companies")
        .catch(() => ({ data: [] })),
    ])
      .then(([employersResponse, recommended, followedResponse]) => {
        const followedUsernames = new Set(
          unwrap(followedResponse)
            .map((item) => item.username || item.Username)
            .filter(Boolean)
            .map((username) => username.toLowerCase()),
        );
        // Keep recommendation entries first because they contain the score.
        const source = [...recommended, ...unwrap(employersResponse)];
        const seen = new Set();
        const companies = source.filter(
          (item) =>
            (item.userType === "Employer" ||
              item.UserType === "Employer" ||
              item.role === "Employer" ||
              item.Role === "Employer" ||
              item.companyInfo ||
              item.CompanyInfo) &&
            (() => {
              const key = item.username || item.Username || item.id || item.Id;
              const username = item.username || item.Username || "";
              if (
                !key ||
                seen.has(String(key)) ||
                username.toLowerCase() === currentUsername.toLowerCase() ||
                followedUsernames.has(username.toLowerCase()) ||
                item.isFollowing === true ||
                item.IsFollowing === true
              ) {
                return false;
              }
              seen.add(String(key));
              return true;
            })(),
        );
        const sortedCompanies = companies.sort(
            (a, b) =>
              Number(
                b.score ||
                  b.Score ||
                  b.companyInfo?.score ||
                  b.CompanyInfo?.Score ||
                  0,
              ) -
              Number(
                a.score ||
                  a.Score ||
                  a.companyInfo?.score ||
                  a.CompanyInfo?.Score ||
                  0,
              ),
          );

        // The requested spotlight is the second-highest rated eligible company.
        // If only one company is available, show it instead of an empty card.
        setCompany(sortedCompanies[1] || sortedCompanies[0] || null);
      })
      .catch(() => setCompany(null));
  }, [currentUsername]);

  if (!company) return null;
  const username = company.username || company.Username;

  return (
    <aside className="home-top-company-card">
      <span className="home-top-company-recommended">Recommended for you</span>
      <img
        src={resolveMediaUrl(
          company.profileImage ||
            company.ProfileImage ||
            company.logoUrl ||
            company.LogoUrl ||
            company.companyInfo?.logoUrl ||
            company.CompanyInfo?.LogoUrl,
          defaultAvatar,
        )}
        alt=""
      />
      <h3>
        {company.fullName ||
          company.FullName ||
          company.companyInfo?.name ||
          company.CompanyInfo?.Name ||
          username}
      </h3>
      <span className="home-company-username">@{username}</span>
      <div className="home-company-position">
        {company.currentPosition ||
          company.CurrentPosition ||
          company.companyInfo?.industry ||
          company.CompanyInfo?.Industry ||
          "Company"}
      </div>
      <button type="button" onClick={() => navigate(`/profile/${username}`)}>
        View company
      </button>
    </aside>
  );
}
