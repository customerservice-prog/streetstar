import { NextRequest, NextResponse } from "next/server";
import { getStory } from "@/lib/db";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function xml(text:string) {
  return text.replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
function lines(text:string,maxChars=21):string[] {
  const words=text.trim().toLocaleUpperCase("es").split(/\s+/);
  const out:string[]=[];let current="";
  for(const word of words) {
    if((current+" "+word).trim().length>maxChars && current){out.push(current);current=word;}
    else current=(current+" "+word).trim();
    if(out.length===3)break;
  }
  if(current&&out.length<3)out.push(current);
  return out.slice(0,3);
}
type Params={params:Promise<{slug:string}>};
export async function GET(_req:NextRequest,{params}:Params){
  const {slug}=await params;
  if(!/^[a-z0-9-]{1,100}$/.test(slug))return new NextResponse("Not found",{status:404});
  const story=await getStory(slug).catch(()=>undefined);
  if(!story)return new NextResponse("Not found",{status:404});
  const headline=lines(story.title);
  const title=headline.map((line,i)=>`<text x="78" y="${327+i*89}" font-family="Impact,Arial Black,Arial,sans-serif" font-size="78" font-weight="900" fill="#fff" textLength="${Math.max(20,Math.min(1010,line.length*47))}" lengthAdjust="spacingAndGlyphs">${xml(line)}</text>`).join("");
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
    <defs><linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#28151c"/><stop offset=".52" stop-color="#0d0e14"/><stop offset="1" stop-color="#302017"/></linearGradient>
    <linearGradient id="accent" x1="0" x2="1"><stop stop-color="#ff452c"/><stop offset="1" stop-color="#ffc322"/></linearGradient>
    <radialGradient id="glow"><stop stop-color="#f14b30" stop-opacity=".38"/><stop offset="1" stop-color="#f14b30" stop-opacity="0"/></radialGradient></defs>
    <rect width="1280" height="720" fill="url(#bg)"/>
    <ellipse cx="100" cy="160" rx="650" ry="490" fill="url(#glow)"/>
    <path d="M-90 375 380-90M800 810 1320 290" stroke="#fe5d32" stroke-width="8" opacity=".5"/>
    <rect x="72" y="74" width="370" height="74" rx="12" fill="url(#accent)"/>
    <text x="95" y="122" font-family="Arial,sans-serif" font-size="36" font-weight="900" fill="#120c0c">BAJO MUNDO VIRAL</text>
    <text x="78" y="245" font-family="Arial,sans-serif" font-size="30" font-weight="900" fill="#ffac68">${xml(story.category.toLocaleUpperCase("es"))}  /  ${xml(story.artist.slice(0,48))}</text>
    ${title}
    <rect x="76" y="639" width="1122" height="3" fill="url(#accent)" opacity=".9"/>
    <text x="79" y="689" font-family="Arial,sans-serif" font-size="22" letter-spacing="5" fill="#d4bdb6">LA CALLE HABLA · EL MUNDO LO VE</text>
    <circle cx="1140" cy="533" r="64" fill="#151017" stroke="#ff9136" stroke-width="5"/>
    <path d="M1125 503 L1125 563 L1176 533 Z" fill="#fff"/>
  </svg>`;
  return new NextResponse(svg,{status:200,headers:{
    "Content-Type":"image/svg+xml; charset=utf-8",
    "Cache-Control":"public, max-age=300, s-maxage=1800, stale-while-revalidate=86400",
    "X-Content-Type-Options":"nosniff"
  }});
}
