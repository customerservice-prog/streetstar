import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
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
  const real=req.headers.get("x-real-ip")?.trim()||"";
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"";
  const ip=isIP(real)?real:(isIP(forwarded)?forwarded:"unknown");
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
    // Embedded under bajomundotv.com, so a partitioned cookie is needed for
    // guest reaction/like identity in browsers that restrict third-party cookies.
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    partitioned: process.env.NODE_ENV === "production",
    maxAge: COOKIE_SECONDS,
    path: "/"
  });
  return response;
}

export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    // Next.js may reconstruct req.nextUrl from the internal bind host
    // (0.0.0.0/localhost). Browser security checks must use the HTTP Host
    // of the actual request instead. Browsers cannot forge Host headers.
    const host = req.headers.get("host");
    return Boolean(host && new URL(origin).host.toLowerCase() === host.toLowerCase());
  } catch { return false; }
}

export function hasNetworkIdentity(req:NextRequest):boolean{
  const real=req.headers.get("x-real-ip")?.trim()||"";
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"";
  return Boolean(isIP(real)||isIP(forwarded));
}
export function actorHashIsUnknown(value:string):boolean{return value===digest("actor:unknown");}

export async function actorIsBlocked(req:NextRequest):Promise<boolean>{
  if(!hasNetworkIdentity(req))return false;
  const {database}=await import("@/lib/db");
  const result=await database().query(
    "SELECT 1 FROM moderation_blocks WHERE actor_hash=$1 AND blocked_until>NOW() LIMIT 1",
    [actorHash(req)]
  );
  return result.rows.length>0;
}

export async function publishedVideo(slug: string): Promise<boolean> {
  // Includes explicitly labeled demonstration videos while the catalog is empty.
  return Boolean(await getStory(slug));
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
