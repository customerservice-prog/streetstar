import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to start StreetStar.");
  process.exit(1);
}
const schema = await fs.readFile(path.resolve("database/schema.sql"), "utf8");
let ready = false;
for (let attempt = 1; attempt <= 8; attempt++) {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    await client.query(schema);
    // Publish the eight user-provided Bajo Mundo TV Viral clips idempotently
    // after their Descript share links have been finalized and approved.
    const manifest = await fs.readFile(path.resolve("database/launch-videos.json"), "utf8").catch(error => {
      if (error?.code === "ENOENT") return "[]";
      throw error;
    });
    const launchVideos = JSON.parse(manifest);
    for (const clip of launchVideos) {
      if (!/^https:\/\/share\.descript\.com\/view\/[A-Za-z0-9_-]+$/.test(clip.videoUrl))
        throw new Error("Invalid video host URL for " + clip.slug);
      await client.query(
        "INSERT INTO videos(slug,title,artist,description,category,video_url,poster_url,featured,status,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'published',$9) ON CONFLICT(slug) DO UPDATE SET poster_url=EXCLUDED.poster_url WHERE videos.video_url=EXCLUDED.video_url AND videos.poster_url LIKE 'https://share.descript.com/view/%'",
        [clip.slug,clip.title,clip.artist,clip.description,clip.category,clip.videoUrl,clip.posterUrl,Boolean(clip.featured),clip.createdAt]
      );
    }
    if (launchVideos.length) console.log("Bajo Mundo TV Viral launch catalog verified: " + launchVideos.length + " clips.");
    // Give all older published entries missing a poster their own dynamic cover.
    // Never overwrite thumbnails that were supplied or extracted successfully.
    await client.query("UPDATE videos SET poster_url = '/api/auto-poster/' || slug WHERE status = 'published' AND poster_url = ''");
    ready = true;
    console.log("StreetStar database schema verified.");
    break;
  } catch (e) {
    console.error("Database initialization attempt " + attempt + " failed: " + (e?.code || e?.message || "unknown"));
    if (attempt < 8) await new Promise(resolve => setTimeout(resolve, 4000));
  } finally {
    await client.end().catch(() => {});
  }
}
if (!ready) {
  console.error("Database initialization failed. Refusing to start the app.");
  process.exit(1);
}
