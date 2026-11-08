import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin-dashboard";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Control Room", robots: { index: false, follow: false } };

export default async function AdminPage() {
  return <main><AdminDashboard initialSignedIn={await isAdmin()}/></main>;
}
