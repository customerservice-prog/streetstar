"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CircleAlert, Clapperboard, ExternalLink, Loader2, LockKeyhole, LogOut, Plus, RefreshCcw, Star, Video } from "lucide-react";

type Submission = { id: number; title: string; artist: string; email: string; category: string; video_url: string; notes: string; status: string; created_at: string };
type AdminVideo = { id: number; slug: string; title: string; artist: string; category: string; status: string; featured: boolean; created_at: string };
type ContentReport = {id:number;claimant:string;email:string;content_url:string;reason:string;details:string;status:string;created_at:string};
type Dashboard = { submissions: Submission[]; videos: AdminVideo[]; reports: ContentReport[] };

const empty = { title: "", artist: "", category: "Music", videoUrl: "", posterUrl: "", description: "", featured: false, status: "draft" };

export function AdminDashboard({ initialSignedIn }: { initialSignedIn: boolean }) {
  const [signedIn, setSignedIn] = useState(initialSignedIn);
  const [password, setPassword] = useState("");
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(empty);
  const [section, setSection] = useState<"submissions" | "videos" | "publish" | "reports">("submissions");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 401) setSignedIn(false);
        throw new Error(payload.error || "Could not load dashboard.");
      }
      setData(payload);
      setError("");
    } catch (err) { setError(err instanceof Error ? err.message : "Could not load dashboard."); }
  }, []);

  useEffect(() => { if (signedIn) void refresh(); }, [signedIn, refresh]);

  async function login(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Sign-in failed.");
      setPassword(""); setSignedIn(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Sign-in failed."); }
    finally { setBusy(false); }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setSignedIn(false); setData(null);
  }

  async function mutation(url: string, method: string, body: object, message: string) {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      setSuccess(message);
      await refresh();
      return true;
    } catch (err) { setError(err instanceof Error ? err.message : "Request failed."); return false; }
    finally { setBusy(false); }
  }

  async function publish(event: FormEvent) {
    event.preventDefault();
    const ok = await mutation("/api/admin/videos", "POST", form, "Video saved.");
    if (ok) { setForm(empty); setSection("videos"); }
  }

  if (!signedIn) return <div className="admin-login"><div className="admin-login-icon"><LockKeyhole size={30}/></div><p className="micro-label">RESTRICTED ACCESS</p><h1>STREETSTAR CONTROL ROOM</h1><p>Authorized publishers only.</p><form onSubmit={login}><label>ADMIN PASSWORD<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password"/></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-accent" disabled={busy}>{busy ? "CHECKING..." : "ENTER CONTROL ROOM"} <ArrowUpRight size={16}/></button></form><Link href="/">BACK TO SITE</Link></div>;

  return <div className="container admin-page">
    <div className="admin-heading"><div><p className="micro-label"><span className="section-marker"/> PRIVATE PUBLISHING</p><h1>CONTROL <span>ROOM.</span></h1><p>Review submissions, publish stories, and manage the front page.</p></div><div className="admin-heading-actions"><button className="button button-outline" onClick={() => void refresh()}><RefreshCcw size={15}/> REFRESH</button><button className="button button-outline" onClick={() => void logout()}><LogOut size={15}/> SIGN OUT</button></div></div>
    <div className="admin-stats"><div><strong>{data?.submissions.filter(x => x.status === "pending").length ?? "—"}</strong><span>AWAITING REVIEW</span></div><div><strong>{data?.videos.filter(x => x.status === "published").length ?? "—"}</strong><span>PUBLISHED VIDEOS</span></div><div><strong>{data?.videos.filter(x => x.status === "draft").length ?? "—"}</strong><span>DRAFTS</span></div><div><strong>{data?.reports.filter(x => x.status === "open").length ?? "—"}</strong><span>OPEN REPORTS</span></div></div>
    <div className="admin-tabs"><button className={section === "submissions" ? "active" : ""} onClick={() => setSection("submissions")}>SUBMISSIONS</button><button className={section === "videos" ? "active" : ""} onClick={() => setSection("videos")}>VIDEO LIBRARY</button><button className={section === "publish" ? "active" : ""} onClick={() => setSection("publish")}><Plus size={16}/> ADD VIDEO</button><button className={section === "reports" ? "active" : ""} onClick={() => setSection("reports")}>CONTENT REPORTS</button></div>
    {error && <p className="form-error admin-alert" role="alert"><CircleAlert size={18}/>{error}</p>}
    {success && <p className="form-success-inline"><Check size={18}/>{success}</p>}
    {section === "submissions" && <div className="admin-list">{data?.submissions.length ? data.submissions.map(item => <div key={item.id} className="admin-item"><div className="admin-item-main"><span className="admin-kicker">{item.category} · {item.status.toUpperCase()} · #{item.id}</span><h3>{item.title}</h3><p>{item.artist} · {item.email}</p>{item.notes && <p>{item.notes}</p>}<a href={item.video_url} target="_blank" rel="noopener noreferrer">OPEN SUBMISSION <ExternalLink size={13}/></a></div><div className="admin-item-controls"><button disabled={busy} className="button button-outline" onClick={() => void mutation("/api/admin/submissions","PATCH",{id:item.id,status:"reviewed"},"Marked reviewed.")}>REVIEWED</button><button disabled={busy} className="button button-outline" onClick={() => void mutation("/api/admin/submissions","PATCH",{id:item.id,status:"rejected"},"Submission rejected.")}>REJECT</button></div></div>) : <p className="admin-empty">No submissions yet. New submissions will appear here when persistent storage is enabled.</p>}</div>}
    {section === "videos" && <div className="admin-list">{data?.videos.length ? data.videos.map(item => <div key={item.id} className="admin-item"><div className="admin-item-main"><span className="admin-kicker">{item.category} · {item.status.toUpperCase()}</span><h3>{item.title}</h3><p>{item.artist || "StreetStar"} · {item.featured ? "FEATURED" : "STANDARD"}</p><Link href={"/watch/" + item.slug}>VIEW PAGE <ArrowUpRight size={14}/></Link></div><div className="admin-item-controls"><button disabled={busy} className="button button-outline" onClick={() => void mutation("/api/admin/videos","PATCH",{id:item.id,status:item.status === "published" ? "draft" : "published"},"Publication status updated.")}>{item.status === "published" ? "UNPUBLISH" : "PUBLISH"}</button><button disabled={busy} className="button button-outline" onClick={() => void mutation("/api/admin/videos","PATCH",{id:item.id,featured:!item.featured},"Feature status updated.")}>{item.featured ? "REMOVE FEATURE" : "FEATURE"}</button></div></div>) : <p className="admin-empty">No published videos. Add your first video to replace the demonstration cards.</p>}</div>}
    {section === "reports" && <div className="admin-list">{data?.reports.length ? data.reports.map(item => <div className="admin-item" key={item.id}><div className="admin-item-main"><span className="admin-kicker">{item.reason.toUpperCase()} · {item.status.toUpperCase()} · #{item.id}</span><h3>{item.claimant}</h3><p>{item.email}</p><p>{item.details}</p><a href={item.content_url} target="_blank" rel="noopener noreferrer">REPORTED CONTENT <ExternalLink size={13}/></a></div><div className="admin-item-controls"><button className="button button-outline" disabled={busy} onClick={() => void mutation("/api/admin/reports","PATCH",{id:item.id,status:"reviewed"},"Report marked reviewed.")}>REVIEWED</button><button className="button button-outline" disabled={busy} onClick={() => void mutation("/api/admin/reports","PATCH",{id:item.id,status:"resolved"},"Report resolved.")}>RESOLVED</button></div></div>) : <p className="admin-empty">No content reports yet.</p>}</div>}
    {section === "publish" && <form onSubmit={publish} className="admin-publish creator-form"><h2>PUBLISH A VIDEO</h2><p>Use only material you own, license, or are authorized to embed. Start as a draft if you still need to verify rights.</p><label>VIDEO TITLE<input required minLength={3} maxLength={170} value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="Headline for your video"/></label><div className="form-row"><label>CREATOR / SOURCE<input maxLength={100} value={form.artist} onChange={e => setForm({...form,artist:e.target.value})}/></label><label>CATEGORY<select value={form.category} onChange={e => setForm({...form,category:e.target.value})}>{["Music","Culture","Viral","Sports","Interviews","Lifestyle"].map(c=><option key={c}>{c}</option>)}</select></label></div><label>VIDEO URL<input required type="url" value={form.videoUrl} onChange={e=>setForm({...form,videoUrl:e.target.value})} placeholder="https://..." /></label><label>POSTER IMAGE URL<input type="url" value={form.posterUrl} onChange={e=>setForm({...form,posterUrl:e.target.value})} placeholder="https://... (optional)"/></label><label>DESCRIPTION<textarea rows={4} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="form-row"><label>PUBLICATION STATUS<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="draft">Save draft</option><option value="published">Publish now</option></select></label><label className="admin-checkbox"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/> FEATURE ON HOMEPAGE <Star size={17}/></label></div><button type="submit" disabled={busy} className="button button-accent">{busy ? <Loader2 className="spin" size={17}/> : <Video size={17}/>} SAVE VIDEO <ArrowUpRight size={17}/></button></form>}
  </div>;
}
