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


-- Viewer membership, personal libraries, and event-derived analytics.
CREATE TABLE IF NOT EXISTS members (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  display_name VARCHAR(40) NOT NULL,
  password_hash TEXT NOT NULL,
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS member_sessions_member_idx ON member_sessions(member_id,expires_at);
CREATE TABLE IF NOT EXISTS member_auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  actor_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS member_auth_attempts_actor_idx ON member_auth_attempts(actor_hash,created_at DESC);
ALTER TABLE video_comments
  ADD COLUMN IF NOT EXISTS member_id BIGINT REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS video_comments_member_idx ON video_comments(member_id,created_at DESC);
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS member_id BIGINT REFERENCES members(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS submissions_member_idx ON submissions(member_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_notifications (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  kind VARCHAR(24) NOT NULL CHECK(kind IN ('reply','approved')),
  actor_name VARCHAR(40) NOT NULL DEFAULT '',
  video_slug TEXT NOT NULL,
  comment_id BIGINT REFERENCES video_comments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS member_notifications_member_idx ON member_notifications(member_id,created_at DESC);
CREATE TABLE IF NOT EXISTS member_saves (
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  video_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(member_id,video_slug)
);
CREATE TABLE IF NOT EXISTS member_watch_history (
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  video_slug TEXT NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 1,
  last_watched TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(member_id,video_slug)
);
CREATE INDEX IF NOT EXISTS member_watch_recent_idx ON member_watch_history(member_id,last_watched DESC);
-- One counted play per browser per video per UTC day, not one per page load.
CREATE TABLE IF NOT EXISTS video_play_events (
  video_slug TEXT NOT NULL,
  visitor_hash CHAR(64) NOT NULL,
  viewed_on DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::date,
  first_played TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(video_slug,visitor_hash,viewed_on)
);
CREATE INDEX IF NOT EXISTS video_play_trending_idx ON video_play_events(viewed_on DESC,video_slug);


-- Secure account recovery (enabled only when verified sender is configured).
ALTER TABLE members ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS member_email_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  purpose VARCHAR(12) NOT NULL CHECK (purpose IN ('verify','reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS member_email_tokens_member_idx ON member_email_tokens(member_id,purpose,created_at DESC);
CREATE TABLE IF NOT EXISTS moderation_blocks (
  actor_hash CHAR(64) PRIMARY KEY,
  reason VARCHAR(200) NOT NULL DEFAULT 'Repeated policy violations',
  blocked_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS moderation_blocks_active_idx ON moderation_blocks(blocked_until);
ALTER TABLE members ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
CREATE TABLE IF NOT EXISTS video_watch_progress (
  video_slug TEXT NOT NULL,
  visitor_hash CHAR(64) NOT NULL,
  viewed_on DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::date,
  watched_seconds INTEGER NOT NULL DEFAULT 0,
  max_position_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  last_reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW() - INTERVAL '10 seconds',
  PRIMARY KEY(video_slug,visitor_hash,viewed_on)
);
CREATE INDEX IF NOT EXISTS video_watch_progress_day_idx ON video_watch_progress(viewed_on DESC,video_slug);
