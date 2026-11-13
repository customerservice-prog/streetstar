"use client";

import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowUpRight, CheckCircle2, Clapperboard, CloudUpload, FileVideo2, Loader2, Star, StopCircle, X } from "lucide-react";

type QueueItem={
  key:string;file:File;title:string;progress:number;
  state:"queued"|"uploading"|"published"|"failed"|"cancelled";
  error?:string;slug?:string;
};
type StorageInfo={ready:boolean;reason?:string;freeBytes?:number;maxFileBytes:number};
type Props={onPublished:()=>Promise<void>|void;openLinks:()=>void};
const CHUNK=4*1024*1024;
function humanSize(bytes:number){return (bytes/1024/1024).toFixed(1)+" MB"}
function getTitle(name:string){
  const title=name.replace(/\.(mp4|webm)$/i,"").replace(/[_]+/g," ").replace(/\s*[-–]\s*/g," — ").trim();
  return title.length>=3?title.slice(0,170):"Nuevo video viral";
}
async function jsonResponse(response:Response){
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(body.error||"Request failed.");
  return body;
}
// Generates a real video-frame JPEG on the owner's device. Original video never
// needs to be transcoded on the server just to build a thumbnail.
async function thumbnailFromFile(file:File):Promise<Blob|null>{
  const url=URL.createObjectURL(file);
  const video=document.createElement("video");
  video.preload="auto";video.muted=true;video.playsInline=true;
  try{
    const ready=await new Promise<boolean>(resolve=>{
      let settled=false;
      const finish=(ok:boolean)=>{if(settled)return;settled=true;resolve(ok)};
      const timeout=window.setTimeout(()=>finish(false),8000);
      const cleanup=()=>window.clearTimeout(timeout);
      video.onloadedmetadata=()=>{
        if(!video.videoWidth||!video.videoHeight){cleanup();finish(false);return;}
        try{video.currentTime=Math.min(2,Math.max(.12,video.duration*.08||.12))}catch{cleanup();finish(false)}
      };
      video.onseeked=()=>{cleanup();finish(true)};
      video.onerror=()=>{cleanup();finish(false)};
      video.src=url;
    });
    if(!ready)return null;
    const w=video.videoWidth,h=video.videoHeight;
    const scale=Math.min(1280/w,720/h,1);
    const canvas=document.createElement("canvas");
    canvas.width=Math.max(1,Math.round(w*scale));
    canvas.height=Math.max(1,Math.round(h*scale));
    const ctx=canvas.getContext("2d");
    if(!ctx)return null;
    ctx.drawImage(video,0,0,canvas.width,canvas.height);
    return await new Promise<Blob|null>(resolve=>canvas.toBlob(blob=>resolve(blob),"image/jpeg",.87));
  }catch{return null}
  finally{video.removeAttribute("src");video.load();URL.revokeObjectURL(url)}
}

