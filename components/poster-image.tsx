"use client";

import { useEffect, useState } from "react";

/** Prevent third-party image failures from leaving black or broken video cards. */
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
  const fallback = "/posters/streetstar-fallback.svg";
  return (
    <img
      src={!src || hasFailed ? fallback : src}
      alt={alt}
      loading={loading}
      onError={() => {
        if (!hasFailed) setHasFailed(true);
      }}
    />
  );
}
