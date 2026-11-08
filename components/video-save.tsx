"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Eye } from "lucide-react";

export function VideoSave({slug}:{slug:string}){
  const [signedIn,setSignedIn]=useState<boolean|null>(null);
  const [saved,setSaved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [plays,setPlays]=useState<number|null>(null);
  useEffect(()=>{
    let canceled=false;
    void Promise.all([
      fetch("/api/member/auth",{cache:"no-store"}).then(r=>r.json()),
      fetch("/api/video-stats?slug="+encodeURIComponent(slug),{cache:"no-store"}).then(r=>r.json())
    ]).then(async ([account,stats])=>{
      if(canceled)return;
      setSignedIn(Boolean(account.member));
      if(Number.isInteger(stats.plays))setPlays(stats.plays);
      if(account.member){
        const library=await fetch("/api/member/library",{cache:"no-store"}).then(r=>r.json());
        if(!canceled&&Array.isArray(library.saved))setSaved(library.saved.some((x:{slug:string})=>x.slug===slug));
      }
    }).catch(()=>{if(!canceled)setSignedIn(false);});
    return ()=>{canceled=true;};
  },[slug]);
  useEffect(()=>{
    const update=()=>{
      void fetch("/api/video-stats?slug="+encodeURIComponent(slug),{cache:"no-store"})
        .then(r=>r.json()).then(info=>{if(Number.isInteger(info.plays))setPlays(info.plays);})
        .catch(()=>{});
    };
    window.addEventListener("streetstar:played",update);
    return ()=>window.removeEventListener("streetstar:played",update);
  },[slug]);
  async function toggle(){
    if(!signedIn||busy)return;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/member/library",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({slug,saved:!saved})});
      const data=await response.json();
      if(!response.ok)throw new Error(data.error||"Couldn't update library.");
      setSaved(data.saved);
    }catch(e){setError(e instanceof Error?e.message:"Save failed.");}
    finally{setBusy(false);}
  }
  return <div className="watch-social-extras">
    {signedIn===false?<Link className="watch-save-button" href="/account"><Bookmark size={16}/> SIGN IN TO SAVE</Link>
      :<button className={"watch-save-button"+(saved?" active":"")} disabled={busy||signedIn===null} onClick={()=>void toggle()} aria-pressed={saved}><Bookmark size={16} fill={saved?"currentColor":"none"}/>{saved?"SAVED":"SAVE VIDEO"}</button>}
    {plays!==null&&<span className="watch-play-stats"><Eye size={15}/>{plays.toLocaleString()} {plays===1?"PLAY":"PLAYS"}</span>}
    {error&&<small role="alert">{error}</small>}
  </div>;
}
