-- Rico Club V9: featured carousel content only; no changes to users or points.
CREATE TABLE IF NOT EXISTS hot_games (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 title TEXT NOT NULL,
 description TEXT NOT NULL DEFAULT '',
 banner_url TEXT NOT NULL,
 target_url TEXT NOT NULL,
 cta_label TEXT NOT NULL DEFAULT 'Play Now',
 sort_order INTEGER NOT NULL DEFAULT 0,
 active INTEGER NOT NULL DEFAULT 1,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_hot_games_display ON hot_games(active,sort_order);
INSERT INTO hot_games (title,description,banner_url,target_url,cta_label,sort_order,active)
SELECT 'Toodle Jump','Climb higher and beat your personal best.','/assets/club/arcade-toodle-cover.webp','/','Play Now',0,1
WHERE NOT EXISTS (SELECT 1 FROM hot_games);
