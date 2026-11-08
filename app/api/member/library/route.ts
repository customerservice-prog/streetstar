import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database, getStories } from "@/lib/db";
import { getMemberFromRequest } from "@/lib/member-auth";
import { jsonError, publishedVideo, sameOrigin } from "@/lib/community";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const form=z.object({slug:z.string().regex(/^[a-z0-9-]{1,100}$/),saved:z.boolean()});
export async function GET(req:NextRequest){
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in to view your library.",401);
  try{
    const db=database();
    const [saved,history,submissions,stories]=await Promise.all([
      db.query<{slug:string;createdAt:Date}>('SELECT video_slug AS slug,created_at AS "createdAt" FROM member_saves WHERE member_id=$1 ORDER BY created_at DESC LIMIT 100',[member.id]),
      db.query<{slug:string;lastWatched:Date;viewCount:number}>('SELECT video_slug AS slug,last_watched AS "lastWatched",view_count AS "viewCount" FROM member_watch_history WHERE member_id=$1 ORDER BY last_watched DESC LIMIT 100',[member.id]),
      db.query('SELECT id::text AS id,title,category,status,created_at AS "createdAt" FROM submissions WHERE member_id=$1 ORDER BY created_at DESC LIMIT 100',[member.id]),
      getStories()
    ]);
    const catalog=new Map(stories.map(s=>[s.slug,s]));
    return NextResponse.json({
      saved:saved.rows.map(x=>({...x,story:catalog.get(x.slug)||null})).filter(x=>x.story),
      history:history.rows.map(x=>({...x,story:catalog.get(x.slug)||null})).filter(x=>x.story),
      submissions:submissions.rows
    },{headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Library unavailable.",503);}
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in to save videos.",401);
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return jsonError("Invalid video.",400);
  try{
    if(!(await publishedVideo(parsed.data.slug)))return jsonError("Video not available.",404);
    if(parsed.data.saved)await database().query(
      "INSERT INTO member_saves(member_id,video_slug) VALUES($1,$2) ON CONFLICT DO NOTHING",[member.id,parsed.data.slug]);
    else await database().query(
      "DELETE FROM member_saves WHERE member_id=$1 AND video_slug=$2",[member.id,parsed.data.slug]);
    return NextResponse.json({ok:true,saved:parsed.data.saved});
  }catch{return jsonError("Could not update saved videos.",503);}
}
