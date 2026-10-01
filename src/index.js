const encoder = new TextEncoder();

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (url.pathname.startsWith("/api/")) {
        return handleApi(request, env, url);
      }

      if (url.pathname.startsWith("/telegram/")) {
        return handleTelegram(request, env, url);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      console.error(error);

      return json(
        {
          ok: false,
          error: "Internal server error"
        },
        500
      );
    } 
  }
};

/* =========================================================
   API ROUTER
========================================================= */

async function handleApi(request, env, url) {
  const path = url.pathname;

  if (path === "/api/health" && request.method === "GET") {
    return json({
      ok: true,
      app: env.APP_NAME || "Rico Club"
    });
  }

  if (path === "/api/app/bootstrap" && request.method === "POST") {
    return appBootstrap(request, env);
  }

  if (path === "/api/app/checkin" && request.method === "POST") {
    return appCheckin(request, env);
  }

  if (path === "/api/app/leaderboard" && request.method === "POST") {
    return appLeaderboard(request, env);
  }

  if (path === "/api/app/activity" && request.method === "POST") {
    return appActivity(request, env);
  }

  if (path === "/api/admin/login" && request.method === "POST") {
    return adminLogin(request, env);
  }

  if (path === "/api/admin/logout" && request.method === "POST") {
    return adminLogout();
  }

  if (path === "/api/admin/me" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return json({
      ok: true,
      admin
    });
  }

  if (path === "/api/admin/dashboard" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return adminDashboard(env);
  }

  if (path === "/api/admin/players" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return adminPlayers(env, url);
  }

  if (
    path.startsWith("/api/admin/player/") &&
    request.method === "GET"
  ) {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    const id = path.split("/").pop();

    return adminPlayerDetail(env, id);
  }

  if (
    path.startsWith("/api/admin/player/") &&
    path.endsWith("/points") &&
    request.method === "POST"
  ) {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    const pieces = path.split("/");
    const id = pieces[4];

    return adminAdjustPoints(request, env, id, admin);
  }

  if (
    path.startsWith("/api/admin/player/") &&
    path.endsWith("/message") &&
    request.method === "POST"
  ) {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    const pieces = path.split("/");
    const id = pieces[4];

    return adminSendMessage(request, env, id, admin);
  }

  if (path === "/api/admin/missions" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return listMissions(env);
  }

  if (path === "/api/admin/missions" && request.method === "POST") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return createMission(request, env);
  }

  if (path === "/api/admin/rewards" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return listRewards(env);
  }

  if (path === "/api/admin/rewards" && request.method === "POST") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return createReward(request, env);
  }

  if (path === "/api/admin/drops" && request.method === "GET") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return listDrops(env);
  }

  if (path === "/api/admin/drops" && request.method === "POST") {
    const admin = await requireAdmin(request, env);

    if (!admin) {
      return json({ ok: false }, 401);
    }

    return createDrop(request, env);
  }

  return json(
    {
      ok: false,
      error: "Not found"
    },
    404
  );
}


/* =========================================================
   TELEGRAM MINI APP AUTHENTICATION
========================================================= */

async function getTelegramUser(request, env) {
  const initData = request.headers.get("X-Telegram-Init-Data");

  if (!initData || !env.BOT_TOKEN) {
    return null;
  }

  const valid = await validateTelegramInitData(
    initData,
    env.BOT_TOKEN
  );

  if (!valid) {
    return null;
  }

  const params = new URLSearchParams(initData);

  const rawUser = params.get("user");

  if (!rawUser) {
    return null;
  }

  let telegramUser;

  try {
    telegramUser = JSON.parse(rawUser);
  } catch {
    return null;
  }

  if (!telegramUser?.id) {
    return null;
  }

  return telegramUser;
}


async function validateTelegramInitData(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);

    const receivedHash = params.get("hash");

    if (!receivedHash) {
      return false;
    }

    params.delete("hash");

    const authDate = Number(params.get("auth_date"));

    if (!authDate) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);

    if (now - authDate > 86400) {
      return false;
    }

    const entries = [];

    for (const [key, value] of params.entries()) {
      entries.push(`${key}=${value}`);
    }

    entries.sort();

    const dataCheckString = entries.join("\n");

    const secretKey = await crypto.subtle.sign(
      "HMAC",
      await crypto.subtle.importKey(
        "raw",
        encoder.encode("WebAppData"),
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        false,
        ["sign"]
      ),
      encoder.encode(botToken)
    );

    const key = await crypto.subtle.importKey(
      "raw",
      secretKey,
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(dataCheckString)
    );

    return bytesToHex(new Uint8Array(signature)) === receivedHash;
  } catch {
    return false;
  }
}


