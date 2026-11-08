import { HomeFeed } from "@/components/home-feed";
import { getStories } from "@/lib/db";
import { getTrending } from "@/lib/trending";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [stories,trending] = await Promise.all([getStories(),getTrending()]);
  return <HomeFeed stories={stories} trending={trending} />;
}
