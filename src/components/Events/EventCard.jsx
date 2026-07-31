import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import ProfileIcon from "../Profile/ProfileIcon";
import "./Events.css";
import CreateEventModal from "./CreateEventModal";
import defaultAvatar from "../../assets/default-avatar.png";

export default function EventCard({ event, compact = false, onAttendanceChange, onChanged, showToast }) {
  const navigate = useNavigate();
  const currentUser = useSelector((state) => state.user.user);
  const [isAttending, setIsAttending] = useState(
    !!(event.isAttending || event.IsAttending),
  );
  const [attendeeCount, setAttendeeCount] = useState(
    Number(event.attendeeCount || event.AttendeeCount || 0),
  );
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  const id = event.id || event.Id;
  const username = event.username || event.Username;
  const startsAt = event.startsAt || event.StartsAt;
  const isPast = new Date(startsAt) < new Date();
  const imageUrl = event.imageUrl || event.ImageUrl;
  const currentUsername = currentUser?.basicInfo?.username || currentUser?.username || currentUser?.Username;
  const isOwner = !!(event.isOwner || event.IsOwner || (username && currentUsername && username.toLowerCase() === currentUsername.toLowerCase()));

  const toggleAttendance = async () => {
    if (!id || loading) return;
    const previous = isAttending;
    setIsAttending(!previous);
    setAttendeeCount((count) => Math.max(0, count + (previous ? -1 : 1)));
    setLoading(true);

    try {
      if (previous) await api.delete(`/Event/${id}/attend`);
      else await api.post(`/Event/${id}/attend`);
      onAttendanceChange?.(id, !previous);
    } catch (error) {
      setIsAttending(previous);
      setAttendeeCount((count) => Math.max(0, count + (previous ? 1 : -1)));
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!id || deleting || !window.confirm("Delete this event permanently?")) return;
    try {
      setDeleting(true);
      await api.delete(`/Event/${id}`);
      showToast?.("Event deleted.", "success");
      onChanged?.(id, "deleted");
    } catch (error) {
      showToast?.(error.response?.data || "Event could not be deleted.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const openAttendees = async () => {
    setAttendeesOpen(true);
    setAttendeesLoading(true);
    try {
      const response = await api.get(`/Event/${id}/attendees`);
      const payload =
        response?.data?.data ?? response?.data?.Data ?? response?.data ?? {};
      setAttendees(payload.items || payload.Items || []);
    } catch (error) {
      setAttendees([]);
      showToast?.("Attendees could not be loaded.", "error");
    } finally {
      setAttendeesLoading(false);
    }
  };

  return (
    <article
      className={`event-card ${compact ? "is-compact" : ""}`}
      onClick={(clickEvent) => {
        if (clickEvent.target.closest("button, input, textarea, form, label")) return;
        if (id) navigate(`/events/${id}`, { state: { eventPreview: event } });
      }}
    >
      <div className="event-media">
        {imageUrl ? (
          <img src={resolveMediaUrl(imageUrl)} alt={event.title || event.Title} />
        ) : (
          <div className="event-media-placeholder">
            <ProfileIcon name="calendar" size={30} strokeWidth={1.7} />
          </div>
        )}
      </div>

      <div className="event-copy">
        <time>{new Date(startsAt).toLocaleString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}</time>
        <h3>{event.title || event.Title}</h3>
        {!compact && (event.description || event.Description) && (
          <p>{event.description || event.Description}</p>
        )}
        <div className="event-meta">
          {(event.location || event.Location) && (
            <span><ProfileIcon name="mapPin" size={14} />{event.location || event.Location}</span>
          )}
          <span><ProfileIcon name="users" size={14} />{attendeeCount} attending</span>
        </div>
        {username && (
          <button className="event-company" type="button" onClick={(clickEvent) => { clickEvent.stopPropagation(); navigate(`/profile/${username}`); }}>
            {event.organizerName || event.OrganizerName || event.companyName || event.CompanyName || `@${username}`}
          </button>
        )}
      </div>

      {!isOwner && (
        <button
          type="button"
          className={`event-attend-button ${isAttending ? "is-attending" : ""}`}
          onClick={(clickEvent) => { clickEvent.stopPropagation(); toggleAttendance(); }}
          disabled={loading || isPast}
        >
          {isPast
            ? "Event ended"
            : loading
              ? "Saving..."
              : isAttending
                ? "Attending"
                : "Attend"}
        </button>
      )}

      {isOwner && (
        <div className="event-owner-actions">
          <button type="button" onClick={(clickEvent) => { clickEvent.stopPropagation(); openAttendees(); }}><ProfileIcon name="users" size={16} /> View attendees ({attendeeCount})</button>
          <button type="button" onClick={(clickEvent) => { clickEvent.stopPropagation(); setEditOpen(true); }}><ProfileIcon name="edit" size={16} /> Edit</button>
          <button type="button" className="is-danger" onClick={(clickEvent) => { clickEvent.stopPropagation(); deleteEvent(); }} disabled={deleting}><ProfileIcon name="trash" size={16} /> {deleting ? "Deleting..." : "Delete"}</button>
        </div>
      )}
      <CreateEventModal open={editOpen} event={event} onClose={() => setEditOpen(false)} onUpdated={() => onChanged?.(id, "updated")} showToast={showToast} />

      {attendeesOpen && (
        <div
          style={attendeeStyles.overlay}
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            setAttendeesOpen(false);
          }}
        >
          <section
            style={attendeeStyles.modal}
            onClick={(clickEvent) => clickEvent.stopPropagation()}
          >
            <header style={attendeeStyles.header}>
              <div>
                <small style={attendeeStyles.eyebrow}>Event audience</small>
                <h3 style={attendeeStyles.title}>Attendees ({attendeeCount})</h3>
              </div>
              <button
                type="button"
                style={attendeeStyles.close}
                onClick={() => setAttendeesOpen(false)}
              >
                ×
              </button>
            </header>

            {attendeesLoading ? (
              <div style={attendeeStyles.state}>Loading attendees...</div>
            ) : attendees.length === 0 ? (
              <div style={attendeeStyles.state}>No attendees yet.</div>
            ) : (
              <div style={attendeeStyles.list}>
                {attendees.map((person) => (
                  <button
                    type="button"
                    key={person.userId || person.UserId}
                    style={attendeeStyles.person}
                    onClick={() => {
                      setAttendeesOpen(false);
                      navigate(
                        `/profile/${person.username || person.Username}`,
                      );
                    }}
                  >
                    <img
                      src={resolveMediaUrl(
                        person.profileImage || person.ProfileImage,
                        defaultAvatar,
                      )}
                      alt=""
                      style={attendeeStyles.avatar}
                      onError={(imageEvent) => {
                        imageEvent.currentTarget.src = defaultAvatar;
                      }}
                    />
                    <span style={attendeeStyles.copy}>
                      <strong>{person.fullName || person.FullName}</strong>
                      <small>
                        {person.currentPosition ||
                          person.CurrentPosition ||
                          "Member"}
                      </small>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </article>
  );
}

const attendeeStyles = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 10000,
    display: "grid",
    placeItems: "center",
    padding: 18,
    background: "rgba(15, 23, 42, .55)",
  },
  modal: {
    width: 460,
    maxWidth: "100%",
    maxHeight: "75vh",
    overflow: "auto",
    borderRadius: 16,
    background: "var(--app-surface)",
    boxShadow: "0 24px 70px rgba(15, 23, 42, .28)",
  },
  header: {
    position: "sticky",
    top: 0,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    borderBottom: "1px solid var(--app-border)",
    background: "var(--app-surface)",
  },
  eyebrow: { color: "#057642", fontWeight: 800, textTransform: "uppercase" },
  title: { margin: "3px 0 0", color: "var(--app-text)" },
  close: {
    border: "none",
    background: "transparent",
    color: "var(--app-muted)",
    fontSize: 28,
    cursor: "pointer",
  },
  list: { padding: "4px 18px 16px" },
  person: {
    width: "100%",
    display: "flex",
    gap: 11,
    alignItems: "center",
    padding: "12px 0",
    border: "none",
    borderBottom: "1px solid var(--app-border)",
    background: "transparent",
    textAlign: "left",
    cursor: "pointer",
  },
  avatar: { width: 46, height: 46, borderRadius: "50%", objectFit: "cover" },
  copy: { display: "flex", flexDirection: "column", color: "var(--app-text)" },
  state: { padding: 28, color: "var(--app-muted)", textAlign: "center" },
};
