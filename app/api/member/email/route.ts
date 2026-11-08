import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { actorHash,jsonError,sameOrigin } from "@/lib/community";
import { getMemberFromRequest } from "@/lib/member-auth";
import { emailConfigured,sendMemberEmail } from "@/lib/member-email";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const form=z.discriminatedUnion("purpose",[
  z.object({purpose:z.literal("verify")}),
  z.object({purpose:z.literal("reset"),email:z.email().max(200).transform(s=>s.toLowerCase().trim())})
]);
export async function GET(req:NextRequest){
  const member=await getMemberFromRequest(req);
  return NextResponse.json({emailEnabled:emailConfigured(),verified:member?.emailVerified||false},
    {headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid origin.",403);
  if(Number(req.headers.get("content-length")||0)>4000)return jsonError("Invalid request.",413);
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return jsonError("Invalid email request.",400);
  if(!emailConfigured())return jsonError("Email verification and recovery are not configured yet.",503);
  const db=database();
  const actor=actorHash(req);
  try{
    const rate=await db.query<{count:string}>(
      "SELECT COUNT(*)::text AS count FROM member_auth_attempts WHERE actor_hash=$1 AND created_at>NOW()-INTERVAL '15 minutes'",[actor]);
    if(Number(rate.rows[0]?.count||0)>=8)return jsonError("Too many requests. Try again later.",429);
    await db.query("INSERT INTO member_auth_attempts(actor_hash) VALUES($1)",[actor]);
    let recipient:{id:string;email:string;emailVerified:boolean}|undefined;
    if(parsed.data.purpose==="verify"){
      const member=await getMemberFromRequest(req);
      if(!member)return jsonError("Sign in to verify your email.",401);
      recipient={id:member.id,email:member.email,emailVerified:member.emailVerified};
    }else{
      const found=await db.query<{id:string;email:string;emailVerified:boolean}>(
        'SELECT id::text AS id,email,(email_verified_at IS NOT NULL) AS "emailVerified" FROM members WHERE email=$1',
        [parsed.data.email]);
      recipient=found.rows[0];
    }
    if(recipient && (parsed.data.purpose==="reset"||!recipient.emailVerified))
      await sendMemberEmail(recipient.id,recipient.email,parsed.data.purpose);
    // Uniform response for existing and unknown reset emails to avoid enumeration.
    return NextResponse.json({
      ok:true,message:parsed.data.purpose==="reset"
        ?"If an account exists, recovery instructions will be sent when email delivery is available."
        :"If this account needs verification, a link will be sent to its registered address."
    },{headers:{"Cache-Control":"no-store"}});
  }catch{return jsonError("Unable to request account email right now.",503);}
}
