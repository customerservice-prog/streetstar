"use client";

import { useRef, type SyntheticEvent } from "react";
import { ExternalLink } from "lucide-react";
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
    if (host === "share.descript.com") {
      const match = parsed.pathname.match(/^\/view\/([A-Za-z0-9_-]+)\/?$/);
      return match ? "https://share.descript.com/embed/" + match[1] : null;
    }
    return null;
  } catch { return null; }
}

export function VideoPlayer({ story }: { story: Story }) {
  const playLogged=useRef(false);
  const trackingReady=useRef(false);
  const lastTick=useRef(0);
  const watchBuffer=useRef(0);
  const reportBusy=useRef(false);
  const embed = embedUrl(story.videoUrl);
  const direct = /^https?:\/\/[^\s]+\.(mp4|webm|ogg)(\?[^\s]*)?$/i.test(story.videoUrl);
  const trackPlay=()=>{
    if(playLogged.current)return;
    playLogged.current=true;
    void fetch("/api/watch-event",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({slug:story.slug}),keepalive:true
    }).then(response=>{
      if(response.ok){
        trackingReady.current=true;
        window.dispatchEvent(new Event("streetstar:played"));
      } else playLogged.current=false;
    }).catch(()=>{playLogged.current=false;});
  };
  const reportProgress=(video:HTMLVideoElement,ended=false)=>{
    if(!trackingReady.current||reportBusy.current||story.isDemo)return;
    const seconds=Math.min(20,Math.floor(watchBuffer.current));
    if(seconds<1)return;
    watchBuffer.current-=seconds;
    reportBusy.current=true;
    const duration=Number.isFinite(video.duration)?Math.min(21600,Math.floor(video.duration)):0;
    const position=Number.isFinite(video.currentTime)?Math.min(21600,Math.floor(video.currentTime)):0;
    void fetch("/api/watch-progress",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({slug:story.slug,seconds,position,duration,ended}),
      keepalive:true
    }).catch(()=>{}).finally(()=>{reportBusy.current=false;});
  };
  const onTimeUpdate=(event:SyntheticEvent<HTMLVideoElement>)=>{
    const video=event.currentTarget;
    const now=performance.now();
    if(lastTick.current>0&&!video.paused&&!document.hidden&&trackingReady.current)
      watchBuffer.current+=Math.min(2,Math.max(0,(now-lastTick.current)/1000));
    lastTick.current=now;
    if(watchBuffer.current>=12)reportProgress(video);
  };
  const onPaused=(event:SyntheticEvent<HTMLVideoElement>)=>{
    lastTick.current=0;
    reportProgress(event.currentTarget,event.currentTarget.ended);
  };
  return (
    <div className="player">
      {embed ? (
        // Load directly after clicking a video card: no second StreetStar play screen.
        // Muted autoplay is allowed by modern browsers; viewers can enable sound in the player.
        <iframe src={embed + "?autoplay=1&muted=1&mute=1&playsinline=1&rel=0"}
          title={story.title} loading="eager" onLoad={trackPlay}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      ) : direct ? (
        <video controls autoPlay muted playsInline preload="auto"
          onPlay={()=>{lastTick.current=0;trackPlay();}}
          onTimeUpdate={onTimeUpdate} onPause={onPaused} onEnded={onPaused}
          poster={story.posterUrl || undefined} src={story.videoUrl}>Your browser does not support this video.</video>
      ) : (
        <div className="external-player"><h3>PLAY ON THE ORIGINAL PLATFORM</h3><p>This video is hosted externally and cannot be embedded here.</p><a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="button button-accent">OPEN VIDEO <ExternalLink size={17}/></a></div>
      )}
      {story.isDemo && <span className="player-demo">DEMO POST · SAMPLE VIDEO</span>}
    </div>
  );
}
