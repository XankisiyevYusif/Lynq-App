import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import "./EmployerHome.css";

export default function EmployerHome({ user, onOpenAbout, onOpenMentions }) {
  const navigate = useNavigate();
  const company = user?.companyInfo || {};
  const basic = user?.basicInfo || {};
  const overview = company.bio || user?.about?.bio || "";
  const username =
    basic.username || basic.userName || user?.username || user?.userName;
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!username) return;
    api.get(`/Company/${username}/overview`)
      .then((response) =>
        setSummary(
          response?.data?.data ?? response?.data?.Data ?? response?.data,
        ),
      )
      .catch(() => setSummary(null));
  }, [username]);

  const companySummary = summary?.company || summary?.Company || {};
  const mentions = summary?.popularMentions || summary?.PopularMentions || [];
  const companyName =
    company.name || basic.fullName || basic.username || "this company";

  return (
    <div className="company-overview">
      <section className="company-overview-about">
        <div className="company-overview-section-heading">
          <div>
            <span>Company overview</span>
            <h2>About {companyName}</h2>
          </div>
          <button type="button" onClick={onOpenAbout}>View full profile</button>
        </div>
        <p>
          {overview
            ? overview.length > 240
              ? `${overview.slice(0, 240)}...`
              : overview
            : "Company overview has not been added yet."}
        </p>
      </section>

      <section className="company-overview-numbers">
        {[
          ["Followers", companySummary.followers ?? 0],
          ["Employees", companySummary.employees ?? 0],
          ["Active jobs", companySummary.activeJobs ?? 0],
          ["Upcoming events", companySummary.upcomingEvents ?? 0],
        ].map(([label, value]) => (
          <article key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="company-popular-mentions">
        <header>
          <div>
            <span>Member conversations</span>
            <h2>People are talking about {companyName}</h2>
            <p>
              Posts shared by members who mention @{username || companyName}.
            </p>
          </div>
          <button type="button" onClick={onOpenMentions}>View mentions</button>
        </header>

        {mentions.length > 0 ? (
          <div>
            {mentions.map((mention) => (
              <button key={mention.id || mention.Id} type="button" onClick={() => navigate(`/posts/${mention.id || mention.Id}`)}>
                <img src={resolveMediaUrl(mention.profileImage || mention.ProfileImage, defaultAvatar)} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} />
                <span>
                  <strong>{mention.fullName || mention.FullName || mention.username || mention.Username}</strong>
                  <p>{mention.content || mention.Content || "Shared a post mentioning this company."}</p>
                  <small>{mention.likeCount || mention.LikeCount || 0} likes · {mention.commentCount || mention.CommentCount || 0} comments</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="company-mentions-empty">
            <span aria-hidden="true">@</span>
            <div>
              <strong>No mentions yet</strong>
              <p>
                Member posts that tag @{username || companyName} will appear
                here.
              </p>
            </div>
            <button type="button" onClick={onOpenMentions}>Open posts</button>
          </div>
        )}
      </section>
    </div>
  );
}
