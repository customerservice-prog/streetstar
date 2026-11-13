import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
import { database } from "@/lib/db";
import {
  MAX_VIDEO_BYTES, MIN_FREE_BYTES, availableStorage, fileExtension,
  newUploadId, pendingFileName, pendingPosterName, prepareStorage, storageReady, validUploadId
} from "@/lib/media-storage";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const schema=z.object({
  filename:z.string().min(1).max(220),
  type:z.string().max(100).default(""),
  size:z.number().int().min(12).max(MAX_VIDEO_BYTES)
});

export async function GET(){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  const mounted=await storageReady();
  if(!mounted)return NextResponse.json({
    ready:false,reason:"Persistent Viral media storage is not activated.",
    maxFileBytes:MAX_VIDEO_BYTES
  },{headers:{"Cache-Control":"no-store"}});
  try{
    const free=await availableStorage();
    return NextResponse.json({ready:true,freeBytes:free,maxFileBytes:MAX_VIDEO_BYTES},{
      headers:{"Cache-Control":"no-store"}
    });
  }catch{
    return NextResponse.json({ready:false,reason:"Media storage is temporarily unavailable.",maxFileBytes:MAX_VIDEO_BYTES});
  }
}

export async function POST(req:NextRequest){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Choose an MP4 or WebM video smaller than 500 MiB."},{status:400});
  const {filename,type,size}=parsed.data;
  const ext=fileExtension(filename,type);
  if(!ext)return NextResponse.json({error:"Only MP4 or WebM files are supported."},{status:415});
  let destination="";
  try{
    const free=await availableStorage();
    // Expired incomplete transfers are never allowed to fill the volume.
    const expired=await database().query<{id:string;extension:string}>(
      "DELETE FROM viral_media_uploads WHERE id IN (SELECT id FROM viral_media_uploads WHERE created_at < NOW() - INTERVAL '24 hours' LIMIT 30) RETURNING id,extension"
    ).catch(()=>null);
    for(const old of expired?.rows||[]){
      if(validUploadId(old.id)&&(old.extension==="mp4"||old.extension==="webm"))
        await Promise.allSettled([fs.unlink(pendingFileName(old.id,old.extension)),fs.unlink(pendingPosterName(old.id))]);
    }
    const active=await database().query<{reserved:string}>(
      "SELECT COALESCE(SUM(size_bytes-received_bytes),0)::text AS reserved FROM viral_media_uploads WHERE created_at > NOW()-INTERVAL '24 hours'"
    );
    if(free-Number(active.rows[0]?.reserved||0)<size+MIN_FREE_BYTES)
      return NextResponse.json({error:"Not enough persistent storage. Archive old videos or use a video link."},{status:507});
    const id=newUploadId();
    destination=pendingFileName(id,ext);
    const file=await fs.open(destination,"wx",0o640);
    await file.close();
    await database().query(
      "INSERT INTO viral_media_uploads(id,filename,extension,size_bytes) VALUES($1,$2,$3,$4)",
      [id,filename,ext,size]
    );
    return NextResponse.json({ok:true,id,chunkBytes:4*1024*1024},{status:201});
  }catch(error){
    if(destination)await fs.unlink(destination).catch(()=>{});
    const message=error instanceof Error?error.message:"Upload unavailable";
    return NextResponse.json({error:message.includes("mounted")?"Persistent storage is not activated.":"Could not start the upload."},{status:503});
  }
}
