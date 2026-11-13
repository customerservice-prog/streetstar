import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
import { database } from "@/lib/db";
import { slugify } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_POSTER_BYTES = 4 * 1024 * 1024;
const validCategories = new Set(["Music","Culture","Viral","Sports","Interviews","Lifestyle"]);

// This must be a Railway persistent volume, never the app's ephemeral filesystem.
function mediaDir() { return process.env.STREETSTAR_MEDIA_DIR || "/data/viral-media"; }

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error:"Invalid origin." },{status:403});
  if (!(await isAdmin())) return NextResponse.json({error:"Not authorized."},{status:401});
  const length = Number(req.headers.get("content-length") || "0");
  if (length > MAX_VIDEO_BYTES + MAX_POSTER_BYTES + 300000) return NextResponse.json({error:"Video exceeds the 100 MB safe-upload limit."},{status:413});
  const form = await req.formData().catch(()=>null);
  if (!form) return NextResponse.json({error:"Invalid upload body."},{status:400});
  const video = form.get("video");
  const poster = form.get("poster");
  if (!(video instanceof File) || !video.name.toLowerCase().endsWith(".mp4") || video.size < 64 || video.size > MAX_VIDEO_BYTES)
    return NextResponse.json({error:"Select a valid MP4 video under 100 MB."},{status:400});
  if (poster && (!(poster instanceof File) || poster.size > MAX_POSTER_BYTES || poster.type !== "image/jpeg"))
    return NextResponse.json({error:"Poster must be a JPG under 4 MB."},{status:400});
  const title = String(form.get("title") || "").trim().slice(0,170);
  const artist = String(form.get("artist") || "Bajo Mundo TV").trim().slice(0,100);
  const description = String(form.get("description") || "").trim().slice(0,4000);
  const category = String(form.get("category") || "Viral");
  if (title.length < 3 || !validCategories.has(category))
    return NextResponse.json({error:"Invalid title or category."},{status:400});
  const videoData = Buffer.from(await video.arrayBuffer());
  if (videoData.toString("latin1",4,8) !== "ftyp")
    return NextResponse.json({error:"The uploaded file is not an MP4 container."},{status:400});
  const id = randomBytes(16).toString("hex");
  const dirname=mediaDir();
  const videoName=id+".mp4";
  const posterName=id+".jpg";
  const videoPath=path.join(dirname,videoName);
  const posterPath=path.join(dirname,posterName);
  let wroteVideo=false,wrotePoster=false;
  try {
    await mkdir(dirname,{recursive:true});
    await writeFile(videoPath,videoData,{flag:"wx",mode:0o600});
    wroteVideo=true;
    if(poster instanceof File && poster.size>0) {
      const posterData=Buffer.from(await poster.arrayBuffer());
      if(posterData[0]!==0xff || posterData[1]!==0xd8) throw new Error("Invalid JPG.");
      await writeFile(posterPath,posterData,{flag:"wx",mode:0o600});
      wrotePoster=true;
    }
    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/,"") || req.nextUrl.origin;
    const videoUrl=origin+"/media/"+videoName;
    const posterUrl=wrotePoster?origin+"/media/"+posterName:"";
    const slug=slugify(title)+"-"+randomBytes(4).toString("hex");
    const saved=await database().query(
      "INSERT INTO videos (slug,title,artist,description,category,video_url,poster_url,featured,status) VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,'draft') RETURNING id,slug",
      [slug,title,artist,description,category,videoUrl,posterUrl]);
    return NextResponse.json({ok:true,video:saved.rows[0],status:"draft"},{status:201});
  } catch {
    if(wroteVideo) await unlink(videoPath).catch(()=>{});
    if(wrotePoster) await unlink(posterPath).catch(()=>{});
    return NextResponse.json({error:"Upload could not be saved to persistent storage or the database. Check the dedicated StreetStar media volume."},{status:503});
  }
}
