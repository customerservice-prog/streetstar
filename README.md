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
- Guest comments, one-level threaded replies, comment likes, and Fire/Love/Wow video reactions.
- Manual approval of every new comment or reply, plus per-comment abuse reporting.
- Moderation queue at `/admin/comments` (requires admin login), with approve/hide actions and report review.
- Pseudonymous guest reaction cookie, basic hashed-address comment throttling, and human moderation.

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