export function AdminQuickUpload({onPublished,openLinks}:Props){
  const [queue,setQueue]=useState<QueueItem[]>([]);
  const [artist,setArtist]=useState("");
  const [category,setCategory]=useState("Viral");
  const [published,setPublished]=useState(true);
  const [featuredKey,setFeaturedKey]=useState<string|null>(null);
  const [storage,setStorage]=useState<StorageInfo|null>(null);
  const [busy,setBusy]=useState(false);
  const [dragging,setDragging]=useState(false);
  const [notice,setNotice]=useState("");
  const fileInput=useRef<HTMLInputElement>(null);
  const abortRef=useRef<AbortController|null>(null);
  const stopped=useRef(false);
  const queueRef=useRef<QueueItem[]>([]);
  useEffect(()=>{queueRef.current=queue},[queue]);
  useEffect(()=>{
    void fetch("/api/admin/uploads",{cache:"no-store"})
      .then(r=>r.json()).then(x=>setStorage(x)).catch(()=>setStorage({ready:false,reason:"Storage status unavailable.",maxFileBytes:500*1024*1024}));
  },[]);
  useEffect(()=>{
    const protect=(event:BeforeUnloadEvent)=>{if(!busy)return;event.preventDefault()};
    window.addEventListener("beforeunload",protect);
    return ()=>window.removeEventListener("beforeunload",protect);
  },[busy]);
  function update(key:string,patch:Partial<QueueItem>){
    setQueue(current=>current.map(item=>item.key===key?{...item,...patch}:item));
  }
  function addFiles(files:File[]){
    setNotice("");
    const selected=files.filter(file=>/\.(mp4|webm)$/i.test(file.name)).slice(0,12);
    if(selected.length!==files.length)setNotice("Only 12 MP4 or WebM files can be added at a time.");
    const items=selected.map(file=>({
      key:crypto.randomUUID(),file,title:getTitle(file.name),progress:0,state:"queued" as const
    }));
    setQueue(old=>[...old,...items].slice(0,12));
  }
  function choose(event:ChangeEvent<HTMLInputElement>){addFiles(Array.from(event.target.files||[]));event.target.value="";}
  function dropped(event:DragEvent<HTMLDivElement>){event.preventDefault();setDragging(false);if(!busy)addFiles(Array.from(event.dataTransfer.files));}
  async function putChunk(url:string,chunk:Blob,signal:AbortSignal){
    const res=await fetch(url,{method:"PUT",body:chunk,headers:{"Content-Type":"application/octet-stream"},signal});
    return jsonResponse(res);
  }
  async function uploadOne(item:QueueItem){
    if(item.file.size>(storage?.maxFileBytes||500*1024*1024))throw new Error("File exceeds 500 MiB limit.");
    const init=await jsonResponse(await fetch("/api/admin/uploads",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({filename:item.file.name,type:item.file.type||"application/octet-stream",size:item.file.size})
    }));
    const id=String(init.id);
    try{
      let offset=0,retries=0;
      update(item.key,{state:"uploading",error:"",progress:0});
      while(offset<item.file.size){
        if(stopped.current)throw new Error("Upload cancelled.");
        const chunk=item.file.slice(offset,Math.min(offset+CHUNK,item.file.size));
        try{
          const outcome=await putChunk("/api/admin/uploads/"+id+"?offset="+offset,chunk,abortRef.current!.signal);
          offset=Number(outcome.received);
          retries=0;
          update(item.key,{progress:Math.min(99,Math.round(offset/item.file.size*100))});
        }catch(error){
          if(stopped.current)throw error;
          const state=await fetch("/api/admin/uploads/"+id,{cache:"no-store"}).then(r=>r.json()).catch(()=>null);
          if(state?.ok && Number.isSafeInteger(state.received))offset=state.received;
          retries++;
          if(retries>=3)throw error;
        }
      }
      if(stopped.current)throw new Error("Upload cancelled.");
      const thumbnail=await thumbnailFromFile(item.file);
      if(thumbnail && thumbnail.size<=2*1024*1024){
        await putChunk("/api/admin/uploads/"+id+"/poster",thumbnail,abortRef.current!.signal).catch(()=>null);
      }
      const result=await jsonResponse(await fetch("/api/admin/uploads/"+id+"/complete",{
        method:"POST",headers:{"Content-Type":"application/json"},signal:abortRef.current!.signal,
        body:JSON.stringify({
          title:item.title,artist,category,status:published?"published":"draft",
          featured:published && item.key===featuredKey,
          description:""
        })
      }));
      update(item.key,{state:"published",progress:100,slug:result.video.slug});
    }catch(error){
      await fetch("/api/admin/uploads/"+id,{method:"DELETE"}).catch(()=>{});
      throw error;
    }
  }
  async function uploadAll(){
    if(busy||!storage?.ready)return;
    setBusy(true);stopped.current=false;setNotice("");
    abortRef.current=new AbortController();
    let count=0;
    for(const item of queueRef.current.filter(q=>q.state==="queued"||q.state==="failed")){
      if(stopped.current)break;
      try{
        await uploadOne(item);count++;
      }catch(error){
        update(item.key,{state:stopped.current?"cancelled":"failed",error:error instanceof Error?error.message:"Upload failed."});
        if(stopped.current)break;
      }
    }
    setBusy(false);abortRef.current=null;
    if(count){setNotice(count+" video(s) saved. Published videos are visible on Viral.");await onPublished();}
  }
  function stop(){stopped.current=true;abortRef.current?.abort();setNotice("Stopping and removing the current incomplete upload.");}
  const waiting=queue.filter(q=>q.state==="queued"||q.state==="failed");
  const hasUploaded=queue.some(q=>q.state==="published");
  return <section className="viral-upload-panel" aria-label="Quick Viral upload">
    <div className="viral-upload-title"><div><span className="admin-kicker">BAJO MUNDO VIRAL · CONTROL ROOM</span><h2>UPLOAD VIDEOS FAST.</h2><p>Select videos, add a title, and publish. Thumbnails are created automatically when possible.</p></div><CloudUpload size={44}/></div>
    {storage&&!storage.ready&&<div className="upload-storage-warning" role="alert"><strong>DIRECT FILE UPLOAD NOT ACTIVE</strong><p>{storage.reason||"The storage volume is not mounted."} You can publish a video link now.</p><button type="button" className="button button-outline" onClick={openLinks}>ADD VIDEO LINK <ArrowUpRight size={15}/></button></div>}
    {storage?.ready&&<p className="upload-storage-info">Persistent storage active · Up to {humanSize(storage.maxFileBytes)} per video · {humanSize(storage.freeBytes||0)} free</p>}
    <div className={"viral-dropzone"+(dragging?" is-dragging":"")} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={dropped}>
      <FileVideo2 size={33}/><strong>DROP MP4 OR WEBM VIDEOS HERE</strong><span>Or select up to 12 files. Designed for mobile and desktop.</span>
      <input ref={fileInput} type="file" accept=".mp4,.webm,video/mp4,video/webm" multiple aria-label="Select video files" onChange={choose} disabled={busy}/>
      <button type="button" className="button button-accent" onClick={()=>fileInput.current?.click()} disabled={busy}>CHOOSE VIDEOS</button>
    </div>
    {queue.length>0&&<div className="viral-upload-queue">
      <div className="viral-upload-queue-heading"><strong>{queue.length} SELECTED</strong><button type="button" disabled={busy} onClick={()=>{setQueue([]);setFeaturedKey(null)}}>CLEAR</button></div>
      {queue.map(item=><div key={item.key} className="viral-upload-item">
        <div className="viral-upload-item-icon"><Clapperboard size={21}/></div>
        <div className="viral-upload-item-body">
          <label>VIDEO TITLE<input value={item.title} disabled={busy||item.state==="published"} onChange={event=>update(item.key,{title:event.target.value.slice(0,170)})} maxLength={170}/></label>
          <div className="viral-upload-item-meta"><span>{item.file.name}</span><span>{humanSize(item.file.size)}</span><span>{item.state.toUpperCase()}</span></div>
          {item.progress>0&&<progress max={100} value={item.progress} aria-label={"Upload progress "+item.title}/>}
          {item.error&&<small role="alert">{item.error}</small>}
          {item.slug&&<a href={"/watch/"+item.slug} target="_blank" rel="noreferrer">VIEW VIDEO <ArrowUpRight size={13}/></a>}
        </div>
        <div className="viral-upload-item-options">
          <label><input type="radio" checked={featuredKey===item.key} disabled={busy||item.state==="published"} onChange={()=>setFeaturedKey(item.key)}/><Star size={16}/> FEATURE</label>
          <button type="button" aria-label={"Remove "+item.title} disabled={busy} onClick={()=>{setQueue(current=>current.filter(q=>q.key!==item.key));if(featuredKey===item.key)setFeaturedKey(null)}}><X size={16}/></button>
        </div>
      </div>)}
    </div>}
    <div className="viral-quick-settings">
      <label>CREATOR / SOURCE <input placeholder="Creator name (optional)" value={artist} maxLength={100} onChange={e=>setArtist(e.target.value)}/></label>
      <label>CATEGORY <select value={category} onChange={e=>setCategory(e.target.value)}>{["Viral","Culture","Interviews","Lifestyle","Sports","Music"].map(value=><option key={value}>{value}</option>)}</select></label>
      <label className="upload-check"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> PUBLISH RIGHT AWAY</label>
    </div>
    <div className="viral-upload-actions">
      <button type="button" className="button button-accent" disabled={!storage?.ready||busy||!waiting.length||waiting.some(x=>x.title.trim().length<3)} onClick={()=>void uploadAll()}>{busy?<Loader2 size={17} className="spin"/>:<CloudUpload size={17}/>} {busy?"UPLOADING...":"UPLOAD & "+(published?"PUBLISH":"SAVE DRAFT")}</button>
      {busy&&<button type="button" className="button button-outline" onClick={stop}><StopCircle size={16}/> STOP UPLOAD</button>}
      <button type="button" className="button button-outline" onClick={openLinks} disabled={busy}>PASTE VIDEO LINK <ArrowUpRight size={15}/></button>
    </div>
    {notice&&<p role="status" className="viral-upload-notice">{hasUploaded&&<CheckCircle2 size={17}/>} {notice}</p>}
    <p className="viral-upload-legal">Upload only footage you own or have permission to publish. If you have a YouTube, Vimeo, or Descript video, publishing its link avoids using storage.</p>
  </section>;
}
