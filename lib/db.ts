import { Pool } from "pg";
import { demoStories, type Story } from "@/lib/content";

declare global {
  // eslint-disable-next-line no-var
  var streetstarPool: Pool | undefined;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function database(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL has not been configured.");
  if (!globalThis.streetstarPool) {
    globalThis.streetstarPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 8000
    });
  }
  return globalThis.streetstarPool;
}

type StoryRow = {
  slug: string;
  title: string;
  artist: string;
  description: string;
  category: string;
  video_url: string;
  poster_url: string;
  featured: boolean;
  created_at: Date | string;
};

function mapStory(row: StoryRow): Story {
  return {
    slug: row.slug,
    title: row.title,
    artist: row.artist,
    description: row.description,
    category: row.category,
    videoUrl: row.video_url,
    posterUrl: row.poster_url,
    featured: row.featured,
    createdAt: new Date(row.created_at).toISOString()
  };
}

export async function getStories(): Promise<Story[]> {
  if (!hasDatabase()) return demoStories;
  const result = await database().query<StoryRow>("SELECT slug, title, artist, description, category, video_url, poster_url, featured, created_at FROM videos WHERE status = 'published' ORDER BY featured DESC, created_at DESC LIMIT 120");
  return result.rows.length ? result.rows.map(mapStory) : demoStories;
}

export async function getStory(slug: string): Promise<Story | undefined> {
  const stories = await getStories();
  return stories.find(story => story.slug === slug);
}
