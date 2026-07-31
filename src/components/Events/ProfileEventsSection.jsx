import React, { useEffect, useState } from "react";
import api from "../../services/api";
import ProfileIcon from "../Profile/ProfileIcon";
import CreateEventModal from "./CreateEventModal";
import EventCard from "./EventCard";
import "./Events.css";

const unwrap = (response) => {
  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.Items)) return payload.Items;
  return [];
};

export default function ProfileEventsSection({
  username,
  isOwner,
  showToast,
  showEmptyState = false,
}) {
  const [events, setEvents] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);

  const load = async () => {
    if (!isOwner && !username) return;
    const response = await api.get("/Event", {
      params: {
        username: isOwner ? undefined : username,
        mine: isOwner,
        upcoming: true,
        page: 1,
        pageSize: 6,
      },
    });
    setEvents(unwrap(response));
  };

  useEffect(() => {
    load().catch(() => setEvents([]));
  }, [username, isOwner]);

  if (!events.length && !isOwner && !showEmptyState) return null;

  if (!events.length) {
    if (!isOwner) {
      return (
        <section className="profile-events-section profile-events-empty">
          <div className="profile-events-empty-icon" aria-hidden="true">
            <ProfileIcon name="calendar" size={22} />
          </div>
          <div>
            <h2>No upcoming events</h2>
            <p>New events from this company will appear here.</p>
          </div>
        </section>
      );
    }

    return (
      <>
        <button type="button" className="event-create-profile-action" onClick={() => setCreateOpen(true)}>
          <ProfileIcon name="calendar" size={18} /> Create an event
        </button>
        <CreateEventModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={load}
          showToast={showToast}
        />
      </>
    );
  }

  return (
    <section className="profile-events-section">
      <header>
        <div>
          <span>Upcoming</span>
          <h2>Events</h2>
        </div>
        {isOwner && (
          <button type="button" onClick={() => setCreateOpen(true)}>
            <ProfileIcon name="plus" size={16} /> Create event
          </button>
        )}
      </header>
      <div>
        {events.map((item) => (
          <EventCard
            key={item.id || item.Id}
            event={item}
            compact
            showToast={showToast}
            onChanged={load}
          />
        ))}
      </div>
      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={load}
        showToast={showToast}
      />
    </section>
  );
}
