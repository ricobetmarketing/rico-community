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

  /* -------------------------------------------------------
     PUBLIC / MINI APP
  ------------------------------------------------------- */

  if (
    path === "/api/health" &&
    request.method === "GET"
  ) {
    return json({
      ok: true,
      app: env.APP_NAME || "Rico Club"
    });
  }

  if (
    path === "/api/app/bootstrap" &&
    request.method === "POST"
  ) {
    return appBootstrap(request, env);
  }

  if (
    path === "/api/app/checkin" &&
    request.method === "POST"
  ) {
    return appCheckin(request, env);
  }

  if (
    path === "/api/app/activity" &&
    request.method === "POST"
  ) {
    return appActivity(request, env);
  }

  if (
    path === "/api/app/leaderboard" &&
    request.method === "POST"
  ) {
    return appLeaderboard(request, env);
  }

  if (
    path === "/api/app/redeem" &&
    request.method === "POST"
  ) {
    return appRedeemReward(request, env);
  }


  /* -------------------------------------------------------
     ADMIN AUTH
  ------------------------------------------------------- */

  if (
    path === "/api/admin/login" &&
    request.method === "POST"
  ) {
    return adminLogin(request, env);
  }

  if (
    path === "/api/admin/logout" &&
    request.method === "POST"
  ) {
    return adminLogout();
  }

  if (
    path === "/api/admin/me" &&
    request.method === "GET"
  ) {
    const admin =
      await requireAdmin(request, env);

    if (!admin) {
      return json(
        { ok: false },
        401
      );
    }

    return json({
      ok: true,
      admin
    });
  }


  /* -------------------------------------------------------
     ALL ROUTES BELOW REQUIRE ADMIN
  ------------------------------------------------------- */

  if (path.startsWith("/api/admin/")) {
    const admin =
      await requireAdmin(request, env);

    if (!admin) {
      return json(
        {
          ok: false,
          error: "Unauthorized"
        },
        401
      );
    }

    /* DASHBOARD */

    if (
      path === "/api/admin/dashboard" &&
      request.method === "GET"
    ) {
      return adminDashboard(env);
    }


    /* PLAYERS */

    if (
      path === "/api/admin/players" &&
      request.method === "GET"
    ) {
      return adminPlayers(env, url);
    }

    if (
      /^\/api\/admin\/player\/\d+$/.test(path) &&
      request.method === "GET"
    ) {
      const id =
        path.split("/").pop();

      return adminPlayerDetail(
        env,
        id
      );
    }

    if (
      /^\/api\/admin\/player\/\d+\/points$/.test(path) &&
      request.method === "POST"
    ) {
      const id =
        path.split("/")[4];

      return adminAdjustPoints(
        request,
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/player\/\d+\/message$/.test(path) &&
      request.method === "POST"
    ) {
      const id =
        path.split("/")[4];

      return adminSendMessage(
        request,
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/player\/\d+\/status$/.test(path) &&
      request.method === "PATCH"
    ) {
      const id =
        path.split("/")[4];

      return adminPlayerStatus(
        request,
        env,
        id,
        admin
      );
    }


    /* MISSIONS */

    if (
      path === "/api/admin/missions" &&
      request.method === "GET"
    ) {
      return listMissions(env);
    }

    if (
      path === "/api/admin/missions" &&
      request.method === "POST"
    ) {
      return createMission(
        request,
        env,
        admin
      );
    }

    if (
      /^\/api\/admin\/missions\/\d+$/.test(path) &&
      request.method === "PATCH"
    ) {
      const id =
        path.split("/").pop();

      return updateMission(
        request,
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/missions\/\d+$/.test(path) &&
      request.method === "DELETE"
    ) {
      const id =
        path.split("/").pop();

      return deleteMission(
        env,
        id,
        admin
      );
    }


    /* REWARDS */

    if (
      path === "/api/admin/rewards" &&
      request.method === "GET"
    ) {
      return listRewards(env);
    }

    if (
      path === "/api/admin/rewards" &&
      request.method === "POST"
    ) {
      return createReward(
        request,
        env,
        admin
      );
    }

    if (
      /^\/api\/admin\/rewards\/\d+$/.test(path) &&
      request.method === "PATCH"
    ) {
      const id =
        path.split("/").pop();

      return updateReward(
        request,
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/rewards\/\d+$/.test(path) &&
      request.method === "DELETE"
    ) {
      const id =
        path.split("/").pop();

      return deleteReward(
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/rewards\/\d+\/codes$/.test(path) &&
      request.method === "POST"
    ) {
      const id =
        path.split("/")[4];

      return uploadRewardCodes(
        request,
        env,
        id,
        admin
      );
    }

    if (
      path === "/api/admin/reward-claims" &&
      request.method === "GET"
    ) {
      return listRewardClaims(env);
    }


    /* DROPS */

    if (
      path === "/api/admin/drops" &&
      request.method === "GET"
    ) {
      return listDrops(env);
    }

    if (
      path === "/api/admin/drops" &&
      request.method === "POST"
    ) {
      return createDrop(
        request,
        env,
        admin
      );
    }

    if (
      /^\/api\/admin\/drops\/\d+$/.test(path) &&
      request.method === "PATCH"
    ) {
      const id =
        path.split("/").pop();

      return updateDrop(
        request,
        env,
        id,
        admin
      );
    }

    if (
      /^\/api\/admin\/drops\/\d+$/.test(path) &&
      request.method === "DELETE"
    ) {
      const id =
        path.split("/").pop();

      return deleteDrop(
        env,
        id,
        admin
      );
    }


    /* REFERRALS */

    if (
      path === "/api/admin/referrals" &&
      request.method === "GET"
    ) {
      return adminReferrals(env);
    }


    /* SETTINGS */

    if (
      path === "/api/admin/settings" &&
      request.method === "GET"
    ) {
      return getAdminSettings(env);
    }

    if (
      path === "/api/admin/settings" &&
      request.method === "PUT"
    ) {
      return saveAdminSettings(
        request,
        env,
        admin
      );
    }


    /* AUDIT */

    if (
      path === "/api/admin/audit" &&
      request.method === "GET"
    ) {
      return adminAuditLogs(env);
    }
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
   TELEGRAM AUTH
========================================================= */

async function getTelegramUser(request, env) {
  const initData =
    request.headers.get(
      "X-Telegram-Init-Data"
    );

  if (
    !initData ||
    !env.BOT_TOKEN
  ) {
    return null;
  }

  const valid =
    await validateTelegramInitData(
      initData,
      env.BOT_TOKEN
    );

  if (!valid) {
    return null;
  }

  const params =
    new URLSearchParams(
      initData
    );

  const rawUser =
    params.get("user");

  if (!rawUser) {
    return null;
  }

  try {
    const user =
      JSON.parse(rawUser);

    return user?.id
      ? user
      : null;

  } catch {
    return null;
  }
}


async function validateTelegramInitData(
  initData,
  botToken
) {
  try {
    const params =
      new URLSearchParams(
        initData
      );

    const receivedHash =
      params.get("hash");

    if (!receivedHash) {
      return false;
    }

    params.delete("hash");

    const authDate =
      Number(
        params.get("auth_date")
      );

    if (!authDate) {
      return false;
    }

    const now =
      Math.floor(
        Date.now() / 1000
      );

    if (
      now - authDate >
      86400
    ) {
      return false;
    }

    const lines = [];

    for (
      const [key, value]
      of params.entries()
    ) {
      lines.push(
        `${key}=${value}`
      );
    }

    lines.sort();

    const dataCheckString =
      lines.join("\n");

    const webAppKey =
      await crypto.subtle.importKey(
        "raw",
        encoder.encode(
          "WebAppData"
        ),
        {
          name: "HMAC",
          hash: "SHA-256"
        },
        false,
        ["sign"]
      );

    const secretKey =
      await crypto.subtle.sign(
        "HMAC",
        webAppKey,
        encoder.encode(
          botToken
        )
      );

    const validationKey =
      await crypto.subtle.importKey(
        "raw",
        secretKey,
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
        validationKey,
        encoder.encode(
          dataCheckString
        )
      );

    return (
      bytesToHex(
        new Uint8Array(
          signature
        )
      ) === receivedHash
    );

  } catch {
    return false;
  }
}


/* =========================================================
   APP BOOTSTRAP
========================================================= */

async function appBootstrap(
  request,
  env
) {
  const telegramUser =
    await getTelegramUser(
      request,
      env
    );

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error:
          "Telegram authentication required"
      },
      401
    );
  }

  let user =
    await upsertTelegramUser(
      env,
      telegramUser
    );

  if (
    user.status !==
    "active"
  ) {
    return json(
      {
        ok: false,
        error:
          "This Rico Club account is currently unavailable."
      },
      403
    );
  }

  const settings =
    await getSettingsMap(env);

  const today =
    getDateInTimezone(
      env.APP_TIMEZONE ||
      "America/Sao_Paulo"
    );

  const checkin =
    await env.DB
      .prepare(
        `
        SELECT id
        FROM checkins
        WHERE user_id = ?
        AND checkin_date = ?
        LIMIT 1
        `
      )
      .bind(
        user.id,
        today
      )
      .first();

  const missions =
    settings.show_missions === "false"
      ? { results: [] }
      : await env.DB
          .prepare(
            `
            SELECT *
            FROM missions
            WHERE status = 'active'
            AND (
              start_at IS NULL
              OR datetime(start_at) <= datetime('now')
            )
            AND (
              end_at IS NULL
              OR datetime(end_at) >= datetime('now')
            )
            ORDER BY sort_order ASC, id DESC
            `
          )
          .all();

  const rewards =
    settings.show_rewards === "false"
      ? { results: [] }
      : await env.DB
          .prepare(
            `
            SELECT *
            FROM rewards
            WHERE status = 'active'
            AND (
              start_at IS NULL
              OR datetime(start_at) <= datetime('now')
            )
            AND (
              end_at IS NULL
              OR datetime(end_at) >= datetime('now')
            )
            ORDER BY sort_order ASC, id DESC
            `
          )
          .all();

  const drops =
    settings.show_drops === "false"
      ? { results: [] }
      : await env.DB
          .prepare(
            `
            SELECT *
            FROM drops
            WHERE status IN (
              'active',
              'scheduled'
            )
            AND datetime(end_at) >= datetime('now')
            ORDER BY datetime(start_at) ASC
            `
          )
          .all();

  const leaderboard =
    settings.show_leaderboard === "false"
      ? []
      : await getLeaderboard(
          env,
          100
        );

  user.rank =
    await getUserRank(
      env,
      user.id
    );

  return json({
    ok: true,

    user,

    checked_in_today:
      Boolean(checkin),

    missions:
      missions.results || [],

    rewards:
      rewards.results || [],

    drops:
      drops.results || [],

    leaderboard,

    settings
  });
}


/* =========================================================
   CHECK-IN
========================================================= */

async function appCheckin(
  request,
  env
) {
  const telegramUser =
    await getTelegramUser(
      request,
      env
    );

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error:
          "Telegram authentication required"
      },
      401
    );
  }

  const user =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(
        String(
          telegramUser.id
        )
      )
      .first();

  if (!user) {
    return json(
      {
        ok: false,
        error:
          "Player not found"
      },
      404
    );
  }

  if (
    user.status !==
    "active"
  ) {
    return json(
      {
        ok: false,
        error:
          "Account unavailable"
      },
      403
    );
  }

  const settings =
    await getSettingsMap(env);

  if (
    settings.show_checkin ===
    "false"
  ) {
    return json(
      {
        ok: false,
        error:
          "Daily check-in is currently unavailable."
      },
      400
    );
  }

  const timezone =
    env.APP_TIMEZONE ||
    "America/Sao_Paulo";

  const today =
    getDateInTimezone(
      timezone
    );

  const existing =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM checkins
        WHERE user_id = ?
        AND checkin_date = ?
        `
      )
      .bind(
        user.id,
        today
      )
      .first();

  if (existing) {
    return json({
      ok: true,
      already_checked_in:
        true,
      streak:
        existing.streak_after,
      points:
        user.current_points
    });
  }

  const yesterday =
    shiftDate(
      today,
      -1
    );

  const streak =
    user.last_checkin_date ===
    yesterday
      ? Number(
          user.current_streak ||
          0
        ) + 1
      : 1;

  const basePoints =
    Number(
      settings.daily_checkin_points ||
      20
    );

  const bonuses = {
    7:
      Number(
        settings.streak_bonus_7 ||
        50
      ),

    14:
      Number(
        settings.streak_bonus_14 ||
        150
      ),

    28:
      Number(
        settings.streak_bonus_28 ||
        300
      ),

    56:
      Number(
        settings.streak_bonus_56 ||
        600
      ),

    84:
      Number(
        settings.streak_bonus_84 ||
        900
      ),

    112:
      Number(
        settings.streak_bonus_112 ||
        1200
      )
  };

  const bonus =
    bonuses[streak] ||
    0;

  const earned =
    basePoints +
    bonus;

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
        VALUES (
          ?,
          'checkin',
          ?,
          'checkin',
          ?
        )
        `
      )
      .bind(
        user.id,
        earned,
        bonus
          ? `Daily check-in + ${streak}-day streak reward`
          : "Daily check-in"
      ),

    env.DB
      .prepare(
        `
        UPDATE users
        SET
          current_points =
            current_points + ?,

          lifetime_points =
            lifetime_points + ?,

          current_streak = ?,

          longest_streak =
            CASE
              WHEN longest_streak < ?
              THEN ?
              ELSE longest_streak
            END,

          last_checkin_date = ?,

          last_active_at =
            CURRENT_TIMESTAMP,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = ?
        `
      )
      .bind(
        earned,
        earned,
        streak,
        streak,
        streak,
        today,
        user.id
      )
  ]);

  await logActivity(
    env,
    user.id,
    "checkin",
    "Daily check-in",
    `+${earned} Rico Points`
  );

  await updateUserTier(
    env,
    user.id
  );

  const refreshed =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE id = ?
        `
      )
      .bind(
        user.id
      )
      .first();

  return json({
    ok: true,

    already_checked_in:
      false,

    base_points:
      basePoints,

    bonus_points:
      bonus,

    points_earned:
      earned,

    streak,

    balance:
      refreshed.current_points
  });
}


/* =========================================================
   REWARD REDEMPTION
========================================================= */

async function appRedeemReward(
  request,
  env
) {
  const telegramUser =
    await getTelegramUser(
      request,
      env
    );

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error:
          "Telegram authentication required"
      },
      401
    );
  }

  const body =
    await safeJson(
      request
    );

  const rewardId =
    Number(
      body.reward_id
    );

  if (!rewardId) {
    return json(
      {
        ok: false,
        error:
          "Reward is required"
      },
      400
    );
  }

  const user =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(
        String(
          telegramUser.id
        )
      )
      .first();

  const reward =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM rewards
        WHERE id = ?
        AND status = 'active'
        `
      )
      .bind(
        rewardId
      )
      .first();

  if (
    !user ||
    !reward
  ) {
    return json(
      {
        ok: false,
        error:
          "Reward unavailable"
      },
      404
    );
  }

  const cost =
    Number(
      reward.points_cost ||
      0
    );

  if (
    Number(
      user.current_points
    ) <
    cost
  ) {
    return json(
      {
        ok: false,
        error:
          "Not enough Rico Points"
      },
      400
    );
  }

  if (
    reward.stock !== null &&
    Number(
      reward.redeemed_count
    ) >=
    Number(
      reward.stock
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "Reward is out of stock"
      },
      400
    );
  }

  let code = null;
  let codeId = null;

  if (
    reward.reward_type ===
    "voucher" ||
    reward.reward_type ===
    "promo"
  ) {
    const availableCode =
      await env.DB
        .prepare(
          `
          SELECT *
          FROM reward_codes
          WHERE reward_id = ?
          AND status = 'available'
          ORDER BY id ASC
          LIMIT 1
          `
        )
        .bind(
          rewardId
        )
        .first();

    if (!availableCode) {
      return json(
        {
          ok: false,
          error:
            "No reward codes available"
        },
        400
      );
    }

    code =
      availableCode.code;

    codeId =
      availableCode.id;
  }

  const statements = [
    env.DB
      .prepare(
        `
        UPDATE users
        SET
          current_points =
            current_points - ?,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        cost,
        user.id
      ),

    env.DB
      .prepare(
        `
        INSERT INTO point_transactions (
          user_id,
          transaction_type,
          amount,
          reference_type,
          reference_id,
          description
        )
        VALUES (
          ?,
          'reward_redemption',
          ?,
          'reward',
          ?,
          ?
        )
        `
      )
      .bind(
        user.id,
        -cost,
        String(
          reward.id
        ),
        `Redeemed ${reward.title}`
      ),

    env.DB
      .prepare(
        `
        INSERT INTO reward_claims (
          reward_id,
          user_id,
          points_spent,
          reward_code_id,
          status
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          'claimed'
        )
        `
      )
      .bind(
        reward.id,
        user.id,
        cost,
        codeId
      ),

    env.DB
      .prepare(
        `
        UPDATE rewards
        SET
          redeemed_count =
            redeemed_count + 1,
          updated_at =
            CURRENT_TIMESTAMP
        WHERE id = ?
        `
      )
      .bind(
        reward.id
      )
  ];

  if (codeId) {
    statements.push(
      env.DB
        .prepare(
          `
          UPDATE reward_codes
          SET
            status = 'assigned',
            assigned_user_id = ?,
            assigned_at =
              CURRENT_TIMESTAMP
          WHERE id = ?
          `
        )
        .bind(
          user.id,
          codeId
        )
    );
  }

  await env.DB.batch(
    statements
  );

  await logActivity(
    env,
    user.id,
    "reward",
    "Reward redeemed",
    reward.title
  );

  return json({
    ok: true,
    reward:
      reward.title,
    points_spent:
      cost,
    code
  });
}


/* =========================================================
   APP ACTIVITY / LEADERBOARD
========================================================= */

async function appActivity(
  request,
  env
) {
  const telegramUser =
    await getTelegramUser(
      request,
      env
    );

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error:
          "Telegram authentication required"
      },
      401
    );
  }

  const user =
    await env.DB
      .prepare(
        `
        SELECT id
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(
        String(
          telegramUser.id
        )
      )
      .first();

  if (!user) {
    return json(
      {
        ok: false,
        error:
          "Player not found"
      },
      404
    );
  }

  const result =
    await env.DB
      .prepare(
        `
        SELECT
          event_type,
          title,
          description,
          created_at
        FROM activity_logs
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 50
        `
      )
      .bind(
        user.id
      )
      .all();

  return json({
    ok: true,
    activity:
      result.results || []
  });
}


async function appLeaderboard(
  request,
  env
) {
  const telegramUser =
    await getTelegramUser(
      request,
      env
    );

  if (!telegramUser) {
    return json(
      {
        ok: false,
        error:
          "Telegram authentication required"
      },
      401
    );
  }

  const user =
    await env.DB
      .prepare(
        `
        SELECT id
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(
        String(
          telegramUser.id
        )
      )
      .first();

  return json({
    ok: true,

    leaderboard:
      await getLeaderboard(
        env,
        100
      ),

    user_rank:
      user
        ? await getUserRank(
            env,
            user.id
          )
        : null
  });
}


/* =========================================================
   ADMIN AUTH
========================================================= */

async function adminLogin(
  request,
  env
) {
  if (
    !env.ADMIN_EMAIL ||
    !env.ADMIN_PASSWORD ||
    !env.SESSION_SECRET
  ) {
    return json(
      {
        ok: false,
        error:
          "Admin access is not configured"
      },
      503
    );
  }

  const body =
    await safeJson(
      request
    );

  const email =
    String(
      body.email || ""
    )
      .trim()
      .toLowerCase();

  const password =
    String(
      body.password || ""
    );

  if (
    !constantTimeEqual(
      email,
      String(
        env.ADMIN_EMAIL
      )
        .toLowerCase()
    ) ||
    !constantTimeEqual(
      password,
      String(
        env.ADMIN_PASSWORD
      )
    )
  ) {
    return json(
      {
        ok: false,
        error:
          "Invalid email or password"
      },
      401
    );
  }

  const expires =
    Math.floor(
      Date.now() / 1000
    ) +
    60 * 60 * 12;

  const payload =
    `${email}|${expires}`;

  const signature =
    await signValue(
      payload,
      env.SESSION_SECRET
    );

  const token =
    btoa(
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


async function requireAdmin(
  request,
  env
) {
  const cookie =
    request.headers.get(
      "Cookie"
    ) || "";

  const token =
    getCookie(
      cookie,
      "rico_admin"
    );

  if (!token) {
    return null;
  }

  try {
    const data =
      JSON.parse(
        atob(token)
      );

    if (
      !data.email ||
      !data.expires ||
      !data.signature
    ) {
      return null;
    }

    if (
      Number(
        data.expires
      ) <
      Math.floor(
        Date.now() / 1000
      )
    ) {
      return null;
    }

    const payload =
      `${data.email}|${data.expires}`;

    const expected =
      await signValue(
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

    return {
      email:
        data.email
    };

  } catch {
    return null;
  }
}


/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function adminDashboard(
  env
) {
  const [
    players,
    active,
    checkins,
    points,
    referrals,
    claims,
    activity
  ] =
    await Promise.all([
      env.DB
        .prepare(
          `SELECT COUNT(*) AS total FROM users`
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
          SELECT COALESCE(SUM(amount),0) AS total
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
            a.*,
            u.telegram_username,
            u.first_name
          FROM activity_logs a

          LEFT JOIN users u
          ON u.id = a.user_id

          ORDER BY a.id DESC

          LIMIT 20
          `
        )
        .all()
    ]);

  const chart =
    await env.DB
      .prepare(
        `
        SELECT
          date(created_at) AS day,
          COUNT(*) AS total

        FROM activity_logs

        WHERE datetime(created_at)
          >= datetime('now','-6 days')

        GROUP BY
          date(created_at)

        ORDER BY
          day ASC
        `
      )
      .all();

  return json({
    ok: true,

    stats: {
      total_players:
        Number(
          players?.total || 0
        ),

      active_today:
        Number(
          active?.total || 0
        ),

      checkins_today:
        Number(
          checkins?.total || 0
        ),

      points_issued:
        Number(
          points?.total || 0
        ),

      referrals:
        Number(
          referrals?.total || 0
        ),

      rewards_claimed:
        Number(
          claims?.total || 0
        )
    },

    activity_chart:
      chart.results || [],

    recent_activity:
      activity.results || []
  });
}


