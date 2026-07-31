import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import ProfileIcon from "../Profile/ProfileIcon";
import { resolveMediaUrl } from "../../utils/mediaUrl";
import "./Events.css";

export default function CreateEventModal({ open, onClose, onCreated, onUpdated, showToast, event: existingEvent = null }) {
  const [form, setForm] = useState({ title: "", description: "", topics: "", location: "", startsAt: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const preview = useMemo(() => (image ? URL.createObjectURL(image) : ""), [image]);
  const isEditing = !!(existingEvent?.id || existingEvent?.Id);
  const coverPreview = preview || resolveMediaUrl(existingEvent?.imageUrl || existingEvent?.ImageUrl);

  useEffect(() => {
    if (!open) return;
    if (!existingEvent) {
      setForm({ title: "", description: "", topics: "", location: "", startsAt: "" });
      setImage(null);
      return;
    }
    const sourceDate = existingEvent.startsAt || existingEvent.StartsAt;
    const source = sourceDate ? new Date(sourceDate) : null;
    const localDate = source
      ? new Date(source.getTime() - source.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : "";
    setForm({
      title: existingEvent.title || existingEvent.Title || "",
      description: existingEvent.description || existingEvent.Description || "",
      topics: existingEvent.topics || existingEvent.Topics || "",
      location: existingEvent.location || existingEvent.Location || "",
      startsAt: localDate,
    });
    setImage(null);
  }, [open, existingEvent]);

  useEffect(() => {
    if (!preview) return undefined;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();
    if (new Date(form.startsAt) <= new Date()) {
      showToast?.("Choose a future date and time.", "error");
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("topics", form.topics.trim());
      payload.append("location", form.location.trim());
      payload.append("startsAt", new Date(form.startsAt).toISOString());
      if (image) payload.append("image", image);
      if (isEditing) {
        await api.put(`/Event/${existingEvent.id || existingEvent.Id}`, payload, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        await api.post("/Event", payload, { headers: { "Content-Type": "multipart/form-data" } });
      }
      setForm({ title: "", description: "", topics: "", location: "", startsAt: "" });
      setImage(null);
      showToast?.(isEditing ? "Event updated successfully." : "Event created successfully.", "success");
      if (isEditing) onUpdated?.();
      else onCreated?.();
      onClose();
    } catch (error) {
      showToast?.(error.response?.data || "Event could not be created.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="event-create-modal" onSubmit={submit}>
        <div className="event-modal-header">
          <div><span>Nexora event</span><h2>{isEditing ? "Edit event" : "Create an event"}</h2></div>
          <button type="button" onClick={onClose} aria-label="Close"><ProfileIcon name="close" /></button>
        </div>

        <label className={`event-image-picker ${coverPreview ? "has-image" : ""}`}>
          {coverPreview ? <img src={coverPreview} alt="Event preview" /> : <><ProfileIcon name="camera" size={25} /><strong>Add event cover</strong><small>JPG, PNG or WEBP · up to 8 MB</small></>}
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} />
        </label>

        <label>Event title<input required maxLength={120} value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Give your event a clear title" /></label>
        <label>Description<textarea maxLength={1000} rows={3} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What should attendees expect?" /></label>
        <label>Topics<input maxLength={300} value={form.topics} onChange={(e) => setForm((p) => ({ ...p, topics: e.target.value }))} placeholder="React, .NET, design, career..." /></label>
        <div className="event-form-row">
          <label>Location<input required maxLength={180} value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} placeholder="Online or venue" /></label>
          <label>Date and time<input required type="datetime-local" min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} value={form.startsAt} onChange={(e) => setForm((p) => ({ ...p, startsAt: e.target.value }))} /></label>
        </div>
        <div className="event-modal-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={loading}>{loading ? "Saving..." : isEditing ? "Save changes" : "Create event"}</button></div>
      </form>
    </div>
  );
}
