(() => {
  const tg =
    window.Telegram?.WebApp || null;

  const state = {
    bootstrap: null,
    user: null,
    missions: [],
    rewards: [],
    drops: [],
    leaderboard: [],
    settings: {}
  };


  const $ = (selector) =>
    document.querySelector(selector);

  const $$ = (selector) =>
    Array.from(
      document.querySelectorAll(selector)
    );


  init();


  async function init() {
    if (!tg || !tg.initData) {
      $("#appLoader").classList.add("hidden");

      $("#telegramRequired")
        .classList.remove("hidden");

      return;
    }

    tg.ready();
    tg.expand();

    if (tg.setHeaderColor) {
      tg.setHeaderColor("#0d0c1b");
    }

    if (tg.setBackgroundColor) {
      tg.setBackgroundColor("#0d0c1b");
    }

    bindNavigation();
    bindActions();

    await loadBootstrap();
  }


  async function loadBootstrap() {
    try {
      const response =
        await api(
          "/api/app/bootstrap",
          {
            method: "POST"
          }
        );

      state.bootstrap = response;
      state.user = response.user;
      state.missions =
        response.missions || [];
      state.rewards =
        response.rewards || [];
      state.drops =
        response.drops || [];
      state.leaderboard =
        response.leaderboard || [];
      state.settings =
        response.settings || {};

      render();

      $("#appLoader")
        .classList.add("hidden");

      $("#playerApp")
        .classList.remove("hidden");
    } catch (error) {
      $("#appLoader")
        .classList.add("hidden");

      $("#telegramRequired")
        .classList.remove("hidden");

      showToast(
        error.message ||
        "Rico Club could not be opened."
      );
    }
  }


  function render() {
    renderUser();
    renderMissions();
    renderRewards();
    renderDrops();
    renderLeaderboard();
    renderCheckin();
  }


  function renderUser() {
    const user = state.user;

    if (!user) {
      return;
    }

    const firstName =
      user.first_name || "Rico Member";

    const username =
      user.telegram_username
        ? `@${user.telegram_username}`
        : "Telegram Member";

    const initial =
      firstName
        .charAt(0)
        .toUpperCase();

    $("#welcomeName").textContent =
      `Hello, ${firstName}`;

    $("#pointBalance").textContent =
      formatNumber(user.current_points);

    $("#rewardBalance").textContent =
      formatNumber(user.current_points);

    $("#lifetimePoints").textContent =
      formatNumber(user.lifetime_points);

    $("#tierBadge").textContent =
      String(user.tier || "Rookie")
        .toUpperCase();

    $("#profileTier").textContent =
      String(user.tier || "Rookie")
        .toUpperCase();

    $("#homeStreak").textContent =
      `${user.current_streak || 0} days`;

    $("#streakPill").textContent =
      `🔥 ${user.current_streak || 0}`;

    $("#rankText").textContent =
      `#${user.rank || "—"}`;

    $("#homeRank").textContent =
      `#${user.rank || "—"}`;

    $("#profileName").textContent =
      firstName;

    $("#profileUsername").textContent =
      username;

    $("#profilePoints").textContent =
      formatNumber(user.current_points);

    $("#profileStreak").textContent =
      user.current_streak || 0;

    $("#profileRank").textContent =
      `#${user.rank || "—"}`;

    $("#profileAvatar").textContent =
      initial;

    $("#profileLargeAvatar").textContent =
      initial;

    $("#yourRankValue").textContent =
      `#${user.rank || "—"}`;

    $("#yourRankPoints").textContent =
      formatNumber(user.current_points);

    const tier =
      getTierProgress(
        Number(user.current_points || 0)
      );

    $("#tierProgressBar").style.width =
      `${tier.percent}%`;

    $("#tierProgressText").textContent =
      tier.text;
  }


  function getTierProgress(points) {
    const tiers = [
      {
        name: "Rookie",
        min: 0,
        max: 500,
        next: "Bronze"
      },
      {
        name: "Bronze",
        min: 500,
        max: 1500,
        next: "Silver"
      },
      {
        name: "Silver",
        min: 1500,
        max: 5000,
        next: "Gold"
      },
      {
        name: "Gold",
        min: 5000,
        max: 15000,
        next: "Diamond"
      },
      {
        name: "Diamond",
        min: 15000,
        max: null,
        next: null
      }
    ];

    const current =
      tiers
        .slice()
        .reverse()
        .find(
          (tier) =>
            points >= tier.min
        ) || tiers[0];

    if (!current.max) {
      return {
        percent: 100,
        text:
          "Diamond status unlocked"
      };
    }

    const range =
      current.max - current.min;

    const progress =
      points - current.min;

    const percent =
      Math.max(
        0,
        Math.min(
          100,
          (progress / range) * 100
        )
      );

    return {
      percent,

      text:
        `${formatNumber(
          current.max - points
        )} points to ${current.next}`
    };
  }


  function renderCheckin() {
    const checked =
      Boolean(
        state.bootstrap
          ?.checked_in_today
      );

    const button =
      $("#checkinButton");

    const card =
      $("#checkinCard");

    if (checked) {
      button.textContent =
        "DONE";

      button.disabled = true;

      card.classList.add(
        "completed"
      );

      $("#checkinDescription")
        .textContent =
        "Today's check-in is complete. Come back tomorrow to continue your streak.";
    } else {
      button.textContent =
        "CHECK IN";

      button.disabled = false;

      card.classList.remove(
        "completed"
      );
    }
  }


  function renderMissions() {
    const missions =
      state.missions || [];

    const full =
      $("#missionList");

    const home =
      $("#homeMissionList");

    if (!missions.length) {
      const empty = `
        <div class="empty-card">
          <div class="empty-icon">◇</div>
          <strong>No active missions right now</strong>
          <p>New Rico Club missions will appear here when they go live.</p>
        </div>
      `;

      full.innerHTML = empty;
      home.innerHTML = empty;

      return;
    }

    full.innerHTML =
      missions
        .map(renderMissionCard)
        .join("");

    home.innerHTML =
      missions
        .slice(0, 2)
        .map(renderMissionCard)
        .join("");

    $$(".mission-action")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            const url =
              button.dataset.url;

            if (url) {
              openExternal(url);
            }
          }
        );
      });
  }


  function renderMissionCard(mission) {
    const reward =
      Number(
        mission.reward_points || 0
      );

    return `
      <article class="mission-card">

        <div class="mission-card-top">

          <div class="mission-symbol">
            ${missionIcon(
              mission.mission_type
            )}
          </div>

          <div class="mission-reward">
            +${formatNumber(reward)}
          </div>

        </div>

        <h3>
          ${escapeHtml(mission.title)}
        </h3>

        <p>
          ${escapeHtml(
            mission.description ||
            "Complete this mission to earn Rico Points."
          )}
        </p>

        <div class="mission-progress">
          <div class="mission-progress-bar">
            <span style="width:0%"></span>
          </div>

          <small>
            Reward · ${formatNumber(
              reward
            )} Rico Points
          </small>
        </div>

        ${
          mission.button_text
            ? `
              <button
                class="mission-action secondary-button"
                type="button"
                data-url="${escapeAttribute(
                  mission.button_url || ""
                )}"
              >
                ${escapeHtml(
                  mission.button_text
                )}
              </button>
            `
            : ""
        }

      </article>
    `;
  }


  function renderRewards() {
    const rewards =
      state.rewards || [];

    const container =
      $("#rewardList");

    if (!rewards.length) {
      container.innerHTML = `
        <div class="empty-card wide">
          <div class="empty-icon">◆</div>
          <strong>Rewards are being prepared</strong>
          <p>Your available Rico Club rewards will appear here.</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      rewards
        .map((reward) => {
          const points =
            Number(
              reward.points_cost || 0
            );

          const affordable =
            Number(
              state.user.current_points ||
              0
            ) >= points;

          return `
            <article class="reward-card">

              <div class="reward-visual">
                ${
                  reward.image_url
                    ? `
                      <img
                        src="${escapeAttribute(
                          reward.image_url
                        )}"
                        alt=""
                      >
                    `
                    : `
                      <div class="reward-gem">
                        ◆
                      </div>
                    `
                }

                ${
                  reward.required_tier
                    ? `
                      <span class="reward-tier">
                        ${escapeHtml(
                          reward.required_tier
                        )}
                      </span>
                    `
                    : ""
                }
              </div>

              <div class="reward-card-body">

                <h3>
                  ${escapeHtml(
                    reward.title
                  )}
                </h3>

                <p>
                  ${escapeHtml(
                    reward.description ||
                    "Exclusive Rico Club reward."
                  )}
                </p>

                <div class="reward-bottom">

                  <strong>
                    ◆ ${formatNumber(
                      points
                    )}
                  </strong>

                  <button
                    class="secondary-button"
                    type="button"
                    ${affordable ? "" : "disabled"}
                  >
                    ${
                      affordable
                        ? "REDEEM"
                        : "LOCKED"
                    }
                  </button>

                </div>

              </div>

            </article>
          `;
        })
        .join("");
  }


  function renderDrops() {
    const drops =
      state.drops || [];

    const section =
      $("#dropSection");

    const container =
      $("#dropCards");

    if (!drops.length) {
      section.classList.add("hidden");
      return;
    }

    section.classList.remove(
      "hidden"
    );

    container.innerHTML =
      drops
        .slice(0, 1)
        .map((drop) => {
          const now = Date.now();

          const start =
            new Date(
              drop.start_at
            ).getTime();

          const end =
            new Date(
              drop.end_at
            ).getTime();

          let status =
            "UPCOMING";

          if (
            now >= start &&
            now <= end
          ) {
            status = "LIVE NOW";
          }

          const remaining =
            Math.max(
              0,
              Number(
                drop.total_quantity ||
                0
              ) -
              Number(
                drop.claimed_quantity ||
                0
              )
            );

          return `
            <article class="drop-card">

              <div class="drop-live">
                <span></span>
                ${status}
              </div>

              <h3>
                ${escapeHtml(
                  drop.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  drop.description ||
                  "Limited Rico Club rewards."
                )}
              </p>

              <div class="drop-stats">

                <div>
                  <span>
                    REMAINING
                  </span>

                  <strong>
                    ${formatNumber(
                      remaining
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    REWARD
                  </span>

                  <strong>
                    ${formatNumber(
                      drop.reward_value
                    )}
                  </strong>
                </div>

              </div>

            </article>
          `;
        })
        .join("");
  }


  function renderLeaderboard() {
    const rows =
      state.leaderboard || [];

    const podium =
      $("#podium");

    const list =
      $("#leaderboardRows");

    if (!rows.length) {
      podium.innerHTML = `
        <div class="empty-card wide">
          <div class="empty-icon">♛</div>
          <strong>The leaderboard is opening soon</strong>
          <p>Earn Rico Points to secure your position.</p>
        </div>
      `;

      list.innerHTML = "";

      return;
    }

    const topThree =
      rows.slice(0, 3);

    const displayOrder = [
      topThree[1],
      topThree[0],
      topThree[2]
    ].filter(Boolean);

    podium.innerHTML =
      displayOrder
        .map((user) => {
          const isFirst =
            user.rank === 1;

          return `
            <article
              class="podium-player ${
                isFirst
                  ? "winner"
                  : ""
              }"
            >

              <span class="podium-position">
                #${user.rank}
              </span>

              <div class="podium-avatar">
                ${getInitial(user)}
              </div>

              <strong>
                ${escapeHtml(
                  maskUser(user)
                )}
              </strong>

              <b>
                ${formatNumber(
                  user.current_points
                )}
              </b>

              <small>
                Rico Points
              </small>

            </article>
          `;
        })
        .join("");

    list.innerHTML =
      rows
        .slice(3)
        .map(
          (user) => `
            <div class="rank-row">

              <div class="rank-person">

                <span class="rank-number">
                  #${user.rank}
                </span>

                <div class="mini-avatar">
                  ${getInitial(user)}
                </div>

                <div>
                  <strong>
                    ${escapeHtml(
                      maskUser(user)
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      user.tier ||
                      "Rookie"
                    )}
                  </small>
                </div>

              </div>

              <strong>
                ${formatNumber(
                  user.current_points
                )}
              </strong>

            </div>
          `
        )
        .join("");
  }


  function bindNavigation() {
    $$(".nav-item")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openPage(
              button.dataset.page
            );
          }
        );
      });

    $$("[data-go]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            openPage(
              button.dataset.go
            );
          }
        );
      });

    $("#profileAvatar")
      .addEventListener(
        "click",
        () => openPage("profile")
      );
  }


  function openPage(page) {
    $$(".app-page")
      .forEach((section) =>
        section.classList.remove(
          "active"
        )
      );

    $$(".nav-item")
      .forEach((button) =>
        button.classList.remove(
          "active"
        )
      );

    const pageElement =
      $(
        `#page${
          page.charAt(0).toUpperCase() +
          page.slice(1)
        }`
      );

    if (pageElement) {
      pageElement.classList.add(
        "active"
      );
    }

    const nav =
      $(
        `.nav-item[data-page="${page}"]`
      );

    if (nav) {
      nav.classList.add(
        "active"
      );
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    if (tg?.HapticFeedback) {
      tg.HapticFeedback
        .selectionChanged();
    }
  }


  function bindActions() {
    $("#checkinButton")
      .addEventListener(
        "click",
        doCheckin
      );

    $("#closeSuccess")
      .addEventListener(
        "click",
        closeSuccess
      );

    $("#successDone")
      .addEventListener(
        "click",
        closeSuccess
      );

    $("#homeInviteButton")
      .addEventListener(
        "click",
        shareReferral
      );

    $("#profileInvite")
      .addEventListener(
        "click",
        shareReferral
      );

    $("#officialChannel")
      .addEventListener(
        "click",
        () => {
          const url =
            state.settings
              .official_channel_url;

          if (url) {
            openExternal(url);
          }
        }
      );

    $("#profileActivity")
      .addEventListener(
        "click",
        async () => {
          try {
            const result =
              await api(
                "/api/app/activity",
                {
                  method: "POST"
                }
              );

            const latest =
              result.activity?.[0];

            showToast(
              latest
                ? latest.title
                : "No recent activity."
            );
          } catch (error) {
            showToast(
              error.message
            );
          }
        }
      );
  }


  async function doCheckin() {
    const button =
      $("#checkinButton");

    button.disabled = true;
    button.textContent =
      "CHECKING IN";

    try {
      const result =
        await api(
          "/api/app/checkin",
          {
            method: "POST"
          }
        );

      if (
        result.already_checked_in
      ) {
        showToast(
          "Today's check-in is already complete."
        );

        state.bootstrap
          .checked_in_today = true;

        renderCheckin();

        return;
      }

      state.user.current_points =
        result.balance;

      state.user.lifetime_points =
        Number(
          state.user.lifetime_points ||
          0
        ) +
        Number(
          result.points_earned || 0
        );

      state.user.current_streak =
        result.streak;

      state.bootstrap
        .checked_in_today = true;

      renderUser();
      renderCheckin();

      $("#successTitle")
        .textContent =
        `+${formatNumber(
          result.points_earned
        )} Rico Points`;

      $("#successSubtitle")
        .textContent =
        `${result.streak}-day streak active`;

      $("#successModal")
        .classList.remove("hidden");

      if (tg?.HapticFeedback) {
        tg.HapticFeedback
          .notificationOccurred(
            "success"
          );
      }
    } catch (error) {
      button.disabled = false;
      button.textContent =
        "CHECK IN";

      showToast(
        error.message ||
        "Check-in could not be completed."
      );
    }
  }


  function closeSuccess() {
    $("#successModal")
      .classList.add("hidden");
  }


  function shareReferral() {
    const code =
      state.user?.referral_code;

    const botUsername =
      state.settings
        .bot_username;

    if (!code || !botUsername) {
      showToast(
        "Your invitation link is being prepared."
      );

      return;
    }

    const referral =
      `https://t.me/${botUsername}?start=ref_${code}`;

    const shareUrl =
      `https://t.me/share/url?url=${
        encodeURIComponent(referral)
      }&text=${
        encodeURIComponent(
          "Join me on Rico Club"
        )
      }`;

    openExternal(shareUrl);
  }


  function openExternal(url) {
    if (!url) {
      return;
    }

    if (
      tg &&
      /^https:\/\/t\.me\//i.test(url)
    ) {
      tg.openTelegramLink(url);
      return;
    }

    if (tg?.openLink) {
      tg.openLink(url);
      return;
    }

    window.location.href = url;
  }


  async function api(
    url,
    options = {}
  ) {
    const response =
      await fetch(
        url,
        {
          ...options,

          headers: {
            "content-type":
              "application/json",

            "X-Telegram-Init-Data":
              tg?.initData || "",

            ...(options.headers || {})
          }
        }
      );

    let data = {};

    try {
      data =
        await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Request failed"
      );
    }

    return data;
  }


  function showToast(message) {
    const toast =
      $("#toast");

    toast.textContent =
      message;

    toast.classList.add(
      "visible"
    );

    clearTimeout(
      showToast.timer
    );

    showToast.timer =
      setTimeout(
        () =>
          toast.classList.remove(
            "visible"
          ),
        2600
      );
  }


  function missionIcon(type) {
    const icons = {
      referral: "↗",
      checkin: "✓",
      channel: "◉",
      promo: "◆",
      custom: "◇"
    };

    return icons[type] || "◇";
  }


  function formatNumber(number) {
    return new Intl.NumberFormat(
      "en-US"
    ).format(
      Number(number || 0)
    );
  }


  function getInitial(user) {
    return String(
      user.first_name ||
      user.telegram_username ||
      "R"
    )
      .charAt(0)
      .toUpperCase();
  }


  function maskUser(user) {
    const name =
      user.telegram_username ||
      user.first_name ||
      "Rico Member";

    if (name.length <= 4) {
      return name;
    }

    return `${name.slice(
      0,
      3
    )}***${name.slice(-2)}`;
  }


  function escapeHtml(value) {
    const div =
      document.createElement("div");

    div.textContent =
      String(value ?? "");

    return div.innerHTML;
  }


  function escapeAttribute(value) {
    return escapeHtml(value)
      .replace(/"/g, "&quot;");
  }
})();
