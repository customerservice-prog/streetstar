"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, Clapperboard,
  Flame, Headphones, Play, Search, SlidersHorizontal, Sparkles,
  Star, X, Zap
} from "lucide-react";
import { categories, categoryLabel, type Story } from "@/lib/content";
import { VideoCard } from "@/components/video-card";
import { PosterImage } from "@/components/poster-image";
import { TrendingPreview } from "@/components/trending-preview";
import type { TrendingRow } from "@/lib/trending";

export function HomeFeed({ stories,spotlight,trending=[],trendingStories=[],total,page,pageCount,initialCategory,initialSearch,initialSort }: {
  stories:Story[];spotlight:Story[];trending?:TrendingRow[];trendingStories?:Story[];
  total:number;page:number;pageCount:number;initialCategory:string;initialSearch:string;initialSort:"newest"|"az";
}) {
  const router=useRouter();
  const [category,setCategory]=useState(initialCategory);
  const [search,setSearch]=useState(initialSearch);
  const [sort,setSort]=useState(initialSort);
  const lead=spotlight.find(item=>item.featured)||spotlight[0];
  const nextUp=spotlight.filter(item=>item.slug!==lead?.slug).slice(0,2);
  // Server-side filtering and 24-item pagination: no thousands of videos in browser memory.
  const filtered=stories;
  const pageUrl=(pageNumber:number,categoryValue=category,searchValue=search,sortValue=sort)=>{
    const params=new URLSearchParams();
    if(categoryValue!=="All")params.set("category",categoryValue);
    if(searchValue.trim())params.set("q",searchValue.trim().slice(0,100));
    if(sortValue!=="newest")params.set("sort",sortValue);
    if(pageNumber>1)params.set("page",String(pageNumber));
    const query=params.toString();
    return "/" + (query?"?"+query:"") + "#discover";
  };
  const applyCategory=(next:string)=>{setCategory(next);router.push(pageUrl(1,next));};
  const submitSearch=()=>router.push(pageUrl(1,category,search));
  const firstPage=Math.max(1,Math.min(pageCount-4,page-2));
  const pageNumbers=Array.from({length:Math.min(pageCount,5)},(_,i)=>firstPage+i);

  return (
    <main className="streetstar-home streetstar-v3">
      <section className="v3-front container" id="spotlight" aria-label="Bajo Mundo TV Viral front page">
        <div className="v3-masthead">
          <span className="v3-masthead-left"><span className="v3-live-dot" /> PORTADA VIRAL <span className="v3-masthead-slash">/</span> LA CULTURA EN MOVIMIENTO</span>
          <span className="v3-masthead-right">VIDEOS QUE DAN DE QUÉ HABLAR. <Star size={13} fill="currentColor" /></span>
        </div>
        <div className="v3-front-grid">
          {lead ? (
            <Link href={"/watch/" + lead.slug} className="v3-lead-story">
              <PosterImage src={lead.posterUrl} alt="" loading="eager" />
              <span className="v3-lead-shade" />
              <span className="v3-lead-grain" aria-hidden="true"/>
              <span className="v3-lead-top">
                <span className="v3-featured-pill"><Star size={14} fill="currentColor" /> VIDEO DESTACADO</span>
                <span className="v3-featured-issue">BAJO MUNDO TV / 001</span>
              </span>
              <span className="v3-lead-play" aria-hidden="true"><Play size={24} fill="currentColor" /></span>
              <span className="v3-lead-copy">
                <span className="v3-lead-category"><span>{categoryLabel(lead.category)}</span> / {lead.artist || "Bajo Mundo TV Viral"} {lead.isDemo && <span className="demo-pill">DEMO</span>}</span>
                <span className="v3-lead-title">{lead.title}</span>
                <span className="v3-lead-link"><span><Play size={16} fill="currentColor" /></span> VER VIDEO DESTACADO <ArrowUpRight size={18}/></span>
              </span>
              <span className="v3-lead-corner" aria-hidden="true">B / M</span>
            </Link>
          ) : (
            <div className="v3-lead-empty">
              <Star size={50} fill="currentColor" /><h1>THE PRÓXIMA HISTORIA.</h1>
              <Link className="button button-accent" href="/submit">ENVIAR VIDEO <ArrowUpRight size={17}/></Link>
            </div>
          )}
          <aside className="v3-front-aside">
            <div className="v3-front-identity">
              <div className="v3-front-identity-top"><span>BAJO MUNDO TV</span><span>EST. 2026 <Zap size={13} fill="currentColor"/></span></div>
              <h2>LA CALLE<br/><em>HABLA.</em><br/>EL MUNDO LO VE<span>.</span></h2>
              <p>Videos virales, entrevistas y cultura urbana. La calle tiene su canal.</p>
              <div className="v3-front-identity-bottom"><span>EL MUNDO ESTÁ MIRANDO</span><Star size={24} fill="currentColor" /></div>
            </div>
            <div className="v3-up-next">
              <div className="v3-up-next-heading"><span><Flame size={15}/> EN LA MIRA</span><span>{String(nextUp.length).padStart(2, "0")} PICKS</span></div>
              {nextUp.map((item, index) => (
                <Link href={"/watch/" + item.slug} className="v3-next-item" key={item.slug}>
                  <span className="v3-next-thumb"><PosterImage src={item.posterUrl} alt="" /><span className="v3-next-play"><Play size={14} fill="currentColor" /></span></span>
                  <span className="v3-next-copy">
                    <span className="v3-next-cat">{categoryLabel(item.category)} {item.isDemo && <span className="demo-pill">DEMO</span>}</span>
                    <strong>{item.title}</strong>
                    <span className="v3-next-watch">VER VIDEO <ArrowUpRight size={13}/></span>
                  </span>
                  <span className="v3-next-rank">0{index + 1}</span>
                </Link>
              ))}
              <Link className="v3-next-discover" href="#discover">VER TODOS LOS VIDEOS <ArrowRight size={15}/></Link>
            </div>
          </aside>
        </div>
        <div className="v3-front-bottom">
          <span>BAJO MUNDO TV · VIRAL · LA CALLE TIENE SU CANAL.</span>
          <a href="#discover">EXPLORAR VIDEOS <ArrowDown size={17}/></a>
        </div>
      </section>

      <div className="v3-ribbon" aria-label="Bajo Mundo TV Viral topics">
        <div className="v3-ribbon-track" aria-hidden="true">
          {Array.from({length:2},(_,i)=><div className="v3-ribbon-sequence" key={i}>
            <span>FARÁNDULA</span><Star size={13} fill="currentColor"/><span>VIRAL</span><Star size={13} fill="currentColor"/>
            <span>CULTURA</span><Star size={13} fill="currentColor"/><span>HISTORIAS</span><Star size={13} fill="currentColor"/>
            <span>BAJO MUNDO TV</span><Star size={13} fill="currentColor"/>
          </div>)}
        </div>
      </div>

      <TrendingPreview stories={trendingStories.length ? trendingStories : spotlight} trending={trending}/>
      <section className="container v3-discover" id="discover">
        <div className="v3-section-head">
          <div><div className="v3-eyebrow"><span className="v3-eyebrow-line"/> LOS ÚLTIMOS / LOS VIRALES</div><h2>LO <span>VIRAL.</span></h2><p>Los momentos, entrevistas y temas de los que todos están hablando.</p></div>
          <div className="v3-section-stamp" aria-hidden="true"><Star size={31} fill="currentColor"/><span>BAJO MUNDO TV<br/>ORIGINAL FEED</span></div>
        </div>
        <div className="v3-filter-bar">
          <div className="v3-filter-label"><Sparkles size={15}/> EXPLORAR CATEGORÍAS</div>
          <div className="categories" aria-label="Filter videos by category">
            {categories.map(item =>
              <button type="button" key={item} className={"filter-chip " + (category === item ? "selected" : "")}
                aria-pressed={category === item} onClick={() => applyCategory(item)}>
                {item === "All" && <Check size={13}/>} {item}
              </button>
            )}
          </div>
          <div className="search-sort">
            <form className="viral-search-form" role="search" onSubmit={e=>{e.preventDefault();submitSearch();}}>
              <label className="feed-search"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar videos o artistas" maxLength={100} aria-label="Buscar videos o artistas"/>{search && <button type="button" onClick={()=>{setSearch("");router.push(pageUrl(1,category,""));}} aria-label="Limpiar búsqueda"><X size={16}/></button>}</label>
              <button className="viral-search-submit" type="submit">BUSCAR</button>
            </form>
            <label className="sort-control"><SlidersHorizontal size={17}/><select aria-label="Ordenar videos" value={sort} onChange={e=>{const next=e.target.value as "newest"|"az";setSort(next);router.push(pageUrl(1,category,search,next));}}><option value="newest">Más recientes</option><option value="az">A–Z</option></select></label>
          </div>
        </div>

        <div className="v3-feed-head" id="latest"><span><Clapperboard size={18}/> ÚLTIMOS VIDEOS</span><span>{total.toLocaleString("es-DO")} {total === 1 ? "VIDEO" : "VIDEOS"} · PÁGINA {page} DE {pageCount}</span></div>
        {filtered.length ?
          <div className="video-grid v3-video-grid">
            {filtered.map((story, index) => <VideoCard story={story} key={story.slug} index={(page-1)*24+index}/>)}
          </div>
          : <div className="no-results"><Search size={37}/><h3>NO ENCONTRAMOS VIDEOS</h3><p>Prueba otra categoría o búsqueda.</p><button className="button button-outline" onClick={() => {setSearch("");setCategory("All");setSort("newest");router.push("/#discover");}}>LIMPIAR FILTROS</button></div>}
        {pageCount>1 && <nav className="viral-pagination" aria-label="Páginas de videos">
          {page>1 ? <Link href={pageUrl(page-1)}>← ANTERIOR</Link> : <span className="is-disabled">← ANTERIOR</span>}
          {firstPage>1 && <span aria-hidden="true">…</span>}
          {pageNumbers.map(n=><Link key={n} href={pageUrl(n)} aria-current={n===page?"page":undefined} className={n===page?"is-current":""}>{n}</Link>)}
          {pageNumbers[pageNumbers.length-1]<pageCount && <span aria-hidden="true">…</span>}
          {page<pageCount ? <Link href={pageUrl(page+1)}>SIGUIENTE →</Link> : <span className="is-disabled">SIGUIENTE →</span>}
        </nav>}
        {pageCount>1 && <p className="viral-pagination-note">24 videos por página · Búsqueda en toda la biblioteca</p>}
      </section>

      <section className="container v3-creator">
        <div className="v3-creator-back" aria-hidden="true"><span>TU HISTORIA</span><span>TU ESCENARIO</span></div>
        <div className="v3-creator-copy"><span className="v3-eyebrow"><span className="v3-eyebrow-line"/> LOS VIDEOS DE NUESTRA GENTE</span>
          <h2>¿TIENES<br/>ALGO<br/><em>VIRAL?</em></h2>
          <p>Make some noise. Envía tu video a Bajo Mundo TV para revisión editorial.</p>
          <Link href="/submit" className="v3-creator-cta">ENVIAR TU VIDEO <ArrowUpRight size={18}/></Link>
        </div>
        <div className="v3-creator-badge" aria-hidden="true"><Star size={80} fill="currentColor"/><span>BAJO MUNDO TV</span></div>
      </section>

      <div className="container v3-endline"><span><Star size={14} fill="currentColor"/> LA CALLE TIENE SU CANAL.</span><Link href="#spotlight">VOLVER ARRIBA <ArrowUpRight size={16}/></Link></div>
    </main>
  );
}
