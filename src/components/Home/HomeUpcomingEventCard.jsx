import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import EventCard from "../Events/EventCard";

const unwrap = (response) => {
  const data = response?.data?.data || response?.data;
  if (Array.isArray(data)) return data;
  return data?.items || data?.Items || [];
};

export default function HomeUpcomingEventCard() {
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);

  const load = () => {
    api.get("/Event", { params: { page: 1, pageSize: 1, upcoming: true, recommended: true } })
      .then((response) => setEvent(unwrap(response)[0] || null))
      .catch(() => setEvent(null));
  };

  useEffect(() => {
    load();
  }, []);

  if (!event) return null;
  return <section className="home-discovery-card"><h2>Upcoming event</h2><EventCard key={event.id || event.Id} event={event} compact onChanged={load} /><button className="home-discovery-footer" type="button" onClick={() => navigate("/search?type=events")}>View all events <span>→</span></button></section>;
}
