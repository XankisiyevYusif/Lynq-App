import React, { useEffect } from "react";
import ProfileIcon from "../Profile/ProfileIcon";
import "./Events.css";

export default function DeleteEventModal({ open, eventTitle, loading, onClose, onConfirm }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div className="event-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && !loading && onClose()}>
      <section className="event-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-event-title">
        <div className="event-delete-icon"><ProfileIcon name="trash" size={23} /></div>
        <h2 id="delete-event-title">Delete this event?</h2>
        <p>
          <strong>{eventTitle || "This event"}</strong> will be permanently removed. Attendees will no longer be able to open or join it.
        </p>
        <div className="event-modal-actions">
          <button type="button" onClick={onClose} disabled={loading}>Keep event</button>
          <button type="button" className="event-delete-confirm" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete event"}
          </button>
        </div>
      </section>
    </div>
  );
}
