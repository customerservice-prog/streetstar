"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

export function AccountSecurity(){
  const [purpose,setPurpose]=useState<"verify"|"reset">("reset");
  const [token,setToken]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [available,setAvailable]=useState<boolean|null>(null);
  const [loggedIn,setLoggedIn]=useState(false);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [finished,setFinished]=useState(false);
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    setPurpose(params.get("purpose")==="verify"||params.get("mode")==="verify"?"verify":"reset");
    const link=params.get("token")||"";
    if(/^[a-f0-9]{64}$/.test(link))setToken(link);
    // Remove a one-time credential from browser history and subsequent referrers.
    if(params.has("token")){
      params.delete("token");
      const query=params.toString();
      window.history.replaceState(null,"",window.location.pathname+(query?"?"+query:""));
    }
    void fetch("/api/member/email",{cache:"no-store"}).then(r=>r.json()).then(x=>setAvailable(Boolean(x.emailEnabled))).catch(()=>setAvailable(false));
    void fetch("/api/member/auth",{cache:"no-store"}).then(r=>r.json()).then(x=>{setLoggedIn(Boolean(x.member));if(x.member?.email)setEmail(x.member.email);}).catch(()=>{});
  },[]);
  async function submit(event:FormEvent){
    event.preventDefault();setBusy(true);setNotice("");setError("");
    try{
      const body=token
        ? purpose==="verify"?{purpose,token}:{purpose,token,password}
        : purpose==="verify"?{purpose}:{purpose,email};
      const response=await fetch(token?"/api/member/email/confirm":"/api/member/email",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)
      });
      const info=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(info.error||"Unable to complete request.");
      setNotice(info.message||"Request received.");
      if(token){setToken("");setPassword("");setFinished(true);}
    }catch(e){setError(e instanceof Error?e.message:"Request failed.");}
    finally{setBusy(false);}
  }
  return <main className="container security-page">
    <Link href="/account" className="security-back"><ArrowLeft size={16}/> BACK TO ACCOUNT</Link>
    <div className="security-intro"><p className="community-eyebrow"><ShieldCheck size={16}/> PROTECT YOUR ACCOUNT</p><h1>ACCOUNT <span>SECURITY.</span></h1>
      <p>Secure account ownership and recovery for StreetStar members.</p>
    </div>
    <div className="security-panel">
      {finished?<><CheckCircle size={42} color="#d7fc56"/><h2>SUCCESS.</h2><p>{notice}</p><Link className="button button-accent" href="/account">RETURN TO ACCOUNT <ArrowRight size={16}/></Link></>
        :<><div className="security-modes"><button className={purpose==="verify"?"active":""} type="button" disabled={!!token} onClick={()=>{setPurpose("verify");setError("");setNotice("");}}><Mail size={16}/> VERIFY EMAIL</button>
          <button className={purpose==="reset"?"active":""} type="button" disabled={!!token} onClick={()=>{setPurpose("reset");setError("");setNotice("");}}><LockKeyhole size={16}/> RESET PASSWORD</button></div>
          <h2>{token?(purpose==="verify"?"CONFIRM YOUR EMAIL.":"SET A NEW PASSWORD."):purpose==="verify"?"VERIFY YOUR EMAIL.":"RECOVER YOUR ACCOUNT."}</h2>
          <p>{token?"Finish using your single-use secure link.":purpose==="verify"?"Verify the email registered to your signed-in account.":"Request a password recovery link for your StreetStar account."}</p>
          {available===false&&!token&&<div className="security-notice">Email delivery is not configured for StreetStar yet. We cannot send verification or password-reset links until a verified StreetStar sender is connected.</div>}
          {error&&<p className="discussion-alert error" role="alert">{error}</p>}
          {notice&&<p className="discussion-alert success" role="status">{notice}</p>}
          {(!token&&available===true||!!token)&&<form className="member-form" onSubmit={submit}>
            {!token&&purpose==="reset"&&<label>ACCOUNT EMAIL<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" maxLength={200}/></label>}
            {!token&&purpose==="verify"&&!loggedIn&&<p className="security-notice">Sign in first to request an email verification link. <Link href="/account">Sign in</Link>.</p>}
            {token&&purpose==="reset"&&<label>NEW PASSWORD<input required type="password" minLength={10} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 10 characters"/></label>}
            <button className="button button-accent" disabled={busy||(!token&&purpose==="verify"&&!loggedIn)}>{busy?"PROCESSING...":token?"CONFIRM SECURE LINK":"SEND SECURE LINK"} <ArrowRight size={16}/></button>
          </form>}
          <p className="member-fineprint">Links can only be used once and expire automatically. Resetting your password signs out other sessions. Never share a recovery link.</p>
        </>}
    </div>
  </main>;
}
