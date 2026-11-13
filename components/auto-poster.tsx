"use client";

import { PosterImage } from "@/components/poster-image";

/**
 * Automatic editorial artwork for any clip. A single source frame becomes
 * a widescreen, branded backdrop + an uncropped subject layer. Portrait reels
 * no longer sit in an empty black 16:9 rectangle or get stretched to fill it.
 * Safe fallback is already provided by PosterImage.
 */
export function AutoPoster({
  src,
  variant = "card",
  loading = "lazy"
}:{
  src?:string;
  variant?:"feature"|"card"|"mini";
  loading?:"lazy"|"eager";
}) {
  return <span className={"auto-poster auto-poster--"+variant} aria-hidden="true">
    <span className="auto-poster-halo"/>
    <PosterImage src={src} alt="" loading={loading}/>
    <span className="auto-poster-frame"/>
  </span>;
}