/* =========================================================
   ADMIN PLAYERS
========================================================= */

async function adminPlayers(
  env,
  url
) {
  const search =
    String(
      url.searchParams.get(
        "search"
      ) || ""
    )
      .trim();

  const q =
    `%${search}%`;

  const result =
    search
      ? await env.DB
          .prepare(
            `
            SELECT
              u.*,

              (
                SELECT COUNT(*)
                FROM referrals
                WHERE referrer_user_id =
                  u.id
              ) AS referrals

            FROM users u

            WHERE
              telegram_username LIKE ?
              OR first_name LIKE ?
              OR last_name LIKE ?
              OR telegram_id LIKE ?

            ORDER BY
              last_active_at DESC

            LIMIT 100
            `
          )
          .bind(
            q,
            q,
            q,
            q
          )
          .all()

      : await env.DB
          .prepare(
            `
            SELECT
              u.*,

              (
                SELECT COUNT(*)
                FROM referrals
                WHERE referrer_user_id =
                  u.id
              ) AS referrals

            FROM users u

            ORDER BY
              last_active_at DESC

            LIMIT 100
            `
          )
          .all();

  return json({
    ok: true,
    players:
      result.results || []
  });
}


async function adminPlayerDetail(
  env,
  id
) {
  const player =
    await env.DB
      .prepare(
        `
        SELECT
          u.*,

          (
            SELECT COUNT(*)
            FROM referrals
            WHERE referrer_user_id =
              u.id
          ) AS referrals

        FROM users u

        WHERE u.id = ?
        `
      )
      .bind(id)
      .first();

  if (!player) {
    return json(
      {
        ok: false,
        error:
          "Player not found"
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
  ] =
    await Promise.all([
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
            r.title,
            c.code
          FROM reward_claims rc

          JOIN rewards r
          ON r.id = rc.reward_id

          LEFT JOIN reward_codes c
          ON c.id = rc.reward_code_id

          WHERE rc.user_id = ?

          ORDER BY rc.id DESC
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
          ON u.id =
            r.referred_user_id

          WHERE
            r.referrer_user_id = ?

          ORDER BY
            r.id DESC
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

    rank:
      await getUserRank(
        env,
        Number(id)
      ),

    transactions:
      transactions.results || [],

    activity:
      activity.results || [],

    rewards:
      rewards.results || [],

    referrals:
      referrals.results || [],

    messages:
      messages.results || []
  });
}


async function adminAdjustPoints(
  request,
  env,
  id,
  admin
) {
  const body =
    await safeJson(
      request
    );

  const amount =
    Number(
      body.amount
    );

  const reason =
    String(
      body.reason || ""
    )
      .trim();

  if (
    !Number.isInteger(amount) ||
    amount === 0
  ) {
    return json(
      {
        ok: false,
        error:
          "Enter a valid point amount"
      },
      400
    );
  }

  if (!reason) {
    return json(
      {
        ok: false,
        error:
          "Reason is required"
      },
      400
    );
  }

  const player =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE id = ?
        `
      )
      .bind(id)
      .first();

  if (!player) {
    return json(
      {
        ok: false,
        error:
          "Player not found"
      },
      404
    );
  }

  if (
    Number(
      player.current_points
    ) +
    amount <
    0
  ) {
    return json(
      {
        ok: false,
        error:
          "Balance cannot become negative"
      },
      400
    );
  }

  await env.DB.batch([
    env.DB
      .prepare(
        `
        UPDATE users
        SET
          current_points =
            current_points + ?,

          lifetime_points =
            CASE
              WHEN ? > 0
              THEN lifetime_points + ?
              ELSE lifetime_points
            END,

          updated_at =
            CURRENT_TIMESTAMP

        WHERE id = ?
        `
      )
      .bind(
        amount,
        amount,
        amount,
        id
      ),

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
        VALUES (
          ?,
          'admin_adjustment',
          ?,
          'admin',
          ?,
          ?
        )
        `
      )
      .bind(
        id,
        amount,
        reason,
        admin.email
      )
  ]);

  await updateUserTier(
    env,
    Number(id)
  );

  await logActivity(
    env,
    Number(id),
    "admin_adjustment",
    amount > 0
      ? "Points added"
      : "Points deducted",
    `${amount > 0 ? "+" : ""}${amount} · ${reason}`
  );

  await audit(
    env,
    admin,
    "player_points",
    "user",
    id,
    `${amount > 0 ? "+" : ""}${amount} points · ${reason}`
  );

  return json({
    ok: true
  });
}