function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}


/* =========================================================
   PLAYER BOOTSTRAP
========================================================= */

async function appBootstrap(request, env) {
  const telegramUser = await getTelegramUser(request, env);

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error: "Telegram authentication required"
      },
      401
    );
  }

  const telegramId = String(telegramUser.id);

  let user = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE telegram_id = ?
      LIMIT 1
      `
    )
    .bind(telegramId)
    .first();

  if (!user) {
    const referralCode = await makeReferralCode(telegramId);

    await env.DB
      .prepare(
        `
        INSERT INTO users (
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          language_code,
          photo_url,
          referral_code,
          joined_at,
          last_active_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
      )
      .bind(
        telegramId,
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || "en",
        telegramUser.photo_url || null,
        referralCode
      )
      .run();

    user = await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE telegram_id = ?
        LIMIT 1
        `
      )
      .bind(telegramId)
      .first();

    await logActivity(
      env,
      user.id,
      "account_created",
      "Joined Rico Club",
      null
    );
  } else {
    await env.DB
      .prepare(
        `
        UPDATE users
        SET
          telegram_username = ?,
          first_name = ?,
          last_name = ?,
          language_code = ?,
          photo_url = ?,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || "en",
        telegramUser.photo_url || null,
        user.id
      )
      .run();

    user = await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE id = ?
        `
      )
      .bind(user.id)
      .first();
  }

  const today = getDateInTimezone(
    env.APP_TIMEZONE || "America/Sao_Paulo"
  );

  const checkin = await env.DB
    .prepare(
      `
      SELECT id
      FROM checkins
      WHERE user_id = ?
        AND checkin_date = ?
      LIMIT 1
      `
    )
    .bind(user.id, today)
    .first();

  const missions = await env.DB
    .prepare(
      `
      SELECT *
      FROM missions
      WHERE status = 'active'
        AND (start_at IS NULL OR datetime(start_at) <= datetime('now'))
        AND (end_at IS NULL OR datetime(end_at) >= datetime('now'))
      ORDER BY sort_order ASC, id DESC
      LIMIT 20
      `
    )
    .all();

  const rewards = await env.DB
    .prepare(
      `
      SELECT *
      FROM rewards
      WHERE status = 'active'
        AND (start_at IS NULL OR datetime(start_at) <= datetime('now'))
        AND (end_at IS NULL OR datetime(end_at) >= datetime('now'))
      ORDER BY sort_order ASC, id DESC
      LIMIT 30
      `
    )
    .all();

  const drops = await env.DB
    .prepare(
      `
      SELECT *
      FROM drops
      WHERE status IN ('active', 'scheduled')
        AND datetime(end_at) >= datetime('now')
      ORDER BY datetime(start_at) ASC
      LIMIT 10
      `
    )
    .all();

  const leaderboard = await getLeaderboard(env, 10);

  const rank = await getUserRank(env, user.id);

  const settingsRows = await env.DB
    .prepare(
      `
      SELECT setting_key, setting_value
      FROM app_settings
      `
    )
    .all();

  const settings = {};

  for (const row of settingsRows.results || []) {
    settings[row.setting_key] = row.setting_value;
  }

  return json({
    ok: true,

    user: {
      id: user.id,
      telegram_id: user.telegram_id,
      telegram_username: user.telegram_username,
      first_name: user.first_name,
      last_name: user.last_name,
      language_code: user.language_code,
      photo_url: user.photo_url,
      tier: user.tier,
      current_points: user.current_points,
      lifetime_points: user.lifetime_points,
      current_streak: user.current_streak,
      longest_streak: user.longest_streak,
      referral_code: user.referral_code,
      joined_at: user.joined_at,
      rank
    },

    checked_in_today: Boolean(checkin),

    missions: missions.results || [],

    rewards: rewards.results || [],

    drops: drops.results || [],

    leaderboard,

    settings
  });
}


/* =========================================================
   CHECK-IN
========================================================= */

async function appCheckin(request, env) {
  const telegramUser = await getTelegramUser(request, env);

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error: "Telegram authentication required"
      },
      401
    );
  }

  const user = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE telegram_id = ?
      LIMIT 1
      `
    )
    .bind(String(telegramUser.id))
    .first();

  if (!user) {
    return json(
      {
        ok: false,
        error: "Player not found"
      },
      404
    );
  }

  const timezone =
    env.APP_TIMEZONE ||
    "America/Sao_Paulo";

  const today = getDateInTimezone(timezone);

  const existing = await env.DB
    .prepare(
      `
      SELECT *
      FROM checkins
      WHERE user_id = ?
        AND checkin_date = ?
      LIMIT 1
      `
    )
    .bind(user.id, today)
    .first();

  if (existing) {
    return json({
      ok: true,
      already_checked_in: true,
      streak: existing.streak_after,
      points: user.current_points
    });
  }

  const yesterday = shiftDate(today, -1);

  let streak = 1;

  if (user.last_checkin_date === yesterday) {
    streak = Number(user.current_streak || 0) + 1;
  }

  let bonus = 0;

  const streakBonuses = {
    7: 50,
    14: 150,
    28: 300,
    56: 600,
    84: 900,
    112: 1200
  };

  bonus = streakBonuses[streak] || 0;

  const basePoints = 20;

  const totalPoints = basePoints + bonus;

  try {
    await env.DB.batch([
      env.DB
        .prepare(
          `
          INSERT INTO checkins (
            user_id,
            checkin_date,
            base_points,
            bonus_points,
            streak_after
          )
          VALUES (?, ?, ?, ?, ?)
          `
        )
        .bind(
          user.id,
          today,
          basePoints,
          bonus,
          streak
        ),

      env.DB
        .prepare(
          `
          INSERT INTO point_transactions (
            user_id,
            transaction_type,
            amount,
            reference_type,
            description
          )
          VALUES (?, 'checkin', ?, 'checkin', ?)
          `
        )
        .bind(
          user.id,
          totalPoints,
          bonus > 0
            ? `Daily check-in + ${streak}-day streak reward`
            : "Daily check-in"
        ),

      env.DB
        .prepare(
          `
          UPDATE users
          SET
            current_points = current_points + ?,
            lifetime_points = lifetime_points + ?,
            current_streak = ?,
            longest_streak =
              CASE
                WHEN longest_streak < ? THEN ?
                ELSE longest_streak
              END,
            last_checkin_date = ?,
            last_active_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
          `
        )
        .bind(
          totalPoints,
          totalPoints,
          streak,
          streak,
          streak,
          today,
          user.id
        )
    ]);
  } catch (error) {
    const refreshed = await env.DB
      .prepare(
        `
        SELECT *
        FROM checkins
        WHERE user_id = ?
          AND checkin_date = ?
        `
      )
      .bind(user.id, today)
      .first();

    if (refreshed) {
      return json({
        ok: true,
        already_checked_in: true,
        streak: refreshed.streak_after
      });
    }

    throw error;
  }

  await logActivity(
    env,
    user.id,
    "checkin",
    "Daily check-in",
    `+${totalPoints} Rico Points`
  );

  const refreshedUser = await env.DB
    .prepare(
      `
      SELECT current_points, lifetime_points
      FROM users
      WHERE id = ?
      `
    )
    .bind(user.id)
    .first();

  return json({
    ok: true,
    already_checked_in: false,
    base_points: basePoints,
    bonus_points: bonus,
    points_earned: totalPoints,
    streak,
    balance: refreshedUser.current_points
  });
}


