import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database, getStory } from "@/lib/db";
import { getMemberFromRequest } from "@/lib/member-auth";
import { guestIdentity,jsonError,sameOrigin,withGuestCookie } from "@/lib/community";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const form=z.object({slug:z.string().regex(/^[a-z0-9-]{1,100}$/)});
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return jsonError("Invalid video.",400);
  try{
    const story=await getStory(parsed.data.slug);
    if(!story)return jsonError("Video not found.",404);
    const member=await getMemberFromRequest(req);
    const guest=guestIdentity(req);
    const db=database();
    // Demo content is never used to fabricate trending or view metrics.
    let counted=false;
    if(!story.isDemo){
      const result=await db.query(
        "INSERT INTO video_play_events(video_slug,visitor_hash) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING video_slug",
        [story.slug,guest.hash]
      );
      counted=result.rows.length>0;
    }
    if(member){
      await db.query(
        "INSERT INTO member_watch_history(member_id,video_slug) VALUES($1,$2) ON CONFLICT (member_id,video_slug) DO UPDATE SET last_watched=NOW(),view_count=member_watch_history.view_count+1 WHERE member_watch_history.last_watched<NOW()-INTERVAL '1 minute'",
        [member.id,story.slug]
      );
    }
    return withGuestCookie(
      NextResponse.json({ok:true,counted,demo:!!story.isDemo},{headers:{"Cache-Control":"no-store"}}),guest.token,guest.fresh
    );
  }catch{return jsonError("Play could not be recorded.",503);}
}
