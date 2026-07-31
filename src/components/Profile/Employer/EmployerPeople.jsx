import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import defaultAvatar from "../../../assets/default-avatar.png";
import { resolveMediaUrl } from "../../../utils/mediaUrl";
import "./EmployerPeople.css";

const unwrap = (response) =>
  response?.data?.data ?? response?.data?.Data ?? response?.data;

export default function EmployerPeople({ username }) {
  const navigate = useNavigate();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    api.get(`/Company/${username}/people`, { params: { take: 20 } })
      .then((response) => setPeople(unwrap(response) || []))
      .catch(() => setPeople([]))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <section className="company-people-section">
      <header>
        <span>Member-provided experience</span>
        <h2>People</h2>
        <p>Members who currently list this company in their experience.</p>
      </header>
      {loading ? (
        <div className="company-people-state">Loading people...</div>
      ) : people.length === 0 ? (
        <div className="company-people-state">No linked employees yet.</div>
      ) : (
        <div className="company-people-grid">
          {people.map((person) => (
            <button key={person.id || person.Id} type="button" onClick={() => navigate(`/profile/${person.username || person.Username}`)}>
              <img src={resolveMediaUrl(person.profileImage || person.ProfileImage, defaultAvatar)} alt="" onError={(event) => { event.currentTarget.src = defaultAvatar; }} />
              <span>
                <strong>{person.fullName || person.FullName}</strong>
                <small>{person.currentPosition || person.CurrentPosition || `Works at ${person.worksAt || person.WorksAt}`}</small>
                {(person.sharedSkillCount || person.SharedSkillCount) > 0 && <em>{person.sharedSkillCount || person.SharedSkillCount} shared skills</em>}
              </span>
            </button>
          ))}
        </div>
      )}
      <footer>Based on information provided by members.</footer>
    </section>
  );
}