async function adminPlayerStatus(
  request,
  env,
  id,
  admin
) {
  const body =
    await safeJson(
      request
    );

  const status =
    String(
      body.status || ""
    );

  if (
    ![
      "active",
      "inactive",
      "blocked"
    ].includes(status)
  ) {
    return json(
      {
        ok: false,
        error:
          "Invalid status"
      },
      400
    );
  }

  await env.DB
    .prepare(
      `
      UPDATE users
      SET
        status = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(
      status,
      id
    )
    .run();

  await audit(
    env,
    admin,
    "player_status",
    "user",
    id,
    status
  );

  return json({
    ok: true
  });
}


/* =========================================================
   ADMIN TELEGRAM MESSAGE
========================================================= */

async function adminSendMessage(
  request,
  env,
  id,
  admin
) {
  if (!env.BOT_TOKEN) {
    return json(
      {
        ok: false,
        error:
          "Telegram bot is not configured"
      },
      503
    );
  }

  const body =
    await safeJson(
      request
    );

  const message =
    String(
      body.message || ""
    )
      .trim();

  if (!message) {
    return json(
      {
        ok: false,
        error:
          "Message is required"
      },
      400
    );
  }

  const player =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE id = ?
        `
      )
      .bind(id)
      .first();

  if (!player) {
    return json(
      {
        ok: false,
        error:
          "Player not found"
      },
      404
    );
  }

  const payload = {
    chat_id:
      player.telegram_id,

    text:
      message
  };

  if (
    body.button_text &&
    body.button_url
  ) {
    payload.reply_markup = {
      inline_keyboard: [
        [
          {
            text:
              String(
                body.button_text
              ),

            url:
              String(
                body.button_url
              )
          }
        ]
      ]
    };
  }

  const response =
    await fetch(
      `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json"
        },

        body:
          JSON.stringify(
            payload
          )
      }
    );

  const telegram =
    await response.json();

  if (!telegram.ok) {
    return json(
      {
        ok: false,
        error:
          telegram.description ||
          "Message could not be sent"
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
      VALUES (
        ?,
        ?,
        ?,
        ?,
        ?,
        'sent',
        ?
      )
      `
    )
    .bind(
      id,
      String(
        telegram.result.message_id
      ),
      message,
      body.button_text || null,
      body.button_url || null,
      admin.email
    )
    .run();

  await audit(
    env,
    admin,
    "telegram_message",
    "user",
    id,
    message.substring(
      0,
      120
    )
  );

  return json({
    ok: true
  });
}


