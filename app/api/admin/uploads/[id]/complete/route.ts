import { randomBytes } from "node:crypto";
import fs from "node:fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
import { slugify } from "@/lib/content";
import { database } from "@/lib/db";
import {
  validUploadId,pendingFileName,pendingPosterName,mediaFileName,posterFileName,
  prepareStorage,type VideoExtension
} from "@/lib/media-storage";

export const runtime="nodejs";
type Params={params:Promise<{id:string}>};
type Session={filename:string; extension:VideoExtension;size_bytes:string;received_bytes:string;created_at:Date};
const schema=z.object({
  title:z.string().trim().min(3).max(170),
  artist:z.string().trim().max(100).default(""),
  category:z.enum(["Music","Culture","Viral","Sports","Interviews","Lifestyle"]),
  description:z.string().trim().max(4000).default(""),
  status:z.enum(["published","draft"]).default("published"),
  featured:z.boolean().default(false)
});

export async function POST(req:NextRequest,{params}:Params){
  if(!await isAdmin())return NextResponse.json({error:"Unauthorized"},{status:401});
  if(!sameOrigin(req))return NextResponse.json({error:"Invalid request origin."},{status:403});
  const {id}=await params;
  if(!validUploadId(id))return NextResponse.json({error:"Invalid upload."},{status:400});
  const parsed=schema.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Enter a title and valid category."},{status:400});
  const client=await database().connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Database unavailable."},{status:503});
  const v=parsed.data;
  let fromVideo="",toVideo="",fromPoster="",toPoster="";
  let videoMoved=false,posterMoved=false,committed=false;
  try{
    await prepareStorage();
    await client.query("BEGIN");
    const result=await client.query<Session>(
      "SELECT filename,extension,size_bytes,received_bytes,created_at FROM viral_media_uploads WHERE id=$1 FOR UPDATE",[id]
    );
    const s=result.rows[0];
    if(!s || Date.now()-new Date(s.created_at).getTime()>24*3600*1000)
      throw new Error("Upload expired or missing.");
    if(Number(s.received_bytes)!==Number(s.size_bytes))
      throw new Error("Video upload is not complete.");
    const slug=slugify(v.title)+"-"+randomBytes(4).toString("hex");
    fromVideo=pendingFileName(id,s.extension);
    toVideo=mediaFileName(slug,s.extension);
    fromPoster=pendingPosterName(id);
    toPoster=posterFileName(slug);
    const file=await fs.stat(fromVideo);
    if(!file.isFile()||file.size!==Number(s.size_bytes))throw new Error("Uploaded file size does not match.");
    let hasPoster=false;
    try{
      const info=await fs.stat(fromPoster);
      hasPoster=info.isFile()&&info.size>100&&info.size<=2*1024*1024;
    }catch{}
    await fs.rename(fromVideo,toVideo);videoMoved=true;
    if(hasPoster){await fs.rename(fromPoster,toPoster);posterMoved=true;}
    const videoUrl="/api/media/"+slug+"."+s.extension;
    const posterUrl=hasPoster?"/api/media/"+slug+".jpg":"/api/auto-poster/"+slug;
    if(v.featured&&v.status==="published")
      await client.query("UPDATE videos SET featured=FALSE WHERE featured=TRUE");
    const created=await client.query<{id:string;slug:string}>(
      "INSERT INTO videos(slug,title,artist,description,category,video_url,poster_url,featured,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,slug",
      [slug,v.title,v.artist,v.description,v.category,videoUrl,posterUrl,v.featured&&v.status==="published",v.status]
    );
    await client.query("DELETE FROM viral_media_uploads WHERE id=$1",[id]);
    await client.query("COMMIT");committed=true;
    return NextResponse.json({ok:true,video:{...created.rows[0],slug,status:v.status,featured:v.featured&&v.status==="published",posterUrl,videoUrl}},{status:201});
  }catch(error){
    if(!committed){
      await client.query("ROLLBACK").catch(()=>{});
      // If publication failed, restore the uploaded files for a safe retry.
      if(videoMoved)await fs.rename(toVideo,fromVideo).catch(()=>{});
      if(posterMoved)await fs.rename(toPoster,fromPoster).catch(()=>{});
    }
    const message=error instanceof Error?error.message:"Could not publish video.";
    return NextResponse.json({error:/Upload|file size/.test(message)?message:"Could not publish video; your upload remains available to retry."},{status:503});
  }finally{client.release();}
}
