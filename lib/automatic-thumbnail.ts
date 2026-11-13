/**
 * Automatically chooses a durable source thumbnail on publication.
 * Never fetch user-provided arbitrary URLs server-side: only approved
 * video hosts are contacted; unknown sources get a first-party cover.
 * All covers then receive the same visual treatment in AutoPoster.
 */
function videoUrl(value:string):URL|null {
  try { const url=new URL(value);return url.protocol==="https:"?url:null; }
  catch { return null; }
}
function safeImage(value:unknown):string|null {
  if(typeof value!=="string")return null;
  try {
    const url=new URL(value.trim());
    if(url.protocol!=="https:"||url.username||url.password||url.port)return null;
    const host=url.hostname.toLowerCase();
    if(host==="localhost"||host.endsWith(".local")||host.endsWith(".internal")
      ||/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(":"))return null;
    if([...url.searchParams.keys()].some(key=>/signature|expires|x-amz|policy|token|key-pair-id/i.test(key)))return null;
    return url.href;
  }catch{return null;}
}
export function youtubeThumbnail(value:string):string|null {
  const url=videoUrl(value);if(!url)return null;
  const host=url.hostname.toLowerCase();
  let id="";
  if(host==="youtu.be")id=url.pathname.slice(1).split("/")[0]||"";
  else if(["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com","www.youtube-nocookie.com"].includes(host)){
    id=url.pathname==="/watch"?(url.searchParams.get("v")||"")
      :(/^\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/.exec(url.pathname)?.[1]||"");
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(id)?`https://i.ytimg.com/vi/${id}/hqdefault.jpg`:null;
}
async function fetchPublicMetadata(url:string):Promise<string|null> {
  try {
    const response=await fetch(url,{redirect:"error",cache:"no-store",signal:AbortSignal.timeout(2600),headers:{Accept:"text/html"}});
    if(!response.ok||!response.headers.get("content-type")?.toLowerCase().includes("text/html"))return null;
    if(Number(response.headers.get("content-length")||0)>600000)return null;
    const html=(await response.text()).slice(0,120000);
    const metas=html.match(/<meta\s+[^>]*>/gi)||[];
    for(const meta of metas) {
      if(!/(?:property|name)\s*=\s*["'](?:og:image|twitter:image)["']/i.test(meta))continue;
      const found=meta.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
      const img=safeImage(found?.[1]?.replaceAll("&amp;","&"));
      if(img)return img;
    }
  }catch{}
  return null;
}
export async function automaticThumbnailForVideo(value:string,slug:string):Promise<string> {
  const generated="/api/auto-poster/"+encodeURIComponent(slug);
  const youTube=youtubeThumbnail(value);
  if(youTube)return youTube;
  const url=videoUrl(value);
  if(!url)return generated;
  const host=url.hostname.toLowerCase();
  if(host==="share.descript.com" && /^\/view\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname))
    return (await fetchPublicMetadata("https://share.descript.com"+url.pathname))||generated;
  if(["vimeo.com","www.vimeo.com"].includes(host) && /^\/\d+(?:\/\d+)?\/?$/.test(url.pathname)){
    try {
      const endpoint="https://vimeo.com/api/oembed.json?url="+encodeURIComponent("https://vimeo.com"+url.pathname);
      const response=await fetch(endpoint,{redirect:"error",signal:AbortSignal.timeout(2600),cache:"no-store"});
      if(response.ok){
        const result=await response.json() as {thumbnail_url?:unknown};
        return safeImage(result.thumbnail_url)||generated;
      }
    }catch{}
  }
  return generated;
}
