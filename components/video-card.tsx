import Link from "next/link";
import { ArrowUpRight, Play } from "lucide-react";
import { storyDate, type Story } from "@/lib/content";

export function VideoCard({ story, index = 0, compact = false }: { story: Story; index?: number; compact?: boolean }) {
  return (
    <Link href={"/watch/" + story.slug} className={compact ? "video-card video-card-compact" : "video-card"}>
      <div className="card-art">
        {story.posterUrl ? <img src={story.posterUrl} alt="" loading="lazy" /> : <div className="card-image-placeholder" />}
        <span className="card-rank">{String(index + 1).padStart(2, "0")}</span>
        <span className="card-play" aria-hidden="true"><Play size={18} fill="currentColor" /></span>
        <span className="card-category">{story.category.toUpperCase()}</span>
      </div>
      <div className="card-copy">
        <div className="card-meta"><span>{story.artist || "StreetStar"}</span><span className="meta-bullet">•</span><span>{storyDate(story.createdAt)}</span>{story.isDemo && <span className="demo-pill">DEMO</span>}</div>
        <h3>{story.title}</h3>
        <span className="card-watch">WATCH VIDEO <ArrowUpRight size={14} /></span>
      </div>
    </Link>
  );
}
