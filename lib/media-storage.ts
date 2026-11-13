import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const MEDIA_ROOT="/data/viral-media";
export const MAX_VIDEO_BYTES=500*1024*1024;
export const UPLOAD_CHUNK_BYTES=4*1024*1024;
export const MAX_POSTER_BYTES=2*1024*1024;
export const UPLOAD_EXPIRY_HOURS=24;
export const MIN_FREE_BYTES=96*1024*1024;
export type VideoExtension="mp4"|"webm";
export const mediaDirs={
  tmp:path.join(MEDIA_ROOT,"incoming"),
  files:path.join(MEDIA_ROOT,"files"),
};
export function validUploadId(id:string){return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)}
export function mediaFileName(slug:string,ext:VideoExtension){return path.join(mediaDirs.files,slug+"."+ext)}
export function posterFileName(slug:string){return path.join(mediaDirs.files,slug+".jpg")}
export function pendingFileName(id:string,ext:VideoExtension){return path.join(mediaDirs.tmp,id+"."+ext+".part")}
export function pendingPosterName(id:string){return path.join(mediaDirs.tmp,id+".jpg")}
export function fileExtension(filename:string,type:string):VideoExtension|null{
  const suffix=filename.toLowerCase().split(".").pop();
  if(suffix==="mp4" && (type==="video/mp4"||type==="application/octet-stream"||!type))return "mp4";
  if(suffix==="webm" && (type==="video/webm"||type==="application/octet-stream"||!type))return "webm";
  return null;
}
export function validVideoHeader(data:Uint8Array,ext:VideoExtension):boolean{
  if(ext==="mp4")return data.length>=12 && Buffer.from(data.subarray(4,8)).toString("ascii")==="ftyp";
  return data.length>=4 && data[0]===0x1a && data[1]===0x45 && data[2]===0xdf && data[3]===0xa3;
}
export async function storageReady():Promise<boolean>{
  try{
    const stat=await fs.stat(MEDIA_ROOT);
    if(!stat.isDirectory())return false;
    // A staged Railway volume must never be confused with writable ephemeral storage.
    // Railway mounts this directory once the volume patch is accepted.
    const mountinfo=await fs.readFile("/proc/self/mountinfo","utf8");
    const target=" "+MEDIA_ROOT+" ";
    return mountinfo.split("\n").some(line=>line.includes(target));
  }catch{return false;}
}
export async function prepareStorage():Promise<void>{
  if(!await storageReady())throw new Error("Persistent media storage is not mounted.");
  await fs.mkdir(mediaDirs.tmp,{recursive:true,mode:0o750});
  await fs.mkdir(mediaDirs.files,{recursive:true,mode:0o750});
}
export async function availableStorage():Promise<number>{
  await prepareStorage();
  const stats=await fs.statfs(MEDIA_ROOT);
  return Math.max(0,stats.bavail*stats.bsize);
}
export function newUploadId(){return randomUUID()}
export async function readBoundedBody(body:ReadableStream<Uint8Array>|null,limit:number):Promise<Buffer>{
  if(!body)throw new Error("Missing upload body");
  const reader=body.getReader();
  let length=0;const chunks:Buffer[]=[];
  try{
    for(;;){
      const {value,done}=await reader.read();
      if(done)break;
      length+=value.byteLength;
      if(length>limit)throw new Error("Upload chunk exceeds limit.");
      chunks.push(Buffer.from(value));
    }
  }catch(error){await reader.cancel().catch(()=>{});throw error}
  return Buffer.concat(chunks,length);
}