/* =========================================================
   LEADERBOARD
========================================================= */

async function appLeaderboard(request, env) {
  const telegramUser = await getTelegramUser(request, env);

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error: "Telegram authentication required"
      },
      401
    );
  }

  const user = await env.DB
    .prepare(
      `
      SELECT id
      FROM users
      WHERE telegram_id = ?
      `
    )
    .bind(String(telegramUser.id))
    .first();

  return json({
    ok: true,
    leaderboard: await getLeaderboard(env, 100),
    user_rank: user
      ? await getUserRank(env, user.id)
      : null
  });
}


async function getLeaderboard(env, limit = 10) {
  const result = await env.DB
    .prepare(
      `
      SELECT
        id,
        telegram_username,
        first_name,
        photo_url,
        tier,
        current_points,
        current_streak
      FROM users
      WHERE status = 'active'
      ORDER BY current_points DESC, lifetime_points DESC, id ASC
      LIMIT ?
      `
    )
    .bind(limit)
    .all();

  return (result.results || []).map(
    (row, index) => ({
      ...row,
      rank: index + 1
    })
  );
}


async function getUserRank(env, userId) {
  const user = await env.DB
    .prepare(
      `
      SELECT current_points
      FROM users
      WHERE id = ?
      `
    )
    .bind(userId)
    .first();

  if (!user) {
    return null;
  }

  const higher = await env.DB
    .prepare(
      `
      SELECT COUNT(*) AS total
      FROM users
      WHERE status = 'active'
        AND current_points > ?
      `
    )
    .bind(user.current_points)
    .first();

  return Number(higher?.total || 0) + 1;
}


