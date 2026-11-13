"use client";

import { useEffect, useState } from "react";

/** Static video artwork only; load remote video players on actual watch pages. */
export function PosterImage({
  src,
  alt = "",
  loading = "lazy",
}: {
  src?: string;
  alt?: string;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <img
      src={!src || failed ? "/posters/bajo-mundo-fallback.svg" : src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
