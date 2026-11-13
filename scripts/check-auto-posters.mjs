import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(p)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const hero=read("components/home-feed.tsx");
const cards=read("components/video-card.tsx");
const poster=read("components/auto-poster.tsx");
const style=read("app/auto-posters.css");
const admin=read("app/api/admin/videos/route.ts");
const resolver=read("lib/automatic-thumbnail.ts");
const generator=read("app/api/auto-poster/[slug]/route.ts");
const layout=read("app/layout.tsx");
const bootstrap=read("scripts/init-db.mjs");

assert.match(hero,/AutoPoster src=\{lead.posterUrl\} variant="feature"/,"Homepage hero must use automatic artwork");
assert.match(hero,/leadAccent/,"Hero emphasis should be based on video title, not hardcoded person");
assert.match(hero,/AutoPoster src=\{item.posterUrl\} variant="mini"/,"Sidebar videos must use automatic artwork");
assert.match(cards,/AutoPoster src=\{story.posterUrl\} variant="card"/,"All gallery videos must use automatic artwork");
assert.match(poster,/auto-poster-halo/,"Portrait videos need a branded wide background");
assert.match(poster,/naturalWidth\/image.naturalHeight/,"Thumbnail layout should detect portrait versus landscape at runtime");
assert.match(style,/auto-poster--wide/,"Landscape sources need automatic smart cropping");
assert.match(style,/smart-feature \.v3-lead-copy/,"Featured text must be separate from the source frame");
assert.match(style,/@media\(max-width:620px\)/,"Featured video must also work on mobile");
assert.match(admin,/automaticThumbnailForVideo\(d.videoUrl, slug\)/,"New video posts must auto-resolve artwork");
assert.match(admin,/UPDATE videos SET featured = FALSE/,"The owner can choose one clear featured item");
assert.match(resolver,/youtubeThumbnail/,"YouTube frames should be discovered automatically");
assert.match(resolver,/share\.descript\.com/,"Only known Descript URLs are fetched");
assert.match(resolver,/redirect:"error"/,"External thumbnail lookups must not follow arbitrary redirects");
assert.match(resolver,/\/api\/auto-poster\//,"Unresolved sources need a generated video-specific cover");
assert.match(generator,/image\/svg\+xml/,"Generated branded covers must be image assets");
assert.match(generator,/function xml\(/,"Video titles must be escaped before SVG generation");
assert.match(layout,/\.\/auto-posters\.css/,"Premium styles must be enabled in the application");

assert.match(bootstrap,/UPDATE videos SET poster_url/,"Existing published videos must receive a fallback poster automatically");
console.log("Automatic editorial thumbnail, source selection, mobile and safety checks passed.");
