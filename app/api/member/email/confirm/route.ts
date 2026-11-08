import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { jsonError,sameOrigin } from "@/lib/community";
import { hashEmailToken } from "@/lib/member-email";
import { makePasswordHash,memberCookie,sessionCookieOptions } from "@/lib/member-auth";
export const runtime="nodejs";
const form=z.discriminatedUnion("purpose",[
  z.object({purpose:z.literal("verify"),token:z.string().regex(/^[a-f0-9]{64}$/)}),
  z.object({purpose:z.literal("reset"),token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(10).max(128)})
]);
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  const input=form.safeParse(await req.json().catch(()=>null));
  if(!input.success)return jsonError("Invalid or expired link.",400);
  const client=await database().connect();
  try{
    await client.query("BEGIN");
    const hit=await client.query<{member_id:string;purpose:string}>(
      "SELECT member_id::text AS member_id,purpose FROM member_email_tokens WHERE token_hash=$1 AND purpose=$2 AND used_at IS NULL AND expires_at>NOW() FOR UPDATE",
      [hashEmailToken(input.data.token),input.data.purpose]
    );
    const token=hit.rows[0];
    if(!token){
      await client.query("ROLLBACK");
      return jsonError("Link expired, already used, or invalid.",400);
    }
    if(input.data.purpose==="verify"){
      await client.query("UPDATE members SET email_verified_at=COALESCE(email_verified_at,NOW()) WHERE id=$1",[token.member_id]);
    }else{
      const password=await makePasswordHash(input.data.password);
      await client.query("UPDATE members SET password_hash=$1 WHERE id=$2",[password,token.member_id]);
      await client.query("DELETE FROM member_sessions WHERE member_id=$1",[token.member_id]);
      await client.query("UPDATE member_email_tokens SET used_at=NOW() WHERE member_id=$1 AND purpose='reset'",[token.member_id]);
    }
    await client.query("UPDATE member_email_tokens SET used_at=NOW() WHERE token_hash=$1",[hashEmailToken(input.data.token)]);
    await client.query("COMMIT");
    const res=NextResponse.json({ok:true,verified:input.data.purpose==="verify",
      message:input.data.purpose==="verify"?"Email verified.":"Password updated. Sign in with your new password."});
    if(input.data.purpose==="reset")res.cookies.set(memberCookie,"",{...sessionCookieOptions(),maxAge:0});
    return res;
  }catch{
    await client.query("ROLLBACK").catch(()=>{});
    return jsonError("Unable to verify the link. Try again.",503);
  }finally{client.release();}
}