/* =========================================================
   MISSIONS
========================================================= */

async function listMissions(
  env
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM missions
        ORDER BY
          sort_order ASC,
          id DESC
        `
      )
      .all();

  return json({
    ok: true,
    missions:
      result.results || []
  });
}


async function createMission(
  request,
  env,
  admin
) {
  const body =
    await safeJson(
      request
    );

  const title =
    String(
      body.title || ""
    )
      .trim();

  if (!title) {
    return json(
      {
        ok: false,
        error:
          "Mission name is required"
      },
      400
    );
  }

  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO missions (
          title,
          description,
          image_url,
          mission_type,
          target_value,
          reward_points,
          button_text,
          button_url,
          start_at,
          end_at,
          required_tier,
          sort_order,
          status
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?,?,?,?
        )
        `
      )
      .bind(
        title,
        body.description || "",
        body.image_url || null,
        body.mission_type || "custom",
        Number(
          body.target_value || 1
        ),
        Number(
          body.reward_points || 0
        ),
        body.button_text || null,
        body.button_url || null,
        body.start_at || null,
        body.end_at || null,
        body.required_tier || null,
        Number(
          body.sort_order || 0
        ),
        body.status || "draft"
      )
      .run();

  await audit(
    env,
    admin,
    "mission_created",
    "mission",
    String(
      result.meta.last_row_id
    ),
    title
  );

  return json({
    ok: true,
    id:
      result.meta.last_row_id
  });
}


