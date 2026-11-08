import { HomeFeed } from "@/components/home-feed";
import { getStories } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const stories = await getStories();
  return <HomeFeed stories={stories} />;
}
