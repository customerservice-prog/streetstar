import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { jsonError, sameOrigin, actorHashIsUnknown } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const moderation = z.discriminatedUnion("type", [
  z.object({type:z.literal("comment"),id:z.string().regex(/^\d+$/),status:z.enum(["pending","approved","hidden"])}),
  z.object({type:z.literal("report"),id:z.string().regex(/^\d+$/),status:z.enum(["open","reviewed","resolved"])}),
  z.object({type:z.literal("block"),id:z.string().regex(/^\d+$/),status:z.enum(["blocked","unblocked"])})
]);

export async function GET() {
  if (!(await isAdmin())) return jsonError("Unauthorized.",401);
  try {
    const [comments,reports] = await Promise.all([
      database().query(
        "SELECT c.id::text AS id, c.video_slug AS slug, c.parent_id::text AS \"parentId\", c.author_name AS name, c.body, c.status, c.created_at AS \"createdAt\", (c.member_id IS NOT NULL) AS \"isMember\", (b.blocked_until>NOW() OR m.suspended_until>NOW()) AS blocked, (c.body ~* '(https?://|www\\.)') AS suspicious FROM video_comments c LEFT JOIN moderation_blocks b ON b.actor_hash=c.actor_hash LEFT JOIN members m ON m.id=c.member_id ORDER BY CASE WHEN c.status='pending' THEN 0 ELSE 1 END,c.created_at DESC LIMIT 250"
      ),
      database().query(
        "SELECT r.id::text AS id, r.comment_id::text AS \"commentId\", r.reason, r.details, r.status, r.created_at AS \"createdAt\", c.body, c.author_name AS name, c.video_slug AS slug FROM comment_reports r JOIN video_comments c ON c.id=r.comment_id ORDER BY CASE WHEN r.status='open' THEN 0 ELSE 1 END,r.created_at DESC LIMIT 150"
      )
    ]);
    return NextResponse.json({comments:comments.rows,reports:reports.rows},{headers:{"Cache-Control":"no-store"}});
  } catch { return jsonError("Moderation data unavailable.",503); }
}

export async function PATCH(req:NextRequest) {
  if (!(await isAdmin())) return jsonError("Unauthorized.",401);
  if (!sameOrigin(req)) return jsonError("Invalid request origin.",403);
  const parsed = moderation.safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return jsonError("Invalid moderation action.",400);
  try {
    const {type,id,status}=parsed.data;
    if(type==="report"){
      const result=await database().query("UPDATE comment_reports SET status=$1 WHERE id=$2",[status,id]);
      if(!result.rowCount)return jsonError("Report not found.",404);
      return NextResponse.json({ok:true});
    }
    if(type==="block"){
      const db=database();
      const comment=await db.query<{actor_hash:string;member_id:string|null}>(
        "SELECT actor_hash,member_id::text AS member_id FROM video_comments WHERE id=$1",[id]);
      const target=comment.rows[0];
      if(!target)return jsonError("Comment not found.",404);
      if(status==="blocked"){
        if(actorHashIsUnknown(target.actor_hash) && !target.member_id)
          return jsonError("Could not identify a network or member account to restrict. Hide this guest comment instead.",409);
        if(!actorHashIsUnknown(target.actor_hash))
          await db.query(
            "INSERT INTO moderation_blocks(actor_hash,blocked_until) VALUES($1,NOW()+INTERVAL '24 hours') ON CONFLICT(actor_hash) DO UPDATE SET blocked_until=EXCLUDED.blocked_until",
            [target.actor_hash]);
        if(target.member_id)await db.query(
          "UPDATE members SET suspended_until=NOW()+INTERVAL '24 hours' WHERE id=$1",[target.member_id]);
      }else{
        if(!actorHashIsUnknown(target.actor_hash))
          await db.query("DELETE FROM moderation_blocks WHERE actor_hash=$1",[target.actor_hash]);
        if(target.member_id)await db.query("UPDATE members SET suspended_until=NULL WHERE id=$1",[target.member_id]);
      }
      return NextResponse.json({ok:true});
    }
    const client=await database().connect();
    try{
      await client.query("BEGIN");
      const previous=await client.query<{
        status:string;member_id:string|null;parent_id:string|null;
        author_name:string;video_slug:string
      }>("SELECT status,member_id::text AS member_id,parent_id::text AS parent_id,author_name,video_slug FROM video_comments WHERE id=$1 FOR UPDATE",[id]);
      const comment=previous.rows[0];
      if(!comment){
        await client.query("ROLLBACK");
        return jsonError("Comment not found.",404);
      }
      await client.query("UPDATE video_comments SET status=$1,reviewed_at=NOW() WHERE id=$2",[status,id]);
      // Fire exactly once when a pending/hidden comment is approved, not on repeated clicks.
      if(status==="approved"&&comment.status!=="approved"){
        if(comment.member_id){
          await client.query(
            "INSERT INTO member_notifications(member_id,kind,actor_name,video_slug,comment_id) SELECT id,'approved','StreetStar',$2,$3 FROM members WHERE id=$1 AND notifications_enabled=TRUE",
            [comment.member_id,comment.video_slug,id]
          );
        }
        if(comment.parent_id){
          await client.query(
            "INSERT INTO member_notifications(member_id,kind,actor_name,video_slug,comment_id) SELECT m.id,'reply',$1,$2,$3 FROM video_comments p JOIN members m ON m.id=p.member_id WHERE p.id=$4 AND p.status='approved' AND m.notifications_enabled=TRUE AND ($5::bigint IS NULL OR m.id<>$5::bigint)",
            [comment.author_name,comment.video_slug,id,comment.parent_id,comment.member_id]
          );
        }
      }
      await client.query("COMMIT");
      return NextResponse.json({ok:true});
    }catch{
      await client.query("ROLLBACK");
      return jsonError("Moderation update failed.",503);
    }finally{client.release();}
  } catch {return jsonError("Moderation update failed.",503);}
}
