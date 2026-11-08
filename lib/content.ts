export type Story = {
  slug: string;
  title: string;
  artist: string;
  description: string;
  category: string;
  videoUrl: string;
  posterUrl: string;
  featured: boolean;
  createdAt: string;
  isDemo?: boolean;
};

export const categories = ["All", "Music", "Culture", "Viral", "Sports", "Interviews", "Lifestyle"] as const;

const demoVideo = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

// Fictional editorial examples, not real reporting or uploaded music videos.
// A real published database video automatically replaces this entire demo library.
export const demoStories: Story[] = [
  {
    slug: "after-hours-the-city-never-stops",
    title: "AFTER HOURS: THE CITY NEVER STOPS",
    artist: "StreetStar Originals",
    description: "A fictional editorial preview exploring the energy of nightlife, creativity, and the streets. This is a demonstration post, not news coverage.",
    category: "Culture",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85",
    featured: true,
    createdAt: "2026-11-08T14:00:00.000Z",
    isDemo: true
  },
  {
    slug: "next-wave-underground-sounds",
    title: "NEXT WAVE: UNDERGROUND SOUNDS",
    artist: "StreetStar Sessions",
    description: "Concept card for new music discovery. Replace with an authorized artist upload.",
    category: "Music",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&q=85",
    featured: true,
    createdAt: "2026-11-08T13:00:00.000Z",
    isDemo: true
  },
  {
    slug: "courtside-energy",
    title: "COURTSIDE ENERGY: MORE THAN THE GAME",
    artist: "StreetStar Sports",
    description: "Sample sports culture feature. No real event is depicted or reported.",
    category: "Sports",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-08T12:00:00.000Z",
    isDemo: true
  },
  {
    slug: "the-voices-building-tomorrow",
    title: "THE VOICES BUILDING TOMORROW",
    artist: "StreetStar Conversations",
    description: "Placeholder for long-form interviews and emerging creators.",
    category: "Interviews",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-07T16:00:00.000Z",
    isDemo: true
  },
  {
    slug: "the-moment-everyone-talks-about",
    title: "THE MOMENT EVERYONE TALKS ABOUT",
    artist: "StreetStar Viral",
    description: "Placeholder for licensed, verified viral footage.",
    category: "Viral",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-07T11:00:00.000Z",
    isDemo: true
  },
  {
    slug: "style-from-the-block",
    title: "STYLE FROM THE BLOCK",
    artist: "StreetStar Style",
    description: "Concept article for streetwear and city lifestyle coverage.",
    category: "Lifestyle",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-06T10:00:00.000Z",
    isDemo: true
  },
  {
    slug: "behind-the-beat",
    title: "BEHIND THE BEAT: WHERE IDEAS BEGIN",
    artist: "StreetStar Sessions",
    description: "Concept for behind-the-scenes studio footage.",
    category: "Music",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-05T09:00:00.000Z",
    isDemo: true
  },
  {
    slug: "the-night-shift",
    title: "THE NIGHT SHIFT: CITY STORIES",
    artist: "StreetStar Originals",
    description: "Placeholder for cultural storytelling and community features.",
    category: "Culture",
    videoUrl: demoVideo,
    posterUrl: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&q=85",
    featured: false,
    createdAt: "2026-11-04T08:00:00.000Z",
    isDemo: true
  }
];

export function storyDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function slugify(value: string) {
  const slug = value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.slice(0, 70) || "video";
}
