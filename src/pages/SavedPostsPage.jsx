import React, { useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import PostItem from "../components/Post/PostItem";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ProfileIcon from "../components/Profile/ProfileIcon";
import api from "../services/api";
import "./SavedPostsPage.css";

const unwrap = (response) => {
  const payload = response?.data?.data || response?.data;
  return Array.isArray(payload) ? payload : payload?.items || [];
};

export default function SavedPostsPage({ likeConnection }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/SavedPost").then((response) => setPosts(unwrap(response))).catch(() => setPosts([])).finally(() => setLoading(false)); }, []);
  return <><Navbar/><div className="saved-page"><header className="saved-header"><span className="saved-header-icon"><ProfileIcon name="bookmark" size={23}/></span><div><span>Your collection</span><h1>Saved posts</h1><p>Posts you saved for later appear here.</p></div><strong>{posts.length}</strong></header><main className="saved-list">{loading ? <div className="saved-state"><LoadingSpinner text="Loading saved posts..."/></div> : posts.length ? posts.map((post) => <PostItem key={post.id} post={{...post,isSaved:true}} likeConnection={likeConnection} onSavedChange={(id, saved) => !saved && setPosts((current) => current.filter((item) => Number(item.id) !== Number(id)))}/>) : <div className="saved-state"><ProfileIcon name="bookmark" size={34}/><h2>No saved posts yet</h2><p>Use the bookmark button on a post to keep it here.</p></div>}</main></div></>;
}
