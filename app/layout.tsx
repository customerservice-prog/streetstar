import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Instagram, Mail, Star, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "StreetStar | The Culture Doesn't Wait", template: "%s | StreetStar" },
  description: "StreetStar is an independent destination for music, viral moments, interviews, sports and urban culture.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: "StreetStar", description: "The culture doesn't wait. Neither do we.", type: "website" },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="container footer-top">
            <div className="footer-brand"><Link href="/" className="brand"><span className="brand-mark"><Star size={22} fill="currentColor"/></span><span>STREET<span className="brand-accent">STAR</span><span className="brand-period">.</span></span></Link><p>A new home for the voices, sounds, and moments shaping culture.</p></div>
            <div className="footer-links"><h3>EXPLORE</h3><Link href="/">Home</Link><Link href="/#discover">Discover</Link><Link href="/#latest">Latest drops</Link></div>
            <div className="footer-links"><h3>CREATE</h3><Link href="/submit">Submit a video <ArrowUpRight size={14}/></Link><Link href="/admin">Publisher login</Link></div>
            <div className="footer-links"><h3>CONTACT</h3><span>Creator inquiries through our submission page</span><span className="footer-social"><Instagram size={17}/><Youtube size={17}/><Mail size={17}/></span></div>
          </div>
          <div className="container footer-bottom"><span>© {new Date().getFullYear()} STREETSTAR. ALL RIGHTS RESERVED.</span><span>INDEPENDENT BY DESIGN.</span></div>
        </footer>
      </body>
    </html>
  );
}
