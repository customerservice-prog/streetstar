"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";

export function ReportForm() {
  const [form,setForm] = useState({ claimant:"",email:"",contentUrl:"",reason:"copyright",details:"",website:"" });
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [done,setDone] = useState(false);
  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");
    try {
      const response=await fetch("/api/reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const result=await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error||"Could not submit your report.");
      setDone(true);
    }catch(e){setError(e instanceof Error?e.message:"Could not submit your report.");}
    finally{setBusy(false);}
  }
  if (done) return <div className="form-success"><CheckCircle2 size={42}/><h2>REPORT RECEIVED.</h2><p>Thank you. Your report was saved for review.</p></div>;
  return <form className="creator-form report-form" onSubmit={submit}>
    <div className="form-row"><label>YOUR NAME <span>*</span><input required minLength={2} maxLength={150} value={form.claimant} onChange={e=>setForm({...form,claimant:e.target.value})}/></label><label>CONTACT EMAIL <span>*</span><input required type="email" maxLength={200} value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label></div>
    <label>EXACT VIDEO OR PAGE URL <span>*</span><input required type="url" maxLength={1500} placeholder="https://..." value={form.contentUrl} onChange={e=>setForm({...form,contentUrl:e.target.value})}/></label>
    <label>WHAT IS THE ISSUE?<select value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}><option value="copyright">Copyright or intellectual property</option><option value="privacy">Privacy or personal information</option><option value="safety">Safety or harassment</option><option value="other">Other concern</option></select></label>
    <label>EXPLAIN YOUR CONCERN <span>*</span><textarea required minLength={20} maxLength={5000} rows={7} value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Identify the material and explain the issue. For copyright claims, describe your ownership or authority and the work involved."/></label>
    <div className="honey-field" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={e=>setForm({...form,website:e.target.value})}/></label></div>
    <p className="form-legal">Only include information necessary to support the claim. Copyright claimants may be contacted for further required legal information.</p>{error&&<p className="form-error" role="alert">{error}</p>}
    <button className="button button-accent" disabled={busy}>{busy?"SENDING...":"SEND REPORT"} <Send size={17}/></button>
  </form>;
}
