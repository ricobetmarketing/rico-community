(() => {

  const state = {

    admin: null,

    currentSection:
      "dashboard",

    dashboard: null,

    players: [],

    missions: [],

    rewards: [],

    drops: [],

    selectedPlayer: null

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

    bindEvents();

    setDashboardDate();


    const authenticated =
      await checkSession();


    if (authenticated) {

      showAdmin();

      await openSection(
        "dashboard"
      );

    } else {

      showLogin();

    }

  }


  /* ======================================================
     AUTH
  ======================================================= */

  async function checkSession() {

    try {

      const response =
        await fetch(
          "/api/admin/me",
          {
            credentials:
              "same-origin"
          }
        );


      if (!response.ok) {
        return false;
      }


      const data =
        await response.json();


      if (!data.ok) {
        return false;
      }


      state.admin =
        data.admin;


      return true;

    } catch {

      return false;

    }

  }


  async function login(
    event
  ) {

    event.preventDefault();


    const button =
      $("#loginButton");


    const errorBox =
      $("#loginError");


    errorBox
      .classList
      .add("hidden");


    button.disabled =
      true;


    button.textContent =
      "Signing in...";


    try {

      const data =
        await api(
          "/api/admin/login",
          {
            method:
              "POST",

            body:
              JSON.stringify({

                email:
                  $("#loginEmail")
                    .value
                    .trim(),

                password:
                  $("#loginPassword")
                    .value

              })

          }
        );


      state.admin =
        data.admin;


      showAdmin();


      await openSection(
        "dashboard"
      );

    } catch (error) {

      errorBox.textContent =
        error.message;


      errorBox
        .classList
        .remove("hidden");

    } finally {

      button.disabled =
        false;


      button.textContent =
        "Sign in";

    }

  }


  async function logout() {

    try {

      await api(
        "/api/admin/logout",
        {
          method:
            "POST"
        }
      );

    } catch {
      // Continue locally.
    }


    state.admin =
      null;


    showLogin();

  }


  function showLogin() {

    $("#loginScreen")
      .classList
      .remove("hidden");


    $("#adminApp")
      .classList
      .add("hidden");

  }


  function showAdmin() {

    $("#loginScreen")
      .classList
      .add("hidden");


    $("#adminApp")
      .classList
      .remove("hidden");


    $("#sidebarAdminEmail")
      .textContent =
      state.admin?.email ||
      "Administrator";

  }


  /* ======================================================
     NAVIGATION
  ======================================================= */

  const sections = {

    dashboard: [
      "OVERVIEW",
      "Dashboard"
    ],

    players: [
      "PLAYER MANAGEMENT",
      "Players"
    ],

    missions: [
      "ENGAGEMENT",
      "Missions"
    ],

    rewards: [
      "LOYALTY",
      "Rewards"
    ],

    drops: [
      "LIMITED EVENTS",
      "Reward Drops"
    ],

    referrals: [
      "COMMUNITY GROWTH",
      "Referrals"
    ],

    leaderboard: [
      "RANKING",
      "Leaderboard"
    ],

    messages: [
      "TELEGRAM",
      "Messages"
    ],

    appearance: [
      "MINI APP",
      "Appearance"
    ],

    settings: [
      "PLATFORM",
      "Settings"
    ]

  };


  async function openSection(
    section
  ) {

    state.currentSection =
      section;


    $$(".admin-section")
      .forEach(
        element =>
          element
            .classList
            .remove("active")
      );


    $$(".nav-item")
      .forEach(
        element =>
          element
            .classList
            .remove("active")
      );


    const id =
      section
        .charAt(0)
        .toUpperCase()
      +
      section.slice(1);


    $(`#section${id}`)
      ?.classList
      .add("active");


    $(
      `.nav-item[data-section="${section}"]`
    )
      ?.classList
      .add("active");


    const meta =
      sections[section];


    $("#pageEyebrow")
      .textContent =
      meta[0];


    $("#pageTitle")
      .textContent =
      meta[1];


    $("#sidebar")
      .classList
      .remove(
        "mobile-open"
      );


    await loadSection(
      section
    );

  }


  async function loadSection(
    section
  ) {

    switch (section) {

      case "dashboard":
        await loadDashboard();
        break;

      case "players":
        await loadPlayers();
        break;

      case "missions":
        await loadMissions();
        break;

      case "rewards":
        await loadRewards();
        break;

      case "drops":
        await loadDrops();
        break;

      case "leaderboard":
        await loadLeaderboard();
        break;

      case "referrals":
        renderReferralSummary();
        break;

    }

  }


  /* ======================================================
     DASHBOARD
  ======================================================= */

  async function loadDashboard() {

    const data =
      await api(
        "/api/admin/dashboard"
      );


    state.dashboard =
      data;


    const stats =
      data.stats ||
      {};


    $("#statPlayers")
      .textContent =
      number(
        stats.total_players
      );


    $("#statActive")
      .textContent =
      number(
        stats.active_today
      );


    $("#statCheckins")
      .textContent =
      number(
        stats.checkins_today
      );


    $("#statPoints")
      .textContent =
      number(
        stats.points_issued
      );


    $("#statReferrals")
      .textContent =
      number(
        stats.referrals
      );


    $("#statClaims")
      .textContent =
      number(
        stats.rewards_claimed
      );


    renderChart(
      data.activity_chart ||
      []
    );


    renderActivity(
      data.recent_activity ||
      []
    );


    renderReferralSummary();

  }


  function renderChart(
    rows
  ) {

    const map = {};


    for (
      const row of rows
    ) {

      map[row.day] =
        Number(
          row.total ||
          0
        );

    }


    const days = [];


    for (
      let i = 6;
      i >= 0;
      i--
    ) {

      const date =
        new Date();


      date.setDate(
        date.getDate() -
        i
      );


      const key =
        date
          .toISOString()
          .slice(0,10);


      days.push({

        key,

        label:
          date
            .toLocaleDateString(
              "en-US",
              {
                weekday:
                  "short"
              }
            ),

        value:
          map[key] ||
          0

      });

    }


    const max =
      Math.max(
        1,
        ...days.map(
          item =>
            item.value
        )
      );


    $("#activityChart")
      .innerHTML =
      days
        .map(
          item => {

            const height =
              Math.max(
                3,
                (
                  item.value /
                  max
                ) * 100
              );


            return `
              <div class="chart-day">

                <strong>
                  ${number(
                    item.value
                  )}
                </strong>


                <div class="chart-track">

                  <div
                    class="chart-bar"
                    style="
                      height:
                      ${height}%
                    "
                  ></div>

                </div>


                <span>
                  ${escapeHtml(
                    item.label
                  )}
                </span>

              </div>
            `;

          }
        )
        .join("");

  }


  function renderActivity(
    rows
  ) {

    const container =
      $("#recentActivity");


    if (!rows.length) {

      container.innerHTML = `
        <div class="empty-state">

          <strong>
            No recent activity
          </strong>

          <p>
            Player actions will appear here automatically.
          </p>

        </div>
      `;


      return;

    }


    container.innerHTML =
      rows
        .map(
          item => {

            const player =
              item.telegram_username
                ? `@${item.telegram_username}`
                : (
                    item.first_name ||
                    "Rico Member"
                  );


            return `
              <div class="activity-row">

                <div class="activity-icon">
                  ${activityIcon(
                    item.event_type
                  )}
                </div>


                <div>

                  <strong>
                    ${escapeHtml(
                      item.title
                    )}
                  </strong>


                  <p>
                    ${escapeHtml(
                      player
                    )}
                    ${
                      item.description
                        ? ` · ${escapeHtml(
                            item.description
                          )}`
                        : ""
                    }
                  </p>

                </div>


                <time>
                  ${formatDateTime(
                    item.created_at
                  )}
                </time>

              </div>
            `;

          }
        )
        .join("");

  }


  /* ======================================================
     PLAYERS
  ======================================================= */

  async function loadPlayers(
    search = ""
  ) {

    const query =
      search
        ? `?search=${
            encodeURIComponent(
              search
            )
          }`
        : "";


    const data =
      await api(
        `/api/admin/players${query}`
      );


    state.players =
      data.players ||
      [];


    renderPlayers();

  }


  function renderPlayers() {

    const table =
      $("#playersTable");


    const empty =
      $("#playersEmpty");


    if (!state.players.length) {

      table.innerHTML =
        "";


      empty
        .classList
        .remove("hidden");


      return;

    }


    empty
      .classList
      .add("hidden");


    table.innerHTML =
      state.players
        .map(
          player => `
            <tr
              data-player-id="${
                player.id
              }"
            >

              <td>

                <div class="table-player">

                  <div class="table-avatar">
                    ${initial(
                      player
                    )}
                  </div>


                  <div>

                    <strong>
                      ${escapeHtml(
                        displayName(
                          player
                        )
                      )}
                    </strong>


                    <span>
                      ${
                        player.telegram_username
                          ? `@${
                              escapeHtml(
                                player.telegram_username
                              )
                            }`
                          : "No username"
                      }
                    </span>

                  </div>

                </div>

              </td>


              <td>
                ${escapeHtml(
                  player.telegram_id
                )}
              </td>


              <td>
                ${number(
                  player.current_points
                )}
              </td>


              <td>
                ${escapeHtml(
                  player.tier ||
                  "Rookie"
                )}
              </td>


              <td>
                ${
                  player.current_streak ||
                  0
                } days
              </td>


              <td>
                ${number(
                  player.referrals
                )}
              </td>


              <td>
                ${formatDateTime(
                  player.last_active_at
                )}
              </td>


              <td>
                <span
                  class="status-badge ${
                    escapeAttribute(
                      player.status ||
                      "active"
                    )
                  }"
                >
                  ${escapeHtml(
                    player.status ||
                    "active"
                  )}
                </span>
              </td>

            </tr>
          `
        )
        .join("");


    $$("#playersTable tr")
      .forEach(
        row =>
          row.addEventListener(
            "click",
            () =>
              openPlayer(
                row.dataset
                  .playerId
              )
          )
      );

  }


  async function openPlayer(
    id
  ) {

    const data =
      await api(
        `/api/admin/player/${id}`
      );


    state.selectedPlayer =
      data;


    renderPlayerDrawer(
      data
    );


    $("#drawerOverlay")
      .classList
      .remove("hidden");


    $("#playerDrawer")
      .classList
      .add("open");

  }


  function closePlayerDrawer() {

    $("#drawerOverlay")
      .classList
      .add("hidden");


    $("#playerDrawer")
      .classList
      .remove("open");

  }


  function renderPlayerDrawer(
    data
  ) {

    const player =
      data.player;


    $("#playerDrawerContent")
      .innerHTML = `
        <div class="player-detail">

          <div class="player-profile-head">

            <div class="player-profile-avatar">
              ${initial(
                player
              )}
            </div>


            <div>

              <h2>
                ${escapeHtml(
                  displayName(
                    player
                  )
                )}
              </h2>


              <p>
                ${
                  player.telegram_username
                    ? `@${
                        escapeHtml(
                          player.telegram_username
                        )
                      }`
                    : "Telegram Member"
                }
              </p>


              <span
                class="status-badge ${
                  escapeAttribute(
                    player.status
                  )
                }"
              >
                ${escapeHtml(
                  player.status
                )}
              </span>

            </div>

          </div>


          <div class="player-detail-stats">

            <div class="player-detail-stat">
              <span>POINTS</span>
              <strong>
                ${number(
                  player.current_points
                )}
              </strong>
            </div>

            <div class="player-detail-stat">
              <span>TIER</span>
              <strong>
                ${escapeHtml(
                  player.tier
                )}
              </strong>
            </div>

            <div class="player-detail-stat">
              <span>STREAK</span>
              <strong>
                ${
                  player.current_streak ||
                  0
                }
              </strong>
            </div>

            <div class="player-detail-stat">
              <span>RANK</span>
              <strong>
                #${data.rank || "—"}
              </strong>
            </div>

          </div>


          <div class="player-actions">

            <button
              data-player-action="message"
              type="button"
            >
              Message
            </button>

            <button
              data-player-action="add"
              type="button"
            >
              + Points
            </button>

            <button
              data-player-action="deduct"
              type="button"
            >
              − Points
            </button>

          </div>


          <div class="player-tabs">

            <button
              class="player-tab active"
              data-player-tab="activity"
              type="button"
            >
              Activity
            </button>

            <button
              class="player-tab"
              data-player-tab="points"
              type="button"
            >
              Points
            </button>

            <button
              class="player-tab"
              data-player-tab="rewards"
              type="button"
            >
              Rewards
            </button>

            <button
              class="player-tab"
              data-player-tab="referrals"
              type="button"
            >
              Referrals
            </button>

            <button
              class="player-tab"
              data-player-tab="messages"
              type="button"
            >
              Messages
            </button>

          </div>


          <div
            id="playerTabContent"
          >
            ${renderTimeline(
              data.activity ||
              []
            )}
          </div>

        </div>
      `;


    bindPlayerActions(
      player,
      data
    );

  }


  function bindPlayerActions(
    player,
    data
  ) {

    $$("[data-player-action]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              const action =
                button.dataset
                  .playerAction;


              if (
                action ===
                "message"
              ) {

                openMessageModal(
                  player
                );

              }


              if (
                action ===
                "add"
              ) {

                openPointsModal(
                  player,
                  true
                );

              }


              if (
                action ===
                "deduct"
              ) {

                openPointsModal(
                  player,
                  false
                );

              }

            }
          )
      );


    $$(".player-tab")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              $$(".player-tab")
                .forEach(
                  tab =>
                    tab
                      .classList
                      .remove(
                        "active"
                      )
                );


              button
                .classList
                .add("active");


              const target =
                $("#playerTabContent");


              switch (
                button.dataset
                  .playerTab
              ) {

                case "activity":

                  target.innerHTML =
                    renderTimeline(
                      data.activity ||
                      []
                    );

                  break;


                case "points":

                  target.innerHTML =
                    renderTransactions(
                      data.transactions ||
                      []
                    );

                  break;


                case "rewards":

                  target.innerHTML =
                    renderSimpleTimeline(
                      data.rewards ||
                      [],
                      item =>
                        item.title,
                      item =>
                        `${number(
                          item.points_spent
                        )} points`,
                      item =>
                        item.created_at
                    );

                  break;


                case "referrals":

                  target.innerHTML =
                    renderSimpleTimeline(
                      data.referrals ||
                      [],
                      item =>
                        item.telegram_username
                          ? `@${item.telegram_username}`
                          : (
                              item.first_name ||
                              "Rico Member"
                            ),
                      item =>
                        item.status,
                      item =>
                        item.created_at
                    );

                  break;


                case "messages":

                  target.innerHTML =
                    renderSimpleTimeline(
                      data.messages ||
                      [],
                      item =>
                        item.message_text,
                      item =>
                        item.status,
                      item =>
                        item.created_at
                    );

                  break;

              }

            }
          )
      );

  }


  function renderTimeline(
    rows
  ) {

    if (!rows.length) {

      return `
        <div class="empty-state">
          <strong>
            No activity recorded
          </strong>
        </div>
      `;

    }


    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  item.title
                )}
              </strong>

              ${
                item.description
                  ? `
                    <p>
                      ${escapeHtml(
                        item.description
                      )}
                    </p>
                  `
                  : ""
              }

              <time>
                ${formatDateTime(
                  item.created_at
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  function renderTransactions(
    rows
  ) {

    if (!rows.length) {

      return `
        <div class="empty-state">
          <strong>
            No point transactions
          </strong>
        </div>
      `;

    }


    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${
                  Number(
                    item.amount
                  ) >= 0
                    ? "+"
                    : ""
                }${number(
                  item.amount
                )}
                Rico Points
              </strong>

              <p>
                ${escapeHtml(
                  item.description ||
                  item.transaction_type
                )}
              </p>

              <time>
                ${formatDateTime(
                  item.created_at
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  function renderSimpleTimeline(
    rows,
    title,
    subtitle,
    date
  ) {

    if (!rows.length) {

      return `
        <div class="empty-state">
          <strong>
            No records
          </strong>
        </div>
      `;

    }


    return rows
      .map(
        item => `
          <div class="timeline-item">

            <div class="timeline-dot">
            </div>

            <div>

              <strong>
                ${escapeHtml(
                  title(item)
                )}
              </strong>

              <p>
                ${escapeHtml(
                  subtitle(item)
                )}
              </p>

              <time>
                ${formatDateTime(
                  date(item)
                )}
              </time>

            </div>

          </div>
        `
      )
      .join("");

  }


  /* ======================================================
     MISSIONS
  ======================================================= */

  async function loadMissions() {

    const data =
      await api(
        "/api/admin/missions"
      );


    state.missions =
      data.missions ||
      [];


    renderMissions();

  }


  function renderMissions() {

    renderManagementCards(
      state.missions,
      $("#missionsGrid"),
      $("#missionsEmpty"),
      "◇",
      item =>
        item.title,
      item =>
        item.description ||
        "Rico Club mission",
      [
        [
          "TYPE",
          item =>
            item.mission_type
        ],

        [
          "REWARD",
          item =>
            `+${number(
              item.reward_points
            )}`
        ]
      ]
    );

  }


  /* ======================================================
     REWARDS
  ======================================================= */

  async function loadRewards() {

    const data =
      await api(
        "/api/admin/rewards"
      );


    state.rewards =
      data.rewards ||
      [];


    renderRewards();

  }


  function renderRewards() {

    renderManagementCards(
      state.rewards,
      $("#rewardsGrid"),
      $("#rewardsEmpty"),
      "◆",
      item =>
        item.title,
      item =>
        item.description ||
        "Rico Club reward",
      [
        [
          "COST",
          item =>
            number(
              item.points_cost
            )
        ],

        [
          "STOCK",
          item =>
            item.stock === null
              ? "Unlimited"
              : number(
                  item.stock
                )
        ]
      ]
    );

  }


  /* ======================================================
     DROPS
  ======================================================= */

  async function loadDrops() {

    const data =
      await api(
        "/api/admin/drops"
      );


    state.drops =
      data.drops ||
      [];


    renderDrops();

  }


  function renderDrops() {

    renderManagementCards(
      state.drops,
      $("#dropsGrid"),
      $("#dropsEmpty"),
      "✦",
      item =>
        item.title,
      item =>
        item.description ||
        "Rico Club reward drop",
      [
        [
          "QUANTITY",
          item =>
            number(
              item.total_quantity
            )
        ],

        [
          "CLAIMED",
          item =>
            number(
              item.claimed_quantity
            )
        ]
      ]
    );

  }


  function renderManagementCards(
    rows,
    grid,
    empty,
    icon,
    title,
    description,
    meta
  ) {

    if (!rows.length) {

      grid.innerHTML =
        "";


      empty
        .classList
        .remove("hidden");


      return;

    }


    empty
      .classList
      .add("hidden");


    grid.innerHTML =
      rows
        .map(
          item => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ${icon}
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      item.status
                    )
                  }"
                >
                  ${escapeHtml(
                    item.status
                  )}
                </span>

              </div>


              <h3>
                ${escapeHtml(
                  title(item)
                )}
              </h3>


              <p>
                ${escapeHtml(
                  description(item)
                )}
              </p>


              <div class="management-meta">

                ${meta
                  .map(
                    ([label,value]) => `
                      <div>

                        <span>
                          ${label}
                        </span>

                        <strong>
                          ${escapeHtml(
                            value(item)
                          )}
                        </strong>

                      </div>
                    `
                  )
                  .join("")}

              </div>

            </article>
          `
        )
        .join("");

  }


  /* ======================================================
     LEADERBOARD
  ======================================================= */

  async function loadLeaderboard() {

    if (!state.players.length) {
      await loadPlayers();
    }


    const rows =
      [...state.players]
        .sort(
          (a,b) =>
            Number(
              b.current_points ||
              0
            )
            -
            Number(
              a.current_points ||
              0
            )
        );


    const table =
      $("#leaderboardTable");


    const empty =
      $("#leaderboardEmpty");


    if (!rows.length) {

      table.innerHTML =
        "";


      empty
        .classList
        .remove("hidden");


      return;

    }


    empty
      .classList
      .add("hidden");


    table.innerHTML =
      rows
        .map(
          (player,index) => `
            <tr
              data-player-id="${
                player.id
              }"
            >

              <td>
                #${index + 1}
              </td>


              <td>

                <div class="table-player">

                  <div class="table-avatar">
                    ${initial(
                      player
                    )}
                  </div>


                  <div>

                    <strong>
                      ${escapeHtml(
                        displayName(
                          player
                        )
                      )}
                    </strong>

                    <span>
                      ${
                        player.telegram_username
                          ? `@${
                              escapeHtml(
                                player.telegram_username
                              )
                            }`
                          : "Telegram Member"
                      }
                    </span>

                  </div>

                </div>

              </td>


              <td>
                ${escapeHtml(
                  player.tier ||
                  "Rookie"
                )}
              </td>


              <td>
                ${number(
                  player.current_points
                )}
              </td>


              <td>
                ${
                  player.current_streak ||
                  0
                } days
              </td>

            </tr>
          `
        )
        .join("");


    $$("#leaderboardTable tr")
      .forEach(
        row =>
          row.addEventListener(
            "click",
            () =>
              openPlayer(
                row.dataset.playerId
              )
          )
      );

  }


  function renderReferralSummary() {

    const total =
      Number(
        state.dashboard
          ?.stats
          ?.referrals ||
        0
      );


    $("#refTotal")
      .textContent =
      number(total);


    $("#refQualified")
      .textContent =
      "0";


    $("#refPending")
      .textContent =
      number(total);

  }


  /* ======================================================
     MODALS
  ======================================================= */

  function openMissionModal() {

    openModal(
      "MISSION",
      "Create Mission",
      `
        <form
          id="missionForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Mission Name</span>
              <input id="missionTitle" required>
            </label>


            <label class="field wide">
              <span>Description</span>
              <textarea id="missionDescription"></textarea>
            </label>


            <label class="field">

              <span>Mission Type</span>

              <select id="missionType">

                <option value="checkin">
                  Daily Check-in
                </option>

                <option value="referral">
                  Referral
                </option>

                <option value="channel">
                  Telegram Channel
                </option>

                <option value="promo">
                  Promo Code
                </option>

                <option value="custom">
                  Custom
                </option>

              </select>

            </label>


            <label class="field">
              <span>Target</span>
              <input
                id="missionTarget"
                type="number"
                min="1"
                value="1"
              >
            </label>


            <label class="field">
              <span>Reward Points</span>
              <input
                id="missionReward"
                type="number"
                min="0"
                value="0"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="missionStatus">

                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>


            <label class="field">
              <span>Start</span>
              <input
                id="missionStart"
                type="datetime-local"
              >
            </label>


            <label class="field">
              <span>End</span>
              <input
                id="missionEnd"
                type="datetime-local"
              >
            </label>


            <label class="field">
              <span>Button Text</span>
              <input id="missionButton">
            </label>


            <label class="field">
              <span>Button URL</span>
              <input
                id="missionUrl"
                type="url"
              >
            </label>

          </div>


          <div class="modal-actions">

            <button
              class="secondary-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Mission
            </button>

          </div>

        </form>
      `
    );


    $("#missionForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          await api(
            "/api/admin/missions",
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  title:
                    $("#missionTitle")
                      .value
                      .trim(),

                  description:
                    $("#missionDescription")
                      .value
                      .trim(),

                  mission_type:
                    $("#missionType")
                      .value,

                  target_value:
                    Number(
                      $("#missionTarget")
                        .value
                    ),

                  reward_points:
                    Number(
                      $("#missionReward")
                        .value
                    ),

                  status:
                    $("#missionStatus")
                      .value,

                  start_at:
                    toDatabaseDate(
                      $("#missionStart")
                        .value
                    ),

                  end_at:
                    toDatabaseDate(
                      $("#missionEnd")
                        .value
                    ),

                  button_text:
                    $("#missionButton")
                      .value
                      .trim(),

                  button_url:
                    $("#missionUrl")
                      .value
                      .trim()

                })

            }
          );


          closeModal();


          showToast(
            "Mission created."
          );


          await loadMissions();

        }
      );


    bindModalClose();

  }


  function openRewardModal() {

    openModal(
      "REWARD",
      "Create Reward",
      `
        <form
          id="rewardForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Reward Name</span>
              <input id="rewardTitle" required>
            </label>


            <label class="field wide">
              <span>Description</span>
              <textarea id="rewardDescription"></textarea>
            </label>


            <label class="field">

              <span>Reward Type</span>

              <select id="rewardType">

                <option value="manual">
                  Manual Reward
                </option>

                <option value="voucher">
                  Voucher
                </option>

                <option value="promo">
                  Promo Code
                </option>

                <option value="mystery">
                  Mystery Reward
                </option>

              </select>

            </label>


            <label class="field">
              <span>Points Cost</span>
              <input
                id="rewardCost"
                type="number"
                min="0"
                value="0"
              >
            </label>


            <label class="field">
              <span>Stock</span>
              <input
                id="rewardStock"
                type="number"
                min="0"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="rewardStatus">

                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="secondary-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Reward
            </button>

          </div>

        </form>
      `
    );


    $("#rewardForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          const stock =
            $("#rewardStock")
              .value;


          await api(
            "/api/admin/rewards",
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  title:
                    $("#rewardTitle")
                      .value
                      .trim(),

                  description:
                    $("#rewardDescription")
                      .value
                      .trim(),

                  reward_type:
                    $("#rewardType")
                      .value,

                  points_cost:
                    Number(
                      $("#rewardCost")
                        .value
                    ),

                  stock:
                    stock === ""
                      ? null
                      : Number(stock),

                  status:
                    $("#rewardStatus")
                      .value

                })

            }
          );


          closeModal();


          showToast(
            "Reward created."
          );


          await loadRewards();

        }
      );


    bindModalClose();

  }


  function openDropModal() {

    openModal(
      "DROP",
      "Create Reward Drop",
      `
        <form
          id="dropForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Drop Name</span>
              <input id="dropTitle" required>
            </label>


            <label class="field wide">
              <span>Description</span>
              <textarea id="dropDescription"></textarea>
            </label>


            <label class="field">

              <span>Reward Type</span>

              <select id="dropRewardType">

                <option value="points">
                  Rico Points
                </option>

                <option value="voucher">
                  Voucher
                </option>

                <option value="mystery">
                  Mystery Reward
                </option>

              </select>

            </label>


            <label class="field">
              <span>Reward Value</span>
              <input
                id="dropReward"
                type="number"
                min="0"
                value="0"
              >
            </label>


            <label class="field">
              <span>Quantity</span>
              <input
                id="dropQuantity"
                required
                type="number"
                min="1"
              >
            </label>


            <label class="field">
              <span>Claim Limit</span>
              <input
                id="dropLimit"
                type="number"
                min="1"
                value="1"
              >
            </label>


            <label class="field">
              <span>Start</span>
              <input
                id="dropStart"
                required
                type="datetime-local"
              >
            </label>


            <label class="field">
              <span>End</span>
              <input
                id="dropEnd"
                required
                type="datetime-local"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="dropStatus">

                <option value="draft">
                  Draft
                </option>

                <option value="scheduled">
                  Scheduled
                </option>

                <option value="active">
                  Active
                </option>

              </select>

            </label>

          </div>


          <div class="modal-actions">

            <button
              class="secondary-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Create Drop
            </button>

          </div>

        </form>
      `
    );


    $("#dropForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          await api(
            "/api/admin/drops",
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  title:
                    $("#dropTitle")
                      .value
                      .trim(),

                  description:
                    $("#dropDescription")
                      .value
                      .trim(),

                  reward_type:
                    $("#dropRewardType")
                      .value,

                  reward_value:
                    Number(
                      $("#dropReward")
                        .value
                    ),

                  total_quantity:
                    Number(
                      $("#dropQuantity")
                        .value
                    ),

                  claim_limit_per_user:
                    Number(
                      $("#dropLimit")
                        .value
                    ),

                  start_at:
                    toDatabaseDate(
                      $("#dropStart")
                        .value
                    ),

                  end_at:
                    toDatabaseDate(
                      $("#dropEnd")
                        .value
                    ),

                  status:
                    $("#dropStatus")
                      .value

                })

            }
          );


          closeModal();


          showToast(
            "Reward drop created."
          );


          await loadDrops();

        }
      );


    bindModalClose();

  }


  function openPointsModal(
    player,
    adding
  ) {

    openModal(
      "PLAYER POINTS",
      adding
        ? "Add Rico Points"
        : "Deduct Rico Points",
      `
        <form
          id="pointsForm"
          class="modal-form"
        >

          <label class="field">
            <span>Amount</span>
            <input
              id="pointsAmount"
              required
              type="number"
              min="1"
            >
          </label>


          <label class="field">
            <span>Reason</span>
            <textarea
              id="pointsReason"
              required
            ></textarea>
          </label>


          <div class="modal-actions">

            <button
              class="secondary-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Confirm
            </button>

          </div>

        </form>
      `
    );


    $("#pointsForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          let amount =
            Math.abs(
              Number(
                $("#pointsAmount")
                  .value
              )
            );


          if (!adding) {
            amount =
              -amount;
          }


          await api(
            `/api/admin/player/${player.id}/points`,
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  amount,

                  reason:
                    $("#pointsReason")
                      .value
                      .trim()

                })

            }
          );


          closeModal();


          showToast(
            "Player points updated."
          );


          await openPlayer(
            player.id
          );


          await loadDashboard();

        }
      );


    bindModalClose();

  }


  function openMessageModal(
    player
  ) {

    openModal(
      "TELEGRAM",
      "Send Message",
      `
        <form
          id="messageForm"
          class="modal-form"
        >

          <label class="field">

            <span>Message</span>

            <textarea
              id="messageText"
              required
            ></textarea>

          </label>


          <div class="form-grid">

            <label class="field">
              <span>Button Text</span>
              <input id="messageButton">
            </label>


            <label class="field">
              <span>Button URL</span>
              <input
                id="messageUrl"
                type="url"
              >
            </label>

          </div>


          <div class="modal-actions">

            <button
              class="secondary-button"
              type="button"
              data-close-modal
            >
              Cancel
            </button>

            <button
              class="primary-button"
              type="submit"
            >
              Send
            </button>

          </div>

        </form>
      `
    );


    $("#messageForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          await api(
            `/api/admin/player/${player.id}/message`,
            {
              method:
                "POST",

              body:
                JSON.stringify({

                  message:
                    $("#messageText")
                      .value
                      .trim(),

                  button_text:
                    $("#messageButton")
                      .value
                      .trim(),

                  button_url:
                    $("#messageUrl")
                      .value
                      .trim()

                })

            }
          );


          closeModal();


          showToast(
            "Telegram message sent."
          );


          await openPlayer(
            player.id
          );

        }
      );


    bindModalClose();

  }


  function openModal(
    eyebrow,
    title,
    html
  ) {

    $("#modalEyebrow")
      .textContent =
      eyebrow;


    $("#modalTitle")
      .textContent =
      title;


    $("#modalBody")
      .innerHTML =
      html;


    $("#modalOverlay")
      .classList
      .remove("hidden");

  }


  function closeModal() {

    $("#modalOverlay")
      .classList
      .add("hidden");


    $("#modalBody")
      .innerHTML =
      "";

  }


  function bindModalClose() {

    $$("[data-close-modal]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            closeModal
          )
      );

  }


  /* ======================================================
     EVENTS
  ======================================================= */

  function bindEvents() {

    $("#loginForm")
      .addEventListener(
        "submit",
        login
      );


    $("#togglePassword")
      .addEventListener(
        "click",
        () => {

          const input =
            $("#loginPassword");


          const show =
            input.type ===
            "password";


          input.type =
            show
              ? "text"
              : "password";


          $("#togglePassword")
            .textContent =
            show
              ? "Hide"
              : "Show";

        }
      );


    $("#logoutButton")
      .addEventListener(
        "click",
        logout
      );


    $$(".nav-item")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () =>
              openSection(
                button.dataset
                  .section
              )
          )
      );


    $("#refreshCurrent")
      .addEventListener(
        "click",
        () =>
          loadSection(
            state.currentSection
          )
      );


    $("#sidebarToggle")
      .addEventListener(
        "click",
        () =>
          $("#sidebar")
            .classList
            .add(
              "mobile-open"
            )
      );


    $("#sidebarClose")
      .addEventListener(
        "click",
        () =>
          $("#sidebar")
            .classList
            .remove(
              "mobile-open"
            )
      );


    $("#playerSearchButton")
      .addEventListener(
        "click",
        () =>
          loadPlayers(
            $("#playerSearch")
              .value
              .trim()
          )
      );


    $("#playerSearch")
      .addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter"
          ) {

            loadPlayers(
              event.currentTarget
                .value
                .trim()
            );

          }

        }
      );


    $("#createMissionButton")
      .addEventListener(
        "click",
        openMissionModal
      );


    $("#createRewardButton")
      .addEventListener(
        "click",
        openRewardModal
      );


    $("#createDropButton")
      .addEventListener(
        "click",
        openDropModal
      );


    $("#openPlayersFromMessages")
      .addEventListener(
        "click",
        () =>
          openSection(
            "players"
          )
      );


    $("#drawerOverlay")
      .addEventListener(
        "click",
        closePlayerDrawer
      );


    $("#closePlayerDrawer")
      .addEventListener(
        "click",
        closePlayerDrawer
      );


    $("#closeModal")
      .addEventListener(
        "click",
        closeModal
      );


    $("#modalOverlay")
      .addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("#modalOverlay")
          ) {
            closeModal();
          }

        }
      );

  }


  /* ======================================================
     API
  ======================================================= */

  async function api(
    path,
    options = {}
  ) {

    const response =
      await fetch(
        path,
        {
          credentials:
            "same-origin",

          ...options,

          headers: {

            "content-type":
              "application/json",

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


    if (
      response.status ===
      401
    ) {

      if (
        path ===
        "/api/admin/login"
      ) {

        throw new Error(
          data.error ||
          "Invalid email or password."
        );

      }


      state.admin =
        null;


      showLogin();


      throw new Error(
        "Your admin session has expired. Please sign in again."
      );

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

  function setDashboardDate() {

    $("#dashboardDate")
      .textContent =
      new Date()
        .toLocaleDateString(
          "en-GB",
          {
            weekday:
              "long",

            day:
              "2-digit",

            month:
              "long",

            year:
              "numeric"
          }
        );

  }


  function displayName(
    player
  ) {

    return [
      player.first_name,
      player.last_name
    ]
      .filter(Boolean)
      .join(" ")
      ||
      player.telegram_username
      ||
      "Rico Member";

  }


  function initial(
    player
  ) {

    return String(
      player.first_name ||
      player.telegram_username ||
      "R"
    )
      .charAt(0)
      .toUpperCase();

  }


  function number(
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


  function formatDateTime(
    value
  ) {

    if (!value) {
      return "—";
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


    const date =
      new Date(
        normalized
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }


    return date
      .toLocaleString(
        "en-GB",
        {
          day:
            "2-digit",

          month:
            "short",

          hour:
            "2-digit",

          minute:
            "2-digit"
        }
      );

  }


  function toDatabaseDate(
    value
  ) {

    if (!value) {
      return null;
    }


    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }


    return date
      .toISOString()
      .replace(
        "T",
        " "
      )
      .replace(
        "Z",
        ""
      );

  }


  function activityIcon(
    type
  ) {

    const map = {

      checkin:
        "✓",

      account_created:
        "◎",

      admin_adjustment:
        "◆",

      referral:
        "↗",

      reward:
        "✦"

    };


    return map[type] ||
      "•";

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


  function showToast(
    message
  ) {

    const toast =
      $("#adminToast");


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
        2500
      );

  }

})();
