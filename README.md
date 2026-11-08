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

Submitted videos must be reviewed before publishing. Only publish media you are authorized to host or embed. Video URLs should come from rights-cleared sources. This starter does not include automated copyright detection, advertising billing, account recovery, or a mature abuse-control system; those must be addressed before a large public launch.

## Independent project

This repository is for StreetStar only. No code, database, branding, deployment, or configuration is shared with other websites.
