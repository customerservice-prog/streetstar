import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { guestIdentity, jsonError, sameOrigin, withGuestCookie } from "@/lib/community";

export const runtime = "nodejs";
const form = z.object({
  commentId: z.string().regex(/^\d+$/),
  reason: z.enum(["spam", "harassment", "privacy", "other"]),
  details: z.string().trim().max(500).default("")
});

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Invalid request origin.", 403);
  const parsed = form.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid report.", 400);
  try {
    const db = database();
    const comment = await db.query("SELECT id FROM video_comments WHERE id=$1 AND status='approved'", [parsed.data.commentId]);
    if (!comment.rows.length) return jsonError("Comment not found.", 404);
    const guest = guestIdentity(req);
    const rate = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM comment_reports WHERE guest_hash=$1 AND created_at > NOW() - INTERVAL '24 hours'",
      [guest.hash]
    );
    if (Number(rate.rows[0]?.count || 0) >= 5) return jsonError("Daily report limit reached.", 429);
    const result = await db.query(
      "INSERT INTO comment_reports(comment_id,guest_hash,reason,details) VALUES($1,$2,$3,$4) ON CONFLICT (comment_id,guest_hash) DO NOTHING RETURNING id",
      [parsed.data.commentId, guest.hash, parsed.data.reason, parsed.data.details]
    );
    return withGuestCookie(
      NextResponse.json(
        { ok: true, alreadyReported: result.rows.length === 0 },
        { headers: { "Cache-Control":"no-store" } }
      ),
      guest.token, guest.fresh
    );
  } catch { return jsonError("Report could not be saved.", 503); }
}
