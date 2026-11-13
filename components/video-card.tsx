import Link from "next/link";
import { ArrowUpRight, Play, Star } from "lucide-react";
import { storyDate, type Story } from "@/lib/content";
import { PosterImage } from "@/components/poster-image";

export function VideoCard({ story, index = 0, compact = false }: { story: Story; index?: number; compact?: boolean }) {
  return (
    <Link href={"/watch/" + story.slug} className={compact ? "video-card video-card-compact" : "video-card video-card-premium"}>
      <div className="card-art">
        <PosterImage src={story.posterUrl} alt="" />
        <span className="card-rank">{String(index + 1).padStart(2, "0")}<span className="card-rank-slash"> / SS</span></span>
        <span className="card-play" aria-hidden="true"><Play size={18} fill="currentColor" /></span>
        <span className="card-category">{story.category.toUpperCase()}</span>
        {!compact && <span className="card-cover-action" aria-hidden="true">WATCH NOW <ArrowUpRight size={16} /></span>}
      </div>
      <div className="card-copy">
        <div className="card-meta"><span>{story.artist || "Bajo Mundo TV Viral"}</span><span className="meta-bullet">✳</span><span>{storyDate(story.createdAt)}</span>{story.isDemo && <span className="demo-pill">DEMO</span>}</div>
        <h3>{story.title}</h3>
        <div className="card-bottom"><span className="card-watch">WATCH VIDEO <ArrowUpRight size={15} /></span>{!compact && <span className="card-bottom-mark"><Star size={14} fill="currentColor" /></span>}</div>
      </div>
    </Link>
  );
}
