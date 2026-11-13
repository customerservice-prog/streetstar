import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";
import "./editorial-v3.css";
import "./community.css";
import "./member.css";
import "./analytics.css";
import "./bajo-mundo-viral.css";
import "./auto-posters.css";
import "./pagination.css";
import "./admin-upload.css";

export const metadata: Metadata = {
  title: { default: "Bajo Mundo TV Viral | La Calle Tiene Su Canal", template: "%s | Bajo Mundo TV Viral" },
  description: "Videos virales, entrevistas, farándula, polémicas y cultura urbana. La calle tiene su canal.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Bajo Mundo TV Viral",
    description: "La calle tiene su canal. Videos virales, entrevistas y cultura urbana.",
    type: "website",
    locale: "es_DO"
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "https://bajomundotv.com/favicon.svg?v=bm-logo-20261030",
    apple: "https://bajomundotv.com/brand-touch.png?v=bm-logo-20261030"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div className="container footer-top">
            <div className="footer-brand">
              <Link href="/" className="brand bajo-brand" aria-label="Bajo Mundo TV Viral — inicio">
                <img className="bajo-official-logo" src="https://bajomundotv.com/brand-logo-cutout.png" width="78" height="72" alt="Bajo Mundo TV" />
                <span className="bajo-brand-words">BAJO MUNDO <strong>TV</strong><small>VIRAL</small></span>
              </Link>
              <p>Los videos que están dando de qué hablar. Farándula, entrevistas y cultura urbana. La calle tiene su canal.</p>
            </div>
            <div className="footer-links">
              <h3>EXPLORAR</h3>
              <Link href="/">Inicio</Link>
              <Link href="/trending">Tendencias</Link>
              <Link href="/#discover">Videos</Link>
              <a href="https://bajomundotv.com/" target="_blank" rel="noopener noreferrer">Música 24/7 <ArrowUpRight size={13} /></a>
            </div>
            <div className="footer-links">
              <h3>PARTICIPA</h3>
              <Link href="/submit">Enviar video <ArrowUpRight size={14}/></Link>
              <Link href="/account">Mi cuenta</Link>
              <Link href="/admin">Administración</Link>
              <Link href="/report">Reportar contenido</Link>
            </div>
            <div className="footer-links">
              <h3>INFORMACIÓN</h3>
              <span>Bajo Mundo TV Viral — portal de videos independientes</span>
              <Link href="/privacy">Política de privacidad</Link>
              <Link href="/terms">Términos de uso</Link>
            </div>
          </div>
          <div className="container footer-bottom">
            <span>© {new Date().getFullYear()} BAJO MUNDO TV VIRAL · TODOS LOS DERECHOS RESERVADOS.</span>
            <span>LA CALLE TIENE SU CANAL.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
