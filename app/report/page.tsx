import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { ReportForm } from "@/components/report-form";

export const metadata: Metadata = { title: "Report Content", description: "Report potential copyright infringement, privacy violations, or harmful content to Bajo Mundo TV Viral." };

export default function ReportPage() {
  return <main className="container report-page"><Link className="back-link" href="/"><ArrowLeft size={16}/> BACK TO BAJO MUNDO TV</Link><div className="report-heading"><ShieldAlert size={36}/><div><p className="micro-label">CONTENT SAFETY / RIGHTS</p><h1>REPORT CONTENT.</h1></div></div><p>Report a video, potential copyright infringement, privacy issue, or another safety concern. Provide the exact Bajo Mundo TV Viral URL and enough details for a human reviewer to investigate. This form is not a substitute for registering a designated DMCA agent.</p><ReportForm/><p className="policy-end">For details about how we use information, see our <Link href="/privacy">privacy policy</Link>.</p></main>;
}
