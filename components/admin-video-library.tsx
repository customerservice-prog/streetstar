"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Eye, Search, Star, Video } from "lucide-react";
import { PosterImage } from "@/components/poster-image";

type AdminVideo={
  id:number;slug:string;title:string;artist:string;category:string;
  status:"published"|"draft";featured:boolean;poster_url:string;created_at:string;
};
type Listing={items:AdminVideo[];featured:AdminVideo|null;page:number;pageCount:number;total:number};
type Props={onChanged:()=>Promise<void>|void};

export function AdminVideoLibrary({onChanged}:Props){
  const [items,setItems]=useState<Listing|null>(null);
  const [text,setText]=useState("");
  const [query,setQuery]=useState("");
  const [page,setPage]=useState(1);
  const [busy,setBusy]=useState<number|null>(null);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState<string|null>(null);
  const refresh=useCallback(async()=>{
    try{
      const params=new URLSearchParams({page:String(page)});
      if(query)params.set("q",query);
      const res=await fetch("/api/admin/videos?"+params.toString(),{cache:"no-store"});
      const json=await res.json();
      if(!res.ok)throw new Error(json.error||"Could not list videos.");
      setItems(json);setError("");
    }catch(e){setError(e instanceof Error?e.message:"Could not load videos.");}
  },[page,query]);
  useEffect(()=>{void refresh()},[refresh]);
  function search(event:FormEvent){event.preventDefault();setPage(1);setQuery(text.trim().slice(0,100));}
  async function change(video:AdminVideo,patch:{featured?:boolean;status?:"published"|"draft"}){
    setBusy(video.id);setError("");
    try{
      const res=await fetch("/api/admin/videos",{
        method:"PATCH",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:video.id,...patch})
      });
      const json=await res.json();
      if(!res.ok)throw new Error(json.error||"Could not update video.");
      await refresh();
      await onChanged();
    }catch(e){setError(e instanceof Error?e.message:"Update failed.");}
    finally{setBusy(null)}
  }
  async function copy(slug:string){
    try{await navigator.clipboard.writeText("https://bajomundotv.com/viral?video="+encodeURIComponent(slug));setCopied(slug)}
    catch{setError("Could not copy the link in this browser. Use OPEN to visit it.")}
  }
  return <section className="viral-library">
    <header className="viral-library-header"><div><span className="admin-kicker">ONE CLICK TO CHANGE YOUR BIG FEATURED VIDEO</span><h2>VIDEO LIBRARY.</h2></div><span>{items?.total??"—"} VIDEOS</span></header>
    {items?.featured&&<div className="viral-current-feature">
      <span className="viral-current-kicker"><Star fill="currentColor" size={17}/> CURRENT HOMEPAGE FEATURE</span>
      <div className="viral-current-main">
        <PosterImage src={items.featured.poster_url}/>
        <div><h3>{items.featured.title}</h3><p>{items.featured.artist||"Bajo Mundo TV Viral"}</p><a href={"/watch/"+items.featured.slug} target="_blank" rel="noopener noreferrer">VIEW FEATURE <ArrowUpRight size={14}/></a></div>
      </div>
    </div>}
    <form className="viral-library-search" onSubmit={search}>
      <label htmlFor="viral-library-search">Find any video by title or creator</label>
      <div><input id="viral-library-search" value={text} onChange={e=>setText(e.target.value)} placeholder="Search your Viral library..." maxLength={100}/><button type="submit" className="button button-accent"><Search size={16}/> SEARCH</button></div>
    </form>
    {error&&<p role="alert" className="form-error">{error}</p>}
    <div className="viral-library-grid">
      {items?.items.map(video=><article key={video.id} className={"viral-library-card"+(video.featured?" is-featured":"")}>
        <div className="viral-library-photo"><PosterImage src={video.poster_url}/><span>{video.status==="published"?"PUBLISHED":"DRAFT"}</span></div>
        <div className="viral-library-info"><h3>{video.title}</h3><p>{video.artist||"Bajo Mundo TV Viral"} · {video.category}</p>
          <div className="viral-library-commands">
            <button type="button" disabled={busy!==null||video.featured}
              className={"button "+(video.featured?"button-outline":"button-accent")}
              onClick={()=>void change(video,{featured:true})}>{video.featured?<><Check size={14}/> FEATURED</>:<><Star size={14}/> MAKE FEATURED</>}</button>
            <button type="button" className="button button-outline" disabled={busy!==null}
              onClick={()=>void change(video,{status:video.status==="published"?"draft":"published"})}>
              {video.status==="published"?"UNPUBLISH":"PUBLISH"}
            </button>
          </div>
          <div className="viral-library-links">
            <a href={"/watch/"+video.slug} target="_blank" rel="noopener noreferrer"><Eye size={14}/> OPEN</a>
            <button type="button" onClick={()=>void copy(video.slug)}>{copied===video.slug?<Check size={14}/>:<ArrowUpRight size={14}/>} {copied===video.slug?"COPIED":"COPY SHARE LINK"}</button>
          </div>
        </div>
      </article>)}
      {items&&!items.items.length&&<div className="viral-library-none"><Video size={32}/><p>No videos match this search.</p></div>}
    </div>
    {items&&items.pageCount>1&&<div className="viral-library-pagination">
      <button className="button button-outline" disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={14}/> PREVIOUS</button>
      <span>PAGE {page} OF {items.pageCount}</span>
      <button className="button button-outline" disabled={page>=items.pageCount} onClick={()=>setPage(p=>p+1)}>NEXT <ChevronRight size={14}/></button>
    </div>}
  </section>;
}
