import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { mediaFileName, posterFileName, prepareStorage, type VideoExtension } from "@/lib/media-storage";

export const runtime="nodejs";
export const dynamic="force-dynamic";
type Params={params:Promise<{file:string}>};
const MAX_RANGE=8*1024*1024;

async function serve(req:NextRequest,{params}:Params,head=false):Promise<NextResponse>{
  const {file}=await params;
  const match=/^([a-z0-9-]{1,100})\.(mp4|webm|jpg)$/.exec(file);
  if(!match)return new NextResponse("Not found",{status:404});
  const [,slug,ext]=match;
  try{
    const result=await database().query<{video_url:string;poster_url:string}>(
      "SELECT video_url,poster_url FROM videos WHERE slug=$1 AND status='published' LIMIT 1",[slug]
    );
    const video=result.rows[0];
    if(!video)return new NextResponse("Not found",{status:404});
    const publicUrl="/api/media/"+file;
    if(ext==="jpg"&&video.poster_url!==publicUrl)return new NextResponse("Not found",{status:404});
    if(ext!=="jpg"&&video.video_url!==publicUrl)return new NextResponse("Not found",{status:404});
    await prepareStorage();
    const filename=ext==="jpg"?posterFileName(slug):mediaFileName(slug,ext as VideoExtension);
    const stat=await fs.stat(filename);
    if(!stat.isFile()||!stat.size)return new NextResponse("Not found",{status:404});
    const type=ext==="jpg"?"image/jpeg":ext==="mp4"?"video/mp4":"video/webm";
    let start=0,end=stat.size-1,partial=false;
    if(ext!=="jpg"&&req.headers.has("range")){
      const raw=req.headers.get("range")||"";
      const range=/^bytes=(\d*)-(\d*)$/.exec(raw);
      if(!range || (!range[1]&&!range[2]))return new NextResponse(null,{status:416,headers:{"Content-Range":"bytes */"+stat.size}});
      if(!range[1]){
        const suffix=Number(range[2]);
        if(!Number.isSafeInteger(suffix)||suffix<=0)return new NextResponse(null,{status:416,headers:{"Content-Range":"bytes */"+stat.size}});
        start=Math.max(0,stat.size-suffix);
      }else start=Number(range[1]);
      end=range[2]?Number(range[2]):Math.min(stat.size-1,start+MAX_RANGE-1);
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=stat.size||end<start)
        return new NextResponse(null,{status:416,headers:{"Content-Range":"bytes */"+stat.size}});
      end=Math.min(end,stat.size-1,start+MAX_RANGE-1);
      partial=true;
    }
    const headers:Record<string,string>={
      "Content-Type":type,
      "Content-Length":String(end-start+1),
      "Accept-Ranges":"bytes",
      "Cache-Control":"public, max-age=600",
      "X-Content-Type-Options":"nosniff",
      "Content-Disposition":"inline",
    };
    if(partial)headers["Content-Range"]=`bytes ${start}-${end}/${stat.size}`;
    if(head)return new NextResponse(null,{status:partial?206:200,headers});
    const stream=createReadStream(filename,{start,end});
    const body=Readable.toWeb(stream) as unknown as ReadableStream<Uint8Array>;
    return new NextResponse(body,{status:partial?206:200,headers});
  }catch{
    return new NextResponse("Media unavailable",{status:503,headers:{"Cache-Control":"no-store"}});
  }
}
export async function GET(req:NextRequest,params:Params){return serve(req,params)}
export async function HEAD(req:NextRequest,params:Params){return serve(req,params,true)}
