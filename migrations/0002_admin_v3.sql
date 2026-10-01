PRAGMA foreign_keys = ON;

-- =========================================================
-- VOUCHER / CODE BATCHES
-- =========================================================

CREATE TABLE IF NOT EXISTS reward_code_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    reward_id INTEGER NOT NULL,

    batch_name TEXT NOT NULL,

    total_codes INTEGER NOT NULL DEFAULT 0,
    available_codes INTEGER NOT NULL DEFAULT 0,
    assigned_codes INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reward_id)
        REFERENCES rewards(id)
);

CREATE INDEX IF NOT EXISTS idx_reward_code_batches_reward
ON reward_code_batches(reward_id);


-- =========================================================
-- ADDITIONAL APP SETTINGS
-- =========================================================

INSERT OR IGNORE INTO app_settings
(setting_key, setting_value)
VALUES

('hero_title', 'Rico Club'),

('hero_subtitle', 'Complete missions, earn Rico Points and unlock community rewards.'),

('hero_image_url', ''),

('logo_url', ''),

('show_checkin', 'true'),

('show_missions', 'true'),

('show_rewards', 'true'),

('show_drops', 'true'),

('show_referrals', 'true'),

('show_leaderboard', 'true'),

('tier_rookie', '0'),

('tier_bronze', '500'),

('tier_silver', '1500'),

('tier_gold', '5000'),

('tier_diamond', '15000'),

('referral_qualification', 'start_bot'),

('max_referrals_month', '0');