async function updateMission(
  request,
  env,
  id,
  admin
) {
  const body =
    await safeJson(
      request
    );

  await env.DB
    .prepare(
      `
      UPDATE missions
      SET
        title = ?,
        description = ?,
        image_url = ?,
        mission_type = ?,
        target_value = ?,
        reward_points = ?,
        button_text = ?,
        button_url = ?,
        start_at = ?,
        end_at = ?,
        required_tier = ?,
        sort_order = ?,
        status = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(
      body.title || "",
      body.description || "",
      body.image_url || null,
      body.mission_type || "custom",
      Number(
        body.target_value || 1
      ),
      Number(
        body.reward_points || 0
      ),
      body.button_text || null,
      body.button_url || null,
      body.start_at || null,
      body.end_at || null,
      body.required_tier || null,
      Number(
        body.sort_order || 0
      ),
      body.status || "draft",
      id
    )
    .run();

  await audit(
    env,
    admin,
    "mission_updated",
    "mission",
    id,
    body.title || ""
  );

  return json({
    ok: true
  });
}


async function deleteMission(
  env,
  id,
  admin
) {
  await env.DB.batch([
    env.DB
      .prepare(
        `
        DELETE FROM mission_progress
        WHERE mission_id = ?
        `
      )
      .bind(id),

    env.DB
      .prepare(
        `
        DELETE FROM missions
        WHERE id = ?
        `
      )
      .bind(id)
  ]);

  await audit(
    env,
    admin,
    "mission_deleted",
    "mission",
    id,
    ""
  );

  return json({
    ok: true
  });
}


/* =========================================================
   REWARDS
========================================================= */

async function listRewards(
  env
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT
          r.*,

          (
            SELECT COUNT(*)
            FROM reward_codes c
            WHERE c.reward_id = r.id
            AND c.status = 'available'
          ) AS available_codes

        FROM rewards r

        ORDER BY
          sort_order ASC,
          id DESC
        `
      )
      .all();

  return json({
    ok: true,
    rewards:
      result.results || []
  });
}


