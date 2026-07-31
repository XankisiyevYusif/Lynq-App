import React, { useCallback, useEffect, useState } from "react";
import Navbar from "../components/Layout/Navbar";
import CreateEventModal from "../components/Events/CreateEventModal";
import EventCard from "../components/Events/EventCard";
import LoadingSpinner from "../components/UI/LoadingSpinner";
import ProfileIcon from "../components/Profile/ProfileIcon";
import Toast from "../components/UI/Toast";
import api from "../services/api";
import "./EventsPage.css";

const unwrap = (response) => {
  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  return payload?.items ?? payload?.Items ?? [];
};

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("discover");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/Event", {
        params: {
          mine: activeTab === "mine",
          upcoming: true,
          recommended: activeTab === "discover",
          page: 1,
          pageSize: 20,
        },
      });
      setEvents(unwrap(response));
    } catch {
      setEvents([]);
      setError("Events could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (message, type = "success") => {
    setToast({ message: String(message), type });
  };

  return (
    <>
      <Navbar />
      <main className="events-page">
        <header className="events-page-header">
          <div>
            <span>Nexora events</span>
            <h1>Events</h1>
            <p>Discover relevant events or manage the events you created.</p>
          </div>
          <button type="button" onClick={() => setCreateOpen(true)}>
            <ProfileIcon name="plus" size={17} /> Create event
          </button>
        </header>

        <nav className="events-page-tabs" aria-label="Event sections">
          <button
            type="button"
            className={activeTab === "discover" ? "is-active" : ""}
            onClick={() => setActiveTab("discover")}
          >
            Discover
          </button>
          <button
            type="button"
            className={activeTab === "mine" ? "is-active" : ""}
            onClick={() => setActiveTab("mine")}
          >
            Your events
          </button>
        </nav>

        {loading ? (
          <div className="events-page-state">
            <LoadingSpinner text="Loading events..." />
          </div>
        ) : error ? (
          <div className="events-page-state is-error">
            <ProfileIcon name="calendar" size={34} />
            <strong>{error}</strong>
            <button type="button" onClick={load}>Try again</button>
          </div>
        ) : events.length ? (
          <section className="events-page-list">
            {events.map((event) => (
              <EventCard
                key={event.id || event.Id}
                event={event}
                onChanged={load}
                showToast={showToast}
              />
            ))}
          </section>
        ) : (
          <div className="events-page-state">
            <ProfileIcon name="calendar" size={36} />
            <strong>
              {activeTab === "mine"
                ? "You have no upcoming events"
                : "No upcoming events found"}
            </strong>
            <span>
              {activeTab === "mine"
                ? "Create an event and it will appear here immediately."
                : "New relevant events will appear here."}
            </span>
          </div>
        )}
      </main>

      <CreateEventModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setActiveTab("mine");
          load();
        }}
        showToast={showToast}
      />
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
