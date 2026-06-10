import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/Layout/Navbar";
import LoadingSpinner from "../../components/UI/LoadingSpinner";

const monthNames = {
  1: "Jan",
  2: "Feb",
  3: "Mar",
  4: "Apr",
  5: "May",
  6: "Jun",
  7: "Jul",
  8: "Aug",
  9: "Sep",
  10: "Oct",
  11: "Nov",
  12: "Dec",
};

function formatMonthYear(month, year) {
  if (!month && !year) return "";
  if (month && year) return `${monthNames[month]} ${year}`;
  if (year) return `${year}`;
  return "";
}

function getDateRange(exp) {
  const start = formatMonthYear(exp.startMonth, exp.startYear);

  if (exp.isCurrent) {
    return `${start} - Present`;
  }

  const end = formatMonthYear(exp.endMonth, exp.endYear);
  return `${start} - ${end}`;
}

export default function ExperienceListPage() {
  const { username } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isOwner = location.state?.isOwner === true;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        let response;

        if (isOwner) {
          response = await api.get("/User/me");
          setUser(response.data || null);
        } else {
          response = await api.get(`/User/${username}`);
          setUser(response.data || null);
        }
      } catch (error) {
        console.error("Failed to fetch experience list:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchUser();
    }
  }, [username, isOwner]);

  if (loading) {
    return <LoadingSpinner text="Loading experiences..." />;
  }

  if (!user) {
    return <div style={{ textAlign: "center", marginTop: 40 }}>User not found.</div>;
  }

  return (
    <>
      <Navbar />

      <div style={styles.page}>
        <div style={styles.container}>
          <button
            style={styles.backButton}
            onClick={() => navigate(`/profile/${username}`)}
          >
            Back
          </button>

          <div style={styles.card}>
            <h2 style={styles.title}>All experiences</h2>

            {(user.experiences || []).length === 0 ? (
              <div style={styles.emptyText}>No experience added yet.</div>
            ) : (
              user.experiences.map((exp, index) => (
                <div key={exp.id || index}>
                  <div style={styles.item}>
                    <div style={styles.left}>
                      <div style={styles.logoBox}>
                        {(exp.companyName || "E").charAt(0).toUpperCase()}
                      </div>

                      <div style={styles.info}>
                        <div style={styles.topRow}>
                          <div style={{ flex: 1 }}>
                            <div style={styles.position}>{exp.title}</div>
                            <div style={styles.company}>{exp.companyName}</div>
                          </div>

                          {isOwner && (
                            <button type="button" style={styles.iconButton}>
                              <img src={pencil} alt="edit" style={styles.icon} />
                            </button>
                          )}
                        </div>

                        <div style={styles.meta}>{getDateRange(exp)}</div>

                        {(exp.location || exp.locationType) && (
                          <div style={styles.meta}>
                            {exp.location || ""}
                            {exp.location && exp.locationType ? " · " : ""}
                            {exp.locationType || ""}
                          </div>
                        )}

                        {exp.employmentType && (
                          <div style={styles.meta}>{exp.employmentType}</div>
                        )}

                        {exp.description && (
                          <div style={styles.description}>{exp.description}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {index !== user.experiences.length - 1 && (
                    <div style={styles.divider} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    backgroundColor: "#f3f2ef",
    minHeight: "100vh",
    padding: "24px 0",
  },

  container: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
    padding: "0 16px",
  },

  backButton: {
    marginBottom: "16px",
    border: "none",
    background: "transparent",
    color: "#0a66c2",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "15px",
  },

  card: {
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "24px",
  },

  title: {
    margin: "0 0 20px 0",
    fontSize: "24px",
    fontWeight: 700,
    color: "#191919",
  },

  emptyText: {
    fontSize: "15px",
    color: "rgba(0,0,0,0.6)",
  },

  item: {
    padding: "8px 0",
  },

  left: {
    display: "flex",
    gap: "14px",
    alignItems: "flex-start",
  },

  logoBox: {
    width: "52px",
    height: "52px",
    borderRadius: "10px",
    backgroundColor: "#eef3f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "18px",
    color: "#428DFF",
    flexShrink: 0,
  },

  info: {
    flex: 1,
    minWidth: 0,
  },

  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
  },

  position: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#191919",
    marginBottom: "2px",
  },

  company: {
    fontSize: "15px",
    color: "#191919",
    marginBottom: "4px",
  },

  meta: {
    fontSize: "14px",
    color: "rgba(0,0,0,0.6)",
    marginBottom: "4px",
  },

  description: {
    marginTop: "8px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#191919",
    whiteSpace: "pre-wrap",
  },

  divider: {
    borderTop: "1px solid #ebebeb",
    margin: "12px 0",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  icon: {
    width: "18px",
    height: "18px",
    objectFit: "contain",
  },
};