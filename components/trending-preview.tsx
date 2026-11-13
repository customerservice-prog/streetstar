import Link from "next/link";
import { ArrowUpRight, Flame } from "lucide-react";
import type { TrendingRow } from "@/lib/trending";
import type { Story } from "@/lib/content";
export function TrendingPreview({trending,stories}:{trending:TrendingRow[];stories:Story[]}){
  const names=new Map(stories.map(s=>[s.slug,s.title]));
  return <section className="container trending-preview" id="trending">
    <div><p className="community-eyebrow"><Flame size={15}/> BAJO MUNDO TV / REAL-TIME CULTURE</p><h2>LO MÁS <span>VIRAL.</span></h2><p>Clasificación basada en reproducciones y participación real durante los últimos siete días.</p><Link href="/trending">VER TENDENCIAS <ArrowUpRight size={16}/></Link></div>
    <div className="trending-preview-entries">
      {trending.length?trending.slice(0,3).map((r,i)=><Link key={r.slug} href={"/watch/"+r.slug}><strong>{String(i+1).padStart(2,"0")}</strong><span>{names.get(r.slug)||r.slug}</span><small>{r.plays} REPRODUCCIONES</small></Link>):<p>Las tendencias aparecerán cuando los videos reciban reproducciones y reacciones reales.</p>}
    </div>
  </section>;
}
