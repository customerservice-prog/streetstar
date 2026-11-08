"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Loader2, Send } from "lucide-react";

const initial = { artist: "", email: "", title: "", category: "Music", videoUrl: "", notes: "", website: "" };

export function SubmitForm() {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(()=>{
    void fetch("/api/member/auth",{cache:"no-store"}).then(r=>r.json()).then(data=>{
      if(data.member){
        setForm(previous=>({
          ...previous,
          artist:previous.artist||data.member.displayName,
          email:previous.email||data.member.email
        }));
      }
    }).catch(()=>{});
  },[]);
  const set = (name: keyof typeof initial, value: string) => setForm(previous => ({ ...previous, [name]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Submission could not be saved.");
      setSent(true);
      setForm(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally { setBusy(false); }
  }

  if (sent) return <div className="form-success"><CheckCircle2 size={46}/><h2>VIDEO RECEIVED.</h2><p>Your submission was saved for editorial review. Submission does not guarantee publication.</p><button className="button button-accent" onClick={() => setSent(false)}>SUBMIT ANOTHER <ArrowRight size={18}/></button></div>;

  return (
    <form onSubmit={handleSubmit} className="creator-form">
      <div className="form-row"><label>ARTIST / CREATOR NAME <span>*</span><input required minLength={2} maxLength={100} value={form.artist} onChange={e => set("artist",e.target.value)} placeholder="Your name or artist name" /></label><label>EMAIL ADDRESS <span>*</span><input required type="email" maxLength={200} value={form.email} onChange={e => set("email",e.target.value)} placeholder="you@example.com" /></label></div>
      <label>VIDEO TITLE <span>*</span><input required minLength={3} maxLength={170} value={form.title} onChange={e => set("title",e.target.value)} placeholder="What should we call your video?" /></label>
      <div className="form-row"><label>CATEGORY <span>*</span><select value={form.category} onChange={e => set("category",e.target.value)}><option>Music</option><option>Culture</option><option>Viral</option><option>Sports</option><option>Interviews</option><option>Lifestyle</option></select></label><label>PUBLIC VIDEO URL <span>*</span><input required type="url" maxLength={1500} value={form.videoUrl} onChange={e => set("videoUrl",e.target.value)} placeholder="https://youtube.com/watch?v=..." /></label></div>
      <label>ABOUT YOUR SUBMISSION <span className="optional">OPTIONAL</span><textarea rows={5} maxLength={1200} value={form.notes} onChange={e => set("notes",e.target.value)} placeholder="Tell our editors about the video, credits and any details we should know." /></label>
      <div className="honey-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => set("website",e.target.value)}/></label></div>
      <p className="form-legal">By submitting, you confirm you have permission to share this video and its included audio, visuals, and other materials. Submissions are reviewed before publication. Do not submit private information about others without permission.</p>
      {error && <p role="alert" className="form-error">{error}</p>}
      <button type="submit" className="button button-accent form-submit" disabled={busy}>{busy ? <><Loader2 size={18} className="spin"/> SENDING...</> : <>SEND FOR REVIEW <Send size={17}/></>}</button>
    </form>
  );
}
