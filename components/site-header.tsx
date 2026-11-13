import Link from "next/link";
import { ArrowUpRight, Flame, Menu, Play, Search, UserRound } from "lucide-react";
import { AccountIndicator } from "@/components/account-indicator";

export function SiteHeader() {
  return (
    <>
      <div className="announcement announcement-premium bajo-announcement">
        <span className="announcement-start"><span className="announcement-dot" /> LA CALLE TIENE SU CANAL</span>
        <span className="announcement-center">VIRAL <span>✳</span> FÁRANDULA <span>✳</span> CULTURA URBANA</span>
        <span className="announcement-end">BAJO MUNDO TV · VIRAL</span>
      </div>
      <header className="site-header site-header-premium">
        <div className="container header-row">
          <Link className="brand brand-premium bajo-brand" href="/" aria-label="Bajo Mundo TV Viral — inicio">
            <img className="bajo-official-logo" src="https://bajomundotv.com/brand-logo-cutout.png" width="82" height="74" alt="Bajo Mundo TV" />
            <span className="bajo-brand-words">BAJO MUNDO <strong>TV</strong><small>VIRAL</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Navegación principal">
            <Link href="/"><span>01</span> INICIO</Link>
            <Link href="/trending"><span>02</span> TENDENCIAS</Link>
            <Link href="/#discover"><span>03</span> VIDEOS</Link>
            <Link href="/submit"><span>04</span> ENVIAR VIDEO</Link>
          </nav>
          <div className="header-actions">
            <Link className="header-search" href="/#discover" aria-label="Buscar videos"><Search size={20} /></Link>
            <AccountIndicator />
            <a className="button button-accent header-submit" href="https://bajomundotv.com/" target="_blank" rel="noopener noreferrer"><Play size={15} fill="currentColor" /> TV EN VIVO <ArrowUpRight size={16} /></a>
            <details className="mobile-menu">
              <summary aria-label="Abrir menú"><Menu size={23} /></summary>
              <div className="mobile-menu-items">
                <Link href="/"><Flame size={15} /> INICIO</Link>
                <Link href="/trending">TENDENCIAS</Link>
                <Link href="/#discover">TODOS LOS VIDEOS</Link>
                <Link href="/account"><UserRound size={15} /> MI CUENTA</Link>
                <Link href="/submit">ENVIAR VIDEO <ArrowUpRight size={15} /></Link>
                <a href="https://bajomundotv.com/" target="_blank" rel="noopener noreferrer">TV 24/7 <ArrowUpRight size={15} /></a>
              </div>
            </details>
          </div>
        </div>
      </header>
    </>
  );
}
