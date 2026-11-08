import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { database,getStory } from "@/lib/db";
import { guestCookieName,guestIdentity,jsonError,sameOrigin } from "@/lib/community";

export const runtime="nodejs";
const form=z.object({
  slug:z.string().regex(/^[a-z0-9-]{1,100}$/),
  seconds:z.number().int().min(1).max(20),
  position:z.number().int().min(0).max(21600),
  duration:z.number().int().min(0).max(21600),
  ended:z.boolean().default(false)
});
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  if(Number(req.headers.get("content-length")||0)>2048)return jsonError("Payload too large.",413);
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return jsonError("Invalid watch-progress report.",400);
  const d=parsed.data;
  const cookie=req.cookies.get(guestCookieName)?.value;
  if(!cookie||!/^[a-f0-9]{48}$/.test(cookie))return jsonError("Start the video first.",409);
  try{
    const story=await getStory(d.slug);
    if(!story)return jsonError("Video not found.",404);
    if(story.isDemo)return NextResponse.json({ok:true,ignored:true});
    if(!/^https?:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?$/i.test(story.videoUrl))
      return jsonError("Only directly hosted videos support measured watch-time.",400);
    const hash=guestIdentity(req).hash;
    const db=database();
    const started=await db.query(
      "SELECT 1 FROM video_play_events WHERE video_slug=$1 AND visitor_hash=$2 AND viewed_on=(NOW() AT TIME ZONE 'UTC')::date",
      [d.slug,hash]
    );
    if(!started.rows.length)return jsonError("Play the video before reporting watch-time.",409);
    const complete=d.ended && d.duration>0 && d.position>=d.duration-5;
    const sql=[
      "INSERT INTO video_watch_progress(video_slug,visitor_hash,watched_seconds,max_position_seconds,completed,last_reported_at)",
      "VALUES($1,$2,$3,$4,$5,NOW())",
      "ON CONFLICT(video_slug,visitor_hash,viewed_on)",
      "DO UPDATE SET watched_seconds=LEAST(21600,video_watch_progress.watched_seconds+EXCLUDED.watched_seconds),",
      "max_position_seconds=GREATEST(video_watch_progress.max_position_seconds,EXCLUDED.max_position_seconds),",
      "completed=video_watch_progress.completed OR EXCLUDED.completed,last_reported_at=NOW()",
      "WHERE video_watch_progress.last_reported_at<=NOW()-INTERVAL '4 seconds'",
      "RETURNING watched_seconds,completed"
    ].join(" ");
    const result=await db.query(sql,[d.slug,hash,d.seconds,d.position,complete]);
    return NextResponse.json({ok:true,counted:result.rows.length>0},
      {headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Unable to record watch-time.",503);}
}
