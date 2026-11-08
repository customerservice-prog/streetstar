import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { guestIdentity, jsonError, sameOrigin, withGuestCookie } from "@/lib/community";

export const runtime = "nodejs";
const form = z.object({ commentId: z.string().regex(/^\d+$/) });

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Invalid request origin.", 403);
  const parsed = form.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid comment.", 400);
  try {
    const db = database();
    const comment = await db.query(
      "SELECT id FROM video_comments WHERE id=$1 AND status='approved'",
      [parsed.data.commentId]
    );
    if (!comment.rows.length) return jsonError("Comment not available.", 404);
    const guest = guestIdentity(req);
    const existing = await db.query(
      "SELECT 1 FROM comment_likes WHERE comment_id=$1 AND guest_hash=$2",
      [parsed.data.commentId, guest.hash]
    );
    let liked: boolean;
    if (existing.rows.length) {
      await db.query("DELETE FROM comment_likes WHERE comment_id=$1 AND guest_hash=$2",
        [parsed.data.commentId, guest.hash]);
      liked = false;
    } else {
      const added = await db.query(
        "INSERT INTO comment_likes(comment_id,guest_hash) VALUES($1,$2) ON CONFLICT DO NOTHING RETURNING comment_id",
        [parsed.data.commentId, guest.hash]
      );
      liked = added.rows.length > 0;
    }
    const count = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM comment_likes WHERE comment_id=$1",
      [parsed.data.commentId]
    );
    return withGuestCookie(
      NextResponse.json({ ok: true, liked, likes: Number(count.rows[0]?.count || 0) }, { headers: { "Cache-Control":"no-store" } }),
      guest.token, guest.fresh
    );
  } catch {
    return jsonError("Like couldn't be saved.", 503);
  }
}
