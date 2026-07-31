import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import ProfileIcon from "./ProfileIcon";
import "./OpenToWorkCard.css";

const WORKPLACES = ["On-site", "Hybrid", "Remote"];
const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

const value = (source, camel, pascal, fallback) =>
  source?.[camel] ?? source?.[pascal] ?? fallback;

const unique = (items) =>
  [...new Set((items || []).map((item) => String(item).trim()).filter(Boolean))];

const splitText = (text) =>
  unique(String(text || "").split(",")).slice(0, 8);

const normalize = (source = {}) => ({
  isOpenToWork: Boolean(value(source, "isOpenToWork", "IsOpenToWork", false)),
  jobTitles: value(source, "jobTitles", "JobTitles", []),
  locations: value(source, "locations", "Locations", []),
  workplaceTypes: value(source, "workplaceTypes", "WorkplaceTypes", []),
  onsiteLocations: value(source, "onsiteLocations", "OnsiteLocations", []),
  remoteLocations: value(source, "remoteLocations", "RemoteLocations", []),
  employmentTypes: value(source, "employmentTypes", "EmploymentTypes", []),
  startAvailability: value(
    source,
    "startAvailability",
    "StartAvailability",
    "Immediately",
  ),
  updatedAt: value(source, "updatedAt", "UpdatedAt", null),
});

const OptionGroup = ({ label, values, selected, onToggle }) => (
  <fieldset className="open-work-option-group">
    <legend>{label}</legend>
    <div>
      {values.map((item) => (
        <button
          key={item}
          type="button"
          className={selected.includes(item) ? "is-selected" : ""}
          onClick={() => onToggle(item)}
        >
          {item}
        </button>
      ))}
    </div>
  </fieldset>
);

