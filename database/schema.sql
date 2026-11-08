CREATE TABLE IF NOT EXISTS videos (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Culture',
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL DEFAULT '',
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  artist TEXT NOT NULL,
  email TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  video_url TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS videos_status_created_at_idx ON videos (status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_status_created_at_idx ON submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS submissions_email_created_at_idx ON submissions (email, created_at DESC);

CREATE TABLE IF NOT EXISTS content_reports (
  id BIGSERIAL PRIMARY KEY,
  claimant TEXT NOT NULL,
  email TEXT NOT NULL,
  content_url TEXT NOT NULL,
  reason TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS content_reports_status_created_at_idx ON content_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS content_reports_email_created_at_idx ON content_reports (email, created_at DESC);

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  actor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS login_attempts_actor_created_at_idx ON login_attempts (actor_hash, created_at DESC);
