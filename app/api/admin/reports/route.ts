import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { isAdmin } from "@/lib/auth";

export const runtime="nodejs";

const update=z.object({id:z.coerce.number().int().positive(),status:z.enum(["open","reviewed","resolved"])});
export async function PATCH(req:NextRequest){
  if(!(await isAdmin()))return NextResponse.json({error:"Unauthorized"},{status:401});
  const parsed=update.safeParse(await req.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Invalid report update."},{status:400});
  try {
    await database().query("UPDATE content_reports SET status=$1 WHERE id=$2",[parsed.data.status,parsed.data.id]);
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"Unable to update report."},{status:503});}
}
