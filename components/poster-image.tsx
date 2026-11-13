"use client";

import { useEffect, useState, type SyntheticEvent } from "react";

/** Static video artwork only; load remote video players on actual watch pages. */
export function PosterImage({
  src,
  alt = "",
  loading = "lazy",
  onLoad,
}: {
  src?: string;
  alt?: string;
  loading?: "lazy" | "eager";
  onLoad?: (event:SyntheticEvent<HTMLImageElement>)=>void;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <img
      src={!src || failed ? "/posters/bajo-mundo-fallback.svg" : src}
      alt={alt}
      loading={loading}
      decoding="async"
      onLoad={onLoad}
      onError={() => setFailed(true)}
    />
  );
}
