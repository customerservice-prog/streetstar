import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BadgeCheck, Clapperboard, Send, ShieldCheck } from "lucide-react";
import { SubmitForm } from "@/components/submit-form";

export const metadata: Metadata = { title: "Submit a Video", description: "Submit your original or licensed video for editorial consideration at StreetStar." };

export default function SubmitPage() {
  return (
    <main className="submit-page container">
      <Link href="/" className="back-link"><ArrowLeft size={16}/> BACK TO STREETSTAR</Link>
      <div className="submit-heading"><div><p className="micro-label"><span className="section-marker"/> THE NEXT WAVE STARTS HERE</p><h1>YOUR MOMENT.<br/><span>OUR RADAR.</span></h1><p>Have a video worth showing the world? Put it in front of our editorial team. Keep it original. Keep it real.</p></div><div className="submit-icon"><Send size={65}/></div></div>
      <div className="submit-columns">
        <div className="submit-panel"><div className="form-top"><h2>SUBMIT YOUR VIDEO</h2><span>01 — GET NOTICED</span></div><SubmitForm/></div>
        <aside className="submit-sidebar"><div className="guide-card"><h3>BEFORE YOU HIT SEND</h3><div className="guide-item"><Clapperboard size={21}/><div><strong>SHARE A WORKING LINK</strong><p>Use a public YouTube, Vimeo or direct video link that our team can review.</p></div></div><div className="guide-item"><BadgeCheck size={21}/><div><strong>ADD THE DETAILS</strong><p>Include the real creator, title, and relevant context.</p></div></div><div className="guide-item"><ShieldCheck size={21}/><div><strong>OWN THE RIGHTS</strong><p>Only submit videos and music you have permission to share.</p></div></div></div><div className="sidebar-note"><span>NO GUARANTEED FEATURE.</span><p>Every submission is subject to editorial review. StreetStar reserves the right to decline or remove content.</p><Link href="/" className="text-cta">EXPLORE THE FRONT PAGE <ArrowUpRight size={15}/></Link></div></aside>
      </div>
    </main>
  );
}
