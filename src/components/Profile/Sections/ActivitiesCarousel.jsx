import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

import ActivityPreviewCard from "./ActivityPreviewCard";
import CreatePostBox from "../../Post/CreatePostBox";
import ProfileIcon from "../ProfileIcon";

const ActivitiesCarousel = ({
  posts = [],
  username,
  isOwner,
  isEmployer = false,
  onPostCreated,
  onPostUpdated,
  onPostDeleted,
  showToast,
  likeConnection,
  userId,
  postsCount,
}) => {
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("posts");

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    containScroll: "trimSnaps",
  });

  useEffect(() => {
    if (isCreateOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isCreateOpen]);

  const filteredPosts = posts.filter((post) => {
    if (activeFilter === "comments") {
      return Number(post.commentCount || 0) > 0;
    }

    if (activeFilter === "images") {
      return !!post.imageUrl;
    }

    return true;
  });

  const previewPosts = filteredPosts.slice(0, 5);
  const totalPosts = Number.isFinite(Number(postsCount))
    ? Number(postsCount)
    : posts.length;

  useEffect(() => {
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
  }, [activeFilter, previewPosts.length, emblaApi]);

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const goToAllActivity = () => {
    if (!username) {
      showToast?.("Username was not found.", "error");
      return;
    }

    navigate(`/profile/${username}/activity`, {
      state: {
        isOwner,
        userId,
        isEmployer,
      },
    });
  };

  const handleOpenPostComments = (postId) => {
    if (!username) {
      showToast?.("Username was not found.", "error");
      return;
    }

    navigate(`/profile/${username}/activity`, {
      state: {
        isOwner,
        userId,
        isEmployer,
        openCommentsPostId: postId,
      },
    });
  };

  return (
    <div className="profile-section-card activity-carousel-section" style={styles.card}>
      <div style={styles.topRow}>
        <div style={styles.headingGroup}>
          <div>
            <div className="profile-section-title" style={styles.header}>
              Activity
            </div>
            <div style={styles.subText}>{totalPosts} posts</div>
          </div>
        </div>

        <div style={styles.actionsRight}>
          {isOwner && (
            <button
              type="button"
              className="profile-create-post-button"
              style={styles.addPostButton}
              onClick={() => setIsCreateOpen(true)}
            >
              <ProfileIcon name="compose" size={17} />
              Create a post
            </button>
          )}

          {previewPosts.length > 1 && (
            <div style={styles.arrows}>
              <button
                type="button"
                className="profile-icon-button"
                style={styles.arrowBtn}
                onClick={scrollPrev}
                aria-label="Previous activity"
              >
                <ProfileIcon name="chevronLeft" size={20} />
              </button>

              <button
                type="button"
                className="profile-icon-button"
                style={styles.arrowBtn}
                onClick={scrollNext}
                aria-label="Next activity"
              >
                <ProfileIcon name="chevronRight" size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="activity-filter-tabs" role="tablist" aria-label="Activity filters">
        {[
          ["posts", "Posts"],
          ["comments", "Comments"],
          ["images", "Images"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeFilter === value}
            className={activeFilter === value ? "is-active" : ""}
            onClick={() => setActiveFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {previewPosts.length === 0 ? (
        <div style={styles.empty}>No {activeFilter} activity yet.</div>
      ) : (
        <div className="activity-carousel-viewport" style={styles.viewport} ref={emblaRef}>
          <div className="activity-carousel-track" style={styles.container}>
            {previewPosts.map((post) => (
              <div key={post.id} className="activity-carousel-slide" style={styles.slide}>
                <ActivityPreviewCard
                  post={post}
                  showActions={isOwner}
                  isEmployer={isEmployer}
                  showToast={showToast}
                  likeConnection={likeConnection}
                  onPostUpdated={onPostUpdated}
                  onPostDeleted={onPostDeleted}
                  onOpenComments={handleOpenPostComments}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {posts.length > 0 && (
        <button
          type="button"
          className="profile-view-all-button"
          style={styles.footer}
          onClick={goToAllActivity}
        >
          <span>View all activity</span>
          <ProfileIcon name="arrowRight" size={18} />
        </button>
      )}

      {isCreateOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCreateOpen(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <CreatePostBox
              placeholder="Share something..."
              showToast={showToast}
              onPostCreated={(createdPost) => {
                onPostCreated?.(createdPost);
                setIsCreateOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: "var(--app-surface)",
    border: "1px solid var(--app-border)",
    borderRadius: 16,
    padding: 18,
  },

  topRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 10,
  },

  headingGroup: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },

  header: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 6,
  },

  subText: {
    fontSize: 14,
    color: "var(--app-muted)",
  },

  actionsRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
  },

  addPostButton: {
    border: "1px solid var(--app-accent)",
    backgroundColor: "var(--app-surface)",
    color: "var(--app-accent)",
    padding: "8px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
  },

  arrows: {
    display: "flex",
    gap: 8,
  },

  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
    color: "var(--app-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  viewport: {
    overflow: "hidden",
    margin: "0 -5px",
  },

  container: {
    display: "flex",
  },

  slide: {
    minWidth: 0,
    padding: "0 5px",
  },

  footer: {
    width: "100%",
    marginTop: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "none",
    background: "transparent",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--app-accent)",
    cursor: "pointer",
    borderTop: "1px solid var(--app-border)",
    paddingTop: 14,
  },

  empty: {
    color: "var(--app-muted)",
    fontSize: 14,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    overflowY: "auto",
    padding: "24px",
  },

  modalContent: {
    width: "100%",
    maxWidth: 720,
    margin: "0 16px",
  },
};

export default ActivitiesCarousel;
