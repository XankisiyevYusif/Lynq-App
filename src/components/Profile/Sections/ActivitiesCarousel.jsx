import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";

import ActivityPreviewCard from "./ActivityPreviewCard";
import CreatePostBox from "../../Post/CreatePostBox";

const ActivitiesCarousel = ({
  posts = [],
  username,
  isOwner,
  isEmployer=false,
  onPostCreated,
  onPostUpdated,
  onPostDeleted,
  showToast,
  likeConnection,
  userId,
}) => {
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const previewPosts = posts.slice(0, 5);

  const scrollPrev = () => {
    if (emblaApi) emblaApi.scrollPrev();
  };

  const scrollNext = () => {
    if (emblaApi) emblaApi.scrollNext();
  };

  const goToAllActivity = () => {
    if (!username) {
      showToast?.("Username tapılmadı.", "error");
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
      showToast?.("Username tapılmadı.", "error");
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
    <div style={styles.card}>
      <div style={styles.topRow}>
        <div>
          <div style={styles.header}>Fəaliyyət</div>
          <div style={styles.subText}>{posts.length} paylaşım</div>
        </div>

        <div style={styles.actionsRight}>
          {isOwner && (
            <button
              type="button"
              style={styles.addPostButton}
              onClick={() => setIsCreateOpen(true)}
            >
              Create a post
            </button>
          )}

          {previewPosts.length > 1 && (
            <div style={styles.arrows}>
              <button type="button" style={styles.arrowBtn} onClick={scrollPrev}>
                ←
              </button>

              <button type="button" style={styles.arrowBtn} onClick={scrollNext}>
                →
              </button>
            </div>
          )}
        </div>
      </div>

      {previewPosts.length === 0 ? (
        <div style={styles.empty}>Hələ paylaşım yoxdur.</div>
      ) : (
        <div style={styles.viewport} ref={emblaRef}>
          <div style={styles.container}>
            {previewPosts.map((post) => (
              <div key={post.id} style={styles.slide}>
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
        <div style={styles.footer} onClick={goToAllActivity}>
          Tümünü gör →
        </div>
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
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: 16,
    padding: 20,
  },

  topRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 16,
  },

  header: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 6,
  },

  subText: {
    fontSize: 14,
    color: "#666",
  },

  actionsRight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginLeft: "auto",
  },

  addPostButton: {
    border: "1px solid #0a66c2",
    backgroundColor: "#fff",
    color: "#0a66c2",
    padding: "8px 14px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },

  arrows: {
    display: "flex",
    gap: 8,
  },

  arrowBtn: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    border: "1px solid #d0d0d0",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
  },

  viewport: {
    overflow: "hidden",
  },

  container: {
    display: "flex",
    gap: 16,
  },

  slide: {
    flex: "0 0 85%",
    minWidth: 0,
  },

  footer: {
    marginTop: 18,
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
    color: "#444",
    cursor: "pointer",
    borderTop: "1px solid #eee",
    paddingTop: 14,
  },

  empty: {
    color: "#666",
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