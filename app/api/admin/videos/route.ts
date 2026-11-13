import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { database } from "@/lib/db";
import { slugify } from "@/lib/content";
import { automaticThumbnailForVideo } from "@/lib/automatic-thumbnail";

export const runtime = "nodejs";

const webUrl = z.url().refine(value => /^https?:\/\//.test(value), "Enter an HTTP(S) URL.");
const createSchema = z.object({
  title: z.string().trim().min(3).max(170),
  artist: z.string().trim().max(100).default(""),
  description: z.string().trim().max(4000).default(""),
  category: z.enum(["Music", "Culture", "Viral", "Sports", "Interviews", "Lifestyle"]),
  videoUrl: webUrl.max(1500),
  posterUrl: z.union([webUrl.max(1500), z.literal("")]).default(""),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "published"]).default("draft")
});

const updateSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional()
}).refine(data => data.status !== undefined || data.featured !== undefined);

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = createSchema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Check title, category and video URL." }, { status: 400 });
  const d = data.data;
  const slug = slugify(d.title) + "-" + randomBytes(4).toString("hex");
  const posterUrl = d.posterUrl || await automaticThumbnailForVideo(d.videoUrl, slug);
  try {
    const result = await database().query(
      "INSERT INTO videos (slug, title, artist, description, category, video_url, poster_url, featured, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, slug",
      [slug, d.title, d.artist, d.description, d.category, d.videoUrl, posterUrl, d.featured, d.status]
    );
    return NextResponse.json({ ok: true, video: { ...result.rows[0], posterUrl, artwork: d.posterUrl ? "custom" : "automatic" } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create video. Check database setup." }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = updateSchema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  try {
    await database().query(
      "UPDATE videos SET status = COALESCE($1, status), featured = COALESCE($2, featured) WHERE id = $3",
      [data.data.status ?? null, data.data.featured ?? null, data.data.id]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update video." }, { status: 503 });
  }
}
