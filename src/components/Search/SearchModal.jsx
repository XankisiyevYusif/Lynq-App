import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import defaultAvatar from "../../assets/default-avatar.png";
import ProfileIcon from "../Profile/ProfileIcon";
import { SearchContext } from "../../context/SearchContext";
import {
  searchUsers,
  searchHashtags,
  getRecommendedUsers,
  getSearchHistory,
  hideSearchHistoryItem,
  clearVisibleSearchHistory,
} from "../../services/searchApi";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function SearchModal() {
  const navigate = useNavigate();
  const location = useLocation();

  const wrapperRef = useRef(null);

  const { query, setQuery } = useContext(SearchContext);

  const [results, setResults] = useState([]);
  const [resultType, setResultType] = useState("people");
  const [showModal, setShowModal] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [hoveredHistoryIdx, setHoveredHistoryIdx] = useState(null);
  const [historyBusyId, setHistoryBusyId] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getSearchHistory();
      setSearchHistory(data);
    } catch (err) {
      console.error("Failed to load search history in modal:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showModal && query.trim().length === 0) {
      fetchHistory();
    }
  }, [showModal, query]);

  const getImageUrl = (path) => resolveMediaUrl(path, defaultAvatar);

  const goToSearch = () => {
    const cleanQuery = query.trim();

    if (!cleanQuery) return;

    setShowModal(false);
    navigate(`/search?query=${encodeURIComponent(cleanQuery)}`);
  };

  const goToProfile = (username) => {
    if (!username) return;

    setShowModal(false);
    navigate(`/profile/${username}`);
  };

  const hideHistoryItem = async (event, item, idx) => {
    event.stopPropagation();
    const id = typeof item === "object" ? item?.id ?? item?.Id : null;
    if (!id) return;

    try {
      setHistoryBusyId(id);
      await hideSearchHistoryItem(id);
      setSearchHistory((current) => current.filter((entry, entryIdx) => {
        const entryId = typeof entry === "object" ? entry?.id ?? entry?.Id : null;
        return entryId ? Number(entryId) !== Number(id) : entryIdx !== idx;
      }));
    } catch (error) {
      console.error("Failed to hide search history item:", error);
    } finally {
      setHistoryBusyId(null);
    }
  };

  const clearHistory = async () => {
    try {
      setHistoryBusyId("all");
      await clearVisibleSearchHistory();
      setSearchHistory([]);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    } finally {
      setHistoryBusyId(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setShowModal(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      const cleanQuery = query.trim();

      if (!cleanQuery || location.pathname === "/search") {
        setResults([]);
        return;
      }

      try {
        const isHashtag = cleanQuery.startsWith("#");
        const isMention = cleanQuery.startsWith("@");
        const res = isHashtag
          ? await searchHashtags(cleanQuery)
          : isMention && cleanQuery.length === 1
            ? await getRecommendedUsers(1, 6)
            : await searchUsers(cleanQuery);
        setResultType(isHashtag ? "hashtags" : "people");
        setResults(res);
      } catch (err) {
        console.error("Search preview error:", err);
        setResults([]);
      }
    };

    const delayDebounce = setTimeout(fetchResults, 350);

    return () => clearTimeout(delayDebounce);
  }, [query, location.pathname]);

  return (
    <div style={styles.wrapper} ref={wrapperRef}>
      <div className="navbar-search-box" style={styles.inputContainer}>
        <ProfileIcon
          name="search"
          size={17}
          strokeWidth={2}
          className="navbar-search-icon"
        />

        <input
          placeholder="Search"
          aria-label="Search people and jobs"
          style={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);

            if (location.pathname !== "/search") {
              setShowModal(true);
            }
          }}
          onFocus={() => {
            if (location.pathname !== "/search") {
              setShowModal(true);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              goToSearch();
            }

            if (e.key === "Escape") {
              setShowModal(false);
            }
          }}
        />
      </div>

      {showModal && location.pathname !== "/search" && (
        <div className="navbar-search-popover" style={styles.modalOverlay}>
          <div style={styles.previewList}>
            {query.trim().length === 0 ? (
              <div style={styles.historyContainer}>
                <div style={styles.historyHeaderRow}>
                  <div style={styles.historyHeader}>Recent searches</div>
                  {searchHistory.length > 0 && (
                    <button
                      type="button"
                      style={styles.clearHistoryButton}
                      disabled={historyBusyId === "all"}
                      onClick={clearHistory}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                {loadingHistory ? (
                  <p style={styles.historySubText}>Loading history...</p>
                ) : searchHistory.length > 0 ? (
                  searchHistory.slice(0, 5).map((item, idx) => {
                    const term =
                      typeof item === "string"
                        ? item
                        : item?.query ||
                          item?.queryText ||
                          item?.keyword ||
                          item?.searchText ||
                          item?.text ||
                          item?.searchQuery ||
                          "";
                    if (!term) return null;
                    const id = typeof item === "object" ? item?.id ?? item?.Id : idx;
                    return (
                      <div
                        key={id}
                        style={{
                          ...styles.historyRow,
                          backgroundColor: hoveredHistoryIdx === idx ? "var(--app-surface-2)" : "transparent",
                        }}
                        onMouseEnter={() => setHoveredHistoryIdx(idx)}
                        onMouseLeave={() => setHoveredHistoryIdx(null)}
                      >
                        <button
                          type="button"
                          className="navbar-search-result"
                          style={styles.historyItemButton}
                          onClick={() => {
                            setQuery(term);
                            setShowModal(false);
                            navigate(`/search?query=${encodeURIComponent(term)}`);
                          }}
                        >
                          <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                          stroke="currentColor"
                          style={styles.historyIcon}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                          <span style={styles.historyText}>{term}</span>
                        </button>
                        <button
                          type="button"
                          aria-label={`Remove ${term} from recent searches`}
                          title="Remove from your recent searches"
                          style={styles.historyRemoveButton}
                          disabled={historyBusyId === id}
                          onClick={(event) => hideHistoryItem(event, item, idx)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p style={styles.historySubText}>No recent searches.</p>
                )}
              </div>
            ) : resultType === "hashtags" && results.length > 0 ? (
              results.slice(0, 6).map((item) => {
                const tag = String(
                  item?.name || item?.Name || item?.tag || item?.Tag || item,
                ).replace(/^#/, "");
                const count = item?.postCount || item?.PostCount || 0;

                return (
                  <button
                    key={tag}
                    type="button"
                    className="navbar-search-result"
                    style={styles.itemButton}
                    onClick={() => {
                      setShowModal(false);
                      navigate(
                        `/search?query=${encodeURIComponent(`#${tag}`)}`,
                      );
                    }}
                  >
                    <span style={styles.hashIcon}>#</span>
                    <div style={styles.textBox}>
                      <span style={styles.name}>#{tag}</span>
                      <span style={styles.subText}>{count} posts</span>
                    </div>
                  </button>
                );
              })
            ) : results.length > 0 ? (
              results.slice(0, 4).map((user) => {
                const isEmployer =
                  user.userType === "Employer" ||
                  user.UserType === "Employer" ||
                  user.role === "Employer" ||
                  user.Role === "Employer";

                return (
                  <div key={user.id || user.username}>
                    <button
                      type="button"
                      className="navbar-search-result"
                      style={styles.itemButton}
                      onClick={() => goToProfile(user.username)}
                    >
                      <img
                        src={getImageUrl(user.profileImage)}
                        alt=""
                        style={{
                          ...styles.avatar,
                          borderRadius: isEmployer ? 8 : "50%",
                        }}
                      />

                      <div style={styles.textBox}>
                        <span style={styles.name}>
                          {user.fullName || user.name || user.username}
                        </span>

                        <span style={styles.subText}>
                          {user.currentPosition ||
                            user.bio ||
                            user.role ||
                            user.userType ||
                            "Profile"}
                        </span>
                      </div>
                    </button>

                    <div style={styles.line} />
                  </div>
                );
              })
            ) : (
              <p style={styles.emptyText}>No results found.</p>
            )}
          </div>

          {query.trim() && (
            <button
              type="button"
              className="navbar-search-more"
              style={styles.more}
              onClick={goToSearch}
            >
              See all results
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
  },

  inputContainer: {
    display: "flex",
    width: 238,
    height: 38,
    borderRadius: 12,
    border: "1px solid var(--app-border)",
    alignItems: "center",
    backgroundColor: "var(--app-surface-2)",
  },

  input: {
    flex: 1,
    height: "100%",
    borderRadius: 12,
    marginLeft: 8,
    paddingRight: 12,
    border: "none",
    outline: "none",
    fontSize: 13.5,
    color: "var(--app-text)",
    backgroundColor: "transparent",
  },

  modalOverlay: {
    position: "absolute",
    top: 46,
    left: 0,
    width: 340,
    backgroundColor: "var(--app-surface)",
    borderRadius: 14,
    border: "1px solid var(--app-border)",
    boxShadow: "0 18px 45px rgba(15, 23, 42, 0.15)",
    zIndex: 9999,
    overflow: "hidden",
  },

  previewList: {
    padding: 8,
    maxHeight: 310,
    overflowY: "auto",
  },

  itemButton: {
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 11,
    padding: "9px 10px",
    cursor: "pointer",
    textAlign: "left",
  },

  avatar: {
    width: 40,
    height: 40,
    objectFit: "cover",
    backgroundColor: "var(--app-surface-2)",
  },

  hashIcon: {
    width: 40,
    height: 40,
    display: "grid",
    placeItems: "center",
    flex: "0 0 auto",
    borderRadius: 10,
    backgroundColor: "rgba(79, 70, 229,0.08)",
    color: "#4f46e5",
    fontSize: 20,
    fontWeight: 800,
  },

  textBox: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  name: {
    fontSize: 13.5,
    fontWeight: 700,
    color: "var(--app-text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  subText: {
    fontSize: 12,
    color: "var(--app-muted)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  line: {
    height: 1,
    backgroundColor: "var(--app-border)",
    margin: "2px 0",
  },

  more: {
    width: "100%",
    border: "none",
    borderTop: "1px solid var(--app-border)",
    backgroundColor: "var(--app-surface)",
    padding: "11px 12px",
    color: "#4f46e5",
    fontSize: 13.5,
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyText: {
    textAlign: "center",
    margin: "28px 0",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--app-muted)",
  },
  historyContainer: {
    padding: "8px 4px",
  },

  historyHeaderRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "4px 6px 7px",
  },

  clearHistoryButton: {
    border: 0,
    background: "transparent",
    color: "var(--app-muted)",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
  },

  historyRow: {
    display: "flex",
    alignItems: "center",
    borderRadius: 9,
  },

  historyRemoveButton: {
    width: 30,
    height: 30,
    marginRight: 4,
    border: 0,
    borderRadius: "50%",
    background: "transparent",
    color: "var(--app-muted)",
    fontSize: 20,
    lineHeight: 1,
    cursor: "pointer",
  },
  historyHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--app-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    padding: "0 12px 8px",
  },
  historyItemButton: {
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    cursor: "pointer",
    textAlign: "left",
    borderRadius: 8,
    transition: "background-color 0.2s",
    outline: "none",
  },
  historyIcon: {
    width: 16,
    height: 16,
    color: "var(--app-muted)",
    flexShrink: 0,
  },
  historyText: {
    fontSize: 14,
    color: "var(--app-text)",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  historySubText: {
    fontSize: 13,
    color: "var(--app-muted)",
    padding: "8px 12px",
    margin: 0,
  },
};
