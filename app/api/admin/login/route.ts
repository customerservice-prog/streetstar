import { NextRequest, NextResponse } from "next/server";
import { createSession, passwordIsValid, sessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!passwordIsValid(password)) {
    return NextResponse.json({ error: "Invalid password or admin settings are not configured." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(sessionCookie.name, createSession(), sessionCookie.options);
  return res;
}
