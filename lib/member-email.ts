import { createHash, randomBytes } from "node:crypto";
import { database } from "@/lib/db";

export type EmailPurpose="verify"|"reset";
function escapeHtml(input:string){
  return input.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export function emailConfigured(){
  const from=process.env.STREETSTAR_FROM_EMAIL||"";
  const key=process.env.RESEND_API_KEY||"";
  const site=process.env.NEXT_PUBLIC_SITE_URL||"";
  return Boolean(key && key.startsWith("re_")
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)
    && /^https:\/\//i.test(site));
}
export function siteOrigin(){
  const url=new URL(process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000");
  if(url.protocol!=="https:" && url.hostname!=="localhost" && url.hostname!=="127.0.0.1")
    throw new Error("HTTPS site origin required for account links");
  return url.origin;
}
export function hashEmailToken(token:string){return createHash("sha256").update(token).digest("hex");}
async function deliver(to:string,subject:string,action:string,url:string){
  if(!emailConfigured())throw new Error("StreetStar email sender is not configured");
  const from=process.env.STREETSTAR_FROM_EMAIL!;
  const safe=escapeHtml(url);
  const response=await fetch("https://api.resend.com/emails",{
    method:"POST",
    headers:{"Authorization":"Bearer "+process.env.RESEND_API_KEY,"Content-Type":"application/json"},
    body:JSON.stringify({
      from:"StreetStar <"+from+">",to:[to],subject,
      text:"StreetStar — "+action+"\n\nUse this secure link:\n"+url+"\n\nIf you didn't request this, ignore this message.",
      html:'<div style="font-family:Arial,sans-serif;background:#0c1218;color:#f6f8ef;padding:28px"><h1 style="color:#d7fc56">STREETSTAR.</h1><h2>'+escapeHtml(action)+'</h2><p>Use this secure link to continue:</p><p><a style="color:#d7fc56" href="'+safe+'">'+safe+'</a></p><p>If you did not request this, ignore this message.</p></div>'
    }),
    cache:"no-store",signal:AbortSignal.timeout(9000)
  });
  if(!response.ok)throw new Error("Email provider rejected request ("+response.status+")");
}
export async function sendMemberEmail(memberId:string,to:string,purpose:EmailPurpose){
  if(!emailConfigured())return false;
  const db=database();
  const token=randomBytes(32).toString("hex");
  const tokenHash=hashEmailToken(token);
  const ttl=purpose==="reset"?"30 minutes":"24 hours";
  const prior=await db.query<{count:string}>(
    "SELECT COUNT(*)::text AS count FROM member_email_tokens WHERE member_id=$1 AND purpose=$2 AND created_at>NOW()-INTERVAL '1 hour'",
    [memberId,purpose]
  );
  if(Number(prior.rows[0]?.count||0)>=3)return false;
  await db.query(
    "INSERT INTO member_email_tokens(token_hash,member_id,purpose,expires_at) VALUES($1,$2,$3,NOW()+($4::interval))",
    [tokenHash,memberId,purpose,ttl]
  );
  try{
    const url=new URL("/account/security",siteOrigin());
    url.searchParams.set("purpose",purpose);
    url.searchParams.set("token",token);
    const action=purpose==="verify"?"Verify your email":"Reset your password";
    await deliver(to,"StreetStar — "+action,action,url.toString());
    return true;
  }catch{
    await db.query("DELETE FROM member_email_tokens WHERE token_hash=$1",[tokenHash]).catch(()=>{});
    return false;
  }
}
