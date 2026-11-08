import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { jsonError, sameOrigin } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const moderation = z.discriminatedUnion("type", [
  z.object({type:z.literal("comment"),id:z.string().regex(/^\d+$/),status:z.enum(["pending","approved","hidden"])}),
  z.object({type:z.literal("report"),id:z.string().regex(/^\d+$/),status:z.enum(["open","reviewed","resolved"])})
]);

export async function GET() {
  if (!(await isAdmin())) return jsonError("Unauthorized.",401);
  try {
    const [comments,reports] = await Promise.all([
      database().query(
        "SELECT id::text AS id, video_slug AS slug, parent_id::text AS \"parentId\", author_name AS name, body, status, created_at AS \"createdAt\" FROM video_comments ORDER BY CASE WHEN status='pending' THEN 0 ELSE 1 END, created_at DESC LIMIT 250"
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
    const { type,id,status } = parsed.data;
    const sql = type==="comment"
      ? "UPDATE video_comments SET status=$1,reviewed_at=NOW() WHERE id=$2"
      : "UPDATE comment_reports SET status=$1 WHERE id=$2";
    const result = await database().query(sql,[status,id]);
    if (!result.rowCount) return jsonError("Item no longer exists.",404);
    return NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
  } catch { return jsonError("Moderation update failed.",503); }
}
