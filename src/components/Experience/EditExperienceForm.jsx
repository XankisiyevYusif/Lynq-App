import { useState } from "react";
import experienceService from "../Experience/services/experienceService";

export default function EditExperienceForm({ experience, onUpdate, onClose }) {
  const [form, setForm] = useState({ ...experience });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await experienceService.updateExperience(form.id, form);
    setLoading(false);
    if (result.success) {
      onUpdate(result.experience);
    } else {
      alert(result.message || "Update failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h3>Edit Experience</h3>

      <label>Title:</label>
      <input name="title" value={form.title} onChange={handleChange} required />

      <label>Company Name:</label>
      <input name="companyName" value={form.companyName} onChange={handleChange} required />

      <label>Description:</label>
      <textarea name="description" value={form.description || ""} onChange={handleChange} />

      <label>Start Date:</label>
      <input type="date" name="startDate" value={form.startDate?.slice(0, 10)} onChange={handleChange} required />

      <label>End Date:</label>
      <input type="date" name="endDate" value={form.endDate?.slice(0, 10) || ""} onChange={handleChange} disabled={form.isCurrent} />

      <label>
        <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={handleChange} />
        Currently Working
      </label>

      <div style={styles.actions}>
        <button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
        <button type="button" onClick={onClose}>Cancel</button>
      </div>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  actions: {
    marginTop: "12px",
    display: "flex",
    gap: "10px",
  },
};
