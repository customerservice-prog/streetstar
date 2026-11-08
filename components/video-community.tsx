"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, Flag, Heart, Loader2, MessageCircle, MessageSquare, Reply, Send, ShieldCheck, ThumbsUp, X, Zap } from "lucide-react";

type Comment = {
  id: string;
  parentId: string | null;
  name: string;
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
};
type Reaction = "fire" | "love" | "wow";
type Reactions = {
  reactions: Record<Reaction, number>;
  mine: Reaction | null;
};
const choices: {value:Reaction; emoji:string; label:string}[] = [
  { value:"fire",emoji:"🔥",label:"Fire" },
  { value:"love",emoji:"❤️",label:"Love" },
  { value:"wow",emoji:"😮",label:"Wow" }
];

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache:"no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not complete the request.");
  return data;
}
function jsonPost(url: string, body: object) {
  return requestJson(url, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
}
function elapsed(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});
}

export function VideoCommunity({ slug }: {slug:string}) {
  const [comments,setComments] = useState<Comment[]>([]);
  const [total,setTotal] = useState(0);
  const [reactions,setReactions] = useState<Reactions>({reactions:{fire:0,love:0,wow:0},mine:null});
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState(false);
  const [reactionBusy,setReactionBusy] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [name,setName] = useState("");
  const [message,setMessage] = useState("");
  const [replyTo,setReplyTo] = useState<Comment|null>(null);
  const [sort,setSort] = useState<"newest"|"popular">("newest");
  const [reported,setReported] = useState<Comment|null>(null);
  const [reportReason,setReportReason] = useState("spam");
  const [reportDetails,setReportDetails] = useState("");
  const [reportBusy,setReportBusy] = useState(false);
  const [reportedSuccess,setReportedSuccess] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [list,counts] = await Promise.all([
        requestJson("/api/comments?slug="+encodeURIComponent(slug)),
        requestJson("/api/reactions?slug="+encodeURIComponent(slug))
      ]);
      setComments(Array.isArray(list.comments) ? list.comments : []);
      setTotal(typeof list.total==="number" ? list.total : 0);
      setReactions(counts);
      setError("");
    } catch(e) {
      setError(e instanceof Error?e.message:"Community is temporarily unavailable.");
    } finally { setLoading(false); }
  },[slug]);
  useEffect(()=>{void refresh();},[refresh]);

  const rootComments = useMemo(() => {
    const ids = new Set(comments.map(c=>c.id));
    return comments
      .filter(c=>!c.parentId || !ids.has(c.parentId))
      .sort((a,b)=>sort==="popular" ? b.likes-a.likes || Date.parse(b.createdAt)-Date.parse(a.createdAt) : Date.parse(b.createdAt)-Date.parse(a.createdAt));
  },[comments,sort]);
  const childrenByParent = useMemo(()=>{
    const byParent:Record<string,Comment[]>={};
    for(const comment of comments){
      if(!comment.parentId)continue;
      (byParent[comment.parentId] ||= []).push(comment);
    }
    for(const group of Object.values(byParent))group.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
    return byParent;
  },[comments]);

  async function submit(event:FormEvent) {
    event.preventDefault();
    setError("");setNotice("");setBusy(true);
    try {
      const data=await jsonPost("/api/comments",{
        slug,name,body:message,parentId:replyTo?.id||null,website:""
      });
      if(!data.ok)throw new Error("Unable to save comment.");
      setNotice(data.message || "Comment received and awaiting approval.");
      setMessage("");setReplyTo(null);
    }catch(e){setError(e instanceof Error?e.message:"Couldn't submit comment.");}
    finally{setBusy(false);}
  }
  async function react(choice:Reaction) {
    if(reactionBusy)return;
    setReactionBusy(true);setError("");
    try{
      const data=await jsonPost("/api/reactions",{slug,reaction:choice});
      setReactions({reactions:data.reactions,mine:data.mine});
    }catch(e){setError(e instanceof Error?e.message:"Reaction failed.");}
    finally{setReactionBusy(false);}
  }
  async function likeComment(comment:Comment) {
    setError("");
    try {
      const data=await jsonPost("/api/comments/like",{commentId:comment.id});
      setComments(items=>items.map(c=>c.id===comment.id?{...c,likes:data.likes,liked:data.liked}:c));
    }catch(e){setError(e instanceof Error?e.message:"Unable to like this comment.");}
  }
  function reply(comment:Comment) {
    setReplyTo(comment);setNotice("");
    document.getElementById("discussion-compose")?.scrollIntoView({behavior:"smooth",block:"center"});
  }
  async function report(event:FormEvent) {
    event.preventDefault();
    if(!reported)return;
    setReportBusy(true);setError("");
    try {
      const data=await jsonPost("/api/comments/report",{
        commentId:reported.id,reason:reportReason,details:reportDetails
      });
      setReportedSuccess(data.alreadyReported?"You already reported this comment.":"Report sent to moderators.");
      setReported(null);setReportReason("spam");setReportDetails("");
    }catch(e){setError(e instanceof Error?e.message:"Report could not be sent.");}
    finally{setReportBusy(false);}
  }

  function renderComment(comment:Comment,nested=false) {
    return <div className={"discussion-comment"+(nested?" discussion-reply":"")} key={comment.id}>
      <div className="discussion-avatar" aria-hidden="true">{comment.name.charAt(0).toUpperCase()}</div>
      <div className="discussion-comment-content">
        <div className="discussion-comment-header"><strong>{comment.name}</strong><span className="discussion-guest">GUEST</span><time dateTime={comment.createdAt}>{elapsed(comment.createdAt)}</time></div>
        <p>{comment.body}</p>
        <div className="discussion-comment-actions">
          <button type="button" className={comment.liked?"active":""} onClick={()=>void likeComment(comment)} aria-label={"Like comment by "+comment.name} aria-pressed={comment.liked}><ThumbsUp size={15}/>{comment.likes>0?comment.likes:"LIKE"}</button>
          {!nested && <button type="button" onClick={()=>reply(comment)}><Reply size={15}/> REPLY</button>}
          <button type="button" onClick={()=>{setReported(comment);setReportedSuccess("");}}><Flag size={14}/> REPORT</button>
        </div>
        {!nested && (childrenByParent[comment.id]||[]).length>0 && <div className="discussion-replies">
          {(childrenByParent[comment.id]||[]).map(child=>renderComment(child,true))}
        </div>}
      </div>
    </div>;
  }

  return <section className="video-community" id="comments">
    <div className="community-react-panel">
      <div><span className="community-eyebrow"><Zap size={14} fill="currentColor"/> FEEL SOMETHING?</span><h2>REACT TO THIS VIDEO</h2><p>Show some love. Your reaction helps other people discover stories.</p></div>
      <div className="community-react-list" role="group" aria-label="React to this video">
        {choices.map(choice=><button key={choice.value} type="button"
          className={"community-react-button"+(reactions.mine===choice.value?" selected":"")}
          onClick={()=>void react(choice.value)} disabled={reactionBusy||loading}
          aria-pressed={reactions.mine===choice.value}>
          <span aria-hidden="true">{choice.emoji}</span>
          <strong>{choice.label}</strong>
          <small>{reactions.reactions[choice.value]||0}</small>
        </button>)}
      </div>
    </div>

    <div className="community-main-header">
      <div><span className="community-eyebrow"><MessageSquare size={15}/> THE CONVERSATION</span><h2>JOIN THE <span>DISCUSSION.</span></h2><p>Keep it real. Respect the community.</p></div>
      <div className="community-total"><strong>{total}</strong><span>{total===1?"COMMENT":"COMMENTS"}</span></div>
    </div>

    <div className="discussion-compose" id="discussion-compose">
      <div className="discussion-compose-top"><span><MessageCircle size={16}/> ADD YOUR VOICE</span><span><ShieldCheck size={15}/> MODERATED DISCUSSION</span></div>
      {replyTo && <div className="discussion-replying">Replying to <strong>{replyTo.name}</strong><button type="button" onClick={()=>setReplyTo(null)} aria-label="Cancel reply"><X size={16}/></button></div>}
      <form onSubmit={submit}>
        <label htmlFor="discussion-name">DISPLAY NAME <span className="discussion-subtle">(UNVERIFIED GUEST)</span></label>
        <input id="discussion-name" type="text" required minLength={2} maxLength={40}
          value={name} onChange={e=>setName(e.target.value)} placeholder="What should we call you?" autoComplete="nickname" />
        <label htmlFor="discussion-text">YOUR COMMENT</label>
        <textarea id="discussion-text" required minLength={3} maxLength={1200} rows={4}
          value={message} onChange={e=>setMessage(e.target.value)}
          placeholder={replyTo?"Write a respectful reply...":"What's your take? Join the conversation."}/>
        <div className="discussion-compose-bottom"><small>Comments are reviewed before appearing publicly. <Link href="/terms">Community rules</Link></small>
          <button type="submit" disabled={busy} className="button button-accent">{busy?<Loader2 size={16} className="spin"/>:<Send size={16}/>} POST COMMENT</button>
        </div>
      </form>
    </div>

    {notice && <p className="discussion-alert success" role="status"><Check size={17}/>{notice}</p>}
    {reportedSuccess && <p className="discussion-alert success" role="status"><Check size={17}/>{reportedSuccess}</p>}
    {error && <p className="discussion-alert error" role="alert">{error}<button type="button" onClick={()=>{setLoading(true);void refresh();}}><ArrowRight size={16}/> RETRY</button></p>}

    <div className="discussion-list-head">
      <span><MessageSquare size={17}/> COMMUNITY COMMENTS</span>
      <label>Sort: <select aria-label="Sort comments" value={sort} onChange={e=>setSort(e.target.value as "newest"|"popular")}><option value="newest">Newest</option><option value="popular">Most liked</option></select><ChevronDown size={14}/></label>
    </div>
    {loading ? <p className="discussion-loading"><Loader2 className="spin" size={19}/> Loading discussion...</p>
      : rootComments.length===0
        ? <div className="discussion-empty"><MessageSquare size={34}/><h3>START THE CONVERSATION.</h3><p>No approved comments yet. Be the first to share your thoughts.</p></div>
        : <div className="discussion-list">{rootComments.map(comment=>renderComment(comment))}{total>comments.length && <p className="discussion-page-note">Showing the most recent {comments.length} comments.</p>}</div>
    }
    <div className="discussion-footnote"><ShieldCheck size={16}/> Guest names are not verified. No harassment, threats, private information or copyright-infringing content. <Link href="/report">Report a video</Link>.</div>

    {reported && <div className="discussion-report-overlay" role="presentation" onClick={()=>setReported(null)}>
      <div className="discussion-report-dialog" role="dialog" aria-modal="true" aria-labelledby="report-comment-title" onClick={e=>e.stopPropagation()}>
        <div className="discussion-report-top"><div><span className="community-eyebrow"><Flag size={14}/> SAFETY FIRST</span><h3 id="report-comment-title">REPORT COMMENT</h3></div><button type="button" onClick={()=>setReported(null)} aria-label="Close report"><X size={19}/></button></div>
        <p>Tell our moderators why this comment needs review.</p>
        <form onSubmit={report}>
          <label htmlFor="report-reason">REASON</label>
          <select id="report-reason" value={reportReason} onChange={e=>setReportReason(e.target.value)}>
            <option value="spam">Spam or misleading content</option><option value="harassment">Harassment or threats</option>
            <option value="privacy">Personal information</option><option value="other">Other issue</option>
          </select>
          <label htmlFor="report-details">DETAILS (OPTIONAL)</label>
          <textarea id="report-details" rows={3} maxLength={500} value={reportDetails} onChange={e=>setReportDetails(e.target.value)} placeholder="Add context for moderators..."/>
          <button type="submit" className="button button-accent" disabled={reportBusy}>{reportBusy?"SENDING...":"SUBMIT REPORT"}<Flag size={15}/></button>
        </form>
      </div>
    </div>}
  </section>;
}
