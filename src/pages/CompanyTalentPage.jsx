import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import defaultAvatar from "../assets/default-avatar.png";
import api from "../services/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import "./CompanyTalentPage.css";

const tabs = [
  ["discover", "Recommended"],
  ["saved", "Saved"],
  ["followers", "Company followers"],
  ["employees", "Employees"],
  ["invitations", "Invitations"],
];

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

const read = (source, camel, pascal, fallback = null) =>
  source?.[camel] ?? source?.[pascal] ?? fallback;

const candidateId = (candidate) =>
  read(candidate, "candidateId", "CandidateId") ||
  read(candidate, "id", "Id");

const CandidateCard = ({
  candidate,
  onOpen,
  onSave,
  onInvite,
  onWithdraw,
  onStatus,
  onRemove,
  navigate,
  compact = false,
}) => {
  const username = read(candidate, "username", "Username", "");
  const id = candidateId(candidate);
  const skills = read(candidate, "skills", "Skills", []);
  const status =
    read(candidate, "savedStatus", "SavedStatus") ||
    read(candidate, "status", "Status");
  const isOpenToWork = Boolean(
    read(candidate, "isOpenToWork", "IsOpenToWork", false),
  );
  const matchReasons = read(candidate, "matchReasons", "MatchReasons", []);
  const followerCount = Number(
    read(candidate, "followerCount", "FollowerCount", 0),
  );
  const matchScore = read(candidate, "matchScore", "MatchScore");
  const canOpenAvailability = isOpenToWork && Boolean(onOpen);

  const stop = (handler) => (event) => {
    event.stopPropagation();
    handler?.();
  };

  const openFromKeyboard = (event) => {
    if (!canOpenAvailability) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(candidate);
    }
  };

  return (
    <article
      className={`talent-card ${compact ? "is-compact" : ""} ${
        canOpenAvailability ? "is-clickable" : ""
      }`}
      onClick={() => canOpenAvailability && onOpen(candidate)}
      onKeyDown={openFromKeyboard}
      role={canOpenAvailability ? "button" : undefined}
      tabIndex={canOpenAvailability ? 0 : undefined}
    >
      <div className="talent-card-profile">
        <img
          src={resolveMediaUrl(
            read(candidate, "profileImage", "ProfileImage"),
            defaultAvatar,
          )}
          alt=""
          onError={(event) => {
            event.currentTarget.src = defaultAvatar;
          }}
        />
        <span className="talent-card-identity">
          <strong>
            {read(candidate, "fullName", "FullName") || username || "Member"}
          </strong>
          <small>
            {read(candidate, "currentPosition", "CurrentPosition") ||
              "Open to opportunities"}
          </small>
          <em>
            {read(candidate, "location", "Location") || "Location not added"}
          </em>
        </span>
        <span className="talent-card-badges">
          {isOpenToWork && <b className="talent-open-badge">Open to work</b>}
          {Number.isFinite(Number(matchScore)) && (
            <b className="talent-match">{matchScore}% match</b>
          )}
        </span>
      </div>

      <div className="talent-card-network">
        <span>{followerCount.toLocaleString()} followers</span>
        {canOpenAvailability && <span>View availability →</span>}
      </div>

      {!!skills.length && (
        <div className="talent-skills">
          {skills.slice(0, 5).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      )}

      {!!matchReasons.length && (
        <div className="talent-match-reasons">
          {matchReasons.slice(0, 3).map((reason) => (
            <span key={reason}>✓ {reason}</span>
          ))}
        </div>
      )}

      <div className="talent-card-actions">
        <button
          type="button"
          className="is-secondary"
          onClick={stop(() => username && navigate(`/profile/${username}`))}
        >
          View profile
        </button>
        {onInvite && (
          <button
            type="button"
            className="is-primary"
            onClick={stop(() => onInvite(candidate))}
          >
            {candidate.isInvited ? "Invited" : "Invite"}
          </button>
        )}
        {onWithdraw && (
          <button
            type="button"
            className="is-danger"
            onClick={stop(() => onWithdraw(candidate))}
          >
            Withdraw invite
          </button>
        )}
        {onSave && !candidate.isSaved && (
          <button
            type="button"
            className="is-quiet"
            onClick={stop(() => onSave(id))}
          >
            Save
          </button>
        )}
        {onStatus && (
          <select
            value={status || "Saved"}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onStatus(id, event.target.value)}
          >
            <option>Saved</option>
            <option>Contacted</option>
            <option>Invited</option>
          </select>
        )}
        {onRemove && (
          <button
            type="button"
            className="is-danger"
            onClick={stop(() => onRemove(id))}
          >
            Remove
          </button>
        )}
      </div>
    </article>
  );
};

