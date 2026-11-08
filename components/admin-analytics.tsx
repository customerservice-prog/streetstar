"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ArrowUpRight, BarChart3, Clock3, Eye, MessageCircle, RefreshCw, TrendingUp, Users, Video } from "lucide-react";

type Day={date:string;plays:number;watchSeconds:number};
type VideoRow={slug:string;title:string;plays:number;watchSeconds:number;completions:number};
type Data={metrics:{plays:string;recent:string;browsers:string;nativeSeconds:string;completions:string;comments:string};days:Day[];videos:VideoRow[];definitions:Record<string,string>};
const fmt=(value:number)=>value.toLocaleString();
export function AdminAnalytics(){
  const [data,setData]=useState<Data|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const refresh=useCallback(async()=>{
    setError("");setLoading(true);
    try{
      const response=await fetch("/api/admin/analytics",{cache:"no-store"});
      const next=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(next.error||"Analytics unavailable.");
      setData(next);
    }catch(e){setError(e instanceof Error?e.message:"Analytics unavailable.");}
    finally{setLoading(false);}
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const peak=useMemo(()=>Math.max(1,...(data?.days||[]).map(d=>d.plays)),[data?.days]);
  return <main className="container analytics-page">
    <div className="analytics-back"><Link href="/admin"><ArrowLeft size={16}/> BACK TO CONTROL ROOM</Link><span>PRIVATE ANALYTICS</span></div>
    <div className="analytics-heading"><div><p className="community-eyebrow"><Activity size={16}/> AUDIENCE INTELLIGENCE</p><h1>STREETSTAR <span>DATA.</span></h1><p>Actual recorded activity, not fictional view counters. Play starts and native playback duration are separate metrics.</p></div><button className="button button-outline" onClick={()=>void refresh()} disabled={loading}><RefreshCw size={16}/> REFRESH</button></div>
    {error&&<p role="alert" className="discussion-alert error">{error}</p>}
    {loading?<p className="discussion-loading">Loading analytics…</p>
      :data&&<>
        <div className="analytics-stats">
          {[
            {label:"ALL-TIME PLAY STARTS",value:Number(data.metrics.plays||0),icon:Eye},
            {label:"LAST 7 DAYS",value:Number(data.metrics.recent||0),icon:TrendingUp},
            {label:"ACTIVE BROWSER IDS (7D)",value:Number(data.metrics.browsers||0),icon:Users},
            {label:"NATIVE WATCH MINUTES",value:Math.floor(Number(data.metrics.nativeSeconds||0)/60),icon:Clock3},
            {label:"REPORTED COMPLETIONS",value:Number(data.metrics.completions||0),icon:Video},
            {label:"APPROVED COMMENTS",value:Number(data.metrics.comments||0),icon:MessageCircle}
          ].map(x=><div key={x.label} className="analytics-stat"><x.icon size={20}/><strong>{fmt(x.value)}</strong><span>{x.label}</span></div>)}
        </div>
        <section className="analytics-panel">
          <div className="analytics-panel-head"><div><p className="community-eyebrow"><BarChart3 size={15}/> TRENDING ACTIVITY</p><h2>THE LAST 7 DAYS.</h2></div><p>Daily, deduplicated play starts (UTC)</p></div>
          {data.days.every(d=>d.plays===0)
            ?<div className="analytics-no-data">No recorded video plays in this period yet. Demo videos do not generate public trending metrics.</div>
            :<div className="analytics-bars">{data.days.map(d=><div className="analytics-day" key={d.date} title={d.date+": "+d.plays+" play starts"}><strong>{d.plays||""}</strong><div className="analytics-bar-track"><div className="analytics-bar" style={{height:(100*d.plays/peak)+"%"}}/></div><span>{new Date(d.date+"T12:00:00").toLocaleDateString(undefined,{weekday:"short"})}</span></div>)}</div>}
        </section>
        <section className="analytics-panel">
          <div className="analytics-panel-head"><div><p className="community-eyebrow"><Eye size={15}/> CONTENT PERFORMANCE</p><h2>VIDEO LEADERBOARD.</h2></div><p>Published videos only</p></div>
          <div className="analytics-table-scroll"><table className="analytics-table">
            <thead><tr><th>VIDEO</th><th>PLAY STARTS</th><th>NATIVE MINUTES</th><th>COMPLETIONS</th></tr></thead>
            <tbody>{data.videos.map(v=><tr key={v.slug}><td><Link href={"/watch/"+v.slug} target="_blank">{v.title}<ArrowUpRight size={13}/></Link></td><td>{fmt(v.plays)}</td><td>{fmt(Math.floor(v.watchSeconds/60))}</td><td>{fmt(v.completions)}</td></tr>)}</tbody>
          </table></div>
          {!data.videos.length&&<p className="analytics-no-data">No published videos yet.</p>}
        </section>
        <p className="analytics-disclaimer">Definitions: one play start per browser/video/UTC day. Native watch time is approximate playback time reported by HTML5-hosted videos only; YouTube and Vimeo embeds cannot provide verified watch duration here. Browser counts may include repeat visitors on different browsers or cleared cookies. Metrics are not audited advertising impressions.</p>
      </>}
  </main>;
}
