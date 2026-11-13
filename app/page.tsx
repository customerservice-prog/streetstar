import { HomeFeed } from "@/components/home-feed";
import { categories } from "@/lib/content";
import { getStories, getStoriesPage, getStoriesBySlugs } from "@/lib/db";
import { getTrending } from "@/lib/trending";

export const dynamic = "force-dynamic";

type Props={searchParams:Promise<{category?:string;q?:string;sort?:string;page?:string}>};

export default async function HomePage({searchParams}:Props) {
  const params = await searchParams;
  const category=categories.includes(params.category as typeof categories[number]) ? params.category! : "All";
  const search=(params.q||"").slice(0,100).trim();
  const sort=params.sort === "az" ? "az" : "newest";
  const requestedPage=Math.min(100000,Math.max(1,Number.parseInt(params.page||"1",10)||1));
  const [library,featured,trending] = await Promise.all([
    getStoriesPage({category,search,sort,page:requestedPage}),
    getStories(),
    getTrending()
  ]);
  const trendingStories=await getStoriesBySlugs(trending.map(row=>row.slug));
  return <HomeFeed stories={library.stories} spotlight={featured}
    trending={trending} trendingStories={trendingStories}
    total={library.total} page={library.page} pageCount={library.pageCount}
    initialCategory={category} initialSearch={search} initialSort={sort}/>;
}
