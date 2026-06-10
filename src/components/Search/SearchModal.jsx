import React, { useContext, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import searchIcon from "../../assets/Search.png";
import defaultAvatar from "../../assets/default-avatar.png";
import { SearchContext } from "../../context/SearchContext";
import { searchUsers } from "../../services/searchApi";
import api from "../../services/api";

const API_ROOT = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

export default function SearchModal() {
  const navigate = useNavigate();
  const location = useLocation();

  const wrapperRef = useRef(null);

  const { query, setQuery } = useContext(SearchContext);

  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const getImageUrl = (path) => {
    if (!path) return defaultAvatar;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ROOT}/${path.replace(/^\/+/, "")}`;
  };

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
        const res = await searchUsers(cleanQuery);
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
      <div style={styles.inputContainer}>
        <img src={searchIcon} style={styles.icon} alt="search" />

        <input
          placeholder="Search"
          style={styles.input}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);

            if (location.pathname !== "/search") {
              setShowModal(true);
            }
          }}
          onFocus={() => {
            if (location.pathname !== "/search" && query.trim()) {
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
        <div style={styles.modalOverlay}>
          <div style={styles.previewList}>
            {query.trim().length === 0 ? (
              <p style={styles.emptyText}>Start typing to search.</p>
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
            <button type="button" style={styles.more} onClick={goToSearch}>
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
    width: 230,
    height: 34,
    borderRadius: 20,
    border: "1px solid #222",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  icon: {
    width: 18,
    height: 18,
    marginLeft: 10,
    opacity: 0.7,
  },

  input: {
    flex: 1,
    height: "90%",
    borderRadius: 20,
    marginLeft: 6,
    border: "none",
    outline: "none",
    fontSize: 14,
    backgroundColor: "transparent",
  },

  modalOverlay: {
    position: "absolute",
    top: 42,
    left: 0,
    width: 320,
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #ddd",
    boxShadow: "0 8px 24px rgba(0,0,0,0.16)",
    zIndex: 9999,
    overflow: "hidden",
  },

  previewList: {
    padding: 8,
    maxHeight: 280,
    overflowY: "auto",
  },

  itemButton: {
    width: "100%",
    border: "none",
    backgroundColor: "transparent",
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 8px",
    cursor: "pointer",
    textAlign: "left",
  },

  avatar: {
    width: 38,
    height: 38,
    objectFit: "cover",
    backgroundColor: "#eef3f8",
  },

  textBox: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  name: {
    fontSize: 14,
    fontWeight: 700,
    color: "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  subText: {
    fontSize: 12,
    color: "#666",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  line: {
    height: 1,
    backgroundColor: "#eee",
    margin: "2px 0",
  },

  more: {
    width: "100%",
    border: "none",
    borderTop: "1px solid #eee",
    backgroundColor: "#fff",
    padding: "11px 12px",
    color: "#0a66c2",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyText: {
    textAlign: "center",
    margin: "28px 0",
    fontSize: 14,
    fontWeight: 500,
    color: "#666",
  },
};