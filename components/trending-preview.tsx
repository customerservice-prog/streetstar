import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";
import type { TrendingRow } from "@/lib/trending";
import type { Story } from "@/lib/content";
export function TrendingPreview({trending,stories}:{trending:TrendingRow[];stories:Story[]}){
  const names=new Map(stories.map(s=>[s.slug,s.title]));
  return <section className="container trending-preview" id="trending">
    <div><p className="community-eyebrow"><Flame size={15}/> STREETSTAR / REAL-TIME CULTURE</p><h2>WHAT'S <span>TRENDING?</span></h2><p>Ranked by actual daily play starts, reactions and approved discussion from the past seven days. No invented rankings.</p><Link href="/trending">EXPLORE THE CHARTS <ArrowUpRight size={16}/></Link></div>
    <div className="trending-preview-entries">
      {trending.length?trending.slice(0,3).map((r,i)=><Link key={r.slug} href={"/watch/"+r.slug}><strong>{String(i+1).padStart(2,"0")}</strong><span>{names.get(r.slug)||r.slug}</span><small>{r.plays} PLAYS</small></Link>):<p>Charts activate when published videos receive real plays and community activity.</p>}
    </div>
  </section>;
}
