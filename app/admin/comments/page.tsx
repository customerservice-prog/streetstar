import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { AdminCommentModeration } from "@/components/admin-comment-moderation";

export const dynamic="force-dynamic";
export const metadata: Metadata = { title: "Comment moderation", robots:{index:false,follow:false} };

export default async function AdminCommentsPage() {
  if(!(await isAdmin()))redirect("/admin");
  return <AdminCommentModeration/>;
}
