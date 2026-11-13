import assert from "node:assert/strict";

const base = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const slug = "arcangel-habla-sobre-los-mexicanos";
const origin = new URL(base).origin;
const adminPassword = process.env.ADMIN_PASSWORD;
if (!adminPassword) throw new Error("ADMIN_PASSWORD required for smoke test");

async function request(path, opts = {}) {
  const response = await fetch(base + path, {
    ...opts,
    headers: {
      ...(opts.body ? {"Content-Type":"application/json"} : {}),
      ...opts.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}
async function post(path, payload, cookie = "") {
  return request(path, {
    method:"POST", body:JSON.stringify(payload),
    headers:{Origin:origin,...(cookie?{Cookie:cookie}:{})}
  });
}
async function patch(path, payload, cookie) {
  return request(path, {
    method:"PATCH", body:JSON.stringify(payload),
    headers:{Origin:origin,Cookie:cookie}
  });
}
function cookie(response) {
  const value = response.headers.get("set-cookie");
  return value?.split(";")[0] || "";
}
function expectStatus(actual,status,label) {
  assert.equal(actual,status,label+": expected "+status+" got "+actual);
}

const health = await request("/api/health");
expectStatus(health.response.status,200,"Database health");
const empty = await request("/api/comments?slug="+slug);
expectStatus(empty.response.status,200,"Public discussion");
assert.ok(Array.isArray(empty.data.comments),"Comments must be a list");
const missing = await request("/api/comments?slug=nonexistent-video");
expectStatus(missing.response.status,404,"Unpublished video rejected");
const noAdmin = await request("/api/admin/comments");
expectStatus(noAdmin.response.status,401,"Admin moderation protected");
const invalid = await post("/api/comments",{slug,name:"T",body:"x"});
expectStatus(invalid.response.status,400,"Bad guest comment rejected");

const added = await post("/api/comments",{
  slug,name:"StreetStar CI Visitor",body:"This is an automated moderation test. Please keep it constructive."
});
expectStatus(added.response.status,201,"Comment stored");
assert.equal(added.data.pending,true,"New comment must require approval");
const before = await request("/api/comments?slug="+slug);
assert.equal(before.data.total,0,"Unreviewed comments must not appear");

const loggedIn = await post("/api/admin/login",{password:adminPassword});
expectStatus(loggedIn.response.status,200,"Admin login");
const adminCookie = cookie(loggedIn.response);
assert.ok(adminCookie.startsWith("streetstar_session="),"Admin session cookie must exist");
const queue = await request("/api/admin/comments",{headers:{Cookie:adminCookie}});
expectStatus(queue.response.status,200,"Admin queue loads");
const comment = queue.data.comments.find(x=>x.name==="StreetStar CI Visitor");
assert.ok(comment,"Pending comment must be visible to admin");
assert.equal(comment.status,"pending");
const approved = await patch("/api/admin/comments",{type:"comment",id:comment.id,status:"approved"},adminCookie);
expectStatus(approved.response.status,200,"Admin approval");
const visible = await request("/api/comments?slug="+slug);
assert.equal(visible.data.total,1,"Approved comment should be public");
assert.equal(visible.data.comments[0].body,"This is an automated moderation test. Please keep it constructive.");

const reaction = await post("/api/reactions",{slug,reaction:"fire"});
expectStatus(reaction.response.status,200,"Video reaction saved");
const guestCookie = cookie(reaction.response);
assert.ok(guestCookie.startsWith("streetstar_guest="),"Guest cookie must be issued");
assert.equal(reaction.data.mine,"fire");
assert.equal(reaction.data.reactions.fire,1);
const reactsRead = await request("/api/reactions?slug="+slug,{headers:{Cookie:guestCookie}});
assert.equal(reactsRead.data.mine,"fire","Viewer reaction is remembered");
const reactsOff = await post("/api/reactions",{slug,reaction:"fire"},guestCookie);
assert.equal(reactsOff.data.mine,null,"Same reaction should toggle off");

const like = await post("/api/comments/like",{commentId:comment.id},guestCookie);
expectStatus(like.response.status,200,"Like stored");
assert.equal(like.data.likes,1);
const seenLike = await request("/api/comments?slug="+slug,{headers:{Cookie:guestCookie}});
assert.equal(seenLike.data.comments[0].liked,true,"Like belongs to guest browser");

const report = await post("/api/comments/report",{commentId:comment.id,reason:"spam",details:"Automated moderation smoke test"},guestCookie);
expectStatus(report.response.status,200,"Abuse report stored");
const reportQueue = await request("/api/admin/comments",{headers:{Cookie:adminCookie}});
assert.equal(reportQueue.data.reports.length,1,"Admin must see reports");
const marked = await patch("/api/admin/comments",{type:"report",id:reportQueue.data.reports[0].id,status:"resolved"},adminCookie);
expectStatus(marked.response.status,200,"Report resolved");

const reply = await post("/api/comments",{
  slug,parentId:comment.id,name:"StreetStar CI Reply",body:"Thanks for contributing to the conversation."
});
expectStatus(reply.response.status,201,"Threaded reply stored");
const replyQueue = await request("/api/admin/comments",{headers:{Cookie:adminCookie}});
const child = replyQueue.data.comments.find(x=>x.name==="StreetStar CI Reply");
assert.ok(child,"Reply must be queued for approval");
const approveReply = await patch("/api/admin/comments",{type:"comment",id:child.id,status:"approved"},adminCookie);
expectStatus(approveReply.response.status,200,"Reply approved");
const thread = await request("/api/comments?slug="+slug);
assert.equal(thread.data.total,2);
assert.equal(thread.data.comments.find(x=>x.id===child.id)?.parentId,comment.id,"Approved reply attached to parent");
const hidden = await patch("/api/admin/comments",{type:"comment",id:comment.id,status:"hidden"},adminCookie);
expectStatus(hidden.response.status,200,"Hide root comment");
const afterHide = await request("/api/comments?slug="+slug);
assert.equal(afterHide.data.comments.length,0,"Hiding parent must hide its thread publicly");

const crossOrigin = await request("/api/reactions",{
  method:"POST",body:JSON.stringify({slug,reaction:"fire"}),
  headers:{"Content-Type":"application/json",Origin:"https://malicious.example"}
});
expectStatus(crossOrigin.response.status,403,"Cross-origin writes blocked");
console.log("StreetStar community integration smoke test passed.");
