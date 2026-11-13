"use client";

import { useEffect, useState } from "react";
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
  const [wide,setWide]=useState(false);
  useEffect(()=>setWide(false),[src]);
  return <span className={"auto-poster auto-poster--"+variant+(wide?" auto-poster--wide":"")} aria-hidden="true">
    <span className="auto-poster-halo"><PosterImage src={src} alt="" loading={loading}/></span>
    <PosterImage src={src} alt="" loading={loading} onLoad={event=>{
      const image=event.currentTarget;
      setWide(image.naturalWidth>0 && image.naturalHeight>0 && image.naturalWidth/image.naturalHeight>=1.3);
    }}/>
    <span className="auto-poster-frame"/>
  </span>;
}
