import { createHmac, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getStory } from "@/lib/db";

export const guestCookieName = "streetstar_guest";
const COOKIE_SECONDS = 60 * 60 * 24 * 365;

function digest(value: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("Community signing secret missing");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function actorHash(req: NextRequest): string {
  // This is a basic best-effort abuse throttle, not a substitute for an
  // edge rate limiter/CAPTCHA. Never store the plain client address.
  const ip = req.headers.get("x-real-ip")
    || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  return digest("actor:" + ip);
}

export function guestIdentity(req: NextRequest) {
  const existing = req.cookies.get(guestCookieName)?.value;
  const token = existing && /^[a-f0-9]{48}$/.test(existing)
    ? existing : randomBytes(24).toString("hex");
  return {
    token,
    fresh: token !== existing,
    hash: digest("guest:" + token)
  };
}

export function withGuestCookie(response: NextResponse, token: string, fresh: boolean) {
  if (fresh) response.cookies.set(guestCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_SECONDS,
    path: "/"
  });
  return response;
}

export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.nextUrl.host;
  } catch { return false; }
}

export async function publishedVideo(slug: string): Promise<boolean> {
  // Includes explicitly labeled demonstration videos while the catalog is empty.
  return Boolean(await getStory(slug));
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
