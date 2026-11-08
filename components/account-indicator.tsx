"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, UserRound } from "lucide-react";

export function AccountIndicator(){
  const [signedIn,setSignedIn]=useState(false);
  const [unread,setUnread]=useState(0);
  const refresh=useCallback(async()=>{
    try{
      const account=await fetch("/api/member/auth",{cache:"no-store"}).then(r=>r.json());
      if(!account.member){setSignedIn(false);setUnread(0);return;}
      setSignedIn(true);
      const notes=await fetch("/api/member/notifications",{cache:"no-store"}).then(r=>r.json());
      setUnread(Number.isInteger(notes.unread)?notes.unread:0);
    }catch{setUnread(0);}
  },[]);
  useEffect(()=>{
    void refresh();
    const focus=()=>void refresh();
    window.addEventListener("focus",focus);
    return ()=>window.removeEventListener("focus",focus);
  },[refresh]);

  return <Link className="header-search header-account-indicator"
    href={signedIn?"/account?tab=notifications":"/account"}
    title={signedIn?(unread?unread+" unread notifications":"Your StreetStar account"):"Sign in or join"}
    aria-label={signedIn?(unread?unread+" unread notifications":"Your StreetStar account"):"Join or sign in"}>
    {signedIn?<Bell size={20}/>:<UserRound size={20}/>}
    {signedIn&&unread>0&&<span className="header-unread-dot">{unread>9?"9+":unread}</span>}
  </Link>;
}
