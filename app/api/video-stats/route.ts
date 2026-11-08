import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database,getStory } from "@/lib/db";
import { jsonError } from "@/lib/community";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
  const slug=z.string().regex(/^[a-z0-9-]{1,100}$/).safeParse(req.nextUrl.searchParams.get("slug"));
  if(!slug.success)return jsonError("Invalid video.",400);
  try{
    const story=await getStory(slug.data);
    if(!story)return jsonError("Video not found.",404);
    if(story.isDemo)return NextResponse.json({plays:0,last7Days:0,demo:true});
    const r=await database().query<{plays:string;recent:string}>(
      "SELECT COUNT(*)::text AS plays,COUNT(*) FILTER (WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6)::text AS recent FROM video_play_events WHERE video_slug=$1",
      [slug.data]
    );
    return NextResponse.json({plays:Number(r.rows[0]?.plays||0),last7Days:Number(r.rows[0]?.recent||0)},{headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Statistics unavailable.",503);}
}
