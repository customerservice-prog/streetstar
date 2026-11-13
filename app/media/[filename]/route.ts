import { NextRequest } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { isAdmin } from "@/lib/auth";
import { database } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Props={params:Promise<{filename:string}>};

async function serve(req:NextRequest,props:Props,head=false){
  const {filename}=await props.params;
  if(!/^[a-f0-9]{32}\.(mp4|jpg)$/.test(filename)) return new Response("Not found",{status:404});
  const authorized=await isAdmin();
  if(!authorized){
    try{
      const suffix="%/media/"+filename;
      const check=await database().query("SELECT 1 FROM videos WHERE status='published' AND (video_url LIKE $1 OR poster_url LIKE $1) LIMIT 1",[suffix]);
      if(!check.rowCount) return new Response("Not found",{status:404});
    }catch{return new Response("Media unavailable",{status:503});}
  }
  const filenamePath=path.join(process.env.STREETSTAR_MEDIA_DIR||"/data/viral-media",filename);
  const file=await stat(filenamePath).catch(()=>null);
  if(!file?.isFile())return new Response("Not found",{status:404});
  const isVideo=filename.endsWith(".mp4");
  const headers=new Headers({"Content-Type":isVideo?"video/mp4":"image/jpeg","Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff","Cache-Control":authorized?"private, no-store":"public, max-age=3600"});
  let start=0,end=file.size-1,status=200;
  const range=req.headers.get("range");
  if(range && isVideo){
    const m=/^bytes=(\d*)-(\d*)$/.exec(range);
    if(!m || (!m[1]&&!m[2]))return new Response(null,{status:416,headers:{"Content-Range":`bytes */${file.size}`}});
    if(m[1]){start=Number(m[1]);end=m[2]?Number(m[2]):file.size-1;}
    else{const tail=Number(m[2]);start=Math.max(0,file.size-tail);}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start> end||start>=file.size){
      return new Response(null,{status:416,headers:{"Content-Range":`bytes */${file.size}`});
    }
    end=Math.min(end,file.size-1);status=206;
    headers.set("Content-Range",`bytes ${start}-${end}/${file.size}`);
  }
  headers.set("Content-Length",String(end-start+1));
  if(head)return new Response(null,{status,headers});
  const stream=Readable.toWeb(createReadStream(filenamePath,{start,end}));
  return new Response(stream as ReadableStream,{status,headers});
}
export async function GET(req:NextRequest,props:Props){return serve(req,props);}
export async function HEAD(req:NextRequest,props:Props){return serve(req,props,true);}
