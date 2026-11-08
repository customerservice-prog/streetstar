import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { actorHash, jsonError, publishedVideo, sameOrigin, guestIdentity, guestCookieName } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugSchema = z.string().regex(/^[a-z0-9-]{1,100}$/);
const submitSchema = z.object({
  slug: slugSchema,
  parentId: z.union([z.string().regex(/^\d+$/), z.null()]).optional(),
  name: z.string().trim().min(2).max(40).regex(/^[^\r\n<>]+$/),
  body: z.string().trim().min(3).max(1200),
  website: z.string().max(180).default("")
});

export async function GET(req: NextRequest) {
  const parsed = slugSchema.safeParse(req.nextUrl.searchParams.get("slug"));
  if (!parsed.success) return jsonError("Invalid video.", 400);
  try {
    if (!(await publishedVideo(parsed.data))) return jsonError("Video not found.", 404);
    const token = req.cookies.get(guestCookieName)?.value;
    const identity = token && /^[a-f0-9]{48}$/.test(token) ? guestIdentity(req).hash : null;
    const sql = [
      'SELECT c.id::text AS id, c.parent_id::text AS "parentId",',
      'c.author_name AS name, c.body, c.created_at AS "createdAt",',
      '(SELECT COUNT(*)::integer FROM comment_likes l WHERE l.comment_id=c.id) AS likes,',
      'EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id=c.id AND l.guest_hash=$2) AS liked',
      'FROM video_comments c LEFT JOIN video_comments parent ON parent.id=c.parent_id',
      "WHERE c.video_slug=$1 AND c.status='approved'",
      "AND (c.parent_id IS NULL OR parent.status='approved')",
      'ORDER BY c.created_at DESC LIMIT 150'
    ].join(' ');
    const result = await database().query(sql, [parsed.data, identity]);
    const total = await database().query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM video_comments c LEFT JOIN video_comments parent ON parent.id=c.parent_id WHERE c.video_slug=$1 AND c.status='approved' AND (c.parent_id IS NULL OR parent.status='approved')",
      [parsed.data]
    );
    return NextResponse.json(
      { comments: result.rows, total: Number(total.rows[0]?.count || 0) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return jsonError("Comments are temporarily unavailable.", 503);
  }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Invalid request origin.", 403);
  if (Number(req.headers.get("content-length") || 0) > 16000) return jsonError("Comment is too long.", 413);
  const input = submitSchema.safeParse(await req.json().catch(() => null));
  if (!input.success) return jsonError("Enter a display name and comment (3–1200 characters).", 400);
  const { slug, parentId, name, body, website } = input.data;
  if (website) return NextResponse.json({ ok: true, pending: true });
  try {
    if (!(await publishedVideo(slug))) return jsonError("Video not found.", 404);
    const db = database();
    const actor = actorHash(req);
    const rate = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM video_comments WHERE actor_hash=$1 AND created_at > NOW() - INTERVAL '1 hour'",
      [actor]
    );
    if (Number(rate.rows[0]?.count || 0) >= 4)
      return jsonError("You have submitted several comments. Please try again later.", 429);

    if (parentId) {
      const parent = await db.query<{ id: string }>(
        "SELECT id::text AS id FROM video_comments WHERE id=$1 AND video_slug=$2 AND status='approved' AND parent_id IS NULL",
        [parentId, slug]
      );
      if (!parent.rows.length) return jsonError("This comment cannot be replied to.", 400);
    }
    await db.query(
      "INSERT INTO video_comments(video_slug,parent_id,author_name,body,actor_hash) VALUES($1,$2,$3,$4,$5)",
      [slug, parentId || null, name, body, actor]
    );
    return NextResponse.json(
      { ok: true, pending: true, message: "Comment received. It will appear after moderator approval." },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return jsonError("We couldn't save the comment. Please try again.", 503);
  }
}
