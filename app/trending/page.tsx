import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Flame, Star, TrendingUp } from "lucide-react";
import { getStories } from "@/lib/db";
import { getTrending } from "@/lib/trending";
import { VideoCard } from "@/components/video-card";

export const metadata:Metadata={title:"Trending videos",description:"Real play starts and community activity from the last seven days on Bajo Mundo TV Viral."};
export const dynamic="force-dynamic";

export default async function TrendingPage(){
  const [rows,stories]=await Promise.all([getTrending(),getStories()]);
  const bySlug=new Map(stories.map(s=>[s.slug,s]));
  const ranked=rows.map(r=>({metrics:r,story:bySlug.get(r.slug)})).filter(x=>Boolean(x.story));
  return <main className="container trending-page"><div className="trending-hero"><p className="community-eyebrow"><Flame size={16}/> THE COMMUNITY DECIDES</p><h1>TRENDING <span>NOW.</span></h1><p>A real-time ranking based on unique daily play starts, approved comments and reactions over the past seven days. No paid placement or fabricated counters.</p></div>
    {ranked.length?<div className="trending-grid">{ranked.map(({metrics,story},index)=><div className="trending-entry" key={metrics.slug}><div className="trending-entry-top"><strong>#{String(index+1).padStart(2,"0")}</strong><span>{metrics.plays} PLAYS · {metrics.comments} COMMENTS · {metrics.reactions} REACTIONS</span></div><VideoCard story={story!} index={index}/></div>)}</div>
      :<div className="trending-empty"><TrendingUp size={51}/><h2>THE CHARTS START WITH YOU.</h2><p>Trending rankings will appear after published videos receive real plays and community activity. Demo clips never populate these charts.</p><Link className="button button-accent" href="/#discover">DISCOVER VIDEOS <ArrowUpRight size={17}/></Link></div>}
    <p className="trending-notes"><Star size={15} fill="currentColor"/> Daily play counts are deduplicated per browser, and engagement only counts within the seven-day window. These are activity indicators, not verified unique viewers or watch-time analytics.</p>
  </main>;
}
