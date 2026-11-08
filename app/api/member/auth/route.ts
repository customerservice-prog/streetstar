import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { actorHash, jsonError, sameOrigin } from "@/lib/community";
import { destroyMemberSession, getMemberFromRequest, issueMemberSession, makePasswordHash, matchPassword, memberCookie, sessionCookieOptions } from "@/lib/member-auth";
import { emailConfigured,sendMemberEmail } from "@/lib/member-email";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const email=z.email().max(200).transform(s=>s.trim().toLowerCase());
const register=z.object({action:z.literal("register"),email,displayName:z.string().trim().min(2).max(40).regex(/^[^\r\n<>]+$/),password:z.string().min(10).max(128),website:z.string().max(100).optional()});
const login=z.object({action:z.literal("login"),email,password:z.string().min(1).max(128)});
const logout=z.object({action:z.literal("logout")});
const form=z.discriminatedUnion("action",[register,login,logout]);

export async function GET(req:NextRequest){
  const member=await getMemberFromRequest(req);
  return NextResponse.json({member},{headers:{"Cache-Control":"no-store"}});
}
export async function POST(req:NextRequest){
  if(!sameOrigin(req))return jsonError("Invalid request origin.",403);
  if(Number(req.headers.get("content-length")||0)>15000)return jsonError("Request too large.",413);
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return jsonError("Check the required account fields.",400);
  const d=parsed.data;
  if(d.action==="logout"){
    try {await destroyMemberSession(req.cookies.get(memberCookie)?.value);}catch{}
    const res=NextResponse.json({ok:true},{headers:{"Cache-Control":"no-store"}});
    res.cookies.set(memberCookie,"",{...sessionCookieOptions(),maxAge:0});
    return res;
  }
  try{
    const db=database();
    const actor=actorHash(req);
    const count=await db.query<{count:string}>(
      "SELECT COUNT(*)::text AS count FROM member_auth_attempts WHERE actor_hash=$1 AND created_at>NOW()-INTERVAL '15 minutes'",[actor]
    );
    if(Number(count.rows[0]?.count||0)>=10)return jsonError("Too many attempts. Try again later.",429);
    // Rate limit both unsuccessful sign-ins and new account registrations.
    await db.query("INSERT INTO member_auth_attempts(actor_hash) VALUES($1)",[actor]);
    let id:string;
    let verificationSent=false;
    if(d.action==="register"){
      if(d.website)return NextResponse.json({ok:true});
      const daily=await db.query<{count:string}>(
        "SELECT COUNT(*)::text AS count FROM member_auth_attempts WHERE actor_hash=$1 AND created_at>NOW()-INTERVAL '24 hours'",[actor]
      );
      if(Number(daily.rows[0]?.count||0)>20)return jsonError("Account creation is temporarily limited.",429);
      const hashed=await makePasswordHash(d.password);
      const inserted=await db.query<{id:string}>(
        "INSERT INTO members(email,display_name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id::text AS id",
        [d.email,d.displayName,hashed]
      );
      if(!inserted.rows.length)return jsonError("This email is already registered. Sign in instead.",409);
      id=inserted.rows[0].id;
      if(emailConfigured())verificationSent=await sendMemberEmail(id,d.email,"verify").catch(()=>false);
    } else {
      const result=await db.query<{id:string;password_hash:string}>(
        "SELECT id::text AS id,password_hash FROM members WHERE email=$1",[d.email]
      );
      const user=result.rows[0];
      if(!user||!(await matchPassword(d.password,user.password_hash)))return jsonError("Invalid email or password.",401);
      id=user.id;
    }
    const token=await issueMemberSession(id);
    const res=NextResponse.json({ok:true,message:d.action==="register"?(verificationSent?"Account created. Check your email for a verification link.":"Account created. Email confirmation remains pending. You can request a new link in account settings."):"Welcome back."},{headers:{"Cache-Control":"no-store"}});
    res.cookies.set(memberCookie,token,sessionCookieOptions());
    return res;
  }catch{return jsonError("Unable to complete your request. Please try again.",503);}
}
