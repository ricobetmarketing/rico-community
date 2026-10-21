-- Apply once to the existing D1 database BEFORE deploying V7 Worker.
ALTER TABLE users ADD COLUMN avatar_path TEXT;
CREATE INDEX IF NOT EXISTS idx_checkins_date_user ON checkins(checkin_date, user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_qualified_week ON referrals(qualified_at, referrer_user_id, status);
