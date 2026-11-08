import { NextResponse } from "next/server";
import { getTrending } from "@/lib/trending";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(){
  return NextResponse.json({period:"7 days",method:"Unique daily play starts + 2 × approved comments + reactions",trending:await getTrending()},{
    headers:{"Cache-Control":"no-store"}
  });
}