async function createReward(
  request,
  env,
  admin
) {
  const body =
    await safeJson(
      request
    );

  if (
    !String(
      body.title || ""
    ).trim()
  ) {
    return json(
      {
        ok: false,
        error:
          "Reward name is required"
      },
      400
    );
  }

  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO rewards (
          title,
          description,
          image_url,
          reward_type,
          points_cost,
          stock,
          required_tier,
          start_at,
          end_at,
          sort_order,
          status
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?,?
        )
        `
      )
      .bind(
        body.title,
        body.description || "",
        body.image_url || null,
        body.reward_type || "manual",
        Number(
          body.points_cost || 0
        ),
        body.stock === null ||
        body.stock === ""
          ? null
          : Number(
              body.stock
            ),
        body.required_tier || null,
        body.start_at || null,
        body.end_at || null,
        Number(
          body.sort_order || 0
        ),
        body.status || "draft"
      )
      .run();

  await audit(
    env,
    admin,
    "reward_created",
    "reward",
    String(
      result.meta.last_row_id
    ),
    body.title
  );

  return json({
    ok: true,
    id:
      result.meta.last_row_id
  });
}


async function updateReward(
  request,
  env,
  id,
  admin
) {
  const body =
    await safeJson(
      request
    );

  await env.DB
    .prepare(
      `
      UPDATE rewards
      SET
        title = ?,
        description = ?,
        image_url = ?,
        reward_type = ?,
        points_cost = ?,
        stock = ?,
        required_tier = ?,
        start_at = ?,
        end_at = ?,
        sort_order = ?,
        status = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(
      body.title || "",
      body.description || "",
      body.image_url || null,
      body.reward_type || "manual",
      Number(
        body.points_cost || 0
      ),
      body.stock === null ||
      body.stock === ""
        ? null
        : Number(
            body.stock
          ),
      body.required_tier || null,
      body.start_at || null,
      body.end_at || null,
      Number(
        body.sort_order || 0
      ),
      body.status || "draft",
      id
    )
    .run();

  await audit(
    env,
    admin,
    "reward_updated",
    "reward",
    id,
    body.title || ""
  );

  return json({
    ok: true
  });
}


async function deleteReward(
  env,
  id,
  admin
) {
  const claims =
    await env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM reward_claims
        WHERE reward_id = ?
        `
      )
      .bind(id)
      .first();

  if (
    Number(
      claims?.total || 0
    ) >
    0
  ) {
    return json(
      {
        ok: false,
        error:
          "This reward already has claims. Disable it instead of deleting it."
      },
      400
    );
  }

  await env.DB.batch([
    env.DB
      .prepare(
        `
        DELETE FROM reward_codes
        WHERE reward_id = ?
        `
      )
      .bind(id),

    env.DB
      .prepare(
        `
        DELETE FROM reward_code_batches
        WHERE reward_id = ?
        `
      )
      .bind(id),

    env.DB
      .prepare(
        `
        DELETE FROM rewards
        WHERE id = ?
        `
      )
      .bind(id)
  ]);

  await audit(
    env,
    admin,
    "reward_deleted",
    "reward",
    id,
    ""
  );

  return json({
    ok: true
  });
}


async function uploadRewardCodes(
  request,
  env,
  rewardId,
  admin
) {
  const body =
    await safeJson(
      request
    );

  const rawCodes =
    Array.isArray(
      body.codes
    )
      ? body.codes
      : String(
          body.codes || ""
        )
          .split(/\r?\n|,/);

  const codes =
    [
      ...new Set(
        rawCodes
          .map(
            item =>
              String(item)
                .trim()
          )
          .filter(Boolean)
      )
    ];

  if (!codes.length) {
    return json(
      {
        ok: false,
        error:
          "No voucher codes provided"
      },
      400
    );
  }

  const statements =
    codes.map(
      code =>
        env.DB
          .prepare(
            `
            INSERT OR IGNORE
            INTO reward_codes (
              reward_id,
              code,
              status
            )
            VALUES (
              ?,
              ?,
              'available'
            )
            `
          )
          .bind(
            rewardId,
            code
          )
    );

  await env.DB.batch(
    statements
  );

  await env.DB
    .prepare(
      `
      INSERT INTO reward_code_batches (
        reward_id,
        batch_name,
        total_codes,
        available_codes,
        assigned_codes
      )
      VALUES (
        ?,
        ?,
        ?,
        ?,
        0
      )
      `
    )
    .bind(
      rewardId,
      body.batch_name ||
      `Batch ${new Date().toISOString().slice(0,10)}`,
      codes.length,
      codes.length
    )
    .run();

  await audit(
    env,
    admin,
    "reward_codes_uploaded",
    "reward",
    rewardId,
    `${codes.length} codes`
  );

  return json({
    ok: true,
    uploaded:
      codes.length
  });
}


async function listRewardClaims(
  env
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT
          rc.*,

          r.title AS reward_title,

          u.telegram_username,
          u.first_name,

          c.code

        FROM reward_claims rc

        JOIN rewards r
        ON r.id =
          rc.reward_id

        JOIN users u
        ON u.id =
          rc.user_id

        LEFT JOIN reward_codes c
        ON c.id =
          rc.reward_code_id

        ORDER BY
          rc.id DESC

        LIMIT 500
        `
      )
      .all();

  return json({
    ok: true,
    claims:
      result.results || []
  });
}


/* =========================================================
   DROPS
========================================================= */

async function listDrops(
  env
) {
  const result =
    await env.DB
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
    drops:
      result.results || []
  });
}


async function createDrop(
  request,
  env,
  admin
) {
  const body =
    await safeJson(
      request
    );

  if (
    !body.title ||
    !body.start_at ||
    !body.end_at
  ) {
    return json(
      {
        ok: false,
        error:
          "Name, start and end are required"
      },
      400
    );
  }

  const result =
    await env.DB
      .prepare(
        `
        INSERT INTO drops (
          title,
          description,
          image_url,
          reward_type,
          reward_value,
          total_quantity,
          required_tier,
          claim_limit_per_user,
          start_at,
          end_at,
          status
        )
        VALUES (
          ?,?,?,?,?,?,?,?,?,?,?
        )
        `
      )
      .bind(
        body.title,
        body.description || "",
        body.image_url || null,
        body.reward_type || "points",
        Number(
          body.reward_value || 0
        ),
        Number(
          body.total_quantity || 0
        ),
        body.required_tier || null,
        Number(
          body.claim_limit_per_user ||
          1
        ),
        body.start_at,
        body.end_at,
        body.status || "draft"
      )
      .run();

  await audit(
    env,
    admin,
    "drop_created",
    "drop",
    String(
      result.meta.last_row_id
    ),
    body.title
  );

  return json({
    ok: true,
    id:
      result.meta.last_row_id
  });
}


async function updateDrop(
  request,
  env,
  id,
  admin
) {
  const body =
    await safeJson(
      request
    );

  await env.DB
    .prepare(
      `
      UPDATE drops
      SET
        title = ?,
        description = ?,
        image_url = ?,
        reward_type = ?,
        reward_value = ?,
        total_quantity = ?,
        required_tier = ?,
        claim_limit_per_user = ?,
        start_at = ?,
        end_at = ?,
        status = ?,
        updated_at =
          CURRENT_TIMESTAMP
      WHERE id = ?
      `
    )
    .bind(
      body.title || "",
      body.description || "",
      body.image_url || null,
      body.reward_type || "points",
      Number(
        body.reward_value || 0
      ),
      Number(
        body.total_quantity || 0
      ),
      body.required_tier || null,
      Number(
        body.claim_limit_per_user ||
        1
      ),
      body.start_at,
      body.end_at,
      body.status || "draft",
      id
    )
    .run();

  await audit(
    env,
    admin,
    "drop_updated",
    "drop",
    id,
    body.title || ""
  );

  return json({
    ok: true
  });
}


