"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, Clapperboard, Flame, Play, Radio, Search, SlidersHorizontal, Sparkles, TrendingUp, X } from "lucide-react";
import { categories, type Story } from "@/lib/content";
import { VideoCard } from "@/components/video-card";

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
    return [...matching].sort((a, b) => sort === "az" ? a.title.localeCompare(b.title) : Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [stories, category, search, sort]);

  return (
    <main>
      <section className="lead-section container">
        <div className="eyebrow-row"><span className="section-marker" /> <span>THE FRONT PAGE</span><span className="eyebrow-rule" /><span className="issue-label">THE STORIES. THE SOUNDS. THE STREETS.</span></div>
        <div className="lead-grid">
          <div className="feature-main">
            {lead ? <Link href={"/watch/" + lead.slug} className="feature-main-link">
              <div className="feature-image">
                {lead.posterUrl && <img src={lead.posterUrl} alt="" />}
                <div className="feature-shade" />
                <span className="feature-badge"><Flame size={15} /> EDITOR&apos;S PICK</span>
                <span className="feature-play" aria-hidden="true"><Play size={27} fill="currentColor" /></span>
                <div className="feature-caption">
                  <div className="feature-kicker"><span>{lead.category.toUpperCase()}</span> / {lead.artist.toUpperCase()} {lead.isDemo && <span className="demo-pill">DEMO</span>}</div>
                  <h1>{lead.title}</h1>
                  <span className="feature-cta">WATCH THE STORY <ArrowUpRight size={19} /></span>
                </div>
              </div>
            </Link> : <div className="empty-feature">THE NEXT STORY STARTS HERE.</div>}
          </div>
          <div className="feature-side">
            <div className="side-top"><span><Radio size={15} /> ON OUR RADAR</span><span>01 / 02</span></div>
            {secondary.map((item, index) => (
              <Link href={"/watch/" + item.slug} className="side-story" key={item.slug}>
                <div className="side-art">
                  {item.posterUrl && <img src={item.posterUrl} alt="" />}
                  <span className="side-play"><Play fill="currentColor" size={17} /></span>
                </div>
                <div className="side-description">
                  <span className="side-category">{item.category.toUpperCase()} {item.isDemo ? " · DEMO" : ""}</span>
                  <h2>{item.title}</h2>
                  <span>WATCH NOW <ArrowUpRight size={13} /></span>
                </div>
                <span className="side-index">0{index + 1}</span>
              </Link>
            ))}
            <div className="side-footer"><Sparkles size={16} /><span>NEW VOICES. BIG STORIES. ZERO BORING.</span></div>
          </div>
        </div>
      </section>

      <div className="ticker-band" aria-label="StreetStar editorial categories">
        <div className="ticker-track"><span>STREET CULTURE</span><Star fill="currentColor" size={16}/><span>REAL STORIES</span><Star fill="currentColor" size={16}/><span>NEW MUSIC</span><Star fill="currentColor" size={16}/><span>WHAT&apos;S NEXT</span><Star fill="currentColor" size={16}/><span>STREET CULTURE</span><Star fill="currentColor" size={16}/><span>REAL STORIES</span></div>
      </div>

      <section className="container discover-section" id="discover">
        <div className="section-heading"><div><p className="micro-label"><span className="section-marker" /> YOUR WORLD, YOUR FEED</p><h2>THE <span>DISCOVER</span> FEED</h2><p>Culture moves fast. Find what matters to you.</p></div><div className="heading-icon"><TrendingUp size={30}/></div></div>
        <div className="feed-toolbar">
          <div className="categories" aria-label="Filter by category">
            {categories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={"filter-chip " + (category === item ? "selected" : "")} aria-pressed={category === item}>{item}</button>)}
          </div>
          <div className="search-sort">
            <label className="feed-search"><Search size={17}/><input placeholder="Search stories, artists..." value={search} onChange={e => setSearch(e.target.value)} aria-label="Search videos" />{search && <button aria-label="Clear search" onClick={() => setSearch("")}><X size={15}/></button>}</label>
            <label className="sort-control"><SlidersHorizontal size={17}/><select aria-label="Sort videos" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="az">A–Z</option></select></label>
          </div>
        </div>
        <div className="feed-result-header" id="latest"><span><Clapperboard size={18}/> LATEST DROPS</span><span>{filtered.length} {filtered.length === 1 ? "STORY" : "STORIES"} <ArrowDown size={14}/></span></div>
        {filtered.length ? <div className="video-grid">{filtered.map((story, index) => <VideoCard story={story} key={story.slug} index={index}/>)}</div> : <div className="no-results"><Search size={35}/><h3>NO STORIES FOUND</h3><p>Try another search or category.</p><button className="button button-outline" onClick={() => { setSearch(""); setCategory("All"); }}>RESET FILTERS</button></div>}
      </section>

      <section className="container creator-banner">
        <div className="creator-halo" />
        <div className="creator-message"><p className="micro-label"><span className="section-marker" /> FOR THE NEXT GENERATION</p><h2>GOT SOMETHING<br/><em>THE WORLD</em> SHOULD SEE?</h2><p>Your music. Your story. Your moment. Submit your video for editorial consideration.</p><Link href="/submit" className="button button-accent">SUBMIT YOUR VIDEO <ArrowUpRight size={17}/></Link></div>
        <div className="creator-graphic"><span>YOUR</span><strong>STAGE.</strong><span>OUR</span><strong>WORLD.</strong><div className="creator-star"><Star size={88} fill="currentColor"/></div></div>
      </section>
      <div className="container bottom-manifesto"><span>BUILT FOR WHAT&apos;S NEXT.</span><ArrowRight size={22}/><strong>THIS IS STREETSTAR.</strong></div>
    </main>
  );
}
