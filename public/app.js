(() => {

  const tg =
    window.Telegram?.WebApp ||
    null;


  const state = {

    bootstrap: null,

    user: null,

    missions: [],

    rewards: [],

    drops: [],

    leaderboard: [],

    settings: {}

  };


  const $ = selector =>
    document.querySelector(
      selector
    );


  const $$ = selector =>
    Array.from(
      document.querySelectorAll(
        selector
      )
    );


  init();


  async function init() {

    bindNavigation();

    bindActions();


    if (
      !tg ||
      !tg.initData
    ) {

      $("#appLoader")
        .classList
        .add("hidden");


      $("#telegramRequired")
        .classList
        .remove("hidden");


      return;

    }


    tg.ready();

    tg.expand();


    try {

      tg.setHeaderColor?.(
        "#090a10"
      );


      tg.setBackgroundColor?.(
        "#090a10"
      );

    } catch {
      // Optional Telegram client support.
    }


    await loadBootstrap();

  }


  async function loadBootstrap() {

    try {

      const data =
        await api(
          "/api/app/bootstrap",
          {
            method:
              "POST"
          }
        );


      state.bootstrap =
        data;


      state.user =
        data.user;


      state.missions =
        data.missions ||
        [];


      state.rewards =
        data.rewards ||
        [];


      state.drops =
        data.drops ||
        [];


      state.leaderboard =
        data.leaderboard ||
        [];


      state.settings =
        data.settings ||
        {};


      applyAppearance();


      applySectionVisibility();


      renderAll();


      $("#appLoader")
        .classList
        .add("hidden");


      $("#playerApp")
        .classList
        .remove("hidden");

    } catch (error) {

      $("#appLoader")
        .classList
        .add("hidden");


      $("#telegramRequired")
        .classList
        .remove("hidden");


      showToast(
        error.message ||
        "Rico Club could not be opened."
      );

    }

  }


  function renderAll() {

    renderUser();

    renderCheckin();

    renderMissions();

    renderRewards();

    renderDrops();

    renderLeaderboard();

    renderDynamicContent();

  }


  /* ======================================================
     APPEARANCE
  ======================================================= */

  function applyAppearance() {

    const settings =
      state.settings;


    const primary =
      validColor(
        settings.primary_color
      )
        ? settings.primary_color
        : "#FA59A9";


    const secondary =
      validColor(
        settings.secondary_color
      )
        ? settings.secondary_color
        : "#64D6FA";


    const background =
      validColor(
        settings.background_color
      )
        ? settings.background_color
        : "#090A10";


    document.documentElement
      .style
      .setProperty(
        "--pink",
        primary
      );


    document.documentElement
      .style
      .setProperty(
        "--blue",
        secondary
      );


    document.documentElement
      .style
      .setProperty(
        "--bg",
        background
      );


    document.documentElement
      .style
      .setProperty(
        "--gradient",
        `linear-gradient(
          135deg,
          ${primary} 0%,
          #9b6cff 48%,
          ${secondary} 100%
        )`
      );


    document.body.style.backgroundColor =
      background;


    try {

      tg?.setHeaderColor?.(
        background
      );


      tg?.setBackgroundColor?.(
        background
      );

    } catch {
      // Optional.
    }


    const appName =
      settings.app_name ||
      "Rico Club";


    document.title =
      appName;


    const brandStrong =
      document.querySelector(
        ".app-brand strong"
      );


    if (brandStrong) {

      brandStrong.textContent =
        appName.toUpperCase();

    }

  }


  function applySectionVisibility() {

    toggleElement(
      "#checkinCard",
      enabled(
        "show_checkin"
      )
    );


    const checkinSection =
      $("#checkinCard")
        ?.closest(
          ".home-section"
        );


    if (checkinSection) {

      checkinSection
        .classList
        .toggle(
          "hidden",
          !enabled(
            "show_checkin"
          )
        );

    }


    const missionHome =
      $("#homeMissionList")
        ?.closest(
          ".home-section"
        );


    if (missionHome) {

      missionHome
        .classList
        .toggle(
          "hidden",
          !enabled(
            "show_missions"
          )
        );

    }


    toggleNavPage(
      "missions",
      enabled(
        "show_missions"
      )
    );


    toggleNavPage(
      "rewards",
      enabled(
        "show_rewards"
      )
    );


    toggleNavPage(
      "rank",
      enabled(
        "show_leaderboard"
      )
    );


    const invite =
      $("#homeInviteButton")
        ?.closest(
          ".invite-card"
        );


    if (invite) {

      invite
        .classList
        .toggle(
          "hidden",
          !enabled(
            "show_referrals"
          )
        );

    }


    $("#profileInvite")
      ?.classList
      .toggle(
        "hidden",
        !enabled(
          "show_referrals"
        )
      );

  }


  function toggleNavPage(
    page,
    visible
  ) {

    $(
      `.bottom-nav-item[data-page="${page}"]`
    )
      ?.classList
      .toggle(
        "hidden",
        !visible
      );

  }


  function toggleElement(
    selector,
    visible
  ) {

    $(selector)
      ?.classList
      .toggle(
        "hidden",
        !visible
      );

  }


  function enabled(
    key
  ) {

    return String(
      state.settings[key] ??
      "true"
    ) !== "false";

  }


  function renderDynamicContent() {

    const settings =
      state.settings;


    const appName =
      settings.app_name ||
      "Rico Club";


    const heroTitle =
      settings.hero_title ||
      appName;


    const heroSubtitle =
      settings.hero_subtitle ||
      "";


    const announcement =
      String(
        settings.announcement ||
        ""
      )
        .trim();


    const greeting =
      $("#welcomeName");


    if (
      greeting &&
      heroTitle
    ) {

      greeting.dataset
        .defaultGreeting =
        greeting.textContent;

    }


    const existingAnnouncement =
      $("#dynamicAnnouncement");


    if (
      announcement &&
      !existingAnnouncement
    ) {

      const home =
        $("#pageHome");


      const header =
        home
          ?.querySelector(
            ".home-greeting"
          );


      if (
        home &&
        header
      ) {

        const box =
          document
            .createElement(
              "div"
            );


        box.id =
          "dynamicAnnouncement";


        box.style.cssText = `
          margin:0 0 17px;
          padding:13px 15px;
          border:1px solid rgba(255,255,255,.07);
          border-radius:15px;
          background:rgba(255,255,255,.025);
          font-size:10px;
          line-height:1.5;
          color:var(--muted);
        `;


        box.textContent =
          announcement;


        header.insertAdjacentElement(
          "afterend",
          box
        );

      }

    }


    if (
      !announcement &&
      existingAnnouncement
    ) {

      existingAnnouncement.remove();

    }


    if (
      settings.hero_image_url
    ) {

      const wallet =
        document.querySelector(
          ".wallet-card"
        );


      if (wallet) {

        wallet.style.backgroundImage =
          `
            linear-gradient(
              145deg,
              rgba(12,13,20,.88),
              rgba(12,13,20,.94)
            ),
            url("${cssUrl(
              settings.hero_image_url
            )}")
          `;


        wallet.style.backgroundSize =
          "cover";


        wallet.style.backgroundPosition =
          "center";

      }

    }


    if (
      heroSubtitle
    ) {

      const progressText =
        $("#tierProgressText");


      if (
        progressText &&
        Number(
          state.user?.current_points ||
          0
        ) === 0
      ) {

        progressText.textContent =
          heroSubtitle;

      }

    }

  }


  /* ======================================================
     USER
  ======================================================= */

  function renderUser() {

    const user =
      state.user;


    if (!user) {
      return;
    }


    const firstName =
      user.first_name ||
      "Rico Member";


    const initial =
      firstName
        .charAt(0)
        .toUpperCase();


    $("#welcomeName")
      .textContent =
      `Hello, ${firstName}`;


    $("#pointBalance")
      .textContent =
      formatNumber(
        user.current_points
      );


    $("#rewardBalance")
      .textContent =
      formatNumber(
        user.current_points
      );


    $("#lifetimePoints")
      .textContent =
      formatNumber(
        user.lifetime_points
      );


    const tier =
      user.tier ||
      "Rookie";


    $("#tierBadge")
      .textContent =
      tier.toUpperCase();


    $("#profileTier")
      .textContent =
      tier.toUpperCase();


    $("#homeStreak")
      .textContent =
      `${user.current_streak || 0} days`;


    $("#streakPill strong")
      .textContent =
      user.current_streak ||
      0;


    $("#rankText")
      .textContent =
      `#${user.rank || "—"}`;


    $("#homeRank")
      .textContent =
      `#${user.rank || "—"}`;


    $("#profileName")
      .textContent =
      firstName;


    $("#profileUsername")
      .textContent =
      user.telegram_username
        ? `@${user.telegram_username}`
        : "Telegram Member";


    $("#profilePoints")
      .textContent =
      formatNumber(
        user.current_points
      );


    $("#profileStreak")
      .textContent =
      user.current_streak ||
      0;


    $("#profileRank")
      .textContent =
      `#${user.rank || "—"}`;


    $("#profileAvatar")
      .textContent =
      initial;


    $("#profileLargeAvatar")
      .textContent =
      initial;


    $("#yourRankValue")
      .textContent =
      `#${user.rank || "—"}`;


    $("#yourRankPoints")
      .textContent =
      formatNumber(
        user.current_points
      );


    const progress =
      calculateTierProgress(
        Number(
          user.current_points ||
          0
        )
      );


    $("#tierProgressBar")
      .style.width =
      `${progress.percent}%`;


    $("#tierProgressText")
      .textContent =
      progress.text;


    setGreeting();

  }


  function setGreeting() {

    const hour =
      new Date()
        .getHours();


    let label =
      "WELCOME BACK";


    if (
      hour >= 5 &&
      hour < 12
    ) {
      label =
        "GOOD MORNING";
    }


    if (
      hour >= 12 &&
      hour < 18
    ) {
      label =
        "GOOD AFTERNOON";
    }


    if (
      hour >= 18
    ) {
      label =
        "GOOD EVENING";
    }


    $("#greetingLabel")
      .textContent =
      label;

  }


  function calculateTierProgress(
    points
  ) {

    const settings =
      state.settings;


    const tiers = [

      {
        name:
          "Rookie",

        min:
          Number(
            settings.tier_rookie ||
            0
          )
      },

      {
        name:
          "Bronze",

        min:
          Number(
            settings.tier_bronze ||
            500
          )
      },

      {
        name:
          "Silver",

        min:
          Number(
            settings.tier_silver ||
            1500
          )
      },

      {
        name:
          "Gold",

        min:
          Number(
            settings.tier_gold ||
            5000
          )
      },

      {
        name:
          "Diamond",

        min:
          Number(
            settings.tier_diamond ||
            15000
          )
      }

    ];


    let currentIndex =
      0;


    for (
      let i = 0;
      i < tiers.length;
      i++
    ) {

      if (
        points >=
        tiers[i].min
      ) {
        currentIndex =
          i;
      }

    }


    if (
      currentIndex ===
      tiers.length - 1
    ) {

      return {
        percent: 100,
        text:
          "Diamond status unlocked"
      };

    }


    const current =
      tiers[
        currentIndex
      ];


    const next =
      tiers[
        currentIndex + 1
      ];


    const range =
      next.min -
      current.min;


    const gained =
      points -
      current.min;


    const percent =
      Math.max(
        0,
        Math.min(
          100,
          (
            gained /
            range
          ) * 100
        )
      );


    return {

      percent,

      text:
        `${formatNumber(
          next.min -
          points
        )} points to ${next.name}`

    };

  }


  /* ======================================================
     CHECK-IN
  ======================================================= */

  function renderCheckin() {

    const done =
      Boolean(
        state.bootstrap
          ?.checked_in_today
      );


    const button =
      $("#checkinButton");


    const card =
      $("#checkinCard");


    const tag =
      $("#checkinStatusTag");


    const reward =
      Number(
        state.settings
          .daily_checkin_points ||
        20
      );


    const rewardText =
      document.querySelector(
        ".checkin-reward"
      );


    if (rewardText) {

      rewardText.textContent =
        `+${formatNumber(
          reward
        )} Rico Points`;

    }


    if (done) {

      card
        ?.classList
        .add(
          "completed"
        );


      button.disabled =
        true;


      button.textContent =
        "DONE";


      tag.textContent =
        "COMPLETED";


      tag
        .classList
        .add(
          "done"
        );


      $("#checkinDescription")
        .textContent =
        "Today's check-in is complete. Come back tomorrow to continue your streak.";

    } else {

      card
        ?.classList
        .remove(
          "completed"
        );


      button.disabled =
        false;


      button.textContent =
        "CHECK IN";


      tag.textContent =
        "READY";


      tag
        .classList
        .remove(
          "done"
        );


      $("#checkinDescription")
        .textContent =
        `Check in today to collect ${formatNumber(
          reward
        )} Rico Points.`;

    }

  }


  async function doCheckin() {

    const button =
      $("#checkinButton");


    button.disabled =
      true;


    button.textContent =
      "CHECKING IN";


    try {

      const result =
        await api(
          "/api/app/checkin",
          {
            method:
              "POST"
          }
        );


      if (
        result.already_checked_in
      ) {

        state.bootstrap
          .checked_in_today =
          true;


        renderCheckin();


        showToast(
          "Today's check-in is already complete."
        );


        return;

      }


      state.user.current_points =
        result.balance;


      state.user.lifetime_points =
        Number(
          state.user
            .lifetime_points ||
          0
        )
        +
        Number(
          result.points_earned ||
          0
        );


      state.user.current_streak =
        result.streak;


      state.bootstrap
        .checked_in_today =
        true;


      renderUser();

      renderCheckin();

      renderRewards();


      $("#successTitle")
        .textContent =
        `+${formatNumber(
          result.points_earned
        )} Rico Points`;


      $("#successSubtitle")
        .textContent =
        `${result.streak}-day streak active`;


      $("#successModal")
        .classList
        .remove(
          "hidden"
        );


      try {

        tg?.HapticFeedback
          ?.notificationOccurred(
            "success"
          );

      } catch {
        // Optional.
      }

    } catch (error) {

      button.disabled =
        false;


      button.textContent =
        "CHECK IN";


      showToast(
        error.message ||
        "Check-in could not be completed."
      );

    }

  }


  /* ======================================================
     MISSIONS
  ======================================================= */

  function renderMissions() {

    const missions =
      state.missions ||
      [];


    const home =
      $("#homeMissionList");


    const full =
      $("#missionList");


    if (!missions.length) {

      const empty = `
        <div class="empty-card">

          <strong>
            No active missions right now
          </strong>

          <p>
            New Rico Club missions will appear here when they go live.
          </p>

        </div>
      `;


      home.innerHTML =
        empty;


      full.innerHTML =
        empty;


      return;

    }


    home.innerHTML =
      missions
        .slice(
          0,
          2
        )
        .map(
          renderMissionCard
        )
        .join("");


    full.innerHTML =
      missions
        .map(
          renderMissionCard
        )
        .join("");


    bindMissionButtons();

  }


  function renderMissionCard(
    mission
  ) {

    return `
      <article class="mission-card">

        <div class="mission-card-head">

          <div class="mission-icon">
            ${missionIcon(
              mission.mission_type
            )}
          </div>

          <span class="mission-points">
            +${formatNumber(
              mission.reward_points
            )}
          </span>

        </div>


        <h3>
          ${escapeHtml(
            mission.title
          )}
        </h3>


        <p>
          ${escapeHtml(
            mission.description ||
            "Complete this mission to earn Rico Points."
          )}
        </p>


        <div class="mission-bar">
          <span></span>
        </div>


        <div class="mission-foot">

          <small>
            ${formatNumber(
              mission.reward_points
            )}
            Rico Points
          </small>

          ${
            mission.button_text
              ? `
                <button
                  class="mission-action"
                  type="button"
                  data-url="${escapeAttribute(
                    mission.button_url ||
                    ""
                  )}"
                >
                  ${escapeHtml(
                    mission.button_text
                  )}
                </button>
              `
              : ""
          }

        </div>

      </article>
    `;

  }


  function bindMissionButtons() {

    $$(".mission-action")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              openExternal(
                button.dataset.url
              )
          )
      );

  }


  /* ======================================================
     REWARDS
  ======================================================= */

  function renderRewards() {

    const rewards =
      state.rewards ||
      [];


    const container =
      $("#rewardList");


    if (!rewards.length) {

      container.innerHTML = `
        <div class="empty-card wide">

          <strong>
            No rewards available right now
          </strong>

          <p>
            Rico Club rewards will appear here when they become available.
          </p>

        </div>
      `;


      return;

    }


    container.innerHTML =
      rewards
        .map(
          reward => {

            const cost =
              Number(
                reward.points_cost ||
                0
              );


            const balance =
              Number(
                state.user
                  ?.current_points ||
                0
              );


            const affordable =
              balance >=
              cost;


            const outOfStock =
              reward.stock !==
                null &&
              Number(
                reward.redeemed_count ||
                0
              ) >=
              Number(
                reward.stock
              );


            const enabled =
              affordable &&
              !outOfStock;


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


                <div class="reward-content">

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


                  <div class="reward-footer">

                    <strong>
                      ◆
                      ${formatNumber(
                        cost
                      )}
                    </strong>

                    <button
                      class="redeem-button"
                      data-reward-id="${reward.id}"
                      type="button"
                      ${
                        enabled
                          ? ""
                          : "disabled"
                      }
                    >
                      ${
                        outOfStock
                          ? "SOLD OUT"
                          : affordable
                            ? "REDEEM"
                            : "LOCKED"
                      }
                    </button>

                  </div>

                </div>

              </article>
            `;

          }
        )
        .join("");


    $$(".redeem-button")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              redeemReward(
                Number(
                  button.dataset
                    .rewardId
                )
              )
          )
      );

  }


  async function redeemReward(
    rewardId
  ) {

    const reward =
      state.rewards
        .find(
          item =>
            Number(
              item.id
            ) ===
            rewardId
        );


    if (!reward) {
      return;
    }


    if (
      !confirm(
        `Redeem "${reward.title}" for ${formatNumber(
          reward.points_cost
        )} Rico Points?`
      )
    ) {
      return;
    }


    try {

      const result =
        await api(
          "/api/app/redeem",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                reward_id:
                  rewardId
              })
          }
        );


      state.user.current_points =
        Number(
          state.user
            .current_points
        )
        -
        Number(
          result.points_spent
        );


      reward.redeemed_count =
        Number(
          reward.redeemed_count ||
          0
        ) + 1;


      renderUser();

      renderRewards();


      if (result.code) {

        showRewardCode(
          result.reward,
          result.code
        );

      } else {

        showToast(
          `${result.reward} redeemed successfully.`
        );

      }


      try {

        tg?.HapticFeedback
          ?.notificationOccurred(
            "success"
          );

      } catch {
        // Optional.
      }

    } catch (error) {

      showToast(
        error.message
      );

    }

  }


  function showRewardCode(
    rewardName,
    code
  ) {

    $("#successTitle")
      .textContent =
      rewardName;


    $("#successSubtitle")
      .innerHTML =
      `Your reward code:<br><br><strong style="font-size:18px;color:white">${escapeHtml(
        code
      )}</strong>`;


    $("#successModal")
      .classList
      .remove(
        "hidden"
      );

  }


  /* ======================================================
     DROPS
  ======================================================= */

  function renderDrops() {

    const drops =
      state.drops ||
      [];


    const section =
      $("#dropSection");


    if (
      !enabled(
        "show_drops"
      ) ||
      !drops.length
    ) {

      section
        .classList
        .add("hidden");


      return;

    }


    section
      .classList
      .remove("hidden");


    $("#dropCards")
      .innerHTML =
      drops
        .slice(
          0,
          1
        )
        .map(
          drop => {

            const now =
              Date.now();


            const start =
              parseDate(
                drop.start_at
              );


            const end =
              parseDate(
                drop.end_at
              );


            let status =
              "UPCOMING";


            if (
              now >= start &&
              now <= end
            ) {
              status =
                "LIVE NOW";
            }


            const remaining =
              Math.max(
                0,
                Number(
                  drop.total_quantity ||
                  0
                )
                -
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
                    "Limited Rico Club reward."
                  )}
                </p>


                <div class="drop-meta">

                  <div>
                    <span>REMAINING</span>

                    <strong>
                      ${formatNumber(
                        remaining
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>REWARD</span>

                    <strong>
                      ${formatNumber(
                        drop.reward_value
                      )}
                    </strong>
                  </div>

                </div>

              </article>
            `;

          }
        )
        .join("");

  }


  /* ======================================================
     LEADERBOARD
  ======================================================= */

  function renderLeaderboard() {

    const rows =
      state.leaderboard ||
      [];


    const podium =
      $("#podium");


    const list =
      $("#leaderboardRows");


    if (!rows.length) {

      podium.innerHTML = `
        <div class="empty-card wide">

          <strong>
            Leaderboard is empty
          </strong>

          <p>
            Ranking will appear after players begin earning Rico Points.
          </p>

        </div>
      `;


      list.innerHTML =
        "";


      return;

    }


    const topThree =
      rows.slice(
        0,
        3
      );


    const order = [
      topThree[1],
      topThree[0],
      topThree[2]
    ]
      .filter(Boolean);


    podium.innerHTML =
      order
        .map(
          user => `
            <article
              class="podium-player ${
                user.rank === 1
                  ? "winner"
                  : ""
              }"
            >

              <span class="podium-rank">
                #${user.rank}
              </span>

              <div class="podium-avatar">
                ${getInitial(
                  user
                )}
              </div>

              <strong>
                ${escapeHtml(
                  maskUser(
                    user
                  )
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
          `
        )
        .join("");


    list.innerHTML =
      rows
        .slice(3)
        .map(
          user => `
            <div class="rank-row">

              <div class="rank-user">

                <span class="rank-number">
                  #${user.rank}
                </span>

                <div class="rank-mini-avatar">
                  ${getInitial(
                    user
                  )}
                </div>

                <div>

                  <strong>
                    ${escapeHtml(
                      maskUser(
                        user
                      )
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


  /* ======================================================
     NAVIGATION
  ======================================================= */

  function bindNavigation() {

    $$(".bottom-nav-item")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              openPage(
                button.dataset.page
              )
          )
      );


    $$("[data-go]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              openPage(
                button.dataset.go
              )
          )
      );


    $("#profileAvatar")
      ?.addEventListener(
        "click",
        () =>
          openPage(
            "profile"
          )
      );

  }


  function openPage(
    page
  ) {

    const allowed = {

      missions:
        enabled(
          "show_missions"
        ),

      rewards:
        enabled(
          "show_rewards"
        ),

      rank:
        enabled(
          "show_leaderboard"
        )

    };


    if (
      Object.prototype
        .hasOwnProperty
        .call(
          allowed,
          page
        ) &&
      !allowed[page]
    ) {

      openPage(
        "home"
      );

      return;

    }


    $$(".app-page")
      .forEach(
        element =>
          element
            .classList
            .remove("active")
      );


    $$(".bottom-nav-item")
      .forEach(
        element =>
          element
            .classList
            .remove("active")
      );


    const target =
      $(
        `#page${
          page
            .charAt(0)
            .toUpperCase()
          +
          page.slice(1)
        }`
      );


    target
      ?.classList
      .add("active");


    $(
      `.bottom-nav-item[data-page="${page}"]`
    )
      ?.classList
      .add("active");


    window.scrollTo({
      top: 0,
      behavior:
        "smooth"
    });


    try {

      tg?.HapticFeedback
        ?.selectionChanged();

    } catch {
      // Optional.
    }

  }


  /* ======================================================
     ACTIONS
  ======================================================= */

  function bindActions() {

    $("#checkinButton")
      ?.addEventListener(
        "click",
        doCheckin
      );


    $("#closeSuccess")
      ?.addEventListener(
        "click",
        closeSuccess
      );


    $("#successDone")
      ?.addEventListener(
        "click",
        closeSuccess
      );


    $("#homeInviteButton")
      ?.addEventListener(
        "click",
        shareReferral
      );


    $("#profileInvite")
      ?.addEventListener(
        "click",
        shareReferral
      );


    $("#officialChannel")
      ?.addEventListener(
        "click",
        () => {

          const url =
            state.settings
              .official_channel_url;


          if (url) {

            openExternal(
              url
            );

          } else {

            showToast(
              "Official channel is not configured yet."
            );

          }

        }
      );


    $("#profileActivity")
      ?.addEventListener(
        "click",
        async () => {

          try {

            const result =
              await api(
                "/api/app/activity",
                {
                  method:
                    "POST"
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


  function closeSuccess() {

    $("#successModal")
      .classList
      .add("hidden");

  }


  function shareReferral() {

    const code =
      state.user
        ?.referral_code;


    const botUsername =
      String(
        state.settings
          .bot_username ||
        ""
      )
        .replace(
          /^@/,
          ""
        );


    if (
      !code ||
      !botUsername
    ) {

      showToast(
        "Your invitation link is being prepared."
      );


      return;

    }


    const referral =
      `https://t.me/${botUsername}?start=ref_${code}`;


    const shareUrl =
      `https://t.me/share/url?url=${
        encodeURIComponent(
          referral
        )
      }&text=${
        encodeURIComponent(
          `Join me on ${
            state.settings
              .app_name ||
            "Rico Club"
          }`
        )
      }`;


    openExternal(
      shareUrl
    );

  }


  function openExternal(
    url
  ) {

    if (!url) {
      return;
    }


    if (
      tg &&
      /^https:\/\/t\.me\//i
        .test(url)
    ) {

      tg.openTelegramLink(
        url
      );


      return;

    }


    if (
      tg?.openLink
    ) {

      tg.openLink(
        url
      );


      return;

    }


    window.location.href =
      url;

  }


  /* ======================================================
     API
  ======================================================= */

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
              tg?.initData ||
              "",

            ...(
              options.headers ||
              {}
            )

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


  /* ======================================================
     HELPERS
  ======================================================= */

  function validColor(
    value
  ) {

    return /^#[0-9a-fA-F]{6}$/
      .test(
        String(
          value ||
          ""
        )
      );

  }


  function cssUrl(
    url
  ) {

    return String(
      url ||
      ""
    )
      .replace(
        /["\\]/g,
        ""
      );

  }


  function parseDate(
    value
  ) {

    if (!value) {
      return 0;
    }


    const normalized =
      String(value)
        .includes("T")
        ? value
        : String(value)
            .replace(
              " ",
              "T"
            )
          +
          "Z";


    return new Date(
      normalized
    )
      .getTime();

  }


  function missionIcon(
    type
  ) {

    const map = {

      referral:
        "↗",

      checkin:
        "✓",

      channel:
        "◉",

      promo:
        "◆",

      custom:
        "◇"

    };


    return map[type] ||
      "◇";

  }


  function showToast(
    message
  ) {

    const toast =
      $("#toast");


    toast.textContent =
      message;


    toast
      .classList
      .add(
        "visible"
      );


    clearTimeout(
      showToast.timer
    );


    showToast.timer =
      setTimeout(
        () =>
          toast
            .classList
            .remove(
              "visible"
            ),
        2600
      );

  }


  function formatNumber(
    value
  ) {

    return new Intl
      .NumberFormat(
        "en-US"
      )
      .format(
        Number(
          value ||
          0
        )
      );

  }


  function getInitial(
    user
  ) {

    return String(
      user.first_name ||
      user.telegram_username ||
      "R"
    )
      .charAt(0)
      .toUpperCase();

  }


  function maskUser(
    user
  ) {

    const name =
      user.telegram_username ||
      user.first_name ||
      "Rico Member";


    if (
      name.length <=
      4
    ) {
      return name;
    }


    return `${
      name.slice(
        0,
        3
      )
    }***${
      name.slice(
        -2
      )
    }`;

  }


  function escapeHtml(
    value
  ) {

    const div =
      document
        .createElement(
          "div"
        );


    div.textContent =
      String(
        value ??
        ""
      );


    return div.innerHTML;

  }


  function escapeAttribute(
    value
  ) {

    return escapeHtml(
      value
    )
      .replace(
        /"/g,
        "&quot;"
      );

  }

})();
