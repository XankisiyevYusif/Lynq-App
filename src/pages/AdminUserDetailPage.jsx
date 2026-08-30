import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import defaultAvatar from "../assets/default-avatar.png";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { getTokenRole } from "../utils/auth";
import "./AdminPage.css";
import "./AdminUserDetailPage.css";
import useUrlFilters from "../hooks/useUrlFilters";

const USER_DETAIL_QUERY_DEFAULTS = { tab: "overview" };

const value = (object, key, fallback = "") => object?.[key] ?? object?.[key[0].toUpperCase() + key.slice(1)] ?? fallback;
const number = (object, key) => Number(value(object, key, 0));
const formatDate = (input) => input ? new Intl.DateTimeFormat("en", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }).format(new Date(input)) : "—";
const dataOf = (response) => response?.data?.data ?? response?.data?.Data ?? response?.data;

function Badge({ tone = "neutral", children }) { return <span className={`aud-badge ${tone}`}>{children}</span>; }

function ReasonDialog({ action, busy, close, confirm }) {
  const [reason, setReason] = useState("");
  if (!action) return null;
  const needsReason = action.kind === "block";
  return <div className="aud-overlay" onMouseDown={(event)=>event.target===event.currentTarget&&!busy&&close()}><section className="aud-dialog"><button className="aud-close" onClick={close}>×</button><span className={`aud-dialog-mark ${needsReason?"danger":"success"}`}>{needsReason?"!":"✓"}</span><h2>{action.title}</h2><p>{needsReason?"This restriction is visible to the member and is included in the moderation email.":"This content will become available again immediately."}</p>{needsReason&&<label><span>Moderation reason <b>required</b></span><textarea autoFocus maxLength="500" rows="5" value={reason} onChange={(event)=>setReason(event.target.value)} placeholder="Explain the policy or safety reason clearly…"/><small>{reason.length}/500</small></label>}<footer><button onClick={close} disabled={busy}>Cancel</button><button className={needsReason?"danger":"primary"} disabled={busy||(needsReason&&!reason.trim())} onClick={()=>confirm(reason.trim())}>{busy?"Processing…":action.label}</button></footer></section></div>;
}