/* =========================================================
   PLAYER ACTIVITY
========================================================= */

async function appActivity(request, env) {
  const telegramUser = await getTelegramUser(request, env);

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error: "Telegram authentication required"
      },
      401
    );
  }

  const user = await env.DB
    .prepare(
      `
      SELECT id
      FROM users
      WHERE telegram_id = ?
      `
    )
    .bind(String(telegramUser.id))
    .first();

  if (!user) {
    return json(
      {
        ok: false,
        error: "Player not found"
      },
      404
    );
  }

  const result = await env.DB
    .prepare(
      `
      SELECT
        event_type,
        title,
        description,
        created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 50
      `
    )
    .bind(user.id)
    .all();

  return json({
    ok: true,
    activity: result.results || []
  });
}


/* =========================================================
   ADMIN AUTH
========================================================= */

async function adminLogin(request, env) {
  if (
    !env.ADMIN_EMAIL ||
    !env.ADMIN_PASSWORD ||
    !env.SESSION_SECRET
  ) {
    return json(
      {
        ok: false,
        error: "Admin access is not configured"
      },
      503
    );
  }

  const body = await safeJson(request);

  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  const password = String(body.password || "");

  if (
    !constantTimeEqual(
      email,
      String(env.ADMIN_EMAIL).toLowerCase()
    ) ||
    !constantTimeEqual(
      password,
      String(env.ADMIN_PASSWORD)
    )
  ) {
    return json(
      {
        ok: false,
        error: "Invalid email or password"
      },
      401
    );
  }

  const expires =
    Math.floor(Date.now() / 1000) +
    60 * 60 * 12;

  const payload = `${email}|${expires}`;

  const signature = await signValue(
    payload,
    env.SESSION_SECRET
  );

  const token = btoa(
    JSON.stringify({
      email,
      expires,
      signature
    })
  );

  return new Response(
    JSON.stringify({
      ok: true,
      admin: {
        email
      }
    }),
    {
      status: 200,
      headers: {
        "content-type":
          "application/json;charset=UTF-8",
        "set-cookie":
          `rico_admin=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=43200`
      }
    }
  );
}


function adminLogout() {
  return new Response(
    JSON.stringify({
      ok: true
    }),
    {
      headers: {
        "content-type":
          "application/json;charset=UTF-8",
        "set-cookie":
          "rico_admin=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0"
      }
    }
  );
}


