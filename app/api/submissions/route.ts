import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database, hasDatabase } from "@/lib/db";
import { getMemberFromRequest } from "@/lib/member-auth";
import { sameOrigin, jsonError } from "@/lib/community";

export const runtime = "nodejs";

const url = z.url().refine(value => value.startsWith("https://") || value.startsWith("http://"), "Use an HTTP(S) link.");
const form = z.object({
  artist: z.string().trim().min(2).max(100),
  email: z.email().max(200),
  title: z.string().trim().min(3).max(170),
  category: z.enum(["Music", "Culture", "Viral", "Sports", "Interviews", "Lifestyle"]),
  videoUrl: url.max(1500),
  notes: z.string().trim().max(1200).default(""),
  website: z.string().max(200).default("")
});

export async function POST(request: NextRequest) {
  if(!sameOrigin(request))return jsonError("Invalid request origin.",403);
  const data = await request.json().catch(() => null);
  const parsed = form.safeParse(data);
  if (!parsed.success) return NextResponse.json({ error: "Please check the required fields and video link." }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });
  if (!hasDatabase()) return NextResponse.json({ error: "Submissions are not open yet. Database setup is required." }, { status: 503 });
  try {
    const db = database();
    const count = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM submissions WHERE email = $1 AND created_at > NOW() - INTERVAL '1 hour'",
      [parsed.data.email.toLowerCase()]
    );
    if (Number(count.rows[0].count) >= 3) return NextResponse.json({ error: "Submission limit reached. Try again later." }, { status: 429 });
    const member=await getMemberFromRequest(request);
    // Only new signed-in submissions can appear in that member's private history.
    const memberId=member && member.email===parsed.data.email.toLowerCase()?member.id:null;
    const result = await db.query<{ id: string }>(
      "INSERT INTO submissions (artist, email, title, category, video_url, notes,member_id) VALUES ($1, $2, $3, $4, $5, $6,$7) RETURNING id",
      [parsed.data.artist, parsed.data.email.toLowerCase(), parsed.data.title, parsed.data.category, parsed.data.videoUrl, parsed.data.notes,memberId]
    );
    return NextResponse.json({ ok: true, id: result.rows[0].id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save your submission. Please try again later." }, { status: 503 });
  }
}
