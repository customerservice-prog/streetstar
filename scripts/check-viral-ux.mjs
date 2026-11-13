import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(name)=>readFileSync(new URL("../"+name,import.meta.url),"utf8");
const player=read("components/video-player.tsx");
const card=read("components/video-card.tsx");
const share=read("components/share-button.tsx");
const watch=read("app/watch/[slug]/page.tsx");
const db=read("lib/db.ts");
const community=read("lib/community.ts");
const auth=read("lib/member-auth.ts");

assert.doesNotMatch(player,/className="player-cover"/,"A second click must not be required on watch page");
assert.match(player,/autoplay=1&muted=1/,"Video embeds should attempt one-click playback");
assert.match(player,/<iframe src=\{embed/,"Embedded video should be rendered on first arrival");
assert.match(player,/<video controls autoPlay muted/,"Native video starts muted when autoplay is restricted");
assert.match(share,/https:\/\/bajomundotv\.com\/viral\?video=/,"Share links must use official domain");
assert.match(watch,/<ShareButton slug=\{story.slug\}/,"Watch page should share its specific video");
assert.match(card,/<ShareButton slug=\{story.slug\}/,"Each catalog video should have share");
assert.match(card,/href=\{href\+"#comments"\}/,"Each catalog video should link to comments");
assert.match(card,/card-view-count/,"Show actual views on cards");
assert.match(db,/COUNT\(\*\) FROM video_play_events/,"No synthetic view figures");
assert.match(community,/partitioned: process.env.NODE_ENV === "production"/,"Guest interactions need partitioned cookies when embedded");
assert.match(auth,/partitioned:embedded/,"Member sessions need partitioned cookies when embedded");
console.log("Bajo Mundo Viral first-click, sharing, community and real-view checks passed.");
