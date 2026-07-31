import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import JobPostItem from "../components/Post/JobPosts/JobPostItem";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ProfileIcon from "../components/Profile/ProfileIcon";
import api from "../services/api";
import "./ContentDetailsPage.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

export default function JobDetailsPage() {
  const { jobId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [job, setJob] = useState(location.state?.jobPreview || null);
  const [loading, setLoading] = useState(!location.state?.jobPreview);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const response = await api.get(`/JobPost/${jobId}`);
      setJob(unwrap(response));
    } catch (requestError) {
      if (!job) {
        setError(requestError.response?.status === 404
          ? "This job was deleted or is no longer available."
          : "The job could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId]);

  return (
    <>
      <Navbar />
      <main className="content-detail-page">
        {loading ? (
          <LoadingSpinner text="Loading job..." />
        ) : job ? (
          <JobPostItem
            job={job}
            onSavedChanged={(id, isSaved) =>
              setJob((current) => ({ ...current, isSaved }))
            }
            onApplied={(id) =>
              setJob((current) => ({
                ...current,
                isApplied: true,
                appliedAt: new Date().toISOString(),
              }))
            }
            onDeleted={() => navigate("/jobs", { replace: true })}
            onUpdated={(updated) => setJob((current) => ({ ...current, ...updated }))}
          />
        ) : (
          <section className="content-detail-state">
            <ProfileIcon name="briefcase" size={38} />
            <h1>Job unavailable</h1>
            <p>{error}</p>
            <button type="button" onClick={() => navigate(-1)}>Go back</button>
          </section>
        )}
      </main>
    </>
  );
}