async function deleteDrop(
  env,
  id,
  admin
) {
  const claims =
    await env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM drop_claims
        WHERE drop_id = ?
        `
      )
      .bind(id)
      .first();

  if (
    Number(
      claims?.total || 0
    ) >
    0
  ) {
    return json(
      {
        ok: false,
        error:
          "This drop already has claims. End it instead of deleting it."
      },
      400
    );
  }

  await env.DB
    .prepare(
      `
      DELETE FROM drops
      WHERE id = ?
      `
    )
    .bind(id)
    .run();

  await audit(
    env,
    admin,
    "drop_deleted",
    "drop",
    id,
    ""
  );

  return json({
    ok: true
  });
}


/* =========================================================
   REFERRALS
========================================================= */

async function adminReferrals(
  env
) {
  const rows =
    await env.DB
      .prepare(
        `
        SELECT
          r.*,

          referrer.telegram_username
            AS referrer_username,

          referrer.first_name
            AS referrer_name,

          referred.telegram_username
            AS referred_username,

          referred.first_name
            AS referred_name

        FROM referrals r

        JOIN users referrer
        ON referrer.id =
          r.referrer_user_id

        JOIN users referred
        ON referred.id =
          r.referred_user_id

        ORDER BY
          r.id DESC

        LIMIT 500
        `
      )
      .all();

  const stats =
    await env.DB
      .prepare(
        `
        SELECT
          COUNT(*) AS total,

          SUM(
            CASE
              WHEN status = 'qualified'
              THEN 1
              ELSE 0
            END
          ) AS qualified,

          SUM(
            CASE
              WHEN status = 'pending'
              THEN 1
              ELSE 0
            END
          ) AS pending

        FROM referrals
        `
      )
      .first();

  return json({
    ok: true,

    stats: {
      total:
        Number(
          stats?.total || 0
        ),

      qualified:
        Number(
          stats?.qualified || 0
        ),

      pending:
        Number(
          stats?.pending || 0
        )
    },

    referrals:
      rows.results || []
  });
}


/* =========================================================
   SETTINGS
========================================================= */

async function getAdminSettings(
  env
) {
  return json({
    ok: true,
    settings:
      await getSettingsMap(env)
  });
}


async function saveAdminSettings(
  request,
  env,
  admin
) {
  const body =
    await safeJson(
      request
    );

  const allowed =
    [
      "app_name",
      "announcement",
      "primary_color",
      "secondary_color",
      "background_color",

      "hero_title",
      "hero_subtitle",
      "hero_image_url",
      "logo_url",

      "show_checkin",
      "show_missions",
      "show_rewards",
      "show_drops",
      "show_referrals",
      "show_leaderboard",

      "daily_checkin_points",

      "streak_bonus_7",
      "streak_bonus_14",
      "streak_bonus_28",
      "streak_bonus_56",
      "streak_bonus_84",
      "streak_bonus_112",

      "referral_reward_points",

      "tier_rookie",
      "tier_bronze",
      "tier_silver",
      "tier_gold",
      "tier_diamond",

      "official_channel_url",
      "bot_username"
    ];

  const statements = [];

  for (
    const key of allowed
  ) {
    if (
      Object.prototype
        .hasOwnProperty
        .call(
          body,
          key
        )
    ) {
      statements.push(
        env.DB
          .prepare(
            `
            INSERT INTO app_settings (
              setting_key,
              setting_value,
              updated_at
            )
            VALUES (
              ?,
              ?,
              CURRENT_TIMESTAMP
            )

            ON CONFLICT(setting_key)
            DO UPDATE SET
              setting_value =
                excluded.setting_value,
              updated_at =
                CURRENT_TIMESTAMP
            `
          )
          .bind(
            key,
            String(
              body[key]
            )
          )
      );
    }
  }

  if (statements.length) {
    await env.DB.batch(
      statements
    );
  }

  await audit(
    env,
    admin,
    "settings_updated",
    "app_settings",
    "",
    `${statements.length} settings`
  );

  return json({
    ok: true,
    settings:
      await getSettingsMap(env)
  });
}


/* =========================================================
   AUDIT LOG
========================================================= */

async function adminAuditLogs(
  env
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM admin_audit_logs
        ORDER BY id DESC
        LIMIT 300
        `
      )
      .all();

  return json({
    ok: true,
    logs:
      result.results || []
  });
}


async function audit(
  env,
  admin,
  action,
  targetType,
  targetId,
  description
) {
  await env.DB
    .prepare(
      `
      INSERT INTO admin_audit_logs (
        admin_email,
        action_type,
        target_type,
        target_id,
        description
      )
      VALUES (
        ?,?,?,?,?
      )
      `
    )
    .bind(
      admin?.email ||
      "system",

      action,

      targetType ||
      null,

      targetId
        ? String(
            targetId
          )
        : null,

      description ||
      null
    )
    .run();
}


/* =========================================================
   TELEGRAM WEBHOOK
========================================================= */

