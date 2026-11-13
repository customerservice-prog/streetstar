import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "streetstar_session";
const TTL_MS = 24 * 60 * 60 * 1000;

function secret(): string | null {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? value : null;
}

function signature(value: string) {
  const key = secret();
  if (!key) return "";
  return createHmac("sha256", key).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function passwordIsValid(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  return Boolean(password && password.length >= 12 && secret() && safeEqual(input, password));
}

export function createSession(): string {
  if (!secret()) throw new Error("AUTH_SECRET is not configured.");
  const timestamp = String(Date.now());
  return timestamp + "." + signature(timestamp);
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [stamp, sign] = parts;
  const time = Number(stamp);
  if (!Number.isSafeInteger(time) || time > Date.now() || Date.now() - time > TTL_MS) return false;
  return safeEqual(signature(stamp), sign);
}

export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    secure: process.env.NODE_ENV === "production",
    partitioned: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_MS / 1000
  }
};
