import type { MetadataRoute } from "next";
import { getStories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const stories = await getStories();
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: base + "/submit", changeFrequency: "monthly", priority: 0.5 },
    ...stories.filter(s => !s.isDemo).map(s => ({ url: base + "/watch/" + s.slug, lastModified: new Date(s.createdAt), changeFrequency: "weekly" as const, priority: 0.7 }))
  ];
}