export default function AdminUserDetailPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [urlFilters, setUrlFilters] = useUrlFilters(USER_DETAIL_QUERY_DEFAULTS);
  const role = getTokenRole(localStorage.getItem("token")) || "Staff";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const tab = ["overview", "posts", "reports", "jobs"].includes(urlFilters.tab) ? urlFilters.tab : "overview";
  const setTab = (value) => setUrlFilters({ tab: value }, { replace: false });
  const [action, setAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState(()=>localStorage.getItem("nexora-staff-theme") || "system");
  const activeTheme = theme === "system" ? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light") : theme;

  const load = useCallback(async()=>{
    setLoading(true); setError("");
    try { setUser(dataOf(await api.get(`/Admin/users/${userId}/details`))); }
    catch (requestError) { setError(requestError.response?.data?.message || "User details could not be loaded."); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(()=>{load()},[load]);
  useEffect(()=>{localStorage.setItem("nexora-staff-theme",theme)},[theme]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),3200);return()=>clearTimeout(timer)},[toast]);

  const metrics = value(user,"metrics",{});
  const posts = value(user,"posts",[]);
  const jobs = value(user,"jobs",[]);
  const profileReports = value(user,"profileReports",[]);
  const postReports = value(user,"postReports",[]);
  const allReports = useMemo(()=>[
    ...profileReports.map((item)=>({...item, reportType:"Profile"})),
    ...postReports.map((item)=>({...item, reportType:"Post"})),
  ].sort((a,b)=>new Date(value(b,"createdAt"))-new Date(value(a,"createdAt"))),[profileReports,postReports]);

  const askUser = () => setAction({ entity:"user", id:userId, kind:value(user,"isBlocked",false)?"unblock":"block", title:value(user,"isBlocked",false)?"Restore this account":"Restrict this account", label:value(user,"isBlocked",false)?"Restore account":"Restrict account" });
  const askPost = (post) => setAction({ entity:"post", id:value(post,"id"), kind:value(post,"isBlocked",false)?"unblock":"block", title:value(post,"isBlocked",false)?"Restore this post":"Restrict this post", label:value(post,"isBlocked",false)?"Restore post":"Restrict post" });
  const runAction = async(reason) => {
    setBusy(true);
    try {
      const body = action.kind === "block" ? { reason } : undefined;
      await api.post(`/Admin/${action.entity === "user" ? "users" : "posts"}/${action.id}/${action.kind}`, body);
      await load(); setAction(null); setToast("Moderation action completed.");
    } catch (requestError) { setToast(requestError.response?.data?.message || "Action could not be completed."); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="admin-workspace aud-page" data-theme={activeTheme}><div className="aud-state">Loading user workspace…</div></div>;
  if (error || !user) return <div className="admin-workspace aud-page" data-theme={activeTheme}><div className="aud-state"><h2>User unavailable</h2><p>{error}</p><button onClick={()=>navigate("/admin")}>Back to Admin</button></div></div>;

  const risk = number(metrics,"riskScore"), riskLevel = value(metrics,"riskLevel","Low");
  return <div className="admin-workspace aud-page" data-theme={activeTheme}>
    <header className="aud-topbar"><button className="aud-back" onClick={()=>navigate("/admin")}>← <span>Users</span></button><div><small>Nexora administration</small><strong>User moderation workspace</strong></div><label><span>Theme</span><select value={theme} onChange={(event)=>setTheme(event.target.value)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label></header>
    <main className="aud-main">
      <section className="aud-hero"><div className="aud-cover">{value(user,"backgroundImage")&&<img src={resolveMediaUrl(value(user,"backgroundImage"))} alt=""/>}</div><div className="aud-profile"><img src={resolveMediaUrl(value(user,"profileImage"),defaultAvatar)} alt=""/><div className="aud-identity"><div><h1>{value(user,"fullName","Unnamed user")}</h1><Badge>{value(user,"userType","User")}</Badge>{value(user,"isBlocked",false)&&<Badge tone="danger">Restricted</Badge>}</div><p>@{value(user,"username","unknown")} · {value(user,"currentPosition","No current position")}</p><span>{value(user,"location","Location not added")} · Joined {formatDate(value(user,"createdAt"))}</span></div>{role==="Admin"&&<button className={`aud-main-action ${value(user,"isBlocked",false)?"restore":"restrict"}`} onClick={askUser}>{value(user,"isBlocked",false)?"Restore account":"Restrict account"}</button>}</div>{value(user,"blockReason")&&<div className="aud-restriction"><strong>Current restriction reason</strong><p>{value(user,"blockReason")}</p></div>}</section>

      <section className="aud-stat-grid"><article><span>Connections / followers</span><strong>{Math.max(number(metrics,"connectionCount"),number(metrics,"followerCount"))}</strong><small>{number(metrics,"followerCount")} company followers</small></article><article><span>Posts</span><strong>{number(metrics,"postCount")}</strong><small>{number(metrics,"blockedPostCount")} restricted</small></article><article><span>Reports</span><strong>{number(metrics,"reportCount")}</strong><small>{number(metrics,"openReportCount")} unresolved</small></article><article className={`risk-${riskLevel.toLowerCase()}`}><span>Risk level</span><strong>{riskLevel}</strong><small>{risk}/100 score · {number(metrics,"uniqueReporters")} reporters</small><i><b style={{width:`${risk}%`}}/></i></article></section>

      <nav className="aud-tabs">{[["overview","Overview"],["posts",`Posts (${posts.length})`],["reports",`Reports (${allReports.length})`],["jobs",`Jobs (${jobs.length})`]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}</button>)}</nav>

      {tab==="overview"&&<section className="aud-layout"><article className="aud-card"><header><h2>Account information</h2></header><dl className="aud-info"><div><dt>Email</dt><dd>{value(user,"email","—")}</dd></div><div><dt>Phone</dt><dd>{value(user,"phoneNumber","—")}</dd></div><div><dt>Website</dt><dd>{value(user,"website","—")}</dd></div><div><dt>Address</dt><dd>{value(user,"address","—")}</dd></div></dl>{value(user,"bio")&&<div className="aud-text"><span>About</span><p>{value(user,"bio")}</p></div>}</article><article className="aud-card"><header><h2>Risk analysis</h2><Badge tone={riskLevel==="High"?"danger":riskLevel==="Medium"?"warning":"success"}>{riskLevel}</Badge></header><div className="aud-risk"><div style={{background:`conic-gradient(var(--brand) ${risk}%,var(--border) 0)`}}><span><strong>{risk}</strong><small>/100</small></span></div><ul><li><b>{number(metrics,"uniqueReporters")}</b> unique reporters</li><li><b>{number(metrics,"openReportCount")}</b> unresolved reports</li><li><b>{number(metrics,"blockedPostCount")}</b> restricted posts</li><li><b>{number(metrics,"totalEngagement")}</b> post interactions</li></ul></div></article></section>}

      {tab==="posts"&&<section className="aud-list-card"><header><div><h2>User posts</h2><p>Inspect complete content and apply a post-level restriction.</p></div></header>{posts.length?posts.map((post)=><article className="aud-post" key={value(post,"id")}><header><div><strong>Post #{value(post,"id")}</strong><time>{formatDate(value(post,"createdAt"))}</time></div><Badge tone={value(post,"isBlocked",false)?"danger":"success"}>{value(post,"moderationStatus",value(post,"isBlocked",false)?"Restricted":"Published")}</Badge></header><p>{value(post,"content","No text content")}</p>{value(post,"imageUrl")&&<img src={resolveMediaUrl(value(post,"imageUrl"))} alt="Post"/>}<footer><span>{number(post,"likeCount")} likes · {number(post,"commentCount")} comments</span><button className={value(post,"isBlocked",false)?"restore":"restrict"} onClick={()=>askPost(post)}>{value(post,"isBlocked",false)?"Restore post":"Restrict post"}</button></footer>{value(post,"blockReason")&&<div className="aud-inline-reason"><strong>Reason:</strong> {value(post,"blockReason")}</div>}</article>):<div className="aud-empty">This user has no posts.</div>}</section>}

      {tab==="reports"&&<section className="aud-list-card"><header><div><h2>Reports against this user</h2><p>Profile and post reports are combined chronologically.</p></div></header>{allReports.length?allReports.map((report)=><article className="aud-report" key={`${value(report,"reportType")}-${value(report,"id")}`}><div><Badge tone={value(report,"reportType")==="Post"?"warning":"neutral"}>{value(report,"reportType")} report</Badge><strong>{value(report,"category",value(report,"reason","Report"))}</strong><p>{value(report,"details",value(report,"postContent","No additional details"))}</p><small>Reported by {value(report,"reporterName","Unknown")} · @{value(report,"reporterUsername","unknown")}</small></div><aside><time>{formatDate(value(report,"createdAt"))}</time><Badge tone={value(report,"isReviewed",false)?"success":"warning"}>{value(report,"isReviewed",false)?"Reviewed":"Open"}</Badge></aside></article>):<div className="aud-empty">No reports have been submitted against this user.</div>}</section>}

      {tab==="jobs"&&<section className="aud-list-card"><header><div><h2>Published job posts</h2><p>Employer activity connected to this account.</p></div></header>{jobs.length?jobs.map((job)=><article className="aud-job" key={value(job,"id")}><div><strong>{value(job,"title","Untitled job")}</strong><time>{formatDate(value(job,"createdAt"))}</time><p>{value(job,"description","No description")}</p></div><Badge tone={value(job,"isBlocked",false)?"danger":value(job,"isActive",false)?"success":"neutral"}>{value(job,"isBlocked",false)?"Restricted":value(job,"isActive",false)?"Active":"Inactive"}</Badge></article>):<div className="aud-empty">This account has no job posts.</div>}</section>}
    </main>
    <ReasonDialog action={action} busy={busy} close={()=>!busy&&setAction(null)} confirm={runAction}/>
    {toast&&<div className="aud-toast">{toast}</div>}
  </div>;
}
