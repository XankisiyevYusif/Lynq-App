import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import defaultAvatar from "../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../utils/mediaUrl";

const unwrap = (response) => {
  const payload = response?.data?.data || response?.data;
  if (Array.isArray(payload)) return payload;
  return payload?.items || payload?.Items || payload?.data?.items || [];
};

export default function HomeLatestJobCard() {
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  useEffect(() => {
    api.get("/JobPreferences/recommended?take=1")
      .then((response) => setJob(unwrap(response)[0] || null))
      .catch(() => setJob(null));
  }, []);
  if (!job) return null;
  return <section className="home-discovery-card home-latest-job"><h2>Recommended job</h2><button type="button" className="home-latest-job-row" onClick={() => navigate(`/jobs/${encodeURIComponent(job.id)}`, { state: { jobPreview: job } })}><img src={resolveMediaUrl(job.companyLogo || job.profileImage, defaultAvatar)} alt=""/><span><strong>{job.title}</strong><small>{job.companyName || "Company"}</small></span></button><button className="home-discovery-footer" type="button" onClick={() => navigate("/search?type=jobs")}>More jobs <span>→</span></button></section>;
}
