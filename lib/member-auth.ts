import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { database } from "@/lib/db";

const scrypt=promisify(scryptCallback);
export const memberCookie="ss_member";
export const memberMaxAge=30*24*3600;

export type Member={id:string;email:string;displayName:string;notificationsEnabled:boolean;emailVerified:boolean;createdAt:string};
type MemberRow=Member;
const identitySql='SELECT m.id::text AS id,m.email,m.display_name AS "displayName",m.notifications_enabled AS "notificationsEnabled",(m.email_verified_at IS NOT NULL) AS "emailVerified",m.created_at AS "createdAt" FROM member_sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=$1 AND s.expires_at>NOW()';

function digest(token:string){return createHash("sha256").update(token).digest("hex");}
export async function makePasswordHash(password:string):Promise<string>{
  const salt=randomBytes(20).toString("hex");
  const hash=await scrypt(password,salt,64) as Buffer;
  return "scrypt$"+salt+"$"+hash.toString("hex");
}
export async function matchPassword(password:string,record:string):Promise<boolean>{
  const [kind,salt,hex]=record.split("$");
  if(kind!=="scrypt"||!salt||!hex||!/^[a-f0-9]{40}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hex))return false;
  const hash=await scrypt(password,salt,64) as Buffer;
  const stored=Buffer.from(hex,"hex");
  return timingSafeEqual(hash,stored);
}
export async function issueMemberSession(memberId:string){
  const token=randomBytes(32).toString("hex");
  await database().query(
    "INSERT INTO member_sessions(token_hash,member_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '30 days')",
    [digest(token),memberId]
  );
  return token;
}
export function sessionCookieOptions(){
  const embedded=process.env.NODE_ENV==="production";
  return {httpOnly:true,secure:embedded,sameSite:embedded?("none" as const):("lax" as const),partitioned:embedded,path:"/",maxAge:memberMaxAge};
}
async function fromToken(token:string|undefined):Promise<Member|null>{
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  try{
    const result=await database().query<MemberRow>(identitySql,[digest(token)]);
    return result.rows[0]||null;
  }catch{return null;}
}
export async function getMember(){return fromToken((await cookies()).get(memberCookie)?.value);}
export async function getMemberFromRequest(request:NextRequest){return fromToken(request.cookies.get(memberCookie)?.value);}
export async function destroyMemberSession(token:string|undefined){
  if(token&&/^[a-f0-9]{64}$/.test(token)){
    await database().query("DELETE FROM member_sessions WHERE token_hash=$1",[digest(token)]);
  }
}
