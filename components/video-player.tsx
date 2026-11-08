"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import type { Story } from "@/lib/content";

function embedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id : null;
    }
    if (host === "youtube.com" || host === "www.youtube.com" || host === "m.youtube.com") {
      const match = parsed.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/);
      const id = match?.[1] || parsed.searchParams.get("v");
      return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id : null;
    }
    if (host === "vimeo.com" || host === "www.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? "https://player.vimeo.com/video/" + id : null;
    }
    return null;
  } catch { return null; }
}

export function VideoPlayer({ story }: { story: Story }) {
  const [ready, setReady] = useState(false);
  const embed = embedUrl(story.videoUrl);
  const direct = /^https?:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?$/i.test(story.videoUrl);
  return (
    <div className="player">
      {!ready ? (
        <button className="player-cover" onClick={() => setReady(true)} aria-label={"Play " + story.title}>
          {story.posterUrl && <img src={story.posterUrl} alt="" />}
          <span className="player-tint" />
          <span className="player-center"><Play size={34} fill="currentColor"/></span>
          <span className="player-cover-label">CLICK TO WATCH</span>
        </button>
      ) : embed ? (
        <iframe src={embed + "?autoplay=1&rel=0"} title={story.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : direct ? (
        <video controls autoPlay playsInline poster={story.posterUrl || undefined} src={story.videoUrl}>Your browser does not support this video.</video>
      ) : (
        <div className="external-player"><h3>PLAY ON THE ORIGINAL PLATFORM</h3><p>This video is hosted externally and cannot be embedded here.</p><a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="button button-accent">OPEN VIDEO <ExternalLink size={17}/></a></div>
      )}
      {story.isDemo && <span className="player-demo">DEMO POST · SAMPLE VIDEO</span>}
    </div>
  );
}
