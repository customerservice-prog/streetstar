import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/community";
import { getMemberFromRequest } from "@/lib/member-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(req:NextRequest){
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in first.",401);
  try{
    const rows=await database().query(
      'SELECT id::text AS id,kind,actor_name AS "actorName",video_slug AS slug,created_at AS "createdAt",read_at AS "readAt" FROM member_notifications WHERE member_id=$1 ORDER BY created_at DESC LIMIT 75',
      [member.id]
    );
    const unread=await database().query<{count:string}>(
      "SELECT COUNT(*)::text AS count FROM member_notifications WHERE member_id=$1 AND read_at IS NULL",[member.id]
    );
    return NextResponse.json({notifications:rows.rows,unread:Number(unread.rows[0]?.count||0)},{headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Notifications unavailable.",503);}
}
export async function PATCH(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in first.",401);
  const data=z.object({id:z.string().regex(/^\d+$/).optional(),all:z.boolean().optional()}).safeParse(await req.json().catch(()=>null));
  if(!data.success||(!data.data.id&&!data.data.all))return jsonError("Invalid request.",400);
  try{
    if(data.data.all)await database().query("UPDATE member_notifications SET read_at=NOW() WHERE member_id=$1 AND read_at IS NULL",[member.id]);
    else await database().query("UPDATE member_notifications SET read_at=NOW() WHERE member_id=$1 AND id=$2",[member.id,data.data.id]);
    return NextResponse.json({ok:true});
  }catch{return jsonError("Update failed.",503);}
}
