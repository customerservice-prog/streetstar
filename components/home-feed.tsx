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

export function HomeFeed({ stories }: { stories: Story[] }) {
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
      <section className="v3-front container" id="spotlight" aria-label="StreetStar front page">
        <div className="v3-masthead">
          <span className="v3-masthead-left"><span className="v3-live-dot" /> THE FRONT PAGE <span className="v3-masthead-slash">/</span> THE CULTURE IN MOTION</span>
          <span className="v3-masthead-right">INDEPENDENT VOICES. BIG MOMENTS. <Star size={13} fill="currentColor" /></span>
        </div>
        <div className="v3-front-grid">
          {lead ? (
            <Link href={"/watch/" + lead.slug} className="v3-lead-story">
              <PosterImage src={lead.posterUrl} alt="" loading="eager" />
              <span className="v3-lead-shade" />
              <span className="v3-lead-grain" aria-hidden="true"/>
              <span className="v3-lead-top">
                <span className="v3-featured-pill"><Star size={14} fill="currentColor" /> COVER STORY</span>
                <span className="v3-featured-issue">STREETSTAR / 001</span>
              </span>
              <span className="v3-lead-play" aria-hidden="true"><Play size={24} fill="currentColor" /></span>
              <span className="v3-lead-copy">
                <span className="v3-lead-category"><span>{lead.category.toUpperCase()}</span> / {lead.artist || "StreetStar"} {lead.isDemo && <span className="demo-pill">DEMO</span>}</span>
                <span className="v3-lead-title">{lead.title}</span>
                <span className="v3-lead-link"><span><Play size={16} fill="currentColor" /></span> WATCH FEATURED VIDEO <ArrowUpRight size={18}/></span>
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
              <div className="v3-front-identity-top"><span>STREETSTAR</span><span>EST. 2026 <Zap size={13} fill="currentColor"/></span></div>
              <h2>MORE THAN<br/><em>A MOMENT.</em><br/>IT&apos;S CULTURE<span>.</span></h2>
              <p>New sounds, bold stories, and the moments that move us.</p>
              <div className="v3-front-identity-bottom"><span>THE WORLD IS WATCHING</span><Star size={24} fill="currentColor" /></div>
            </div>
            <div className="v3-up-next">
              <div className="v3-up-next-heading"><span><Flame size={15}/> ON OUR RADAR</span><span>{String(nextUp.length).padStart(2, "0")} PICKS</span></div>
              {nextUp.map((item, index) => (
                <Link href={"/watch/" + item.slug} className="v3-next-item" key={item.slug}>
                  <span className="v3-next-thumb"><PosterImage src={item.posterUrl} alt="" /><span className="v3-next-play"><Play size={14} fill="currentColor" /></span></span>
                  <span className="v3-next-copy">
                    <span className="v3-next-cat">{item.category.toUpperCase()} {item.isDemo && <span className="demo-pill">DEMO</span>}</span>
                    <strong>{item.title}</strong>
                    <span className="v3-next-watch">WATCH STORY <ArrowUpRight size={13}/></span>
                  </span>
                  <span className="v3-next-rank">0{index + 1}</span>
                </Link>
              ))}
              <Link className="v3-next-discover" href="#discover">EXPLORE THE FULL FEED <ArrowRight size={15}/></Link>
            </div>
          </aside>
        </div>
        <div className="v3-front-bottom">
          <span>BUILT FOR THE UNEXPECTED. CURATED FOR THE CULTURE.</span>
          <a href="#discover">SCROLL TO DISCOVER <ArrowDown size={17}/></a>
        </div>
      </section>

      <div className="v3-ribbon" aria-label="StreetStar topics">
        <div className="v3-ribbon-track" aria-hidden="true">
          {Array.from({length:2},(_,i)=><div className="v3-ribbon-sequence" key={i}>
            <span>MUSIC</span><Star size={13} fill="currentColor"/><span>VIRAL</span><Star size={13} fill="currentColor"/>
            <span>CULTURE</span><Star size={13} fill="currentColor"/><span>REAL STORIES</span><Star size={13} fill="currentColor"/>
            <span>STREETSTAR</span><Star size={13} fill="currentColor"/>
          </div>)}
        </div>
      </div>

      <section className="container v3-discover" id="discover">
        <div className="v3-section-head">
          <div><div className="v3-eyebrow"><span className="v3-eyebrow-line"/> THE LATEST / THE UNMISSABLE</div><h2>THE <span>DROP.</span></h2><p>The new voices, the headlines, and everything making noise right now.</p></div>
          <div className="v3-section-stamp" aria-hidden="true"><Star size={31} fill="currentColor"/><span>STREETSTAR<br/>ORIGINAL FEED</span></div>
        </div>
        <div className="v3-filter-bar">
          <div className="v3-filter-label"><Sparkles size={15}/> EXPLORE BY CATEGORY</div>
          <div className="categories" aria-label="Filter videos by category">
            {categories.map(item =>
              <button type="button" key={item} className={"filter-chip " + (category === item ? "selected" : "")}
                aria-pressed={category === item} onClick={() => applyCategory(item)}>
                {item === "All" && <Check size={13}/>} {item}
              </button>
            )}
          </div>
          <div className="search-sort">
            <label className="feed-search"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search videos or artists" aria-label="Search videos or artists" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={16}/></button>}</label>
            <label className="sort-control"><SlidersHorizontal size={17}/><select aria-label="Sort videos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest</option><option value="az">A–Z</option></select></label>
          </div>
        </div>

        <div className="v3-feed-head" id="latest"><span><Clapperboard size={18}/> LATEST DROPS</span><span>{filtered.length} {filtered.length === 1 ? "VIDEO" : "VIDEOS"}</span></div>
        {filtered.length ?
          <div className="video-grid v3-video-grid">
            {filtered.map((story, index) => <VideoCard story={story} key={story.slug} index={index}/>)}
          </div>
          : <div className="no-results"><Search size={37}/><h3>NO STORIES FOUND</h3><p>Try another category or search term.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("All"); }}>RESET FILTERS</button></div>}
      </section>

      <section className="container v3-creator">
        <div className="v3-creator-back" aria-hidden="true"><span>YOUR STORY</span><span>YOUR STAGE</span></div>
        <div className="v3-creator-copy"><span className="v3-eyebrow"><span className="v3-eyebrow-line"/> FOR THE PEOPLE MAKING CULTURE</span>
          <h2>GOT<br/>SOMETHING<br/><em>REAL?</em></h2>
          <p>Make some noise. Send your video to the StreetStar editorial team for review.</p>
          <Link href="/submit" className="v3-creator-cta">SUBMIT YOUR VIDEO <ArrowUpRight size={18}/></Link>
        </div>
        <div className="v3-creator-badge" aria-hidden="true"><Star size={80} fill="currentColor"/><span>STREETSTAR</span></div>
      </section>

      <div className="container v3-endline"><span><Star size={14} fill="currentColor"/> THE CULTURE DOESN&apos;T WAIT.</span><Link href="#spotlight">BACK TO TOP <ArrowUpRight size={16}/></Link></div>
    </main>
  );
}
