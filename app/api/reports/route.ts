import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database,hasDatabase } from "@/lib/db";

export const runtime="nodejs";

const form=z.object({
  claimant:z.string().trim().min(2).max(150),
  email:z.email().max(200),
  contentUrl:z.url().max(1500).refine(v=>/^https?:\/\//.test(v)),
  reason:z.enum(["copyright","privacy","safety","other"]),
  details:z.string().trim().min(20).max(5000),
  website:z.string().max(200).default("")
});
export async function POST(req:NextRequest){
  const parsed=form.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Check the required report fields."},{status:400});
  if(parsed.data.website)return NextResponse.json({ok:true});
  if(!hasDatabase())return NextResponse.json({error:"Content reports are temporarily unavailable."},{status:503});
  try {
    const d=parsed.data;
    const email=d.email.toLowerCase();
    const count=await database().query<{count:string}>("SELECT COUNT(*)::text AS count FROM content_reports WHERE email = $1 AND created_at > NOW() - INTERVAL '1 day'",[email]);
    if(Number(count.rows[0].count)>=5)return NextResponse.json({error:"Too many reports from this address today. Please try later."},{status:429});
    await database().query("INSERT INTO content_reports (claimant,email,content_url,reason,details) VALUES ($1,$2,$3,$4,$5)",[d.claimant,email,d.contentUrl,d.reason,d.details]);
    return NextResponse.json({ok:true},{status:201});
  }catch{return NextResponse.json({error:"Report could not be saved. Please try later."},{status:503});}
}
