"use client";
import { useState } from "react";
import { Clapperboard, UploadCloud } from "lucide-react";
const presets=[
 ["ARCANGEL","Arcángel habla sobre los mexicanos","Culture"],
 ["EL_ALFA","El Alfa habla sobre lo ocurrido en Miami","Culture"],
 ["GUADESPALDA","Conversación sobre Anuel AA y El Peje 24","Viral"],
 ["La_Mami_Jordan_Responde","La Mami Jordan responde a Nfasis","Viral"],
 ["Mami_Jordan_ahora","La Mami Jordan vende sancocho","Viral"],
 ["Mami_kim","Mami Kim envía un mensaje entre lágrimas","Interviews"],
 ["NFASIS_LE_RESPONDE","Nfasis responde a Químico Ultramega","Viral"],
 ["Youngchimi","Youngchimi habla en un vivo con El Rey de la City","Interviews"],
] as const;
const cleanName=(name:string)=>name.replace(/\.mp4$/i,"").replace(/_Bajo_Mundo_TV_Original_logo/i,"").replaceAll("_"," ").replace(/\s+/g," ").trim();
function metadata(name:string){
 const match=presets.find(([match])=>name.toLowerCase().includes(match.toLowerCase()));
 return match?{title:match[1],category:match[2]}:{title:cleanName(name).slice(0,170),category:"Viral"};
}
async function thumbnail(file:File):Promise<Blob|null>{
 const url=URL.createObjectURL(file),v=document.createElement("video");
 v.preload="auto";v.muted=true;v.playsInline=true;v.src=url;
 try {
   await new Promise<void>((resolve,reject)=>{v.onloadedmetadata=()=>resolve();v.onerror=()=>reject(new Error("No preview"));});
   v.currentTime=Math.min(3,Math.max(.2,v.duration/4));
   await new Promise<void>((resolve,reject)=>{v.onseeked=()=>resolve();v.onerror=()=>reject(new Error("Seek failed"));});
   const canvas=document.createElement("canvas");canvas.width=960;canvas.height=540;
   const ctx=canvas.getContext("2d");if(!ctx)return null;
   ctx.fillStyle="#0c0c10";ctx.fillRect(0,0,960,540);
   const bgScale=Math.max(960/v.videoWidth,540/v.videoHeight);
   ctx.filter="blur(18px) brightness(.55)";
   ctx.drawImage(v,(960-v.videoWidth*bgScale)/2,(540-v.videoHeight*bgScale)/2,v.videoWidth*bgScale,v.videoHeight*bgScale);
   ctx.filter="none";const fgScale=Math.min(960/v.videoWidth,540/v.videoHeight);
   ctx.drawImage(v,(960-v.videoWidth*fgScale)/2,(540-v.videoHeight*fgScale)/2,v.videoWidth*fgScale,v.videoHeight*fgScale);
   return await new Promise(resolve=>canvas.toBlob(blob=>resolve(blob),"image/jpeg",.84));
 }catch{return null;}finally{v.removeAttribute("src");v.load();URL.revokeObjectURL(url);}
}
export function AdminBulkUpload({onComplete}:{onComplete:()=>Promise<void>}){
 const [files,setFiles]=useState<File[]>([]);
 const [busy,setBusy]=useState(false);
 const [statuses,setStatuses]=useState<string[]>([]);
 const [confirmed,setConfirmed]=useState(false);
 async function uploadAll(){
   if(!files.length||!confirmed||busy)return;
   setBusy(true);const status=Array(files.length).fill("Esperando");setStatuses([...status]);
   for(let i=0;i<files.length;i++){
     const file=files[i],info=metadata(file.name);
     status[i]="Subiendo...";setStatuses([...status]);
     try{
       const form=new FormData();form.set("video",file);form.set("title",info.title);form.set("artist","Bajo Mundo TV");form.set("category",info.category);
       form.set("description","Clip editorial recibido para revisión de publicación y derechos.");
       const poster=await thumbnail(file);if(poster)form.set("poster",poster,"poster.jpg");
       const res=await fetch("/api/admin/upload",{method:"POST",body:form,credentials:"same-origin"});
       const data=await res.json();if(!res.ok)throw new Error(data.error||"Upload failed");
       status[i]="Guardado como BORRADOR";setStatuses([...status]);
     }catch(error){status[i]="ERROR: "+(error instanceof Error?error.message:"Error");setStatuses([...status]);break;}
   }
   setBusy(false);await onComplete();
 }
 return <section className="admin-publish creator-form bajo-upload">
  <div className="bajo-upload-head"><UploadCloud size={35}/><div><h2>SUBIR VIDEOS MP4</h2><p>Selecciona varios videos y se guardarán como borradores. Puedes publicarlos desde Video Library después de revisar permisos y contenido.</p></div></div>
  <label>SELECCIONAR VIDEOS<input type="file" accept="video/mp4,.mp4" multiple disabled={busy} onChange={e=>{setFiles(Array.from(e.currentTarget.files||[]));setStatuses([]);}} /></label>
  <p>Se admiten archivos MP4 de hasta 100 MB cada uno. El sistema prepara automáticamente una miniatura cuando el navegador lo permite. Se suben de uno en uno.</p>
  <label className="bajo-rights"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/> Entiendo que los videos quedan como borradores y debo verificar mis derechos de publicación antes de hacerlos públicos.</label>
  {files.length>0&&<div className="bajo-upload-list">{files.map((file,i)=><div key={i}><Clapperboard size={15}/><span><strong>{metadata(file.name).title}</strong><small>{(file.size/1048576).toFixed(1)} MB · {metadata(file.name).category}</small></span><em>{statuses[i]||"Preparado"}</em></div>)}</div>}
  <button className="button button-accent" disabled={busy||!files.length||!confirmed} onClick={()=>void uploadAll()} type="button">{busy?"SUBIENDO...":"SUBIR "+files.length+" VIDEOS COMO BORRADOR"}</button>
 </section>
}
