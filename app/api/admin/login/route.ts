import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { createSession, passwordIsValid, sessionCookie } from "@/lib/auth";
import { database } from "@/lib/db";
import { sameOrigin } from "@/lib/community";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const ip = req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Admin login unavailable." }, { status: 503 });
  const actorHash = createHmac("sha256", secret).update(ip).digest("hex");

  try {
    const db = database();
    const recent = await db.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM login_attempts WHERE actor_hash=$1 AND created_at > NOW() - INTERVAL '15 minutes'",
      [actorHash]
    );
    if (Number(recent.rows[0].count) >= 8) {
      return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password.slice(0, 1000) : "";
    if (!passwordIsValid(password)) {
      await db.query("INSERT INTO login_attempts (actor_hash) VALUES ($1)", [actorHash]);
      return NextResponse.json({ error: "Invalid password." }, { status: 401 });
    }
    await db.query("DELETE FROM login_attempts WHERE actor_hash=$1", [actorHash]);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(sessionCookie.name, createSession(), sessionCookie.options);
    return res;
  } catch {
    return NextResponse.json({ error: "Admin login temporarily unavailable." }, { status: 503 });
  }
}
