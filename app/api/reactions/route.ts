import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { guestCookieName, guestIdentity, jsonError, publishedVideo, sameOrigin, withGuestCookie } from "@/lib/community";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const slug = z.string().regex(/^[a-z0-9-]{1,100}$/);
const form = z.object({ slug, reaction: z.enum(["fire","love","wow"]) });

async function reactionStats(videoSlug: string, guestHash: string | null) {
  const result = await database().query<{ fire: number; love: number; wow: number }>(
    "SELECT COUNT(*) FILTER (WHERE reaction='fire')::integer AS fire, COUNT(*) FILTER (WHERE reaction='love')::integer AS love, COUNT(*) FILTER (WHERE reaction='wow')::integer AS wow FROM video_reactions WHERE video_slug=$1",
    [videoSlug]
  );
  const own = guestHash ? await database().query<{ reaction: string }>(
    "SELECT reaction FROM video_reactions WHERE video_slug=$1 AND guest_hash=$2",
    [videoSlug, guestHash]
  ) : null;
  return {
    reactions: result.rows[0] || { fire:0,love:0,wow:0 },
    mine: own?.rows[0]?.reaction || null
  };
}

export async function GET(req: NextRequest) {
  const parsed = slug.safeParse(req.nextUrl.searchParams.get("slug"));
  if (!parsed.success) return jsonError("Invalid video.", 400);
  try {
    if (!(await publishedVideo(parsed.data))) return jsonError("Video not found.", 404);
    const token = req.cookies.get(guestCookieName)?.value;
    const hash = token && /^[a-f0-9]{48}$/.test(token) ? guestIdentity(req).hash : null;
    return NextResponse.json(await reactionStats(parsed.data, hash), { headers: { "Cache-Control":"no-store" } });
  } catch { return jsonError("Reactions are unavailable.", 503); }
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Invalid request origin.", 403);
  const parsed = form.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid reaction.", 400);
  try {
    if (!(await publishedVideo(parsed.data.slug))) return jsonError("Video not found.", 404);
    const guest = guestIdentity(req);
    const db = database();
    await db.query(
      "INSERT INTO video_reactions(video_slug,guest_hash,reaction) VALUES($1,$2,$3) ON CONFLICT(video_slug,guest_hash) DO UPDATE SET reaction=EXCLUDED.reaction",
      [parsed.data.slug,guest.hash,parsed.data.reaction]
    );
    const stats = await reactionStats(parsed.data.slug, guest.hash);
    return withGuestCookie(
      NextResponse.json({ok:true,...stats},{headers:{"Cache-Control":"no-store"}}),
      guest.token,guest.fresh
    );
  } catch { return jsonError("Reaction could not be saved.",503); }
}
