import { NextResponse } from "next/server";
import { getStories } from "@/lib/db";

// Public, bounded, read-only feed for the official Bajo Mundo TV home.
// Only published videos are returned by getStories; never expose draft/admin data.
export const dynamic = "force-dynamic";
const origin = "https://streetstar-web-production.up.railway.app";

export async function GET() {
  try {
    const stories = await getStories();
    const videos = stories.filter(story => !story.isDemo && /^[a-z0-9-]{1,100}$/.test(story.slug))
      .slice(0, 5).map(story => {
        let poster = "";
        try {
          const url = new URL(story.posterUrl || "/posters/bajo-mundo-fallback.svg", origin);
          if (url.protocol === "https:") poster = url.toString();
        } catch { /* Blank artwork falls back to original homepage seed. */ }
        return {
          slug: story.slug,
          title: story.title.slice(0, 150),
          artist: story.artist.slice(0, 80),
          category: story.category.slice(0, 40),
          poster
        };
      });
    return NextResponse.json({ videos }, {
      headers: { "Cache-Control": "public, max-age=60, s-maxage=120", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ videos: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
