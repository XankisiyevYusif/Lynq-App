import { useState } from "react";
import api from "../../services/api";
import "./Post.css";

const reasons = [
  { value: "Spam", label: "Spam or scam", help: "Unwanted promotion, suspicious links, or deceptive offers." },
  { value: "Harassment", label: "Harassment or bullying", help: "Abusive, threatening, or targeted behaviour." },
  { value: "Hate speech", label: "Hate speech", help: "Attacks based on identity or protected characteristics." },
  { value: "Misinformation", label: "False or misleading information", help: "Content designed to mislead people." },
  { value: "Other", label: "Something else", help: "Describe an issue that is not listed above." },
];

export default function ReportPostModal({ postId, onClose, showToast }) {
  const [category, setCategory] = useState("Spam");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (category === "Other" && !details.trim()) {
      showToast?.("Please explain why you are reporting this post.", "error");
      return;
    }
    try {
      setSaving(true);
      await api.post(`/Reports/post/${postId}`, { category, details: details.trim() || null });
      showToast?.("Thank you. Your report was submitted.", "success");
      onClose();
    } catch (error) {
      showToast?.(error.response?.data?.message || "This post could not be reported.", "error");
    } finally {
      setSaving(false);
    }
  };

  return <div className="post-report-backdrop" role="presentation" onMouseDown={onClose}>
    <form className="post-report-modal" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
      <div className="post-report-heading"><span aria-hidden="true">!</span><div><h2>Report this post</h2><p>Choose the reason that best describes the problem. Your report is private and reviewed by Nexora moderators.</p></div><button type="button" onClick={onClose} aria-label="Close">×</button></div>
      <div className="post-report-options">{reasons.map((reason) => <label key={reason.value}><input type="radio" name="report-reason" checked={category === reason.value} onChange={() => setCategory(reason.value)} /><span><strong>{reason.label}</strong><small>{reason.help}</small></span></label>)}</div>
      <label className="post-report-details"><span>{category === "Other" ? "Tell us what happened *" : "Additional details (optional)"}</span><textarea maxLength="500" value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Add a short explanation that will help the moderator review this report" required={category === "Other"} /><small>{details.length}/500</small></label>
      <div className="post-report-actions"><button type="button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="is-danger" disabled={saving}>{saving ? "Sending..." : "Submit report"}</button></div>
    </form>
  </div>;
}