async function requireAdmin(request, env) {
  const cookie = request.headers.get("Cookie") || "";

  const token = getCookie(cookie, "rico_admin");

  if (!token) {
    return null;
  }

  try {
    const data = JSON.parse(atob(token));

    if (
      !data.email ||
      !data.expires ||
      !data.signature
    ) {
      return null;
    }

    if (
      Number(data.expires) <
      Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    const payload =
      `${data.email}|${data.expires}`;

    const expected = await signValue(
      payload,
      env.SESSION_SECRET
    );

    if (
      !constantTimeEqual(
        expected,
        data.signature
      )
    ) {
      return null;
    }

    if (
      !constantTimeEqual(
        data.email,
        String(env.ADMIN_EMAIL || "")
          .toLowerCase()
      )
    ) {
      return null;
    }

    return {
      email: data.email
    };
  } catch {
    return null;
  }
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function adminDashboard(env) {
  const [
    totalPlayers,
    activeToday,
    checkinsToday,
    pointTotals,
    referrals,
    rewardClaims,
    recentActivity
  ] = await Promise.all([
    env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM users
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM users
        WHERE date(last_active_at) = date('now')
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM checkins
        WHERE date(created_at) = date('now')
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM point_transactions
        WHERE amount > 0
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM referrals
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM reward_claims
        `
      )
      .first(),

    env.DB
      .prepare(
        `
        SELECT
          a.id,
          a.event_type,
          a.title,
          a.description,
          a.created_at,
          u.telegram_username,
          u.first_name
        FROM activity_logs a
        LEFT JOIN users u
          ON u.id = a.user_id
        ORDER BY a.id DESC
        LIMIT 15
        `
      )
      .all()
  ]);

  const activityChart = await env.DB
    .prepare(
      `
      SELECT
        date(last_active_at) AS day,
        COUNT(*) AS total
      FROM users
      WHERE datetime(last_active_at) >= datetime('now', '-6 days')
      GROUP BY date(last_active_at)
      ORDER BY day ASC
      `
    )
    .all();

  return json({
    ok: true,

    stats: {
      total_players:
        Number(totalPlayers?.total || 0),

      active_today:
        Number(activeToday?.total || 0),

      checkins_today:
        Number(checkinsToday?.total || 0),

      points_issued:
        Number(pointTotals?.total || 0),

      referrals:
        Number(referrals?.total || 0),

      rewards_claimed:
        Number(rewardClaims?.total || 0)
    },

    activity_chart:
      activityChart.results || [],

    recent_activity:
      recentActivity.results || []
  });
}


/* =========================================================
   ADMIN PLAYERS
========================================================= */

async function adminPlayers(env, url) {
  const search =
    String(url.searchParams.get("search") || "")
      .trim();

  const limit = Math.min(
    Math.max(
      Number(url.searchParams.get("limit") || 50),
      1
    ),
    100
  );

  let result;

  if (search) {
    const q = `%${search}%`;

    result = await env.DB
      .prepare(
        `
        SELECT
          id,
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          photo_url,
          tier,
          current_points,
          current_streak,
          status,
          joined_at,
          last_active_at,
          (
            SELECT COUNT(*)
            FROM referrals
            WHERE referrer_user_id = users.id
          ) AS referrals
        FROM users
        WHERE
          telegram_username LIKE ?
          OR first_name LIKE ?
          OR last_name LIKE ?
          OR telegram_id LIKE ?
        ORDER BY last_active_at DESC
        LIMIT ?
        `
      )
      .bind(q, q, q, q, limit)
      .all();
  } else {
    result = await env.DB
      .prepare(
        `
        SELECT
          id,
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          photo_url,
          tier,
          current_points,
          current_streak,
          status,
          joined_at,
          last_active_at,
          (
            SELECT COUNT(*)
            FROM referrals
            WHERE referrer_user_id = users.id
          ) AS referrals
        FROM users
        ORDER BY last_active_at DESC
        LIMIT ?
        `
      )
      .bind(limit)
      .all();
  }

  return json({
    ok: true,
    players: result.results || []
  });
}


async function adminPlayerDetail(env, id) {
  const player = await env.DB
    .prepare(
      `
      SELECT
        u.*,
        (
          SELECT COUNT(*)
          FROM referrals
          WHERE referrer_user_id = u.id
        ) AS referrals
      FROM users u
      WHERE u.id = ?
      LIMIT 1
      `
    )
    .bind(id)
    .first();

  if (!player) {
    return json(
      {
        ok: false,
        error: "Player not found"
      },
      404
    );
  }

  const [
    transactions,
    activity,
    rewards,
    referrals,
    messages
  ] = await Promise.all([
    env.DB
      .prepare(
        `
        SELECT *
        FROM point_transactions
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 100
        `
      )
      .bind(id)
      .all(),

    env.DB
      .prepare(
        `
        SELECT *
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 100
        `
      )
      .bind(id)
      .all(),

    env.DB
      .prepare(
        `
        SELECT
          rc.*,
          r.title
        FROM reward_claims rc
        JOIN rewards r
          ON r.id = rc.reward_id
        WHERE rc.user_id = ?
        ORDER BY rc.id DESC
        LIMIT 100
        `
      )
      .bind(id)
      .all(),

    env.DB
      .prepare(
        `
        SELECT
          r.*,
          u.telegram_username,
          u.first_name
        FROM referrals r
        JOIN users u
          ON u.id = r.referred_user_id
        WHERE r.referrer_user_id = ?
        ORDER BY r.id DESC
        LIMIT 100
        `
      )
      .bind(id)
      .all(),

    env.DB
      .prepare(
        `
        SELECT *
        FROM messages
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 100
        `
      )
      .bind(id)
      .all()
  ]);

  return json({
    ok: true,
    player,
    rank: await getUserRank(env, Number(id)),
    transactions: transactions.results || [],
    activity: activity.results || [],
    rewards: rewards.results || [],
    referrals: referrals.results || [],
    messages: messages.results || []
  });
}


/* =========================================================
   MANUAL POINT ADJUSTMENT
========================================================= */

async function adminAdjustPoints(
  request,
  env,
  playerId,
  admin
) {
  const body = await safeJson(request);

  const amount = Number(body.amount);

  const reason =
    String(body.reason || "").trim();

  if (
    !Number.isInteger(amount) ||
    amount === 0 ||
    Math.abs(amount) > 1000000
  ) {
    return json(
      {
        ok: false,
        error: "Enter a valid point amount"
      },
      400
    );
  }

  if (!reason) {
    return json(
      {
        ok: false,
        error: "Reason is required"
      },
      400
    );
  }

  const player = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
      `
    )
    .bind(playerId)
    .first();

  if (!player) {
    return json(
      {
        ok: false,
        error: "Player not found"
      },
      404
    );
  }

  if (
    amount < 0 &&
    player.current_points + amount < 0
  ) {
    return json(
      {
        ok: false,
        error: "Adjustment would make the balance negative"
      },
      400
    );
  }

  await env.DB.batch([
    env.DB
      .prepare(
        `
        INSERT INTO point_transactions (
          user_id,
          transaction_type,
          amount,
          reference_type,
          description,
          created_by
        )
        VALUES (?, 'admin_adjustment', ?, 'admin', ?, ?)
        `
      )
      .bind(
        playerId,
        amount,
        reason,
        admin.email
      ),

    env.DB
      .prepare(
        `
        UPDATE users
        SET
          current_points = current_points + ?,
          lifetime_points =
            CASE
              WHEN ? > 0
              THEN lifetime_points + ?
              ELSE lifetime_points
            END,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        amount,
        amount,
        amount,
        playerId
      )
  ]);

  await logActivity(
    env,
    Number(playerId),
    "admin_adjustment",
    amount > 0
      ? "Points added"
      : "Points deducted",
    `${amount > 0 ? "+" : ""}${amount} · ${reason}`
  );

  return json({
    ok: true
  });
}


/* =========================================================
   TELEGRAM MESSAGE
========================================================= */

async function adminSendMessage(
  request,
  env,
  playerId,
  admin
) {
  const body = await safeJson(request);

  const message =
    String(body.message || "").trim();

  const buttonText =
    String(body.button_text || "").trim();

  const buttonUrl =
    String(body.button_url || "").trim();

  if (!message) {
    return json(
      {
        ok: false,
        error: "Message is required"
      },
      400
    );
  }

  if (!env.BOT_TOKEN) {
    return json(
      {
        ok: false,
        error: "Telegram bot is not configured"
      },
      503
    );
  }

  const player = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
      `
    )
    .bind(playerId)
    .first();

  if (!player) {
    return json(
      {
        ok: false,
        error: "Player not found"
      },
      404
    );
  }

  const payload = {
    chat_id: player.telegram_id,
    text: message
  };

  if (buttonText && buttonUrl) {
    payload.reply_markup = {
      inline_keyboard: [
        [
          {
            text: buttonText,
            url: buttonUrl
          }
        ]
      ]
    };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    }
  );

  const telegram = await response.json();

  if (!telegram.ok) {
    return json(
      {
        ok: false,
        error:
          telegram.description ||
          "Telegram message could not be sent"
      },
      400
    );
  }

  await env.DB
    .prepare(
      `
      INSERT INTO messages (
        user_id,
        telegram_message_id,
        message_text,
        button_text,
        button_url,
        status,
        sent_by
      )
      VALUES (?, ?, ?, ?, ?, 'sent', ?)
      `
    )
    .bind(
      playerId,
      String(telegram.result.message_id),
      message,
      buttonText || null,
      buttonUrl || null,
      admin.email
    )
    .run();

  return json({
    ok: true
  });
}


/* =========================================================
   MISSIONS / REWARDS / DROPS
========================================================= */

async function listMissions(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT *
      FROM missions
      ORDER BY id DESC
      `
    )
    .all();

  return json({
    ok: true,
    missions: result.results || []
  });
}


async function createMission(request, env) {
  const body = await safeJson(request);

  const title = String(body.title || "").trim();

  if (!title) {
    return json(
      {
        ok: false,
        error: "Mission title is required"
      },
      400
    );
  }

  const result = await env.DB
    .prepare(
      `
      INSERT INTO missions (
        title,
        description,
        mission_type,
        target_value,
        reward_points,
        button_text,
        button_url,
        start_at,
        end_at,
        required_tier,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      title,
      String(body.description || ""),
      String(body.mission_type || "custom"),
      Number(body.target_value || 1),
      Number(body.reward_points || 0),
      body.button_text || null,
      body.button_url || null,
      body.start_at || null,
      body.end_at || null,
      body.required_tier || null,
      String(body.status || "draft")
    )
    .run();

  return json({
    ok: true,
    id: result.meta.last_row_id
  });
}


async function listRewards(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT *
      FROM rewards
      ORDER BY id DESC
      `
    )
    .all();

  return json({
    ok: true,
    rewards: result.results || []
  });
}


async function createReward(request, env) {
  const body = await safeJson(request);

  const title = String(body.title || "").trim();

  if (!title) {
    return json(
      {
        ok: false,
        error: "Reward title is required"
      },
      400
    );
  }

  const result = await env.DB
    .prepare(
      `
      INSERT INTO rewards (
        title,
        description,
        reward_type,
        points_cost,
        stock,
        required_tier,
        start_at,
        end_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      title,
      String(body.description || ""),
      String(body.reward_type || "manual"),
      Number(body.points_cost || 0),
      body.stock === "" ||
      body.stock === null ||
      body.stock === undefined
        ? null
        : Number(body.stock),
      body.required_tier || null,
      body.start_at || null,
      body.end_at || null,
      String(body.status || "draft")
    )
    .run();

  return json({
    ok: true,
    id: result.meta.last_row_id
  });
}


async function listDrops(env) {
  const result = await env.DB
    .prepare(
      `
      SELECT *
      FROM drops
      ORDER BY id DESC
      `
    )
    .all();

  return json({
    ok: true,
    drops: result.results || []
  });
}


async function createDrop(request, env) {
  const body = await safeJson(request);

  const title = String(body.title || "").trim();

  if (
    !title ||
    !body.start_at ||
    !body.end_at
  ) {
    return json(
      {
        ok: false,
        error:
          "Title, start date and end date are required"
      },
      400
    );
  }

  const result = await env.DB
    .prepare(
      `
      INSERT INTO drops (
        title,
        description,
        reward_type,
        reward_value,
        total_quantity,
        required_tier,
        claim_limit_per_user,
        start_at,
        end_at,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
    )
    .bind(
      title,
      String(body.description || ""),
      String(body.reward_type || "points"),
      Number(body.reward_value || 0),
      Number(body.total_quantity || 0),
      body.required_tier || null,
      Number(body.claim_limit_per_user || 1),
      body.start_at,
      body.end_at,
      String(body.status || "draft")
    )
    .run();

  return json({
    ok: true,
    id: result.meta.last_row_id
  });
}


/* =========================================================
   TELEGRAM WEBHOOK
========================================================= */

async function handleTelegram(request, env, url) {
  if (
    url.pathname !== "/telegram/webhook" ||
    request.method !== "POST"
  ) {
    return json(
      {
        ok: false
      },
      404
    );
  }

  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret =
      request.headers.get(
        "X-Telegram-Bot-Api-Secret-Token"
      );

    if (
      !constantTimeEqual(
        secret || "",
        env.TELEGRAM_WEBHOOK_SECRET
      )
    ) {
      return json(
        {
          ok: false
        },
        403
      );
    }
  }

  const update = await safeJson(request);

  const message = update.message;

  if (!message?.from?.id) {
    return json({
      ok: true
    });
  }

  const telegramUser = message.from;

  await upsertTelegramUser(
    env,
    telegramUser
  );

  if (
    message.text &&
    message.text.startsWith("/start")
  ) {
    await processStartCommand(
      env,
      telegramUser,
      message.chat.id,
      message.text
    );
  }

  return json({
    ok: true
  });
}


async function upsertTelegramUser(env, telegramUser) {
  const telegramId =
    String(telegramUser.id);

  let user = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE telegram_id = ?
      `
    )
    .bind(telegramId)
    .first();

  if (!user) {
    const referralCode =
      await makeReferralCode(telegramId);

    await env.DB
      .prepare(
        `
        INSERT INTO users (
          telegram_id,
          telegram_username,
          first_name,
          last_name,
          language_code,
          referral_code
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        telegramId,
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || "en",
        referralCode
      )
      .run();

    user = await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(telegramId)
      .first();
  } else {
    await env.DB
      .prepare(
        `
        UPDATE users
        SET
          telegram_username = ?,
          first_name = ?,
          last_name = ?,
          language_code = ?,
          last_active_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.language_code || "en",
        user.id
      )
      .run();
  }

  return user;
}


async function processStartCommand(
  env,
  telegramUser,
  chatId,
  text
) {
  const user = await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE telegram_id = ?
      `
    )
    .bind(String(telegramUser.id))
    .first();

  const parts = text.trim().split(/\s+/);

  if (
    parts.length > 1 &&
    parts[1].startsWith("ref_") &&
    !user.referred_by_user_id
  ) {
    const referralCode =
      parts[1].substring(4);

    const referrer = await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE referral_code = ?
        `
      )
      .bind(referralCode)
      .first();

    if (
      referrer &&
      Number(referrer.id) !== Number(user.id)
    ) {
      try {
        await env.DB.batch([
          env.DB
            .prepare(
              `
              UPDATE users
              SET referred_by_user_id = ?
              WHERE id = ?
              `
            )
            .bind(
              referrer.id,
              user.id
            ),

          env.DB
            .prepare(
              `
              INSERT INTO referrals (
                referrer_user_id,
                referred_user_id,
                status
              )
              VALUES (?, ?, 'pending')
              `
            )
            .bind(
              referrer.id,
              user.id
            )
        ]);
      } catch {
        // Referral already recorded.
      }
    }
  }

  if (!env.BOT_TOKEN) {
    return;
  }

  const miniAppUrl =
    env.MINI_APP_URL || "";

  const keyboard =
    miniAppUrl
      ? {
          inline_keyboard: [
            [
              {
                text: "Open Rico Club",
                web_app: {
                  url: miniAppUrl
                }
              }
            ],
            [
              {
                text: "Official Channel",
                url:
                  env.OFFICIAL_CHANNEL_URL ||
                  "https://t.me/"
              }
            ]
          ]
        }
      : undefined;

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,

        text:
          "Welcome to Rico Club.\n\nCheck in daily, complete missions, invite friends and unlock rewards.",

        reply_markup: keyboard
      })
    }
  );
}


