"use client";
import { useEffect, useState } from "react";

/**
 * Descript hosts the uploaded clips; its embed shows a real playable
 * thumbnail without copying media to StreetStar's server.
 * Iframes in cards are inert: clicking the card opens our own watch page.
 */
export function PosterImage({
  src,
  alt = "",
  loading = "lazy",
}: {
  src?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}) {
  const [hasFailed, setHasFailed] = useState(false);
  useEffect(() => setHasFailed(false), [src]);
  const match = src?.match(/^https:\/\/share\.descript\.com\/view\/([A-Za-z0-9_-]+)\/?$/);
  if (match) return (
    <iframe
      className="viral-clip-poster"
      src={"https://share.descript.com/embed/" + match[1]}
      loading={loading}
      title={alt || "Vista previa de video"}
      aria-hidden="true"
      tabIndex={-1}
      allow="encrypted-media"
      referrerPolicy="strict-origin-when-cross-origin"
      style={{ pointerEvents: "none" }}
    />
  );
  return (
    <img
      src={!src || hasFailed ? "/posters/streetstar-fallback.svg" : src}
      alt={alt}
      loading={loading}
      onError={() => { if (!hasFailed) setHasFailed(true); }}
    />
  );
}
