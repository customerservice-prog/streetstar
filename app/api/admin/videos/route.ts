import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { sameOrigin } from "@/lib/community";
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

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const query=(req.nextUrl.searchParams.get("q")||"").trim().slice(0,100);
  const page=Math.min(10000,Math.max(1,Number.parseInt(req.nextUrl.searchParams.get("page")||"1",10)||1));
  const limit=24;
  try {
    const db=database();
    const condition=query?"WHERE title ILIKE $1 OR artist ILIKE $1":"";
    const params=query?["%"+query+"%"]:[];
    const [count,rows,featured]=await Promise.all([
      db.query<{count:string}>("SELECT COUNT(*)::text AS count FROM videos "+condition,params),
      db.query("SELECT id,slug,title,artist,category,status,featured,poster_url,created_at FROM videos "+condition+
        " ORDER BY featured DESC, created_at DESC, id DESC LIMIT $"+(params.length+1)+" OFFSET $"+(params.length+2),
        [...params,limit,(page-1)*limit]),
      db.query("SELECT id,slug,title,artist,poster_url FROM videos WHERE featured=TRUE AND status='published' ORDER BY created_at DESC LIMIT 1")
    ]);
    const total=Number(count.rows[0]?.count||0);
    return NextResponse.json({
      items:rows.rows,featured:featured.rows[0]||null,total,page,
      pageCount:Math.max(1,Math.ceil(total/limit))
    },{headers:{"Cache-Control":"no-store"}});
  }catch{return NextResponse.json({error:"Could not load videos."},{status:503})}
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
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
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const data = updateSchema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const pool=database();
  const client=await pool.connect().catch(()=>null);
  if(!client)return NextResponse.json({error:"Database unavailable."},{status:503});
  try {
    await client.query("BEGIN");
    // There is exactly one homepage feature at a time, chosen by the owner.
    if(data.data.featured===true)
      await client.query("UPDATE videos SET featured = FALSE WHERE featured = TRUE AND id <> $1",[data.data.id]);
    const result=await client.query(
      "UPDATE videos SET status = CASE WHEN $2::boolean=TRUE THEN 'published' ELSE COALESCE($1,status) END, featured = CASE WHEN $1::text='draft' THEN FALSE ELSE COALESCE($2,featured) END WHERE id=$3 RETURNING id",
      [data.data.status ?? null, data.data.featured ?? null, data.data.id]
    );
    if(!result.rowCount)throw new Error("Video not found.");
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch {
    await client.query("ROLLBACK").catch(()=>{});
    return NextResponse.json({ error: "Could not update video." }, { status: 503 });
  } finally { client.release(); }
}