/* =========================================================
   HELPERS
========================================================= */

async function logActivity(
  env,
  userId,
  eventType,
  title,
  description
) {
  await env.DB
    .prepare(
      `
      INSERT INTO activity_logs (
        user_id,
        event_type,
        title,
        description
      )
      VALUES (?, ?, ?, ?)
      `
    )
    .bind(
      userId || null,
      eventType,
      title,
      description || null
    )
    .run();
}


function getDateInTimezone(timezone) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date());

  const values = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}


function shiftDate(dateString, days) {
  const [year, month, day] =
    dateString.split("-").map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);
}


async function makeReferralCode(seed) {
  const data = encoder.encode(
    `${seed}:${crypto.randomUUID()}`
  );

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data
    );

  return bytesToHex(
    new Uint8Array(digest)
  )
    .substring(0, 10)
    .toUpperCase();
}


async function signValue(value, secret) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(value)
    );

  return bytesToHex(
    new Uint8Array(signature)
  );
}


function getCookie(cookieHeader, name) {
  const cookies =
    cookieHeader.split(";");

  for (const cookie of cookies) {
    const [key, ...value] =
      cookie.trim().split("=");

    if (key === name) {
      return value.join("=");
    }
  }

  return null;
}


function constantTimeEqual(a, b) {
  a = String(a);
  b = String(b);

  if (a.length !== b.length) {
    return false;
  }

  let result = 0;

  for (let i = 0; i < a.length; i++) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}


async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}


function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "content-type":
          "application/json;charset=UTF-8",

        "cache-control":
          "no-store"
      }
    }
  );
}
