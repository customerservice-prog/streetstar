import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { jsonError } from "@/lib/community";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  if(!(await isAdmin()))return jsonError("Unauthorized.",401);
  try{
    const db=database();
    const summarySql=[
      "SELECT (SELECT COUNT(*)::text FROM video_play_events) AS plays,",
      "(SELECT COUNT(*)::text FROM video_play_events WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6) AS recent,",
      "(SELECT COUNT(DISTINCT visitor_hash)::text FROM video_play_events WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6) AS browsers,",
      "(SELECT COALESCE(SUM(watched_seconds),0)::text FROM video_watch_progress) AS \"nativeSeconds\",",
      "(SELECT COUNT(*)::text FROM video_watch_progress WHERE completed=TRUE) AS completions,",
      "(SELECT COUNT(*)::text FROM video_comments WHERE status='approved') AS comments"
    ].join(" ");
    const daysSql=[
      "SELECT to_char(g.day,'YYYY-MM-DD') AS date,COALESCE(p.plays,0)::integer AS plays,",
      "COALESCE(w.seconds,0)::integer AS \"watchSeconds\"",
      "FROM generate_series((NOW() AT TIME ZONE 'UTC')::date-6,",
      "(NOW() AT TIME ZONE 'UTC')::date,'1 day') g(day)",
      "LEFT JOIN (SELECT viewed_on,COUNT(*) AS plays FROM video_play_events",
      "WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6 GROUP BY viewed_on) p ON p.viewed_on=g.day",
      "LEFT JOIN (SELECT viewed_on,SUM(watched_seconds) AS seconds FROM video_watch_progress",
      "WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6 GROUP BY viewed_on) w ON w.viewed_on=g.day",
      "ORDER BY g.day"
    ].join(" ");
    const videosSql=[
      "SELECT v.slug,v.title,COALESCE(p.plays,0)::integer AS plays,",
      "COALESCE(w.seconds,0)::integer AS \"watchSeconds\",COALESCE(w.completions,0)::integer AS completions",
      "FROM videos v",
      "LEFT JOIN (SELECT video_slug,COUNT(*) AS plays FROM video_play_events GROUP BY video_slug) p ON p.video_slug=v.slug",
      "LEFT JOIN (SELECT video_slug,SUM(watched_seconds) AS seconds,",
      "COUNT(*) FILTER(WHERE completed) AS completions",
      "FROM video_watch_progress GROUP BY video_slug) w ON w.video_slug=v.slug",
      "WHERE v.status='published' ORDER BY plays DESC,v.created_at DESC LIMIT 50"
    ].join(" ");
    const [summary,days,videos]=await Promise.all([
      db.query(summarySql),db.query(daysSql),db.query(videosSql)
    ]);
    return NextResponse.json({
      metrics:summary.rows[0]||{},days:days.rows,videos:videos.rows,
      definitions:{plays:"One play start per browser, video and UTC day.",
      nativeSeconds:"Measured time reported by directly hosted videos only, not external embeds.",
      completions:"Reported native video completions; not independently audited.",
      browsers:"Pseudonymous browser cookies, not verified distinct people."}
    },{headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Analytics temporarily unavailable.",503);}
}
