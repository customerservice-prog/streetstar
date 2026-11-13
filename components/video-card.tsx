import Link from "next/link";
import { ArrowUpRight, Eye, MessageSquare, Play, Star } from "lucide-react";
import { storyDate, categoryLabel, type Story } from "@/lib/content";
import { PosterImage } from "@/components/poster-image";
import { ShareButton } from "@/components/share-button";

export function VideoCard({ story, index = 0, compact = false }: { story: Story; index?: number; compact?: boolean }) {
  const href="/watch/"+story.slug;
  const views=typeof story.plays==="number"&&story.plays>0
    ? story.plays.toLocaleString("es-DO")+" VISTAS" : "NUEVO";
  return (
    <article className={compact ? "video-card video-card-compact" : "video-card video-card-premium"}>
      <Link href={href} className="video-card-main" aria-label={"Ver video: "+story.title}>
        <div className="card-art">
          <PosterImage src={story.posterUrl} alt="" />
          <span className="card-rank">{String(index + 1).padStart(2, "0")}<span className="card-rank-slash"> / BM</span></span>
          <span className="card-play" aria-hidden="true"><Play size={18} fill="currentColor" /></span>
          <span className="card-category">{categoryLabel(story.category)}</span>
          {!compact && <span className="card-cover-action" aria-hidden="true">VER AHORA <ArrowUpRight size={16} /></span>}
        </div>
        <div className="card-copy">
          <div className="card-meta"><span>{story.artist || "Bajo Mundo TV Viral"}</span><span className="meta-bullet">✳</span><span>{storyDate(story.createdAt)}</span>{story.isDemo && <span className="demo-pill">DEMO</span>}</div>
          <h3>{story.title}</h3>
          <div className="card-bottom"><span className="card-watch">VER VIDEO <ArrowUpRight size={15} /></span><span className="card-view-count"><Eye size={13}/>{views}</span></div>
        </div>
      </Link>
      <div className="card-quick-actions">
        <ShareButton slug={story.slug} title={story.title} compact/>
        <Link href={href+"#comments"} aria-label={"Comentar en "+story.title}><MessageSquare size={15}/> COMENTAR</Link>
      </div>
    </article>
  );
}
