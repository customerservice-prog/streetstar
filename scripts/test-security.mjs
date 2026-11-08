import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import pg from "pg";

const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const origin=new URL(base).origin;
const secret=()=>randomBytes(24).toString("hex");
const userEmail="security-"+secret().slice(0,12)+"@example.invalid";
const password=secret();
const db=new pg.Pool({connectionString:process.env.DATABASE_URL});
async function call(path,method="GET",body,cookie="",extraHeaders={}){
  const response=await fetch(base+path,{
    method,
    headers:{
      ...(method!=="GET"?{"Content-Type":"application/json",Origin:origin}:{}),
      ...(cookie?{Cookie:cookie}:{}),...extraHeaders
    },
    ...(body?{body:JSON.stringify(body)}:{})
  });
  const data=await response.json().catch(()=>({}));
  return {status:response.status,data,cookie:(response.headers.get("set-cookie")||"").split(";")[0]};
}
const ok=(x,status)=>assert.equal(x.status,status,JSON.stringify(x.data));
try{
  const status=await call("/api/member/email");
  ok(status,200);
  assert.equal(status.data.emailEnabled,false,"CI deliberately has no email provider credentials");
  const noEmail=await call("/api/member/email","POST",{purpose:"reset",email:userEmail});
  ok(noEmail,503);
  const account=await call("/api/member/auth","POST",{
    action:"register",email:userEmail,displayName:"SecurityTester",password
  });
  ok(account,200);
  const memberCookie=account.cookie;
  assert.ok(memberCookie.startsWith("ss_member="));
  const profile=await call("/api/member/auth","GET",undefined,memberCookie);
  assert.equal(profile.data.member.emailVerified,false);

  // Simulate an email provider having issued an opaque one-time token in the
  // isolated test database. No real email is sent or other project is accessed.
  const id=profile.data.member.id;
  const verifyToken=randomBytes(32).toString("hex");
  const verifyHash=createHash("sha256").update(verifyToken).digest("hex");
  await db.query("INSERT INTO member_email_tokens(token_hash,member_id,purpose,expires_at) VALUES($1,$2,'verify',NOW()+INTERVAL '10 minutes')",[verifyHash,id]);
  const verified=await call("/api/member/email/confirm","POST",{purpose:"verify",token:verifyToken});
  ok(verified,200);assert.equal(verified.data.verified,true);
  ok(await call("/api/member/email/confirm","POST",{purpose:"verify",token:verifyToken}),400);
  const check=await call("/api/member/auth","GET",undefined,memberCookie);
  assert.equal(check.data.member.emailVerified,true);

  const resetToken=randomBytes(32).toString("hex");
  const resetHash=createHash("sha256").update(resetToken).digest("hex");
  await db.query("INSERT INTO member_email_tokens(token_hash,member_id,purpose,expires_at) VALUES($1,$2,'reset',NOW()+INTERVAL '10 minutes')",[resetHash,id]);
  const nextPassword=secret();
  const changed=await call("/api/member/email/confirm","POST",{purpose:"reset",token:resetToken,password:nextPassword});
  ok(changed,200);
  ok(await call("/api/member/email/confirm","POST",{purpose:"reset",token:resetToken,password:nextPassword}),400);
  const expiredSession=await call("/api/member/auth","GET",undefined,memberCookie);
  assert.equal(expiredSession.data.member,null,"Reset must revoke prior sessions");
  ok(await call("/api/member/auth","POST",{action:"login",email:userEmail,password}),401);
  const signedIn=await call("/api/member/auth","POST",{action:"login",email:userEmail,password:nextPassword});
  ok(signedIn,200);

  const hiddenAnalytics=await call("/api/admin/analytics");
  ok(hiddenAnalytics,401);
  const admin=await call("/api/admin/login","POST",{password:process.env.ADMIN_PASSWORD});
  ok(admin,200);
  const video=await call("/api/admin/videos","POST",{
    title:"StreetStar analytics test",artist:"CI",description:"Disposable automated test.",
    category:"Culture",videoUrl:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    posterUrl:"",featured:false,status:"published"
  },admin.cookie);
  ok(video,201);
  const slug=video.data.video.slug;
  ok(await call("/api/watch-progress","POST",{slug,seconds:12,position:12,duration:30,ended:false}),409);
  const play=await call("/api/watch-event","POST",{slug});
  ok(play,200);
  const watched=await call("/api/watch-progress","POST",{slug,seconds:12,position:12,duration:30,ended:false},play.cookie);
  ok(watched,200);assert.equal(watched.data.counted,true);
  const repeat=await call("/api/watch-progress","POST",{slug,seconds:12,position:24,duration:30,ended:false},play.cookie);
  ok(repeat,200);assert.equal(repeat.data.counted,false,"Progress reports must be throttled");
  const analytics=await call("/api/admin/analytics","GET",undefined,admin.cookie);
  ok(analytics,200);
  assert.ok(Number(analytics.data.metrics.plays)>=1);
  assert.ok(Number(analytics.data.metrics.nativeSeconds)>=12);
  assert.ok(analytics.data.videos.some(x=>x.slug===slug));
  assert.equal(analytics.data.days.length,7);

  const visitorHeader={"x-real-ip":"198.51.100.117"};
  const input={slug,name:"Example Visitor",body:"Test moderation comment"};
  const first=await call("/api/comments","POST",input,"",visitorHeader);ok(first,201);
  const queue=await call("/api/admin/comments","GET",undefined,admin.cookie);ok(queue,200);
  const comment=queue.data.comments.find(x=>x.body===input.body);
  assert.ok(comment,"Admin must see moderated comment");
  const block=await call("/api/admin/comments","PATCH",{type:"block",id:comment.id,status:"blocked"},admin.cookie);
  ok(block,200);
  const restricted=await call("/api/comments","POST",{...input,body:"Another attempt"},"",visitorHeader);
  ok(restricted,403);
  const unban=await call("/api/admin/comments","PATCH",{type:"block",id:comment.id,status:"unblocked"},admin.cookie);
  ok(unban,200);
  const allowed=await call("/api/comments","POST",{...input,body:"Another attempt"},"",visitorHeader);
  ok(allowed,201);
  console.log("StreetStar secure recovery, watch-time, analytics and moderation integration checks passed.");
}finally{await db.end();}
