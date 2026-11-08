import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { database, hasDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabase()) return NextResponse.json({ error: "Set DATABASE_URL and apply database/schema.sql first." }, { status: 503 });
  try {
    const [videos, submissions, reports] = await Promise.all([
      database().query("SELECT id, slug, title, artist, category, status, featured, created_at FROM videos ORDER BY created_at DESC LIMIT 200"),
      database().query("SELECT id, title, artist, email, category, video_url, notes, status, created_at FROM submissions ORDER BY created_at DESC LIMIT 200"),
      database().query("SELECT id, claimant, email, content_url, reason, details, status, created_at FROM content_reports ORDER BY created_at DESC LIMIT 200")
    ]);
    return NextResponse.json({ videos: videos.rows, submissions: submissions.rows, reports: reports.rows });
  } catch {
    return NextResponse.json({ error: "Database unavailable or schema missing." }, { status: 503 });
  }
}
