import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Instagram, Mail, Star, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import "./editorial-v3.css";
import "./community.css";
import "./member.css";
import "./analytics.css";
import "./bajo-mundo-viral.css";

export const metadata: Metadata = {
  title: { default: "Bajo Mundo TV Viral | The Culture Doesn't Wait", template: "%s | Bajo Mundo TV Viral" },
  description: "Bajo Mundo TV Viral reúne videos virales, entrevistas, farándula y cultura urbana en un solo lugar.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: "Bajo Mundo TV Viral", description: "La calle tiene su canal. Videos virales, entrevistas y cultura urbana.", type: "website" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="container footer-top">
            <div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark"><Star size={22} fill="currentColor"/></span><span>STREET<span className="brand-accent">STAR</span><span className="brand-period">.</span></span></Link><p>Videos virales, farándula, entrevistas y cultura urbana. Una marca, dos experiencias.</p></div>
            <div className="footer-links"><h3>EXPLORE</h3><Link href="/">Inicio</Link><a href="https://bajomundotv.com/" target="_blank" rel="noopener noreferrer">TV en vivo</a><Link href="/#discover">Discover</Link><Link href="/#latest">Latest drops</Link></div>
            <div className="footer-links"><h3>CREATE</h3><Link href="/submit">Submit a video <ArrowUpRight size={14}/></Link><Link href="/admin">Publisher login</Link><Link href="/report">Report content</Link></div>
            <div className="footer-links"><h3>CONTACT</h3><span>Creator inquiries through our submission page</span><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms of use</Link><span className="footer-social"><Instagram size={17}/><Youtube size={17}/><Mail size={17}/></span></div>
          </div>
          <div className="container footer-bottom"><span>© {new Date().getFullYear()} BAJO MUNDO TV. ALL RIGHTS RESERVED.</span><span>INDEPENDENT BY DESIGN.</span></div>
        </footer>
      </body>
    </html>
  );
}