export default function OpenToWorkCard({ preference, isOwner, onChanged }) {
  const normalizedPreference = useMemo(
    () => normalize(preference),
    [preference],
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(normalizedPreference);

  useEffect(() => {
    setForm(normalizedPreference);
  }, [normalizedPreference]);

  if (!normalizedPreference.isOpenToWork && !isOwner) return null;

  const toggle = (key, item) => {
    setForm((current) => ({
      ...current,
      [key]: current[key].includes(item)
        ? current[key].filter((valueItem) => valueItem !== item)
        : [...current[key], item],
    }));
  };

  const openEditor = async () => {
    setError("");
    try {
      const response = await api.get("/JobPreferences");
      setForm(normalize(response?.data?.data ?? response?.data?.Data ?? response?.data));
    } catch (requestError) {
      console.warn("Open-to-work preferences could not be refreshed:", requestError);
      setForm(normalizedPreference);
    }
    setEditing(true);
  };

  const save = async () => {
    const titleText = form.jobTitlesText ?? form.jobTitles.join(", ");
    if (form.isOpenToWork && splitText(titleText).length === 0) {
      setError("Add at least one job title.");
      return;
    }

    const jobTitles = splitText(titleText);
    const onsiteLocations = splitText(
      form.onsiteLocationsText ?? form.onsiteLocations.join(", "),
    );
    const remoteLocations = splitText(
      form.remoteLocationsText ?? form.remoteLocations.join(", "),
    );

    const payload = {
      jobTitles,
      locations: unique([...onsiteLocations, ...remoteLocations]),
      workplaceTypes: form.workplaceTypes,
      employmentTypes: form.employmentTypes,
      isOpenToWork: form.isOpenToWork,
      onsiteLocations,
      remoteLocations,
      startAvailability: form.startAvailability,
    };

    try {
      setSaving(true);
      setError("");
      const response = await api.put("/JobPreferences", payload);
      const saved = normalize(
        response?.data?.data ?? response?.data?.Data ?? response?.data,
      );
      onChanged?.(saved);
      setEditing(false);
    } catch (requestError) {
      console.error("Open-to-work preferences could not be saved:", requestError);
      setError("Your open-to-work preferences could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const display = normalizedPreference;
  const workModeSummary = display.workplaceTypes.join(" · ");
  const titleSummary = display.jobTitles.join(" · ");
  const locationSummary = unique([
    ...display.onsiteLocations,
    ...display.remoteLocations,
  ]).join(" · ");

  return (
    <>
      <section
        className={`open-work-card ${
          display.isOpenToWork ? "is-active" : "is-inactive"
        }`}
      >
        <span className="open-work-mark">
          <ProfileIcon name="briefcase" size={19} />
        </span>
        <div className="open-work-copy">
          <span>{display.isOpenToWork ? "Open to work" : "Career preferences"}</span>
          <strong>
            {display.isOpenToWork
              ? titleSummary || "Actively exploring opportunities"
              : "Let companies know what role you want next"}
          </strong>
          <small>
            {display.isOpenToWork
              ? [workModeSummary, locationSummary].filter(Boolean).join(" · ")
              : "Add job titles, locations, work modes and employment types."}
          </small>
        </div>
        <div className="open-work-actions">
          {display.isOpenToWork && (
            <button type="button" onClick={() => setDetailsOpen(true)}>
              View details
            </button>
          )}
          {isOwner && (
            <button type="button" className="is-primary" onClick={openEditor}>
              {display.isOpenToWork ? "Edit" : "Add preferences"}
            </button>
          )}
        </div>
      </section>

      {detailsOpen && (
        <div className="open-work-modal-backdrop" onClick={() => setDetailsOpen(false)}>
          <section className="open-work-details" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Open to work</span>
                <h2>Career preferences</h2>
              </div>
              <button type="button" onClick={() => setDetailsOpen(false)} aria-label="Close">×</button>
            </header>
            <dl>
              <div><dt>Job titles</dt><dd>{titleSummary || "Not specified"}</dd></div>
              <div><dt>Work modes</dt><dd>{workModeSummary || "Not specified"}</dd></div>
              <div><dt>On-site locations</dt><dd>{display.onsiteLocations.join(" · ") || "Not specified"}</dd></div>
              <div><dt>Remote locations</dt><dd>{display.remoteLocations.join(" · ") || "Not specified"}</dd></div>
              <div><dt>Start date</dt><dd>{display.startAvailability === "Immediately" ? "Immediately, actively looking" : "Flexible, open to the right opportunity"}</dd></div>
              <div><dt>Employment types</dt><dd>{display.employmentTypes.join(" · ") || "Not specified"}</dd></div>
            </dl>
            {isOwner && <button type="button" className="open-work-edit-details" onClick={() => { setDetailsOpen(false); openEditor(); }}>Edit preferences</button>}
          </section>
        </div>
      )}

      {editing && (
        <div className="open-work-modal-backdrop" onClick={() => !saving && setEditing(false)}>
          <section className="open-work-editor" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Career visibility</span>
                <h2>Open to work preferences</h2>
                <p>These details appear on your profile and improve company talent matches.</p>
              </div>
              <button type="button" onClick={() => !saving && setEditing(false)} aria-label="Close">×</button>
            </header>

            <label className="open-work-switch">
              <span><strong>Show that you are open to work</strong><small>Companies can discover you in relevant talent results.</small></span>
              <input type="checkbox" checked={form.isOpenToWork} onChange={(event) => setForm({ ...form, isOpenToWork: event.target.checked })} />
            </label>

            <label className="open-work-field">
              <span>Job titles</span>
              <textarea
                value={form.jobTitlesText ?? form.jobTitles.join(", ")}
                onChange={(event) => setForm({ ...form, jobTitlesText: event.target.value })}
                placeholder="Senior Frontend Developer, Full Stack Engineer"
              />
              <small>Separate up to 8 titles with commas.</small>
            </label>

            <OptionGroup label="Work modes" values={WORKPLACES} selected={form.workplaceTypes} onToggle={(item) => toggle("workplaceTypes", item)} />

            <div className="open-work-field-grid">
              <label className="open-work-field">
                <span>On-site locations</span>
                <input value={form.onsiteLocationsText ?? form.onsiteLocations.join(", ")} onChange={(event) => setForm({ ...form, onsiteLocationsText: event.target.value })} placeholder="Baku" />
              </label>
              <label className="open-work-field">
                <span>Remote locations</span>
                <input value={form.remoteLocationsText ?? form.remoteLocations.join(", ")} onChange={(event) => setForm({ ...form, remoteLocationsText: event.target.value })} placeholder="Azerbaijan, United Kingdom, Germany" />
              </label>
            </div>

            <label className="open-work-field">
              <span>Start date</span>
              <select value={form.startAvailability} onChange={(event) => setForm({ ...form, startAvailability: event.target.value })}>
                <option value="Immediately">Immediately, actively looking</option>
                <option value="Flexible">Flexible, open to the right opportunity</option>
              </select>
            </label>

            <OptionGroup label="Employment types" values={EMPLOYMENT_TYPES} selected={form.employmentTypes} onToggle={(item) => toggle("employmentTypes", item)} />

            {error && <p className="open-work-error">{error}</p>}
            <footer>
              <button type="button" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
              <button type="button" className="is-primary" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save preferences"}</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
