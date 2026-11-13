# StreetStar

StreetStar is an independent, mobile-first video discovery and urban entertainment platform.

## What is included

- Editorial homepage with featured stories, search, categories, and responsive video cards.
- Individual watch pages with safe YouTube/Vimeo/direct-video playback and recommendations.
- Creator video-submission form.
- Private admin login and dashboard to review submissions, publish videos, and unpublish items.
- PostgreSQL schema for durable submissions and published content.
- Demo-only sample posts shown **only** when no published database videos exist. They are visibly labeled as demos.
- Accessible navigation, SEO metadata, and sharing controls.
- Viewer membership with salted password hashes, database-backed session cookies, private saved videos, watch history, in-app reply alerts, and a submission-history dashboard.
- Real play-start tracking and seven-day trending charts. Demo videos do not contribute to ranked metrics.
- Guest comments, one-level threaded replies, comment likes, and Fire/Love/Wow video reactions.
- Manual approval of every new comment or reply, plus per-comment abuse reporting.
- Moderation queue at `/admin/comments` (requires admin login), with approve/hide actions and report review.
- Pseudonymous guest reaction cookie, basic hashed-address comment throttling, and human moderation.

## Community and account limitations

- Email confirmation and password reset routes, one-time tokens, and UI are implemented, but delivery remains disabled until StreetStar has its own verified email sender plus `RESEND_API_KEY` and `STREETSTAR_FROM_EMAIL`. Never use another project's domain or promise an email was sent when delivery is unavailable.
- Signed-in submissions enter the creator dashboard only if their submitted email matches the member account. Existing guest submissions cannot be claimed simply by registering with that email.
- Approved comments from signed-in members trigger in-app notifications; guest commenters cannot receive private reply alerts.
- Trending uses deduplicated daily play starts, approved comments and reactions. `/admin/analytics` reports directly hosted video watch-time separately, but cannot measure YouTube or Vimeo embed duration accurately.
- Moderation supports manually triggered 24-hour member or network restrictions. Network identifiers can be shared or spoofed if proxy headers are not trustworthy; stronger WAF/CAPTCHA and independent abuse review are required before heavy traffic.
- Keep database backups before heavy traffic.

## Run locally

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Configure a PostgreSQL `DATABASE_URL`, a long `AUTH_SECRET` and `ADMIN_PASSWORD`.
5. Apply `database/schema.sql` to that database.
6. Run `npm run dev` and open http://localhost:3000.

Without a database, the public demo is browsable but publishing and submissions deliberately return a setup error; **no form claims success without durable storage**.

## Production

Run `npm run build` and `npm start`. Configure `DATABASE_URL`, `AUTH_SECRET`, and `ADMIN_PASSWORD` as private server environment variables. Use a managed PostgreSQL service with TLS. Use HTTPS in production. Deploy with a Node.js service on Railway, Vercel, or an equivalent host.

## Moderation and rights

Submitted videos must be reviewed before publishing. Only publish media you are authorized to host or embed. Video URLs should come from rights-cleared sources. This starter does not include automated copyright detection, advertising billing, verified viewer identities, account recovery, automated spam detection, or a mature abuse-control system; those must be addressed before a large public launch.

## Community launch notes

- Viewers can open any watch page to submit comments, reply to approved root comments, react to videos, like approved comments, or report abusive comments.
- Every new guest comment is saved as **pending** and appears only after approval through `/admin/comments`. Never imply immediate publication.
- Guest display names are not authenticated; they may be impersonated. Do not present them as verified users.
- The guest cookie only distinguishes browser sessions for simple likes/reactions and reports; it is not a real account and users can clear it.
- Rate limiting is best effort. Add trusted-edge IP enforcement, CAPTCHA/turnstile, monitoring, stronger moderation tools and abuse response procedures before large-scale promotion.
- The `npm start` command executes `scripts/init-db.mjs` first to create community tables on production startup. No demonstration comments or artificial reaction counts are seeded.
- User content is plain text, escaped by React, and public display occurs only for approved comments.
- To avoid losing history, back up the PostgreSQL volume and set up database backups before traffic grows.

## Independent project

This repository is for StreetStar only. No code, database, branding, deployment, or configuration is shared with other websites.


## StreetStar email setup (required before recovery works)

1. Register or select a **StreetStar-owned** sending domain and finish the provider's DNS verification steps.
2. Set server-only `RESEND_API_KEY` and `STREETSTAR_FROM_EMAIL` to a sender on that verified domain in Railway. Never expose the key in client JavaScript.
3. Ensure `NEXT_PUBLIC_SITE_URL` is the public HTTPS StreetStar origin. Test verification and password reset with an email address you control.
4. Until configured, `/api/member/email` reports `emailEnabled: false`; requests return 503 and **no mail is sent**. Existing registered members can request verification once configuration is complete.
5. StreetStar in-app alerts do not require the email provider; email or push alerts are not yet enabled.

## Admin analytics and safety

- `/admin/analytics` shows actual play starts, seven-day trends, pseudonymous browser IDs, native watch-time, completion reports and per-video performance.
- `/admin/comments` supports review, hiding, suspicious link indicators, abuse reports, and temporary network or account restrictions. Blocks are best effort and network bans can affect shared IPs.
- Watch-time reports are browser estimates for HTML5-hosted videos only. Progress is capped and throttled server-side, and can still be manipulated by clients. Do not treat these as audited media impressions.
- There are no production advertising payments, creator revenue shares, automatic payouts, verified rights contracts or copyright detection. Do not publish monetization promises until these are safely implemented.


## Automatic premium thumbnails

StreetStar/Bajo Mundo Viral now styles every published poster automatically as an
editorial image. Portrait reels retain their frame against a blurred widescreen
background, and landscape frames receive an aspect-aware crop. The FEATURE toggle
turns a selected video into the large cinematic homepage cover with an automatically
highlighted headline. It does not generate a synthetic portrait of the subject.

When an admin leaves the optional poster URL blank, the system tries a public
YouTube thumbnail, supported Vimeo preview or stable public Descript page preview.
If a source image is unavailable, it generates a branded, video-specific fallback
at `/api/auto-poster/{slug}`. Existing approved image files are kept unchanged.
No external media is archived by this feature.

## Viral admin: quick uploads and featured video

Go to /admin on the StreetStar service. Quick Upload opens by default after signing in.

1. Drag in MP4 or WebM files, or choose up to 12 at once.
2. Edit the titles, choose a category and optional creator, select immediate publish or draft, and mark at most one video as featured.
3. Upload files with retryable 4 MiB chunks, progress, a Stop button and optional browser-extracted video-frame thumbnails.
4. Use Videos & Feature to search the library and change the large homepage featured video with one click.
5. Add Video Link supports YouTube, Vimeo and Descript links without media storage.

Direct uploads require the staged StreetStar Railway media volume mounted at /data/viral-media. The volume must be activated separately. Until it is mounted, the uploader refuses to write to ephemeral app disk. Existing Bajo Mundo TV music storage is not used.

Current limits: 500 MiB per MP4/WebM video, 12 selections per batch, 2 MiB thumbnail. A 2 GiB volume has limited capacity; larger catalogs should use dedicated object storage and a CDN.
