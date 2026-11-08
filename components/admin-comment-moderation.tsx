"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Check, CircleAlert, Flag, Loader2, MessageSquare, RefreshCw, ShieldCheck, ThumbsUp, X } from "lucide-react";

type Item = {
  id:string;slug:string;parentId:string|null;name:string;body:string;status:string;createdAt:string;
};
type Report = {
  id:string;commentId:string;reason:string;details:string;status:string;createdAt:string;body:string;name:string;slug:string;
};
type Data = {comments:Item[];reports:Report[]};
type Filter = "pending"|"approved"|"hidden"|"reports";

export function AdminCommentModeration() {
  const [data,setData]=useState<Data>({comments:[],reports:[]});
  const [filter,setFilter]=useState<Filter>("pending");
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const load=useCallback(async()=>{
    setError("");
    try{
      const r=await fetch("/api/admin/comments",{cache:"no-store"});
      const body=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(body.error||"Could not load moderation queue.");
      setData({comments:body.comments||[],reports:body.reports||[]});
    }catch(e){setError(e instanceof Error?e.message:"Could not load comments.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  const items=useMemo(()=>data.comments.filter(c=>c.status===filter),[filter,data.comments]);
  const openReports=data.reports.filter(r=>r.status==="open");
  async function update(type:"comment"|"report",id:string,status:string) {
    setBusy(true);setError("");setNotice("");
    try {
      const res=await fetch("/api/admin/comments",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,id,status})});
      const info=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(info.error||"Update failed.");
      setNotice(type==="comment"?"Comment moderation saved.":"Report status saved.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Update failed.");}
    finally{setBusy(false);}
  }
  return <main className="container comment-admin">
    <div className="comment-admin-top"><Link href="/admin"><ArrowLeft size={17}/> CONTROL ROOM</Link><span><ShieldCheck size={16}/> STAFF ONLY</span></div>
    <div className="comment-admin-title"><div><p className="community-eyebrow"><MessageSquare size={16}/> COMMUNITY MANAGEMENT</p><h1>COMMENT <span>CONTROL.</span></h1><p>Approve comments, manage replies and review member reports.</p></div><button type="button" className="button button-outline" onClick={()=>{setLoading(true);void load();}}><RefreshCw size={17}/> REFRESH</button></div>
    <div className="comment-admin-stats">
      <div><strong>{data.comments.filter(c=>c.status==="pending").length}</strong><span>NEED APPROVAL</span></div>
      <div><strong>{data.comments.filter(c=>c.status==="approved").length}</strong><span>APPROVED</span></div>
      <div><strong>{openReports.length}</strong><span>OPEN REPORTS</span></div>
    </div>
    <div className="comment-admin-tabs">
      {([
        ["pending","PENDING"],
        ["approved","APPROVED"],
        ["hidden","HIDDEN"],
        ["reports","REPORTS"]
      ] as [Filter,string][]).map(([value,label])=><button type="button" key={value} className={filter===value?"active":""} onClick={()=>setFilter(value)}>{label} {value==="pending"&&data.comments.filter(c=>c.status==="pending").length>0?<span>{data.comments.filter(c=>c.status==="pending").length}</span>:value==="reports"&&openReports.length>0?<span>{openReports.length}</span>:null}</button>)}
    </div>
    {error && <p className="discussion-alert error" role="alert"><CircleAlert size={16}/>{error}</p>}
    {notice && <p className="discussion-alert success" role="status"><Check size={16}/>{notice}</p>}
    {loading?<p className="discussion-loading"><Loader2 size={18} className="spin"/> Loading moderation queue...</p>
      :filter==="reports"?
        data.reports.length===0?<div className="comment-admin-empty"><Flag size={32}/><h2>NO REPORTS.</h2><p>Flagged comments will appear here.</p></div>
        :<div className="comment-admin-list">{data.reports.map(r=><article className="comment-admin-item" key={r.id}>
          <div><p className="comment-admin-meta"><Flag size={13}/> {r.reason.toUpperCase()} / {r.status.toUpperCase()}</p><h3>Report against {r.name}</h3><p className="comment-admin-quote">{r.body}</p>{r.details&&<p>Reporter notes: {r.details}</p>}<Link href={"/watch/"+r.slug+"#comments"} target="_blank">VIEW IN CONTEXT <ArrowUpRight size={14}/></Link></div>
          <div className="comment-admin-controls">
            <button type="button" disabled={busy} onClick={()=>void update("report",r.id,"reviewed")} className="button button-outline">MARK REVIEWED</button>
            <button type="button" disabled={busy} onClick={()=>void update("report",r.id,"resolved")} className="button button-outline"><Check size={14}/> RESOLVED</button>
            <button type="button" disabled={busy} onClick={()=>void update("comment",r.commentId,"hidden")} className="button button-outline"><X size={14}/> HIDE COMMENT</button>
          </div>
        </article>)}</div>
      :items.length===0?<div className="comment-admin-empty"><Check size={32}/><h2>ALL CAUGHT UP.</h2><p>No {filter} comments in the moderation queue.</p></div>
      :<div className="comment-admin-list">{items.map(c=><article className="comment-admin-item" key={c.id}>
        <div><p className="comment-admin-meta"><MessageSquare size={13}/> {c.status.toUpperCase()} {c.parentId?"/ REPLY":"/ COMMENT"} / {new Date(c.createdAt).toLocaleDateString()}</p><h3>{c.name} <span className="discussion-guest">GUEST</span></h3><p className="comment-admin-quote">{c.body}</p><Link href={"/watch/"+c.slug+"#comments"} target="_blank">VIDEO: {c.slug} <ArrowUpRight size={14}/></Link></div>
        <div className="comment-admin-controls">
          {c.status!=="approved"&&<button type="button" disabled={busy} className="button button-accent" onClick={()=>void update("comment",c.id,"approved")}><Check size={15}/> APPROVE</button>}
          {c.status!=="hidden"&&<button type="button" disabled={busy} className="button button-outline" onClick={()=>void update("comment",c.id,"hidden")}><X size={15}/> HIDE</button>}
          {c.status==="approved"&&<span className="comment-admin-approved"><ThumbsUp size={15}/> PUBLIC</span>}
        </div>
      </article>)}</div>}
    <p className="comment-admin-policy">Comments are guest-submitted and unverified. Review harassment, private information and third-party rights before approving. For urgent harm, hide the comment and assess the report promptly.</p>
  </main>;
}
