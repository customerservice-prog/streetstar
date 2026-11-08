import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { database } from "@/lib/db";
import { jsonError, sameOrigin } from "@/lib/community";
import { destroyMemberSession, getMemberFromRequest, matchPassword, makePasswordHash, memberCookie, sessionCookieOptions } from "@/lib/member-auth";

export const runtime="nodejs";
const update=z.object({
  displayName:z.string().trim().min(2).max(40).regex(/^[^\r\n<>]+$/).optional(),
  notificationsEnabled:z.boolean().optional(),
  currentPassword:z.string().min(1).max(128).optional(),
  newPassword:z.string().min(10).max(128).optional()
}).refine(x=>x.displayName!==undefined||x.notificationsEnabled!==undefined||x.newPassword!==undefined)
 .refine(x=>!x.newPassword||!!x.currentPassword);
const deletion=z.object({password:z.string().min(1).max(128),confirm:z.literal("DELETE")});

export async function PATCH(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid request origin.",403);
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in first.",401);
  const data=update.safeParse(await req.json().catch(()=>null));
  if(!data.success)return jsonError("Invalid profile details.",400);
  try{
    const db=database();
    let passHash:string|null=null;
    if(data.data.newPassword){
      const row=await db.query<{password_hash:string}>("SELECT password_hash FROM members WHERE id=$1",[member.id]);
      if(!row.rows[0]||!(await matchPassword(data.data.currentPassword||"",row.rows[0].password_hash)))
        return jsonError("Current password was incorrect.",403);
      passHash=await makePasswordHash(data.data.newPassword);
    }
    await db.query(
      "UPDATE members SET display_name=COALESCE($1,display_name),notifications_enabled=COALESCE($2,notifications_enabled),password_hash=COALESCE($3,password_hash) WHERE id=$4",
      [data.data.displayName??null,data.data.notificationsEnabled??null,passHash,member.id]
    );
    if(passHash){
      const currentHash=createHash("sha256").update(req.cookies.get(memberCookie)?.value||"").digest("hex");
      await db.query("DELETE FROM member_sessions WHERE member_id=$1 AND token_hash<>$2",[member.id,currentHash]);
    }
    return NextResponse.json({ok:true});
  }catch{return jsonError("Profile update failed.",503);}
}

export async function DELETE(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid request origin.",403);
  const member=await getMemberFromRequest(req);
  if(!member)return jsonError("Sign in first.",401);
  const data=deletion.safeParse(await req.json().catch(()=>null));
  if(!data.success)return jsonError("Enter your password and type DELETE to confirm.",400);
  const db=database();
  const row=await db.query<{password_hash:string}>("SELECT password_hash FROM members WHERE id=$1",[member.id]);
  if(!row.rows[0]||!(await matchPassword(data.data.password,row.rows[0].password_hash)))
    return jsonError("Incorrect password.",403);
  const client=await db.connect();
  try{
    await client.query("BEGIN");
    await client.query("UPDATE video_comments SET member_id=NULL,author_name='Former member' WHERE member_id=$1",[member.id]);
    await client.query("DELETE FROM members WHERE id=$1",[member.id]);
    await client.query("COMMIT");
  }catch{
    await client.query("ROLLBACK");return jsonError("Account deletion failed.",503);
  }finally{client.release();}
  const res=NextResponse.json({ok:true});
  res.cookies.set(memberCookie,"",{...sessionCookieOptions(),maxAge:0});
  return res;
}
