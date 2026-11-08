import Link from "next/link";
import { ArrowUpRight, Menu, Play, Search, Star } from "lucide-react";

export function SiteHeader() {
  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" />
        THE CULTURE DOESN&apos;T WAIT. NEITHER DO WE.
        <span className="announcement-end">INDEPENDENT. UNFILTERED. NEXT UP.</span>
      </div>
      <header className="site-header">
        <div className="container header-row">
          <Link className="brand" href="/" aria-label="StreetStar home">
            <span className="brand-mark"><Star size={24} fill="currentColor" strokeWidth={1.7} /></span>
            <span>STREET<span className="brand-accent">STAR</span><span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/">Home</Link>
            <Link href="/#latest">Latest</Link>
            <Link href="/#discover">Discover</Link>
            <Link href="/submit">For creators</Link>
          </nav>
          <div className="header-actions">
            <Link className="header-search" href="/#discover" aria-label="Find videos"><Search size={20} /></Link>
            <Link className="button button-accent header-submit" href="/submit">SUBMIT A VIDEO <ArrowUpRight size={15} /></Link>
            <details className="mobile-menu">
              <summary aria-label="Open navigation"><Menu size={22} /></summary>
              <div className="mobile-menu-items">
                <Link href="/"><Play size={15} /> Home</Link>
                <Link href="/#latest">Latest videos</Link>
                <Link href="/#discover">Discover</Link>
                <Link href="/submit">Submit video <ArrowUpRight size={15} /></Link>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
