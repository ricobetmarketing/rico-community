PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT NOT NULL UNIQUE,
    telegram_username TEXT,
    first_name TEXT,
    last_name TEXT,
    language_code TEXT DEFAULT 'en',
    photo_url TEXT,

    status TEXT NOT NULL DEFAULT 'active',

    tier TEXT NOT NULL DEFAULT 'Rookie',

    current_points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,

    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_checkin_date TEXT,

    referral_code TEXT UNIQUE,
    referred_by_user_id INTEGER,

    joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (referred_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id
ON users(telegram_id);

CREATE INDEX IF NOT EXISTS idx_users_username
ON users(telegram_username);

CREATE INDEX IF NOT EXISTS idx_users_points
ON users(current_points DESC);

CREATE INDEX IF NOT EXISTS idx_users_last_active
ON users(last_active_at DESC);


CREATE TABLE IF NOT EXISTS point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,

    transaction_type TEXT NOT NULL,
    amount INTEGER NOT NULL,

    reference_type TEXT,
    reference_id TEXT,

    description TEXT,

    created_by TEXT NOT NULL DEFAULT 'system',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_points_user
ON point_transactions(user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    checkin_date TEXT NOT NULL,

    base_points INTEGER NOT NULL DEFAULT 20,
    bonus_points INTEGER NOT NULL DEFAULT 0,

    streak_after INTEGER NOT NULL DEFAULT 1,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, checkin_date),

    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS missions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    description TEXT,

    image_url TEXT,

    mission_type TEXT NOT NULL,

    target_value INTEGER NOT NULL DEFAULT 1,

    reward_points INTEGER NOT NULL DEFAULT 0,

    button_text TEXT,
    button_url TEXT,

    start_at TEXT,
    end_at TEXT,

    required_tier TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS mission_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    mission_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    progress INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'active',

    completed_at TEXT,
    claimed_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(mission_id, user_id),

    FOREIGN KEY (mission_id) REFERENCES missions(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    referrer_user_id INTEGER NOT NULL,
    referred_user_id INTEGER NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'pending',

    reward_points INTEGER NOT NULL DEFAULT 0,

    qualified_at TEXT,
    rewarded_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (referrer_user_id) REFERENCES users(id),
    FOREIGN KEY (referred_user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS rewards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    description TEXT,

    image_url TEXT,

    reward_type TEXT NOT NULL DEFAULT 'manual',

    points_cost INTEGER NOT NULL DEFAULT 0,

    stock INTEGER,
    redeemed_count INTEGER NOT NULL DEFAULT 0,

    required_tier TEXT,

    start_at TEXT,
    end_at TEXT,

    sort_order INTEGER NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS reward_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    reward_id INTEGER NOT NULL,

    code TEXT NOT NULL UNIQUE,

    status TEXT NOT NULL DEFAULT 'available',

    assigned_user_id INTEGER,

    assigned_at TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reward_id) REFERENCES rewards(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS reward_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    reward_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    points_spent INTEGER NOT NULL DEFAULT 0,

    reward_code_id INTEGER,

    status TEXT NOT NULL DEFAULT 'claimed',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (reward_id) REFERENCES rewards(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (reward_code_id) REFERENCES reward_codes(id)
);


CREATE TABLE IF NOT EXISTS drops (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT NOT NULL,
    description TEXT,

    image_url TEXT,

    reward_type TEXT NOT NULL DEFAULT 'points',

    reward_value INTEGER NOT NULL DEFAULT 0,

    total_quantity INTEGER NOT NULL DEFAULT 0,
    claimed_quantity INTEGER NOT NULL DEFAULT 0,

    required_tier TEXT,

    claim_limit_per_user INTEGER NOT NULL DEFAULT 1,

    start_at TEXT NOT NULL,
    end_at TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IF NOT EXISTS drop_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    drop_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,

    reward_value INTEGER NOT NULL DEFAULT 0,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (drop_id) REFERENCES drops(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,

    telegram_message_id TEXT,

    message_text TEXT NOT NULL,

    button_text TEXT,
    button_url TEXT,

    status TEXT NOT NULL DEFAULT 'sent',

    sent_by TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);


CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER,

    event_type TEXT NOT NULL,

    title TEXT NOT NULL,

    description TEXT,

    metadata TEXT,

    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_activity_user
ON activity_logs(user_id, created_at DESC);


CREATE TABLE IF NOT EXISTS app_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value TEXT,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);


INSERT OR IGNORE INTO app_settings
(setting_key, setting_value)
VALUES
('app_name', 'Rico Club'),
('announcement', ''),
('primary_color', '#FA59A9'),
('secondary_color', '#64D6FA'),
('background_color', '#0D0C1B'),
('checkin_enabled', 'true'),
('missions_enabled', 'true'),
('rewards_enabled', 'true'),
('drops_enabled', 'true'),
('referrals_enabled', 'true'),
('leaderboard_enabled', 'true'),
('daily_checkin_points', '20');
