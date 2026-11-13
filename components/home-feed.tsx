"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, Clapperboard,
  Flame, Headphones, Play, Search, SlidersHorizontal, Sparkles,
  Star, X, Zap
} from "lucide-react";
import { categories, type Story } from "@/lib/content";
import { VideoCard } from "@/components/video-card";
import { PosterImage } from "@/components/poster-image";
import { TrendingPreview } from "@/components/trending-preview";
import type { TrendingRow } from "@/lib/trending";

export function HomeFeed({ stories,trending=[] }: { stories: Story[];trending?:TrendingRow[] }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const lead = stories.find(item => item.featured) || stories[0];
  const nextUp = stories.filter(item => item.slug !== lead?.slug).slice(0, 2);
  const promotedSlugs = useMemo(() =>
    new Set([lead?.slug, ...nextUp.map(item => item.slug)].filter(Boolean)),
    [lead?.slug, nextUp.map(item => item.slug).join("|")]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    // On the default feed, avoid showing the three prominently featured items again.
    // With fewer than 7 stories, or on an explicit search/filter, show the full library.
    const library = category === "All" && !q && stories.length >= 7
      ? stories.filter(item => !promotedSlugs.has(item.slug))
      : stories;

    return library
      .filter(item => (category === "All" || item.category === category) &&
        (!q || (item.title + " " + item.artist + " " + item.category + " " + item.description).toLowerCase().includes(q)))
      .sort((a, b) =>
        sort === "az" ? a.title.localeCompare(b.title) : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [stories, category, search, sort, promotedSlugs]);

  const applyCategory = (next: string) => {
    setCategory(next);
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  };

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
                <span className="v3-lead-category"><span>{lead.category.toUpperCase()}</span> / {lead.artist || "Bajo Mundo TV Viral"} {lead.isDemo && <span className="demo-pill">DEMO</span>}</span>
                <span className="v3-lead-title">{lead.title}</span>
                <span className="v3-lead-link"><span><Play size={16} fill="currentColor" /></span> VER VIDEO DESTACADO <ArrowUpRight size={18}/></span>
              </span>
              <span className="v3-lead-corner" aria-hidden="true">S / S</span>
            </Link>
          ) : (
            <div className="v3-lead-empty">
              <Star size={50} fill="currentColor" /><h1>THE NEXT STORY STARTS HERE.</h1>
              <Link className="button button-accent" href="/submit">SUBMIT A VIDEO <ArrowUpRight size={17}/></Link>
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
                    <span className="v3-next-cat">{item.category.toUpperCase()} {item.isDemo && <span className="demo-pill">DEMO</span>}</span>
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

      <TrendingPreview stories={stories} trending={trending}/>
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
            <label className="feed-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar videos o artistas" aria-label="Buscar videos o artistas" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16}/></button>}</label>
            <label className="sort-control"><SlidersHorizontal size={17}/><select aria-label="Sort videos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
          </div>
        </div>

        <div className="v3-feed-head" id="latest"><span><Clapperboard size={18}/> ÚLTIMOS VIDEOS</span><span>{filtered.length} {filtered.length === 1 ? "VIDEO" : "VIDEOS"}</span></div>
        {filtered.length ?
          <div className="video-grid v3-video-grid">
            {filtered.map((story, index) => <VideoCard story={story} key={story.slug} index={index}/>)}
          </div>
          : <div className="no-results"><Search size={37}/><h3>NO ENCONTRAMOS VIDEOS</h3><p>Prueba otra categoría o búsqueda.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("All"); }}>LIMPIAR FILTROS</button></div>}
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
