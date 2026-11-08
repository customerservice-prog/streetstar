import assert from "node:assert/strict";
import {randomBytes} from "node:crypto";
const base=process.env.SMOKE_BASE_URL||"http://127.0.0.1:3000";
const origin=new URL(base).origin;
const random=()=>randomBytes(24).toString("hex");
const email="ci-"+random().slice(0,12)+"@example.invalid";
const pass=random();
async function call(path,method="GET",body,session){
  const res=await fetch(base+path,{
    method,headers:{...(method!=="GET"?{Origin:origin,"Content-Type":"application/json"}:{}),...(session?{Cookie:session}:{})},
    ...(body?{body:JSON.stringify(body)}:{})
  });
  return {status:res.status,data:await res.json().catch(()=>({})),cookie:(res.headers.get("set-cookie")||"").split(";")[0]};
}
const check=(x,n)=>assert.equal(x.status,n,JSON.stringify(x.data));
const signup=await call("/api/member/auth","POST",{action:"register",email,displayName:"CommunityTester",password:pass});
check(signup,200);assert.ok(signup.cookie.startsWith("ss_member="));
const memberCookie=signup.cookie;
const member=await call("/api/member/auth","GET",undefined,memberCookie);
assert.equal(member.data.member.displayName,"CommunityTester");
const admin=await call("/api/admin/login","POST",{password:process.env.ADMIN_PASSWORD});
check(admin,200);
const video=await call("/api/admin/videos","POST",{
  title:"StreetStar integration video",artist:"Test",category:"Culture",videoUrl:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  description:"Synthetic video for an isolated disposable test database.",posterUrl:"",featured:false,status:"published"
},admin.cookie);
check(video,201);
const slug=video.data.video.slug;
const play=await call("/api/watch-event","POST",{slug},memberCookie);
check(play,200);assert.equal(play.data.counted,true);
const playAgain=await call("/api/watch-event","POST",{slug},memberCookie+"; "+play.cookie);
check(playAgain,200);assert.equal(playAgain.data.counted,false);
const stats=await call("/api/video-stats?slug="+slug);
assert.equal(stats.data.plays,1);
const trend=await call("/api/trending");
assert.ok(trend.data.trending.some(x=>x.slug===slug&&x.plays===1));
const saved=await call("/api/member/library","POST",{slug,saved:true},memberCookie);check(saved,200);
const library=await call("/api/member/library","GET",undefined,memberCookie);
assert.ok(library.data.saved.some(x=>x.slug===slug));
assert.ok(library.data.history.some(x=>x.slug===slug));
const pending=await call("/api/comments","POST",{slug,name:"FakeName",body:"This is a signed-in comment."},memberCookie);check(pending,201);
const queue=await call("/api/admin/comments","GET",undefined,admin.cookie);
const comment=queue.data.comments.find(x=>x.body==="This is a signed-in comment.");
assert.equal(comment.name,"CommunityTester");
const approved=await call("/api/admin/comments","PATCH",{type:"comment",id:comment.id,status:"approved"},admin.cookie);check(approved,200);
const note=await call("/api/member/notifications","GET",undefined,memberCookie);
assert.ok(note.data.notifications.some(x=>x.kind==="approved"));
const update=await call("/api/member/profile","PATCH",{displayName:"UpdatedTester"},memberCookie);check(update,200);
const updated=await call("/api/member/auth","GET",undefined,memberCookie);
assert.equal(updated.data.member.displayName,"UpdatedTester");
const emailOther="ci-other-"+random().slice(0,12)+"@example.invalid";
const otherPass=random();
const other=await call("/api/member/auth","POST",{action:"register",email:emailOther,displayName:"ReplyTester",password:otherPass});
check(other,200);
const reply=await call("/api/comments","POST",{
  slug,parentId:comment.id,name:"SomeoneElse",body:"A test reply to the member."
},other.cookie);
check(reply,201);
const queueAfter=await call("/api/admin/comments","GET",undefined,admin.cookie);
const replyRow=queueAfter.data.comments.find(x=>x.body==="A test reply to the member.");
assert.ok(replyRow);
assert.equal(replyRow.name,"ReplyTester");
const approveReply=await call("/api/admin/comments","PATCH",{type:"comment",id:replyRow.id,status:"approved"},admin.cookie);
check(approveReply,200);
const replyNotes=await call("/api/member/notifications","GET",undefined,memberCookie);
assert.ok(replyNotes.data.notifications.some(x=>x.kind==="reply"&&x.actorName==="ReplyTester"));
const noteId=replyNotes.data.notifications.find(x=>x.kind==="reply").id;
const markRead=await call("/api/member/notifications","PATCH",{id:noteId},memberCookie);
check(markRead,200);

const submission=await call("/api/submissions","POST",{
  artist:"CommunityTester",email,title:"Account-linked video submission",
  category:"Culture",videoUrl:"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
  notes:"Test account submission",website:""
},memberCookie);
check(submission,201);
const history=await call("/api/member/library","GET",undefined,memberCookie);
assert.ok(history.data.submissions.some(x=>x.title==="Account-linked video submission"));

const unSave=await call("/api/member/library","POST",{slug,saved:false},memberCookie);
check(unSave,200);
const removed=await call("/api/member/profile","DELETE",{password:pass,confirm:"DELETE"},memberCookie);
check(removed,200);
const afterDelete=await call("/api/member/auth","GET",undefined,memberCookie);
assert.equal(afterDelete.data.member,null);
const unauthorized=await call("/api/member/library","GET",undefined,memberCookie);
check(unauthorized,401);
console.log("StreetStar member, reply notification and trending integration checks passed.");
