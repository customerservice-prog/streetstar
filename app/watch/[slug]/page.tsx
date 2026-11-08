import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, ExternalLink, Share2, Star } from "lucide-react";
import { VideoPlayer } from "@/components/video-player";
import { VideoCard } from "@/components/video-card";
import { getStories } from "@/lib/db";
import { storyDate } from "@/lib/content";
import { ShareButton } from "@/components/share-button";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stories = await getStories();
  const story = stories.find(item => item.slug === slug);
  return story ? { title: story.title, description: story.description, openGraph: { images: story.posterUrl ? [story.posterUrl] : [] } } : { title: "Video not found" };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const stories = await getStories();
  const story = stories.find(item => item.slug === slug);
  if (!story) notFound();
  const related = stories.filter(item => item.slug !== story.slug).sort((a,b) => Number(b.category === story.category) - Number(a.category === story.category)).slice(0, 3);
  return (
    <main className="watch-layout container">
      <div className="watch-breadcrumb"><Link href="/"><ArrowLeft size={16}/> BACK TO FEED</Link><span>/</span><span>{story.category.toUpperCase()}</span></div>
      <div className="watch-grid">
        <article className="watch-main">
          <div className="watch-label"><Star fill="currentColor" size={14}/> STREETSTAR EXCLUSIVE FEED {story.isDemo && <span className="demo-pill">DEMO</span>}</div>
          <h1>{story.title}</h1>
          <div className="watch-meta"><span>{story.artist || "StreetStar"}</span><span>•</span><span><CalendarDays size={14}/> {storyDate(story.createdAt)}</span><span>•</span><span>{story.category}</span></div>
          <VideoPlayer story={story}/>
          <div className="watch-actions"><span>THE STORY.</span><ShareButton/><a href={story.videoUrl} target="_blank" rel="noopener noreferrer" className="watch-source">ORIGINAL SOURCE <ExternalLink size={15}/></a></div>
          <p className="watch-description">{story.description || "An original StreetStar feature."}</p>
          {story.isDemo && <p className="demo-notice">This is demonstration content. The image and sample player are illustrative and do not represent a real news story or music release.</p>}
          <div className="watch-more-copy"><span>MORE THAN A MOMENT.</span><strong>BE PART OF THE CULTURE.</strong><Link href="/submit">SUBMIT YOUR VIDEO <ArrowUpRight size={16}/></Link></div>
        </article>
        <aside className="watch-aside"><div className="aside-top"><span>UP NEXT</span><Star size={17} fill="currentColor"/></div>{related.map((item,index) => <VideoCard key={item.slug} story={item} index={index} compact/>)}<Link className="aside-all" href="/#discover">EXPLORE ALL VIDEOS <ArrowUpRight size={15}/></Link></aside>
      </div>
    </main>
  );
}
