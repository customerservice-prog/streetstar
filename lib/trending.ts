import { database } from "@/lib/db";
export type TrendingRow={slug:string;plays:number;comments:number;reactions:number;score:number};
export async function getTrending():Promise<TrendingRow[]>{
  try{
    const r=await database().query<TrendingRow>([
      "SELECT v.slug,COALESCE(p.plays,0)::integer AS plays,COALESCE(c.comments,0)::integer AS comments,",
      "COALESCE(r.reactions,0)::integer AS reactions,",
      "(COALESCE(p.plays,0)+COALESCE(c.comments,0)*2+COALESCE(r.reactions,0))::integer AS score",
      "FROM videos v",
      "LEFT JOIN (SELECT video_slug,COUNT(*) plays FROM video_play_events",
      "WHERE viewed_on>=(NOW() AT TIME ZONE 'UTC')::date-6 GROUP BY video_slug) p ON p.video_slug=v.slug",
      "LEFT JOIN (SELECT video_slug,COUNT(*) comments FROM video_comments",
      "WHERE status='approved' AND created_at>=NOW()-INTERVAL '7 days' GROUP BY video_slug) c ON c.video_slug=v.slug",
      "LEFT JOIN (SELECT video_slug,COUNT(*) reactions FROM video_reactions",
      "WHERE created_at>=NOW()-INTERVAL '7 days' GROUP BY video_slug) r ON r.video_slug=v.slug",
      "WHERE v.status='published' AND COALESCE(p.plays,0)+COALESCE(c.comments,0)+COALESCE(r.reactions,0)>0",
      "ORDER BY score DESC,plays DESC,v.created_at DESC LIMIT 20"
    ].join(" "));
    return r.rows;
  }catch{return [];}
}
