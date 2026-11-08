import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";

export default function NotFound() {
  return <main className="not-found container"><Star size={50} fill="currentColor"/><p>404 / LOST IN THE FEED</p><h1>THIS STORY ISN&apos;T HERE.</h1><Link className="button button-accent" href="/"><ArrowLeft size={16}/> BACK TO THE FRONT PAGE</Link></main>;
}
