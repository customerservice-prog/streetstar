import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAdmin } from "@/lib/auth";
import { database } from "@/lib/db";

export const runtime = "nodejs";

const schema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(["pending", "reviewed", "rejected"])
});

export async function PATCH(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = schema.safeParse(await req.json().catch(() => null));
  if (!data.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  try {
    await database().query("UPDATE submissions SET status = $1 WHERE id = $2", [data.data.status, data.data.id]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not update submission." }, { status: 503 });
  }
}
