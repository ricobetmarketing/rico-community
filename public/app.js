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
      // Telegram client capability varies.
    }


    await loadBootstrap();

  }


  async function loadBootstrap() {

    try {

      const data =
        await api(
          "/api/app/bootstrap",
          {
            method: "POST"
          }
        );


      state.bootstrap =
        data;

      state.user =
        data.user;

      state.missions =
        data.missions || [];

      state.rewards =
        data.rewards || [];

      state.drops =
        data.drops || [];

      state.leaderboard =
        data.leaderboard || [];

      state.settings =
        data.settings || {};


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
      user.current_streak || 0;


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
      user.current_streak || 0;


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

    const tiers = [

      {
        min: 0,
        max: 500,
        next: "Bronze"
      },

      {
        min: 500,
        max: 1500,
        next: "Silver"
      },

      {
        min: 1500,
        max: 5000,
        next: "Gold"
      },

      {
        min: 5000,
        max: 15000,
        next: "Diamond"
      },

      {
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
          tier =>
            points >= tier.min
        )
      ||
      tiers[0];


    if (!current.max) {

      return {

        percent: 100,

        text:
          "Diamond status unlocked"

      };

    }


    const percent =
      Math.max(
        0,
        Math.min(
          100,
          (
            (
              points -
              current.min
            )
            /
            (
              current.max -
              current.min
            )
          ) * 100
        )
      );


    return {

      percent,

      text:
        `${formatNumber(
          current.max -
          points
        )} points to ${current.next}`

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


    if (done) {

      card.classList.add(
        "completed"
      );


      button.disabled = true;

      button.textContent =
        "DONE";


      tag.textContent =
        "COMPLETED";

      tag.classList.add(
        "done"
      );


      $("#checkinDescription")
        .textContent =
        "Today's check-in is complete. Come back tomorrow to continue your streak.";

    } else {

      card.classList.remove(
        "completed"
      );


      button.disabled = false;

      button.textContent =
        "CHECK IN";


      tag.textContent =
        "READY";

      tag.classList.remove(
        "done"
      );


      $("#checkinDescription")
        .textContent =
        "Check in today to collect your Rico Points.";

    }

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
          state.user.lifetime_points ||
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
        .remove("hidden");


      try {

        tg?.HapticFeedback
          ?.notificationOccurred(
            "success"
          );

      } catch {
        // Haptic support varies.
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


  /* ======================================================
     MISSIONS
  ======================================================= */

  function renderMissions() {

    const missions =
      state.missions || [];


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
        .slice(0,2)
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
      state.rewards || [];


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


            const affordable =
              Number(
                state.user
                  ?.current_points ||
                0
              )
              >=
              cost;


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

          }
        )
        .join("");

  }


  /* ======================================================
     DROPS
  ======================================================= */

  function renderDrops() {

    const drops =
      state.drops || [];


    const section =
      $("#dropSection");


    if (!drops.length) {

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
        .slice(0,1)
        .map(
          drop => {

            const now =
              Date.now();


            const start =
              new Date(
                drop.start_at
              )
              .getTime();


            const end =
              new Date(
                drop.end_at
              )
              .getTime();


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

          }
        )
        .join("");

  }


  /* ======================================================
     LEADERBOARD
  ======================================================= */

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
      rows.slice(0,3);


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
      behavior: "smooth"
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
            openExternal(url);
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
      state.settings
        .bot_username;


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
          "Join me on Rico Club"
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

  function missionIcon(
    type
  ) {

    const map = {

      referral: "↗",

      checkin: "✓",

      channel: "◉",

      promo: "◆",

      custom: "◇"

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
      .add("visible");


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
      name.length <= 4
    ) {
      return name;
    }


    return `${
      name.slice(0,3)
    }***${
      name.slice(-2)
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
