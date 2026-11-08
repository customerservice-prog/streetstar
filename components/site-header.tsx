import Link from "next/link";
import { ArrowUpRight, Menu, Play, Search, Star, Zap } from "lucide-react";
import { AccountIndicator } from "@/components/account-indicator";

export function SiteHeader() {
  return (
    <>
      <div className="announcement announcement-premium">
        <span className="announcement-start"><span className="announcement-dot" /> THE CULTURE MOVES HERE</span>
        <span className="announcement-center">LOUDER STORIES <span>✳</span> BIGGER MOMENTS <span>✳</span> REAL VOICES</span>
        <span className="announcement-end">INDEPENDENT BY DESIGN / EST. 2026</span>
      </div>
      <header className="site-header site-header-premium">
        <div className="container header-row">
          <Link className="brand brand-premium" href="/" aria-label="StreetStar home">
            <span className="brand-mark"><Star size={24} fill="currentColor" strokeWidth={1.7} /></span>
            <span>STREET<span className="brand-accent">STAR</span><span className="brand-period">.</span></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="/"><span>01</span> HOME</Link>
            <Link href="/trending"><span>02</span> TRENDING</Link>
            <Link href="/#discover"><span>03</span> DISCOVER</Link>
            <Link href="/submit"><span>04</span> FOR CREATORS</Link>
          </nav>
          <div className="header-actions">
            <Link className="header-search" href="/#discover" aria-label="Find videos"><Search size={20} /></Link><AccountIndicator/>
            <Link className="button button-accent header-submit" href="/submit"><Zap size={15} fill="currentColor" /> GET FEATURED <ArrowUpRight size={16} /></Link>
            <details className="mobile-menu">
              <summary aria-label="Open navigation"><Menu size={23} /></summary>
              <div className="mobile-menu-items">
                <Link href="/"><Play size={15} /> HOME</Link>
                <Link href="/trending">TRENDING</Link>
                <Link href="/#discover">DISCOVER</Link><Link href="/account"><UserRound size={15}/> MY ACCOUNT</Link>
                <Link href="/submit">SUBMIT YOUR VIDEO <ArrowUpRight size={15} /></Link>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
