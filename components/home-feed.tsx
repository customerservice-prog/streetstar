"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown, ArrowRight, ArrowUpRight, Clapperboard, Flame,
  Headphones, Play, Radio, Search, SlidersHorizontal, Sparkles,
  TrendingUp, X, Star, Zap, MoveUpRight
} from "lucide-react";
import { categories, type Story } from "@/lib/content";
import { VideoCard } from "@/components/video-card";
import { PosterImage } from "@/components/poster-image";

export function HomeFeed({ stories }: { stories: Story[] }) {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const lead = stories.find(item => item.featured) || stories[0];
  const secondary = stories.filter(item => item.slug !== lead?.slug).slice(0, 2);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matching = stories.filter(item =>
      (category === "All" || item.category === category) &&
      (!q || (item.title + " " + item.artist + " " + item.category + " " + item.description).toLowerCase().includes(q))
    );
    return [...matching].sort((a, b) =>
      sort === "az" ? a.title.localeCompare(b.title) : Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
  }, [stories, category, search, sort]);

  return (
    <main className="streetstar-home">
      <section className="showcase-hero" aria-label="Featured StreetStar stories">
        <div className="showcase-background" aria-hidden="true">
          <PosterImage src={lead?.posterUrl} loading="eager" />
        </div>
        <div className="showcase-scrim" aria-hidden="true" />
        <div className="showcase-glow showcase-glow-one" aria-hidden="true" />
        <div className="showcase-glow showcase-glow-two" aria-hidden="true" />
        <div className="showcase-gridlines" aria-hidden="true" />

        <div className="container showcase-inner">
          <div className="showcase-topline">
            <span className="showcase-live"><span className="live-dot" /> THE CULTURE DOESN&apos;T WAIT</span>
            <span className="showcase-edition">INDEPENDENT VIDEO CULTURE <span className="showcase-topline-divider">/</span> EST. 2026</span>
          </div>

          <div className="showcase-body">
            <div className="showcase-copy">
              <div className="showcase-intro"><Zap size={14} fill="currentColor" /> A DIFFERENT KIND OF FRONT PAGE <span className="showcase-intro-line" /></div>
              <h1 className="showcase-headline">
                <span>STREET</span>
                <span className="outline-line">LEVEL<span className="headline-period">.</span></span>
                <span className="lime-line">STAR</span>
                <span>POWER<span className="headline-period">.</span></span>
              </h1>
              <p className="showcase-description">The stories everyone&apos;s talking about. The artists everyone will know. Culture lives here — and it never stands still.</p>
              <div className="showcase-buttons">
                {lead && <Link href={"/watch/" + lead.slug} className="showcase-primary">
                  <span className="showcase-primary-icon"><Play size={18} fill="currentColor" /></span>
                  WATCH FEATURED VIDEO
                  <ArrowUpRight size={18} />
                </Link>}
                <Link href="#discover" className="showcase-secondary">EXPLORE THE FEED <ArrowDown size={17} /></Link>
              </div>
            </div>

            {lead && <Link href={"/watch/" + lead.slug} className="showcase-feature-card">
              <div className="showcase-card-head">
                <span><span className="tiny-lime-dot" /> EDITOR&apos;S PICK</span>
                <span className="showcase-card-serial">FEATURE / 001</span>
              </div>
              <div className="showcase-card-image">
                <PosterImage src={lead.posterUrl} alt="" loading="eager" />
                <span className="showcase-card-play"><Play size={20} fill="currentColor" /></span>
                <span className="showcase-card-corner"><MoveUpRight size={18}/></span>
              </div>
              <div className="showcase-card-copy">
                <div className="showcase-card-meta">
                  <span>{lead.category.toUpperCase()} / {lead.artist.toUpperCase()}</span>
                  {lead.isDemo && <span className="demo-pill">DEMO</span>}
                </div>
                <h2>{lead.title}</h2>
                <span className="showcase-card-link">WATCH THE FEATURE <ArrowUpRight size={17} /></span>
              </div>
            </Link>}
          </div>

          <div className="showcase-bottomline">
            <div className="showcase-bottom-categories">
              <span><Star size={14} fill="currentColor" /> MUSIC</span>
              <span><Flame size={14} /> VIRAL</span>
              <span><Radio size={14} /> CULTURE</span>
              <span><Headphones size={14} /> ORIGINAL VOICES</span>
            </div>
            <Link href="#spotlight" className="showcase-scroll">KEEP EXPLORING <span><ArrowDown size={15}/></span></Link>
          </div>
        </div>
        <span className="showcase-vertical-word" aria-hidden="true">STREETSTAR / 2026</span>
      </section>

      <div className="premium-ticker" aria-label="StreetStar content categories">
        <div className="premium-ticker-track">
          {Array.from({ length: 2 }, (_, copy) => (
            <div className="premium-ticker-sequence" key={copy} aria-hidden={copy === 1}>
              <span>THE CULTURE MOVES HERE</span><Star fill="currentColor" />
              <span>NEW MUSIC</span><Star fill="currentColor" />
              <span>REAL STORIES</span><Star fill="currentColor" />
              <span>FRESH PERSPECTIVES</span><Star fill="currentColor" />
            </div>
          ))}
        </div>
      </div>

      {secondary.length > 0 && <section className="container spotlight-section" id="spotlight">
        <div className="spotlight-heading">
          <div><span className="micro-label"><span className="section-marker" /> FRESHLY SELECTED</span><h2>ON OUR <span>RADAR.</span></h2></div>
          <div className="spotlight-side-note"><Sparkles size={16}/><span>THE NEXT THING YOU NEED TO SEE.</span></div>
        </div>
        <div className="spotlight-grid">
          {secondary.map((item, index) => (
            <Link href={"/watch/" + item.slug} className="spotlight-story" key={item.slug}>
              <div className="spotlight-image">
                <PosterImage src={item.posterUrl} alt="" />
                <div className="spotlight-image-vignette" />
                <span className="spotlight-rank">0{index + 1}</span>
                <span className="spotlight-play"><Play size={22} fill="currentColor" /></span>
              </div>
              <div className="spotlight-story-copy">
                <div className="spotlight-story-meta"><span>{item.category.toUpperCase()}</span><span className="spotlight-separator">/</span><span>{item.artist}</span>{item.isDemo && <span className="demo-pill">DEMO</span>}</div>
                <h3>{item.title}</h3>
                <span className="spotlight-arrow"><ArrowUpRight size={21} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>}

      <section className="container discover-section discover-premium" id="discover">
        <div className="discover-heading">
          <div>
            <p className="micro-label"><span className="section-marker" /> YOUR WORLD, YOUR FEED</p>
            <h2>FIND YOUR <span>NEXT</span><br/>OBSESSION<span className="headline-period">.</span></h2>
            <p className="discover-lede">Dive into music, big moments, bold voices, and everything making noise.</p>
          </div>
          <div className="discover-heading-art" aria-hidden="true"><span className="discover-art-circle"><Star size={57} fill="currentColor"/></span><span>SS / FEED</span></div>
        </div>

        <div className="feed-toolbar">
          <div className="categories" aria-label="Filter by category">
            {categories.map(item =>
              <button type="button" key={item} onClick={() => setCategory(item)}
                className={"filter-chip " + (category === item ? "selected" : "")} aria-pressed={category === item}>
                {item === "All" && <Zap size={13} fill="currentColor" />} {item}
              </button>
            )}
          </div>
          <div className="search-sort">
            <label className="feed-search"><Search size={17}/><input placeholder="Search stories, artists..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search videos" />{search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15}/></button>}</label>
            <label className="sort-control"><SlidersHorizontal size={17}/><select aria-label="Sort videos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="az">A–Z</option></select></label>
          </div>
        </div>
        <div className="feed-result-header" id="latest"><span><Clapperboard size={18}/> THE LATEST DROPS <span className="feed-result-count">{String(filtered.length).padStart(2, "0")}</span></span><span>STAY IN THE LOOP <ArrowDown size={15}/></span></div>
        {filtered.length ?
          <div className="video-grid">{filtered.map((story, index) => <VideoCard story={story} key={story.slug} index={index}/>)}</div>
          : <div className="no-results"><Search size={35}/><h3>NO STORIES FOUND</h3><p>Try another search or category.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("All"); }}>RESET FILTERS</button></div>}
      </section>

      <section className="container creator-banner creator-banner-premium">
        <div className="creator-orbit orbit-one" aria-hidden="true"/><div className="creator-orbit orbit-two" aria-hidden="true"/>
        <div className="creator-halo" aria-hidden="true" />
        <div className="creator-message">
          <p className="micro-label"><span className="section-marker" /> CREATORS, THE STAGE IS YOURS</p>
          <h2>GOT THE<br/><em>NEXT BIG</em><br/>THING<span className="headline-period">?</span></h2>
          <p>Your music. Your story. Your moment. Send your video to our editorial team and put it on our radar.</p>
          <Link href="/submit" className="button button-accent">GET ON OUR RADAR <ArrowUpRight size={18}/></Link>
        </div>
        <div className="creator-graphic"><span>YOUR</span><strong>STAGE.</strong><span>YOUR</span><strong>MOMENT.</strong><div className="creator-star"><Star size={115} fill="currentColor"/></div></div>
        <div className="creator-banner-bottom">STREETSTAR / THE NEXT GENERATION OF VOICES</div>
      </section>

      <div className="container bottom-manifesto"><span>BUILT FOR WHAT&apos;S NEXT.</span><ArrowRight size={22}/><strong>THIS IS STREETSTAR.</strong></div>
    </main>
  );
}
