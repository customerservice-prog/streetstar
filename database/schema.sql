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


-- StreetStar community features. These migrations are idempotent so Railway startup
-- can initialize them on each new deployment without destroying existing comments.
CREATE TABLE IF NOT EXISTS video_comments (
  id BIGSERIAL PRIMARY KEY,
  video_slug TEXT NOT NULL,
  parent_id BIGINT REFERENCES video_comments(id) ON DELETE SET NULL,
  author_name VARCHAR(40) NOT NULL,
  body VARCHAR(1200) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  actor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS video_comments_slug_status_idx
  ON video_comments (video_slug, status, created_at DESC);
CREATE INDEX IF NOT EXISTS video_comments_actor_idx
  ON video_comments (actor_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS video_comments_pending_idx
  ON video_comments (status, created_at DESC);

CREATE TABLE IF NOT EXISTS comment_likes (
  comment_id BIGINT NOT NULL REFERENCES video_comments(id) ON DELETE CASCADE,
  guest_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, guest_hash)
);
CREATE INDEX IF NOT EXISTS comment_likes_comment_idx ON comment_likes(comment_id);

CREATE TABLE IF NOT EXISTS comment_reports (
  id BIGSERIAL PRIMARY KEY,
  comment_id BIGINT NOT NULL REFERENCES video_comments(id) ON DELETE CASCADE,
  guest_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'privacy', 'other')),
  details VARCHAR(500) NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (comment_id, guest_hash)
);
CREATE INDEX IF NOT EXISTS comment_reports_status_idx ON comment_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS video_reactions (
  video_slug TEXT NOT NULL,
  guest_hash TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('fire','love','wow')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(video_slug, guest_hash)
);
CREATE INDEX IF NOT EXISTS video_reactions_slug_idx ON video_reactions(video_slug);
