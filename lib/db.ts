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
  slug: string; title: string; artist: string; description: string;
  category: string; video_url: string; poster_url: string;
  featured: boolean; plays: number; created_at: Date | string;
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
    plays: Number(row.plays || 0),
    createdAt: new Date(row.created_at).toISOString()
  };
}

export const VIDEOS_PER_PAGE = 24;
export type VideoPage = { stories: Story[]; total: number; page: number; pageCount: number };

export type VideoQuery = {
  category?: string; search?: string; sort?: "newest" | "az"; page?: number;
};

export async function getStoriesPage({
  category = "All", search = "", sort = "newest", page = 1
}: VideoQuery = {}): Promise<VideoPage> {
  const safePage = Number.isSafeInteger(page) ? Math.min(Math.max(page, 1), 100000) : 1;
  const query = search.trim().slice(0, 100).toLowerCase();
  const matches = (story: Story) => (category === "All" || story.category === category)
    && (!query || [story.title,story.artist,story.description,story.category].join(" ").toLowerCase().includes(query));
  const demoPage = (): VideoPage => {
    const all = demoStories.filter(matches).sort((a,b) =>
      sort === "az" ? a.title.localeCompare(b.title) : Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const pageCount = Math.max(1, Math.ceil(all.length / VIDEOS_PER_PAGE));
    const current = Math.min(safePage, pageCount);
    return {stories: all.slice((current-1)*VIDEOS_PER_PAGE,current*VIDEOS_PER_PAGE),
      total: all.length, page: current, pageCount};
  };
  if (!hasDatabase()) return demoPage();
  const conditions = ["status = 'published'"];
  const params: Array<string | number> = [];
  if (category !== "All") {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (query) {
    // Parameterized, bounded search: do not allow raw SQL or a huge query string.
    params.push("%" + query + "%");
    conditions.push(`(title ILIKE $${params.length} OR artist ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }
  const where = conditions.join(" AND ");
  const pool = database();
  const countResult = await pool.query<{count:string}>(`SELECT COUNT(*) AS count FROM videos WHERE ${where}`,params);
  const total = Number(countResult.rows[0]?.count || 0);
  // Keep familiar demo behavior only on a genuinely empty catalogue, not a no-results filter.
  if (!total && category === "All" && !query) return demoPage();
  const pageCount = Math.max(1,Math.ceil(total / VIDEOS_PER_PAGE));
  const current = Math.min(safePage,pageCount);
  params.push(VIDEOS_PER_PAGE,(current - 1) * VIDEOS_PER_PAGE);
  const order = sort === "az" ? "title ASC, id DESC" : "created_at DESC, id DESC";
  const result = await pool.query<StoryRow>(
    `SELECT slug,title,artist,description,category,video_url,poster_url,featured,created_at,COALESCE((SELECT COUNT(*) FROM video_play_events p WHERE p.video_slug=videos.slug),0)::integer AS plays
     FROM videos WHERE ${where} ORDER BY ${order}
     LIMIT $${params.length - 1} OFFSET $${params.length}`,params);
  return {stories:result.rows.map(mapStory),total,page:current,pageCount};
}

// Only the front-page spotlight requires a small selection; the library is paginated.
export async function getStories(): Promise<Story[]> {
  if (!hasDatabase()) return demoStories;
  const result = await database().query<StoryRow>(
    "SELECT slug,title,artist,description,category,video_url,poster_url,featured,created_at,COALESCE((SELECT COUNT(*) FROM video_play_events p WHERE p.video_slug=videos.slug),0)::integer AS plays FROM videos WHERE status = 'published' ORDER BY featured DESC,created_at DESC LIMIT 16");
  return result.rows.length ? result.rows.map(mapStory) : demoStories;
}

// Individual watch pages must NEVER depend on the first N videos.
export async function getStory(slug: string): Promise<Story | undefined> {
  if (!hasDatabase()) return demoStories.find(story=>story.slug===slug);
  const result = await database().query<StoryRow>(
    "SELECT slug,title,artist,description,category,video_url,poster_url,featured,created_at,COALESCE((SELECT COUNT(*) FROM video_play_events p WHERE p.video_slug=videos.slug),0)::integer AS plays FROM videos WHERE slug = $1 AND status = 'published' LIMIT 1",
    [slug]);
  return result.rows[0] ? mapStory(result.rows[0]) : undefined;
}

export async function getRelatedStories(story: Story, limit = 3): Promise<Story[]> {
  if (!hasDatabase()) return demoStories.filter(item=>item.slug !== story.slug)
    .sort((a,b)=>Number(b.category===story.category)-Number(a.category===story.category)).slice(0,limit);
  const result = await database().query<StoryRow>(
    `SELECT slug,title,artist,description,category,video_url,poster_url,featured,created_at,COALESCE((SELECT COUNT(*) FROM video_play_events p WHERE p.video_slug=videos.slug),0)::integer AS plays
     FROM videos WHERE status = 'published' AND slug <> $1
     ORDER BY (category = $2) DESC, created_at DESC LIMIT $3`,[story.slug,story.category,limit]);
  return result.rows.map(mapStory);
}

export async function getStoriesBySlugs(slugs: string[]): Promise<Story[]> {
  if (!slugs.length) return [];
  if (!hasDatabase()) return demoStories.filter(story=>slugs.includes(story.slug));
  const result = await database().query<StoryRow>(
    "SELECT slug,title,artist,description,category,video_url,poster_url,featured,created_at,COALESCE((SELECT COUNT(*) FROM video_play_events p WHERE p.video_slug=videos.slug),0)::integer AS plays FROM videos WHERE status = 'published' AND slug = ANY($1::text[])",
    [slugs.slice(0,100)]);
  return result.rows.map(mapStory);
}