const AvailabilityModal = ({ candidate, onClose, navigate }) => {
  if (!candidate) return null;

  const username = read(candidate, "username", "Username", "");
  const fullName =
    read(candidate, "fullName", "FullName") || username || "Candidate";
  const jobTitles = read(candidate, "jobTitles", "JobTitles", []);
  const workplaceTypes = read(
    candidate,
    "workplaceTypes",
    "WorkplaceTypes",
    [],
  );
  const onsiteLocations = read(
    candidate,
    "onsiteLocations",
    "OnsiteLocations",
    [],
  );
  const remoteLocations = read(
    candidate,
    "remoteLocations",
    "RemoteLocations",
    [],
  );
  const employmentTypes = read(
    candidate,
    "employmentTypes",
    "EmploymentTypes",
    [],
  );
  const startAvailability = read(
    candidate,
    "startAvailability",
    "StartAvailability",
    "Immediately",
  );

  const line = (values) =>
    Array.isArray(values) && values.length ? values.join(" · ") : "Not specified";

  return (
    <div className="talent-modal-backdrop" onClick={onClose}>
      <section
        className="talent-availability-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div className="talent-availability-person">
            <img
              src={resolveMediaUrl(
                read(candidate, "profileImage", "ProfileImage"),
                defaultAvatar,
              )}
              alt=""
              onError={(event) => {
                event.currentTarget.src = defaultAvatar;
              }}
            />
            <div>
              <span>Open to work</span>
              <h2>{fullName}</h2>
              <p>
                {read(candidate, "currentPosition", "CurrentPosition") ||
                  "Actively exploring opportunities"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <dl>
          <div>
            <dt>Job titles</dt>
            <dd>{line(jobTitles)}</dd>
          </div>
          <div>
            <dt>Work modes</dt>
            <dd>{line(workplaceTypes)}</dd>
          </div>
          <div>
            <dt>On-site locations</dt>
            <dd>{line(onsiteLocations)}</dd>
          </div>
          <div>
            <dt>Remote locations</dt>
            <dd>{line(remoteLocations)}</dd>
          </div>
          <div>
            <dt>Start date</dt>
            <dd>
              {startAvailability === "Immediately"
                ? "Immediately, actively looking"
                : "Flexible, open to the right opportunity"}
            </dd>
          </div>
          <div>
            <dt>Employment types</dt>
            <dd>{line(employmentTypes)}</dd>
          </div>
        </dl>

        <footer>
          <span>
            {Number(
              read(candidate, "followerCount", "FollowerCount", 0),
            ).toLocaleString()}{" "}
            followers
          </span>
          <div>
            <button
              type="button"
              className="is-quiet"
              onClick={() => navigate(`/messages/${username}`)}
            >
              Message
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={() => navigate(`/profile/${username}`)}
            >
              View profile
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

export default function CompanyTalentPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("discover");
  const [items, setItems] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(
    () => new URLSearchParams(window.location.search).get("job") || "",
  );
  const [filters, setFilters] = useState({
    search: "",
    skills: "",
    location: "",
    workplaceType: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [availabilityTarget, setAvailabilityTarget] = useState(null);
  const [inviteTarget, setInviteTarget] = useState(null);
  const [inviteJobId, setInviteJobId] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [withdrawingInvitationId, setWithdrawingInvitationId] = useState(null);
  const [matchModal, setMatchModal] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value !== "") params.set(key, value);
    });
    return params.toString();
  }, [appliedFilters]);

  const loadJobs = async () => {
    const response = await api.get("/company/talent/active-jobs");
    setJobs(unwrap(response) || []);
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      setError("");
      let endpoint = `/company/talent/${activeTab}`;
      if (activeTab === "discover" && queryString) endpoint += `?${queryString}`;
      const response = await api.get(endpoint);
      const payload = unwrap(response);
      setItems(
        payload?.items ||
          payload?.Items ||
          (Array.isArray(payload) ? payload : []),
      );
    } catch (requestError) {
      console.error("Talent workspace load failed:", requestError);
      setError("Talent data could not be loaded.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs().catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    loadItems();
  }, [activeTab, queryString]);

  const notify = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  const saveCandidate = async (id) => {
    await api.post("/company/talent/saved", { candidateId: id });
    setItems((current) =>
      current.map((item) =>
        candidateId(item) === id
          ? { ...item, isSaved: true, savedStatus: "Saved" }
          : item,
      ),
    );
    setMatchModal((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              candidateId(item) === id
                ? { ...item, isSaved: true, savedStatus: "Saved" }
                : item,
            ),
          }
        : current,
    );
    notify("Candidate saved.");
  };

  const findMatches = async () => {
    if (!selectedJob) {
      notify("Select an active job first.");
      return;
    }

    setMatchModal({ items: [], job: null });
    setMatchLoading(true);
    setMatchError("");
    try {
      const response = await api.get("/company/talent/discover", {
        params: {
          jobPostId: selectedJob,
          matchOnly: true,
          page: 1,
          pageSize: 30,
        },
      });
      const payload = unwrap(response) || {};
      setMatchModal({
        items: payload.items || payload.Items || [],
        job: payload.job || payload.Job || null,
      });
    } catch (requestError) {
      console.error("Job talent matching failed:", requestError);
      setMatchError("Matching candidates could not be loaded.");
    } finally {
      setMatchLoading(false);
    }
  };

  const changeStatus = async (id, status) => {
    await api.patch(`/company/talent/saved/${id}/status`, { status });
    setItems((current) =>
      current.map((item) =>
        candidateId(item) === id ? { ...item, status } : item,
      ),
    );
  };

  const removeSaved = async (id) => {
    await api.delete(`/company/talent/saved/${id}`);
    setItems((current) =>
      current.filter((item) => candidateId(item) !== id),
    );
    notify("Candidate removed from saved talent.");
  };

  const openInvite = (candidate) => {
    if (candidate.isInvited) return;
    setMatchModal(null);
    setAvailabilityTarget(null);
    setInviteTarget(candidate);
    setInviteJobId(selectedJob || jobs[0]?.id || jobs[0]?.Id || "");
    setInviteMessage("");
  };

  const sendInvite = async () => {
    const id = candidateId(inviteTarget);
    if (!id || !inviteJobId) return;
    await api.post("/company/talent/invite", {
      candidateId: id,
      jobPostId: Number(inviteJobId),
      message: inviteMessage.trim() || null,
    });
    setItems((current) =>
      current.map((item) =>
        candidateId(item) === id
          ? { ...item, isInvited: true, savedStatus: "Invited" }
          : item,
      ),
    );
    setInviteTarget(null);
    notify("Job invitation sent.");
  };

  const withdrawInvite = async () => {
    const invitationId = read(withdrawTarget, "id", "Id");
    if (!invitationId || withdrawingInvitationId) return;

    try {
      setWithdrawingInvitationId(invitationId);
      await api.delete(`/company/talent/invitations/${invitationId}`);
      setItems((current) =>
        current.filter(
          (item) => read(item, "id", "Id") !== invitationId,
        ),
      );
      setWithdrawTarget(null);
      notify("Job invitation withdrawn.");
    } catch (requestError) {
      console.error("Invitation withdrawal failed:", requestError);
      notify("Job invitation could not be withdrawn.");
    } finally {
      setWithdrawingInvitationId(null);
    }
  };

  const clearFilters = () => {
    const clean = {
      search: "",
      skills: "",
      location: "",
      workplaceType: "",
    };
    setFilters(clean);
    setAppliedFilters(clean);
  };

  const openAvailability = (candidate) => {
    setMatchModal(null);
    setAvailabilityTarget(candidate);
  };

  return (
    <>
      <Navbar />
      <main className="company-talent-page">
        {notice && <div className="talent-notice">{notice}</div>}

        <header className="talent-hero">
          <div>
            <span>Company workspace</span>
            <h1>Talent</h1>
            <p>
              Discover people who are actively looking for their next
              opportunity.
            </p>
          </div>
          <div className="talent-hero-stat">
            <strong>{items.length}</strong>
            <span>{activeTab === "discover" ? "open candidates" : "items"}</span>
          </div>
        </header>

        <nav className="talent-tabs" aria-label="Talent sections">
          {tabs.map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={activeTab === key ? "is-active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "discover" && (
          <section className="talent-discovery-panel">
            <div className="talent-discovery-top">
              <div>
                <span className="talent-open-only">Open to work only</span>
                <h2>Recommended talent</h2>
                <p>
                  Ranked by your active roles, skills, work mode and location
                  relevance.
                </p>
              </div>
              <div className="talent-find-match">
                <select
                  value={selectedJob}
                  onChange={(event) => setSelectedJob(event.target.value)}
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job.id || job.Id} value={job.id || job.Id}>
                      {job.title || job.Title}
                    </option>
                  ))}
                </select>
                <button type="button" className="is-primary" onClick={findMatches}>
                  Find match
                </button>
              </div>
            </div>

            <div className="talent-searchbar">
              <input
                value={filters.search}
                onChange={(event) =>
                  setFilters({ ...filters, search: event.target.value })
                }
                placeholder="Name or keyword"
              />
              <input
                value={filters.skills}
                onChange={(event) =>
                  setFilters({ ...filters, skills: event.target.value })
                }
                placeholder="Skills: React, .NET, SQL"
              />
              <input
                value={filters.location}
                onChange={(event) =>
                  setFilters({ ...filters, location: event.target.value })
                }
                placeholder="Location"
              />
              <select
                value={filters.workplaceType}
                onChange={(event) =>
                  setFilters({ ...filters, workplaceType: event.target.value })
                }
              >
                <option value="">Any work mode</option>
                <option>On-site</option>
                <option>Hybrid</option>
                <option>Remote</option>
              </select>
              <button type="button" className="is-primary" onClick={() => setAppliedFilters(filters)}>
                Search
              </button>
              <button type="button" className="is-quiet" onClick={clearFilters}>
                Clear
              </button>
            </div>
          </section>
        )}

        <section className="talent-results">
          {loading ? (
            <div className="talent-state">Loading talent...</div>
          ) : error ? (
            <div className="talent-state is-error">{error}</div>
          ) : items.length === 0 ? (
            <div className="talent-state">
              <strong>No open candidates found</strong>
              <span>
                Try broader filters or check again when more members enable
                Open to work.
              </span>
            </div>
          ) : (
            items.map((candidate) => (
              <CandidateCard
                key={candidateId(candidate)}
                candidate={candidate}
                navigate={navigate}
                compact={activeTab !== "discover"}
                onOpen={activeTab === "discover" ? openAvailability : null}
                onSave={activeTab === "discover" ? saveCandidate : null}
                onInvite={
                  ["discover", "saved", "followers"].includes(activeTab)
                    ? openInvite
                    : null
                }
                onStatus={activeTab === "saved" ? changeStatus : null}
                onRemove={activeTab === "saved" ? removeSaved : null}
                onWithdraw={
                  activeTab === "invitations" ? setWithdrawTarget : null
                }
              />
            ))
          )}
          {activeTab === "employees" && !loading && items.length > 0 && (
            <p className="talent-disclaimer">
              Based on information provided by members.
            </p>
          )}
        </section>
      </main>

      <AvailabilityModal
        candidate={availabilityTarget}
        onClose={() => setAvailabilityTarget(null)}
        navigate={navigate}
      />

      {inviteTarget && (
        <div
          className="talent-modal-backdrop"
          onClick={() => setInviteTarget(null)}
        >
          <div
            className="talent-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <span>Direct job invitation</span>
            <h2>
              Invite{" "}
              {read(inviteTarget, "fullName", "FullName", "candidate")}
            </h2>
            <label>
              Job post
              <select
                value={inviteJobId}
                onChange={(event) => setInviteJobId(event.target.value)}
              >
                {jobs.map((job) => (
                  <option key={job.id || job.Id} value={job.id || job.Id}>
                    {job.title || job.Title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Optional note
              <textarea
                maxLength={500}
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder="Tell the candidate why this opportunity may be relevant."
              />
            </label>
            <div>
              <button
                type="button"
                className="is-quiet"
                onClick={() => setInviteTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="is-primary"
                disabled={!inviteJobId}
                onClick={sendInvite}
              >
                Send invitation
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawTarget && (
        <div
          className="talent-modal-backdrop"
          onClick={() => {
            if (!withdrawingInvitationId) setWithdrawTarget(null);
          }}
        >
          <section
            className="talent-modal talent-withdraw-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <span>Sent invitation</span>
            <h2>Withdraw job invitation?</h2>
            <p>
              The invitation sent to{" "}
              <strong>
                {read(withdrawTarget, "fullName", "FullName", "this candidate")}
              </strong>{" "}
              for{" "}
              <strong>
                {read(withdrawTarget, "jobTitle", "JobTitle", "this role")}
              </strong>{" "}
              will be removed.
            </p>
            <div>
              <button
                type="button"
                className="is-quiet"
                disabled={!!withdrawingInvitationId}
                onClick={() => setWithdrawTarget(null)}
              >
                Keep invitation
              </button>
              <button
                type="button"
                className="is-danger-solid"
                disabled={!!withdrawingInvitationId}
                onClick={withdrawInvite}
              >
                {withdrawingInvitationId ? "Withdrawing..." : "Withdraw"}
              </button>
            </div>
          </section>
        </div>
      )}

      {matchModal && (
        <div
          className="talent-modal-backdrop"
          onClick={() => setMatchModal(null)}
        >
          <section
            className="talent-match-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>Open-to-work matches</span>
                <h2>
                  {matchModal.job?.title ||
                    matchModal.job?.Title ||
                    "Matching candidates"}
                </h2>
                <p>
                  Active candidates with at least 60% job compatibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMatchModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            {matchLoading ? (
              <div className="talent-state">Calculating job matches...</div>
            ) : matchError ? (
              <div className="talent-state is-error">{matchError}</div>
            ) : matchModal.items.length === 0 ? (
              <div className="talent-state">
                <strong>No strong matches yet</strong>
                <span>
                  Add required skills, work mode and location to the job post.
                </span>
              </div>
            ) : (
              <div className="talent-match-modal-grid">
                {matchModal.items.map((candidate) => (
                  <CandidateCard
                    key={candidateId(candidate)}
                    candidate={candidate}
                    navigate={navigate}
                    onOpen={openAvailability}
                    onSave={saveCandidate}
                    onInvite={openInvite}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
