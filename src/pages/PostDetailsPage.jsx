import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import PostItem from "../components/Post/PostItem";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ProfileIcon from "../components/Profile/ProfileIcon";
import api from "../services/api";
import "./ContentDetailsPage.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

export default function PostDetailsPage({ likeConnection }) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get(`/Post/${postId}`)
      .then((response) => {
        if (!cancelled) setPost(unwrap(response));
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(requestError.response?.status === 404
            ? "This post was deleted or is no longer available."
            : "The post could not be loaded.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [postId]);

  return (
    <>
      <Navbar />
      <main className="content-detail-page">
        {loading ? (
          <LoadingSpinner text="Loading post..." />
        ) : post ? (
          <PostItem
            post={post}
            likeConnection={likeConnection}
            defaultCommentsOpen
            highlighted
            onPostDeleted={() => navigate("/home", { replace: true })}
          />
        ) : (
          <section className="content-detail-state">
            <ProfileIcon name="post" size={38} />
            <h1>Post unavailable</h1>
            <p>{error}</p>
            <button type="button" onClick={() => navigate(-1)}>Go back</button>
          </section>
        )}
      </main>
    </>
  );
}
