import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Layout/Navbar";
import ProfileIcon from "../components/Profile/ProfileIcon";
import CreateEventModal from "../components/Events/CreateEventModal";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import api from "../services/api";
import { resolveMediaUrl } from "../utils/mediaUrl";
import "./EventDetailsPage.css";

const value = (source, camel, pascal) => source?.[camel] ?? source?.[pascal];

export default function EventDetailsPage() {
  const { eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const preview =
    location.state?.eventPreview ||
    location.state?.notificationPreview?.event ||
    null;
  const [event, setEvent] = useState(preview);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`/Event/${eventId}`);
      setEvent(response.data?.data ?? response.data?.Data ?? response.data);
    } catch (requestError) {
      if (!preview) {
        setError(requestError.response?.status === 404
          ? "This event is no longer available."
          : "The event could not be loaded.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  if (loading) return <><Navbar /><LoadingSpinner text="Loading event..." /></>;

  if (error || !event) {
    return (
      <>
        <Navbar />
        <main className="event-detail-state">
          <ProfileIcon name="calendar" size={38} />
          <h1>Event unavailable</h1>
          <p>{error}</p>
          <button type="button" onClick={() => navigate(-1)}>Go back</button>
        </main>
      </>
    );
  }

  const id = value(event, "id", "Id");
  const username = value(event, "username", "Username");
  const startsAt = value(event, "startsAt", "StartsAt");
  const isPast = new Date(startsAt) <= new Date();
  const isOwner = !!value(event, "isOwner", "IsOwner");
  const isAttending = !!value(event, "isAttending", "IsAttending");
  const attendeeCount = Number(value(event, "attendeeCount", "AttendeeCount") || 0);

  const toggleAttendance = async () => {
    if (actionLoading || isPast) return;
    try {
      setActionLoading(true);
      if (isAttending) await api.delete(`/Event/${id}/attend`);
      else await api.post(`/Event/${id}/attend`);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  const deleteEvent = async () => {
    if (!window.confirm("Delete this event permanently?")) return;
    await api.delete(`/Event/${id}`);
    navigate("/profile");
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: value(event, "title", "Title"), url });
      return;
    }
    await navigator.clipboard.writeText(url);
  };

  return (
    <>
      <Navbar />
      <main className="event-detail-page">
        <section className="event-detail-card">
          <div className="event-detail-cover">
            {value(event, "imageUrl", "ImageUrl") ? (
              <img src={resolveMediaUrl(value(event, "imageUrl", "ImageUrl"))} alt="" />
            ) : (
              <ProfileIcon name="calendar" size={62} strokeWidth={1.35} />
            )}
          </div>

          <div className="event-detail-content">
            <time>
              {new Date(startsAt).toLocaleString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </time>
            <h1>{value(event, "title", "Title")}</h1>

            <button
              type="button"
              className="event-detail-organizer"
              onClick={() => username && navigate(`/profile/${username}`)}
            >
              {value(event, "organizerImage", "OrganizerImage") ? (
                <img src={resolveMediaUrl(value(event, "organizerImage", "OrganizerImage"))} alt="" />
              ) : (
                <span><ProfileIcon name="user" size={19} /></span>
              )}
              <span>
                <small>Organized by</small>
                <strong>{value(event, "organizerName", "OrganizerName") || username}</strong>
              </span>
            </button>

            <div className="event-detail-meta">
              <span><ProfileIcon name="mapPin" size={18} />{value(event, "location", "Location") || "Online"}</span>
              <span><ProfileIcon name="users" size={18} />{attendeeCount} attending</span>
            </div>

            <div className="event-detail-actions">
              <button
                type="button"
                className={isAttending ? "is-secondary" : "is-primary"}
                disabled={isPast || actionLoading}
                onClick={toggleAttendance}
              >
                {isPast ? "Event ended" : actionLoading ? "Saving..." : isAttending ? "Attending" : "Attend"}
              </button>
              <button type="button" className="is-secondary" onClick={share}>
                <ProfileIcon name="share" size={18} /> Share
              </button>
              {isOwner && (
                <>
                  <button type="button" className="is-secondary" onClick={() => setEditOpen(true)}>Edit</button>
                  <button type="button" className="is-danger" onClick={deleteEvent}>Delete</button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="event-about-card">
          <h2>About this event</h2>
          {value(event, "topics", "Topics") && (
            <div className="event-topic-list">
              {value(event, "topics", "Topics").split(",").map((topic) => (
                <span key={topic.trim()}>{topic.trim()}</span>
              ))}
            </div>
          )}
          <p>{value(event, "description", "Description") || "No description was added."}</p>
        </section>
      </main>

      <CreateEventModal
        open={editOpen}
        event={event}
        onClose={() => setEditOpen(false)}
        onUpdated={load}
      />
    </>
  );
}
