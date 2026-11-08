"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bell, Bookmark, Check, Clapperboard, Clock3, Eye, Heart, KeyRound, LogIn, LogOut, Mail, MessageCircle, Settings, ShieldCheck, Star, Trash2, UserRound, UserPlus } from "lucide-react";
import { PosterImage } from "@/components/poster-image";
import type { Story } from "@/lib/content";

type Member={id:string;email:string;displayName:string;notificationsEnabled:boolean;createdAt:string};
type LibraryVideo={slug:string;story:Story;createdAt?:string;lastWatched?:string;viewCount?:number};
type Submission={id:string;title:string;category:string;status:string;createdAt:string};
type Note={id:string;kind:"reply"|"approved";actorName:string;slug:string;createdAt:string;readAt:string|null};
type Tab="saved"|"history"|"notifications"|"creator"|"settings";
type Library={saved:LibraryVideo[];history:LibraryVideo[];submissions:Submission[]};
const empty:Library={saved:[],history:[],submissions:[]};
const format=(value:string)=>new Date(value).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});

export function MemberCenter(){
  const [member,setMember]=useState<Member|null>(null);
  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [mode,setMode]=useState<"login"|"register">("register");
  const [tab,setTab]=useState<Tab>("saved");
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [displayName,setDisplayName]=useState("");
  const [library,setLibrary]=useState<Library>(empty);
  const [notifications,setNotifications]=useState<Note[]>([]);
  const [unread,setUnread]=useState(0);
  const [newPassword,setNewPassword]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");
  const [deletePassword,setDeletePassword]=useState("");
  const [deleteConfirm,setDeleteConfirm]=useState("");
  const [showDelete,setShowDelete]=useState(false);

  const load=useCallback(async()=>{
    try {
      const auth=await fetch("/api/member/auth",{cache:"no-store"}).then(r=>r.json());
      setMember(auth.member||null);
      if(auth.member){
        setDisplayName(auth.member.displayName);
        const [lib,notes]=await Promise.all([
          fetch("/api/member/library",{cache:"no-store"}).then(r=>r.json()),
          fetch("/api/member/notifications",{cache:"no-store"}).then(r=>r.json())
        ]);
        if(!Array.isArray(lib.saved))throw new Error(lib.error||"Could not load your library.");
        setLibrary(lib);
        setNotifications(notes.notifications||[]);
        setUnread(notes.unread||0);
      } else {setLibrary(empty);setNotifications([]);setUnread(0);}
    }catch(e){setError(e instanceof Error?e.message:"Unable to load account.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void load();},[load]);

  async function request(path:string,action:string,body:object){
    const response=await fetch(path,{method:action,headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const info=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(info.error||"Request failed.");
    return info;
  }
  async function signin(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      const data=await request("/api/member/auth","POST",{
        action:mode,email,password,...(mode==="register"?{displayName,website:""}:{})
      });
      setPassword("");setNotice(data.message||"Signed in.");
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not sign in.");}
    finally{setBusy(false);}
  }
  async function signout(){
    setBusy(true);setError("");setNotice("");
    try{await request("/api/member/auth","POST",{action:"logout"});setMember(null);setLibrary(empty);setNotifications([]);setUnread(0);setNotice("Signed out.");}
    catch(e){setError(e instanceof Error?e.message:"Sign out failed.");}
    finally{setBusy(false);}
  }
  async function save(slug:string,saved:boolean){
    setBusy(true);setError("");
    try{
      await request("/api/member/library","POST",{slug,saved});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Could not update saved videos.");}
    finally{setBusy(false);}
  }
  async function markRead(id?:string){
    try{
      await request("/api/member/notifications","PATCH",id?{id}:{all:true});
      setNotifications(old=>old.map(n=>!id||n.id===id?{...n,readAt:new Date().toISOString()}:n));
      setUnread(old=>id?Math.max(0,old-1):0);
    }catch(e){setError(e instanceof Error?e.message:"Could not update notifications.");}
  }
  async function saveProfile(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");setNotice("");
    try{
      await request("/api/member/profile","PATCH",{displayName,notificationsEnabled:member?.notificationsEnabled??true,...(newPassword?{currentPassword,newPassword}:{})});
      setNewPassword("");setCurrentPassword("");setNotice("Profile updated.");await load();
    }catch(e){setError(e instanceof Error?e.message:"Profile update failed.");}
    finally{setBusy(false);}
  }
  async function toggleNotifications(next:boolean){
    if(!member)return;setBusy(true);setError("");
    try{
      await request("/api/member/profile","PATCH",{notificationsEnabled:next});
      setMember({...member,notificationsEnabled:next});
    }catch(e){setError(e instanceof Error?e.message:"Could not update preferences.");}
    finally{setBusy(false);}
  }
  async function deleteAccount(event:FormEvent){
    event.preventDefault();setBusy(true);setError("");
    try{
      await request("/api/member/profile","DELETE",{password:deletePassword,confirm:deleteConfirm});
      setMember(null);setLibrary(empty);setNotifications([]);setUnread(0);setDeletePassword("");setDeleteConfirm("");setShowDelete(false);
      setNotice("Your member account was deleted.");
    }catch(e){setError(e instanceof Error?e.message:"Account deletion failed.");}
    finally{setBusy(false);}
  }
  function videoList(items:LibraryVideo[],kind:"saved"|"history"){
    if(!items.length)return <div className="member-empty"><Bookmark size={34}/><h3>NOTHING HERE YET.</h3><p>{kind==="saved"?"Save videos from any watch page to build your collection.":"Start watching videos to see your recent activity here."}</p><Link href="/#discover">DISCOVER VIDEOS <ArrowUpRight size={15}/></Link></div>;
    return <div className="member-videos">{items.map(x=><article className="member-video" key={x.slug}>
      <Link href={"/watch/"+x.slug} className="member-video-thumb"><PosterImage src={x.story.posterUrl} alt="" /></Link>
      <div><span className="member-video-meta">{x.story.category.toUpperCase()} {x.story.isDemo?"· DEMO":""}</span><Link href={"/watch/"+x.slug}><h3>{x.story.title}</h3></Link><p>{kind==="history"&&x.lastWatched?"Last viewed "+format(x.lastWatched):"Added "+format(x.createdAt||x.story.createdAt)}</p>
        <div className="member-video-actions"><Link href={"/watch/"+x.slug}>WATCH AGAIN <ArrowUpRight size={14}/></Link>{kind==="saved"&&<button disabled={busy} onClick={()=>void save(x.slug,false)}><Bookmark size={14}/> REMOVE</button>}</div>
      </div>
    </article>)}</div>;
  }

  return <main className="container member-page">
    <div className="member-page-hero"><p className="community-eyebrow"><Star size={15} fill="currentColor"/> THE STREETSTAR COMMUNITY</p>
      <h1>YOUR <span>STREETSTAR.</span></h1>
      <p>Save what moves you. Join the conversation. Be part of the culture.</p>
    </div>
    {error&&<p className="discussion-alert error" role="alert">{error}</p>}
    {notice&&<p className="discussion-alert success" role="status"><Check size={16}/>{notice}</p>}
    {loading?<div className="member-loading">LOADING YOUR SPACE...</div>
      :!member?<div className="member-auth-layout">
        <section className="member-auth-card">
          <div className="member-auth-switch"><button className={mode==="register"?"active":""} onClick={()=>setMode("register")}><UserPlus size={15}/> JOIN STREETSTAR</button><button className={mode==="login"?"active":""} onClick={()=>setMode("login")}><LogIn size={15}/> SIGN IN</button></div>
          <h2>{mode==="register"?"CREATE YOUR ACCOUNT.":"WELCOME BACK."}</h2>
          <p>{mode==="register"?"Your personal library and in-app notifications start here.":"Get back to your favorite videos and conversations."}</p>
          <form onSubmit={signin} className="member-form">
            {mode==="register"&&<label>DISPLAY NAME<input autoComplete="nickname" required minLength={2} maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your public nickname"/></label>}
            <label>EMAIL<input required type="email" autoComplete="email" maxLength={200} value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
            <label>PASSWORD<input required type="password" minLength={mode==="register"?10:1} maxLength={128} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==="register"?"At least 10 characters":"Your password"}/></label>
            <button type="submit" disabled={busy} className="button button-accent">{busy?"WORKING...":mode==="register"?"CREATE MY ACCOUNT":"SIGN IN"}<ArrowUpRight size={17}/></button>
          </form>
          <p className="member-fineprint">Email confirmation and password recovery are not yet available. Use a strong, unique password. By joining, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </section>
        <aside className="member-auth-promo"><div className="member-auth-promo-star"><Star size={55} fill="currentColor"/></div><span>MORE THAN A PROFILE.</span><h2>YOUR CULTURE.<br/><em>YOUR SPACE.</em></h2><div><p><Bookmark size={17}/> SAVE YOUR FAVORITES</p><p><Clock3 size={17}/> YOUR WATCH HISTORY</p><p><Bell size={17}/> REPLY ALERTS</p><p><MessageCircle size={17}/> JOIN THE DISCUSSION</p></div></aside>
      </div>
      :<div className="member-workspace">
        <div className="member-identity"><span className="member-identity-avatar">{member.displayName.charAt(0).toUpperCase()}</span><div><p>WELCOME BACK</p><h2>{member.displayName}</h2><span>MEMBER SINCE {format(member.createdAt)}</span></div><button className="button button-outline" onClick={()=>void signout()} disabled={busy}><LogOut size={15}/> LOG OUT</button></div>
        <div className="member-tabs" role="group" aria-label="Member sections">
          {([{id:"saved",label:"SAVED",icon:Bookmark},{id:"history",label:"HISTORY",icon:Clock3},{id:"notifications",label:"ALERTS",icon:Bell},{id:"creator",label:"MY SUBMISSIONS",icon:Clapperboard},{id:"settings",label:"SETTINGS",icon:Settings}] as {id:Tab;label:string;icon:typeof Bookmark}[]).map(x=><button key={x.id} onClick={()=>setTab(x.id)} aria-pressed={tab===x.id} className={tab===x.id?"active":""}><x.icon size={16}/>{x.label}{x.id==="notifications"&&unread>0&&<span className="member-unread">{unread}</span>}</button>)}
        </div>
        <section className="member-tab-content">
          {tab==="saved"&&<><div className="member-content-head"><h2>YOUR <span>COLLECTION.</span></h2><p>{library.saved.length} saved videos</p></div>{videoList(library.saved,"saved")}</>}
          {tab==="history"&&<><div className="member-content-head"><h2>RECENTLY <span>WATCHED.</span></h2><p>Only video playback starts are recorded.</p></div>{videoList(library.history,"history")}</>}
          {tab==="notifications"&&<><div className="member-content-head"><h2>YOUR <span>ALERTS.</span></h2><button onClick={()=>void markRead()} disabled={unread===0}>MARK ALL READ <Check size={15}/></button></div>
            {notifications.length?<div className="member-notes">{notifications.map(n=><div className={n.readAt?"member-note":"member-note unread"} key={n.id}><span className="member-note-icon">{n.kind==="reply"?<MessageCircle size={19}/>:<Check size={19}/>}</span><div><strong>{n.kind==="reply"?n.actorName+" replied to your comment":"Your comment was approved"}</strong><p>{format(n.createdAt)}</p><Link onClick={()=>void markRead(n.id)} href={"/watch/"+n.slug+"#comments"}>VIEW CONVERSATION <ArrowRight size={13}/></Link></div>{!n.readAt&&<button className="member-mark-read" onClick={()=>void markRead(n.id)} aria-label="Mark notification read"><Check size={16}/></button>}</div>)}</div>
            :<div className="member-empty"><Bell size={34}/><h3>ALL CAUGHT UP.</h3><p>Approved replies to your comments will appear here.</p></div>}
          </>}
          {tab==="creator"&&<><div className="member-content-head"><h2>YOUR <span>SUBMISSIONS.</span></h2><Link href="/submit" className="member-small-cta">SUBMIT A VIDEO <ArrowUpRight size={15}/></Link></div>
            <p className="member-tip">Submissions made while signed in, using your account email, appear here. Older guest submissions cannot be claimed without email verification.</p>
            {library.submissions.length?<div className="member-submissions">{library.submissions.map(s=><div key={s.id}><span className="member-submission-cat">{s.category.toUpperCase()}</span><h3>{s.title}</h3><span className="member-submission-status">{s.status.toUpperCase()}</span><p>{format(s.createdAt)}</p></div>)}</div>
             :<div className="member-empty"><Clapperboard size={34}/><h3>YOUR FIRST DROP?</h3><p>Submit your original or authorized video for editorial review.</p><Link href="/submit">SUBMIT A VIDEO <ArrowUpRight size={15}/></Link></div>}
          </>}
          {tab==="settings"&&<><div className="member-content-head"><h2>YOUR <span>SETTINGS.</span></h2></div>
            <form className="member-form member-settings" onSubmit={saveProfile}>
              <label>DISPLAY NAME<input required minLength={2} maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)}/></label>
              <p className="member-readonly">ACCOUNT EMAIL: {member.email} · Email changes require verification and are not available yet.</p>
              <label className="member-toggle"><input type="checkbox" checked={member.notificationsEnabled} onChange={e=>void toggleNotifications(e.target.checked)} disabled={busy}/><span>Enable in-app notifications for replies and approvals</span></label>
              <h3>CHANGE PASSWORD (OPTIONAL)</h3>
              <label>CURRENT PASSWORD<input type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label>
              <label>NEW PASSWORD<input type="password" minLength={10} maxLength={128} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/></label>
              <button className="button button-accent" disabled={busy}>SAVE CHANGES <Check size={15}/></button>
            </form>
            <div className="member-danger"><h3>DELETE ACCOUNT</h3><p>This deletes your member profile, saved items, alerts and watch history. Published comments will be anonymized.</p>
              {!showDelete?<button onClick={()=>setShowDelete(true)} className="button button-outline"><Trash2 size={15}/> DELETE MY ACCOUNT</button>
                :<form className="member-form" onSubmit={deleteAccount}><label>CURRENT PASSWORD<input type="password" required value={deletePassword} onChange={e=>setDeletePassword(e.target.value)}/></label><label>TYPE DELETE<input required value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE"/></label><button className="button button-outline" type="submit" disabled={busy||deleteConfirm!=="DELETE"}>PERMANENTLY DELETE ACCOUNT</button><button type="button" onClick={()=>setShowDelete(false)}>CANCEL</button></form>}
            </div>
          </>}
        </section>
      </div>}
  </main>;
}
