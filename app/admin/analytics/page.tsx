import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminAnalytics } from "@/components/admin-analytics";
export const metadata:Metadata={title:"Audience analytics",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function AnalyticsPage(){
  if(!(await isAdmin()))redirect("/admin");
  return <AdminAnalytics/>;
}