async function handleTelegram(
  request,
  env,
  url
) {
  if (
    url.pathname !==
    "/telegram/webhook" ||
    request.method !==
    "POST"
  ) {
    return json(
      {
        ok: false
      },
      404
    );
  }

  if (
    env.TELEGRAM_WEBHOOK_SECRET
  ) {
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

  const update =
    await safeJson(
      request
    );

  const message =
    update.message;

  if (!message?.from?.id) {
    return json({
      ok: true
    });
  }

  const user =
    await upsertTelegramUser(
      env,
      message.from
    );

  if (
    message.text?.startsWith(
      "/start"
    )
  ) {
    await processStartCommand(
      env,
      user,
      message.from,
      message.chat.id,
      message.text
    );
  }

  return json({
    ok: true
  });
}


async function processStartCommand(
  env,
  user,
  telegramUser,
  chatId,
  text
) {
  const parts =
    String(text)
      .trim()
      .split(/\s+/);

  if (
    parts[1]?.startsWith(
      "ref_"
    ) &&
    !user.referred_by_user_id
  ) {
    const referralCode =
      parts[1].slice(4);

    const referrer =
      await env.DB
        .prepare(
          `
          SELECT *
          FROM users
          WHERE referral_code = ?
          `
        )
        .bind(
          referralCode
        )
        .first();

    if (
      referrer &&
      Number(
        referrer.id
      ) !==
      Number(
        user.id
      )
    ) {
      try {
        await env.DB.batch([
          env.DB
            .prepare(
              `
              UPDATE users
              SET
                referred_by_user_id = ?
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
              VALUES (
                ?,
                ?,
                'pending'
              )
              `
            )
            .bind(
              referrer.id,
              user.id
            )
        ]);

        await logActivity(
          env,
          referrer.id,
          "referral",
          "New referral",
          telegramUser.username
            ? `@${telegramUser.username}`
            : telegramUser.first_name ||
              "Telegram Member"
        );

      } catch {
        // Existing referral.
      }
    }
  }

  if (!env.BOT_TOKEN) {
    return;
  }

  const keyboard = [];

  if (env.MINI_APP_URL) {
    keyboard.push([
      {
        text:
          "Open Rico Club",

        web_app: {
          url:
            env.MINI_APP_URL
        }
      }
    ]);
  }

  if (
    env.OFFICIAL_CHANNEL_URL
  ) {
    keyboard.push([
      {
        text:
          "Official Channel",

        url:
          env.OFFICIAL_CHANNEL_URL
      }
    ]);
  }

  await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`,
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json"
      },

      body:
        JSON.stringify({
          chat_id:
            chatId,

          text:
            "Welcome to Rico Club.\n\nCheck in daily, complete missions, invite friends and unlock community rewards.",

          reply_markup: {
            inline_keyboard:
              keyboard
          }
        })
    }
  );
}


/* =========================================================
   COMMON USER / RANK HELPERS
========================================================= */

async function upsertTelegramUser(
  env,
  telegramUser
) {
  const telegramId =
    String(
      telegramUser.id
    );

  let user =
    await env.DB
      .prepare(
        `
        SELECT *
        FROM users
        WHERE telegram_id = ?
        `
      )
      .bind(
        telegramId
      )
      .first();

  if (!user) {
    const referralCode =
      await makeReferralCode(
        telegramId
      );

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
          referral_code
        )
        VALUES (
          ?,?,?,?,?,?,?
        )
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

    user =
      await env.DB
        .prepare(
          `
          SELECT *
          FROM users
          WHERE telegram_id = ?
          `
        )
        .bind(
          telegramId
        )
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
          last_active_at =
            CURRENT_TIMESTAMP,
          updated_at =
            CURRENT_TIMESTAMP
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

    user =
      await env.DB
        .prepare(
          `
          SELECT *
          FROM users
          WHERE id = ?
          `
        )
        .bind(
          user.id
        )
        .first();
  }

  await updateUserTier(
    env,
    user.id
  );

  return await env.DB
    .prepare(
      `
      SELECT *
      FROM users
      WHERE id = ?
      `
    )
    .bind(
      user.id
    )
    .first();
}


async function updateUserTier(
  env,
  userId
) {
  const settings =
    await getSettingsMap(env);

  const user =
    await env.DB
      .prepare(
        `
        SELECT current_points
        FROM users
        WHERE id = ?
        `
      )
      .bind(
        userId
      )
      .first();

  if (!user) {
    return;
  }

  const points =
    Number(
      user.current_points ||
      0
    );

  const thresholds = [
    [
      "Diamond",
      Number(
        settings.tier_diamond ||
        15000
      )
    ],

    [
      "Gold",
      Number(
        settings.tier_gold ||
        5000
      )
    ],

    [
      "Silver",
      Number(
        settings.tier_silver ||
        1500
      )
    ],

    [
      "Bronze",
      Number(
        settings.tier_bronze ||
        500
      )
    ],

    [
      "Rookie",
      0
    ]
  ];

  const tier =
    thresholds.find(
      ([, threshold]) =>
        points >= threshold
    )?.[0] ||
    "Rookie";

  await env.DB
    .prepare(
      `
      UPDATE users
      SET tier = ?
      WHERE id = ?
      `
    )
    .bind(
      tier,
      userId
    )
    .run();
}


async function getLeaderboard(
  env,
  limit = 100
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT
          id,
          telegram_username,
          first_name,
          photo_url,
          tier,
          current_points,
          lifetime_points,
          current_streak

        FROM users

        WHERE status = 'active'

        ORDER BY
          current_points DESC,
          lifetime_points DESC,
          id ASC

        LIMIT ?
        `
      )
      .bind(
        limit
      )
      .all();

  return (
    result.results || []
  ).map(
    (item, index) => ({
      ...item,
      rank:
        index + 1
    })
  );
}


async function getUserRank(
  env,
  id
) {
  const user =
    await env.DB
      .prepare(
        `
        SELECT current_points
        FROM users
        WHERE id = ?
        `
      )
      .bind(id)
      .first();

  if (!user) {
    return null;
  }

  const higher =
    await env.DB
      .prepare(
        `
        SELECT COUNT(*) AS total
        FROM users
        WHERE status = 'active'
        AND current_points > ?
        `
      )
      .bind(
        user.current_points
      )
      .first();

  return (
    Number(
      higher?.total || 0
    ) + 1
  );
}


/* =========================================================
   SETTINGS HELPERS
========================================================= */

async function getSettingsMap(
  env
) {
  const result =
    await env.DB
      .prepare(
        `
        SELECT
          setting_key,
          setting_value
        FROM app_settings
        `
      )
      .all();

  const settings = {};

  for (
    const row
    of result.results || []
  ) {
    settings[
      row.setting_key
    ] =
      row.setting_value;
  }

  return settings;
}


/* =========================================================
   GENERAL HELPERS
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
      VALUES (
        ?,?,?,?
      )
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


function getDateInTimezone(
  timezone
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          timezone,

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit"
      }
    )
      .formatToParts(
        new Date()
      );

  const values = {};

  for (
    const part
    of parts
  ) {
    values[
      part.type
    ] =
      part.value;
  }

  return (
    `${values.year}-${values.month}-${values.day}`
  );
}


function shiftDate(
  dateString,
  amount
) {
  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
    amount
  );

  return date
    .toISOString()
    .slice(0,10);
}


async function makeReferralCode(
  seed
) {
  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      encoder.encode(
        `${seed}:${crypto.randomUUID()}`
      )
    );

  return bytesToHex(
    new Uint8Array(
      digest
    )
  )
    .slice(0,10)
    .toUpperCase();
}


async function signValue(
  value,
  secret
) {
  const key =
    await crypto.subtle.importKey(
      "raw",
      encoder.encode(
        secret
      ),
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
      encoder.encode(
        value
      )
    );

  return bytesToHex(
    new Uint8Array(
      signature
    )
  );
}


function bytesToHex(
  bytes
) {
  return Array
    .from(bytes)
    .map(
      value =>
        value
          .toString(16)
          .padStart(
            2,
            "0"
          )
    )
    .join("");
}


function constantTimeEqual(
  a,
  b
) {
  a =
    String(a);

  b =
    String(b);

  if (
    a.length !==
    b.length
  ) {
    return false;
  }

  let result = 0;

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    result |=
      a.charCodeAt(i) ^
      b.charCodeAt(i);
  }

  return result === 0;
}


function getCookie(
  header,
  name
) {
  const cookies =
    String(header)
      .split(";");

  for (
    const cookie
    of cookies
  ) {
    const [
      key,
      ...value
    ] =
      cookie
        .trim()
        .split("=");

    if (
      key === name
    ) {
      return value.join("=");
    }
  }

  return null;
}


async function safeJson(
  request
) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}


function json(
  data,
  status = 200
) {
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
