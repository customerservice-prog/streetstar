import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, MessageSquare, Star } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { VideoCard } from "@/components/video-card";
import { getStory, getRelatedStories } from "@/lib/db";
import { storyDate, categoryLabel } from "@/lib/content";
import { ShareButton } from "@/components/share-button";
import { VideoCommunity } from "@/components/video-community";
import { VideoSave } from "@/components/video-save";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const story = await getStory(slug);
  return story ? { title: story.title, description: story.description, robots: story.isDemo ? { index: false, follow: false } : undefined, openGraph: { images: story.posterUrl && !story.posterUrl.includes("share.descript.com") ? [story.posterUrl] : [] } } : { title: "Video not found" };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const stories = await getStories();
  const story = stories.find(item => item.slug === slug);
  if (!story) notFound();
  const related = await getRelatedStories(story, 3);
  return (
    <main className="watch-layout container">
      <div className="watch-breadcrumb"><Link href="/"><ArrowLeft size={16}/> VOLVER A VIDEOS</Link><span>/</span><span>{categoryLabel(story.category)}</span></div>
      <div className="watch-grid">
        <article className="watch-main">
          <div className="watch-label"><Star fill="currentColor" size={14}/> BAJO MUNDO TV EXCLUSIVE FEED {story.isDemo && <span className="demo-pill">DEMO</span>}</div>
          <h1>{story.title}</h1>
          <div className="watch-meta"><span>{story.artist || "Bajo Mundo TV Viral"}</span><span>•</span><span><CalendarDays size={14}/> {storyDate(story.createdAt)}</span><span>•</span><span>{story.category}</span></div>
          <VideoPlayer story={story}/>
          <div className="watch-actions"><span>EL VIDEO.</span><ShareButton/><VideoSave slug={story.slug}/><a href="#comments" className="watch-share"><MessageSquare size={16}/> COMENTARIOS</a><a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="watch-source">FUENTE DEL VIDEO <ExternalLink size={15}/></a></div>
          <p className="watch-description">{story.description || "An original Bajo Mundo TV Viral feature."}</p>
          {story.isDemo && <p className="demo-notice">This is demonstration content. The image and sample player are illustrative and do not represent a real news story or music release.</p>}
          <VideoCommunity slug={story.slug} />
          <div className="watch-more-copy"><span>LA CALLE TIENE SU CANAL.</span><strong>COMPARTE TU HISTORIA.</strong><Link href="/submit">ENVIAR TU VIDEO <ArrowUpRight size={16}/></Link></div>
        </article>
        <aside className="watch-aside"><div className="aside-top"><span>MÁS VIDEOS</span><Star size={17} fill="currentColor"/></div>{related.map((item,index) => <VideoCard key={item.slug} story={item} index={index} compact/>)}<Link className="aside-all" href="/#discover">VER TODOS LOS VIDEOS <ArrowUpRight size={15}/></Link></aside>
      </div>
    </main>
  );
}
