# Direct MP4 imports

The owner control room has a new **UPLOAD MP4** tab for multiple file selection. Each MP4 is uploaded individually as a **draft**, with browser-generated JPG poster where supported. The first 8 clips have title/category presets matched to filenames.

The files are kept only on a **dedicated persistent Railway volume** mounted on the StreetStar web service at `/data/viral-media`; never use the 24/7 music station volume. Create the volume before enabling uploads. For nonstandard mount points set `STREETSTAR_MEDIA_DIR`. Do not expose the volume to the web directly. The `/media/{random-id}.mp4` route authorizes media from database publication state, supports range playback and enforces private draft access. Media URLs are not CDN-hosted yet.

Only authenticated admins can upload. New uploads remain drafts. Verify permission from the owner/rightsholder, and review personal/safety concerns before publishing. Deleting a video record doesn't automatically reclaim the media file; implement controlled garbage collection and backup before long-term production use. If the dedicated volume isn't mounted, uploads should return an error instead of claiming success.
