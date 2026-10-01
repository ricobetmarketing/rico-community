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

    referrals: [],

    settings: {},

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

    referrals: [
      "COMMUNITY GROWTH",
      "Referrals"
    ],

    leaderboard: [
      "RANKING",
      "Leaderboard"
    ],

    missions: [
      "ENGAGEMENT",
      "Missions"
    ],

    drops: [
      "LIMITED EVENTS",
      "Reward Drops"
    ],

    rewards: [
      "LOYALTY",
      "Rewards"
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

    try {

      switch (section) {

        case "dashboard":
          await loadDashboard();
          break;

        case "players":
          await loadPlayers();
          break;

        case "referrals":
          await loadReferrals();
          break;

        case "leaderboard":
          await loadLeaderboard();
          break;

        case "missions":
          await loadMissions();
          break;

        case "drops":
          await loadDrops();
          break;

        case "rewards":
          await loadRewards();
          break;

        case "appearance":
          await loadSettings();
          break;

        case "settings":
          await loadSettings();
          break;

      }

    } catch (error) {

      showToast(
        error.message ||
        "Unable to load data."
      );

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
                    style="height:${height}%"
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
              data-player-id="${player.id}"
            >

              <td>

                <div class="table-player">

                  <div class="table-avatar">
                    ${initial(player)}
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
                          ? `@${escapeHtml(
                              player.telegram_username
                            )}`
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
              ${initial(player)}
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
                    ? `@${escapeHtml(
                        player.telegram_username
                      )}`
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


          <div id="playerTabContent">
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

            <div class="timeline-dot"></div>

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

            <div class="timeline-dot"></div>

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

            <div class="timeline-dot"></div>

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
     REFERRALS
  ======================================================= */

  async function loadReferrals() {

    const data =
      await api(
        "/api/admin/referrals"
      );


    state.referrals =
      data.referrals ||
      [];


    $("#refTotal")
      .textContent =
      number(
        data.stats?.total
      );


    $("#refQualified")
      .textContent =
      number(
        data.stats?.qualified
      );


    $("#refPending")
      .textContent =
      number(
        data.stats?.pending
      );


    const table =
      $("#referralsTable");


    const empty =
      $("#referralsEmpty");


    if (!state.referrals.length) {

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
      state.referrals
        .map(
          item => `
            <tr>

              <td>
                ${
                  item.referrer_username
                    ? `@${escapeHtml(
                        item.referrer_username
                      )}`
                    : escapeHtml(
                        item.referrer_name ||
                        "Rico Member"
                      )
                }
              </td>

              <td>
                ${
                  item.referred_username
                    ? `@${escapeHtml(
                        item.referred_username
                      )}`
                    : escapeHtml(
                        item.referred_name ||
                        "Rico Member"
                      )
                }
              </td>

              <td>
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
              </td>

              <td>
                ${number(
                  item.reward_points
                )}
              </td>

              <td>
                ${formatDateTime(
                  item.created_at
                )}
              </td>

              <td>
                ${formatDateTime(
                  item.qualified_at
                )}
              </td>

            </tr>
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

    const grid =
      $("#missionsGrid");


    const empty =
      $("#missionsEmpty");


    if (!state.missions.length) {

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
      state.missions
        .map(
          mission => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ◇
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      mission.status
                    )
                  }"
                >
                  ${escapeHtml(
                    mission.status
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
                  "Rico Club mission"
                )}
              </p>

              <div class="management-meta">

                <div>
                  <span>TYPE</span>

                  <strong>
                    ${escapeHtml(
                      mission.mission_type
                    )}
                  </strong>
                </div>

                <div>
                  <span>REWARD</span>

                  <strong>
                    +${number(
                      mission.reward_points
                    )}
                  </strong>
                </div>

              </div>

              <div
                style="
                  display:flex;
                  gap:8px;
                  margin-top:14px
                "
              >

                <button
                  class="secondary-button"
                  data-edit-mission="${mission.id}"
                  type="button"
                >
                  Edit
                </button>

                <button
                  class="secondary-button"
                  data-delete-mission="${mission.id}"
                  type="button"
                >
                  Delete
                </button>

              </div>

            </article>
          `
        )
        .join("");


    $$("[data-edit-mission]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              const mission =
                state.missions
                  .find(
                    item =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .editMission
                      )
                  );


              if (mission) {
                openMissionModal(
                  mission
                );
              }

            }
          )
      );


    $$("[data-delete-mission]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            async () => {

              if (
                !confirm(
                  "Delete this mission?"
                )
              ) {
                return;
              }


              await api(
                `/api/admin/missions/${
                  button.dataset
                    .deleteMission
                }`,
                {
                  method:
                    "DELETE"
                }
              );


              showToast(
                "Mission deleted."
              );


              await loadMissions();

            }
          )
      );

  }


  function openMissionModal(
    mission = null
  ) {

    const editing =
      Boolean(mission);


    openModal(
      "MISSION",
      editing
        ? "Edit Mission"
        : "Create Mission",
      `
        <form
          id="missionForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Mission Name</span>

              <input
                id="missionTitle"
                required
                value="${escapeAttribute(
                  mission?.title ||
                  ""
                )}"
              >
            </label>


            <label class="field wide">
              <span>Description</span>

              <textarea
                id="missionDescription"
              >${escapeHtml(
                mission?.description ||
                ""
              )}</textarea>
            </label>


            <label class="field">

              <span>Mission Type</span>

              <select id="missionType">

                ${selectOption(
                  "checkin",
                  "Daily Check-in",
                  mission?.mission_type
                )}

                ${selectOption(
                  "referral",
                  "Referral",
                  mission?.mission_type
                )}

                ${selectOption(
                  "channel",
                  "Telegram Channel",
                  mission?.mission_type
                )}

                ${selectOption(
                  "promo",
                  "Promo Code",
                  mission?.mission_type
                )}

                ${selectOption(
                  "custom",
                  "Custom",
                  mission?.mission_type
                )}

              </select>

            </label>


            <label class="field">
              <span>Target</span>

              <input
                id="missionTarget"
                type="number"
                min="1"
                value="${mission?.target_value || 1}"
              >
            </label>


            <label class="field">
              <span>Reward Points</span>

              <input
                id="missionReward"
                type="number"
                min="0"
                value="${mission?.reward_points || 0}"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="missionStatus">

                ${selectOption(
                  "draft",
                  "Draft",
                  mission?.status
                )}

                ${selectOption(
                  "active",
                  "Active",
                  mission?.status
                )}

                ${selectOption(
                  "inactive",
                  "Inactive",
                  mission?.status
                )}

              </select>

            </label>


            <label class="field">
              <span>Image URL</span>

              <input
                id="missionImage"
                type="url"
                value="${escapeAttribute(
                  mission?.image_url ||
                  ""
                )}"
              >
            </label>


            <label class="field">
              <span>Required Tier</span>

              <select id="missionTier">

                ${selectOption(
                  "",
                  "Everyone",
                  mission?.required_tier ||
                  ""
                )}

                ${selectOption(
                  "Rookie",
                  "Rookie",
                  mission?.required_tier
                )}

                ${selectOption(
                  "Bronze",
                  "Bronze",
                  mission?.required_tier
                )}

                ${selectOption(
                  "Silver",
                  "Silver",
                  mission?.required_tier
                )}

                ${selectOption(
                  "Gold",
                  "Gold",
                  mission?.required_tier
                )}

                ${selectOption(
                  "Diamond",
                  "Diamond",
                  mission?.required_tier
                )}

              </select>
            </label>


            <label class="field">
              <span>Start</span>

              <input
                id="missionStart"
                type="datetime-local"
                value="${toInputDate(
                  mission?.start_at
                )}"
              >
            </label>


            <label class="field">
              <span>End</span>

              <input
                id="missionEnd"
                type="datetime-local"
                value="${toInputDate(
                  mission?.end_at
                )}"
              >
            </label>


            <label class="field">
              <span>Button Text</span>

              <input
                id="missionButton"
                value="${escapeAttribute(
                  mission?.button_text ||
                  ""
                )}"
              >
            </label>


            <label class="field">
              <span>Button URL</span>

              <input
                id="missionUrl"
                type="url"
                value="${escapeAttribute(
                  mission?.button_url ||
                  ""
                )}"
              >
            </label>


            <label class="field">
              <span>Display Order</span>

              <input
                id="missionSort"
                type="number"
                value="${mission?.sort_order || 0}"
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
              ${
                editing
                  ? "Save Changes"
                  : "Create Mission"
              }
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


          const payload = {

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

            image_url:
              $("#missionImage")
                .value
                .trim(),

            required_tier:
              $("#missionTier")
                .value ||
              null,

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
                .trim(),

            sort_order:
              Number(
                $("#missionSort")
                  .value ||
                0
              )

          };


          await api(
            editing
              ? `/api/admin/missions/${mission.id}`
              : "/api/admin/missions",
            {
              method:
                editing
                  ? "PATCH"
                  : "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );


          closeModal();


          showToast(
            editing
              ? "Mission updated."
              : "Mission created."
          );


          await loadMissions();

        }
      );


    bindModalClose();

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

    const grid =
      $("#rewardsGrid");


    const empty =
      $("#rewardsEmpty");


    if (!state.rewards.length) {

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
      state.rewards
        .map(
          reward => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ◆
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      reward.status
                    )
                  }"
                >
                  ${escapeHtml(
                    reward.status
                  )}
                </span>

              </div>

              <h3>
                ${escapeHtml(
                  reward.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  reward.description ||
                  "Rico Club reward"
                )}
              </p>

              <div class="management-meta">

                <div>
                  <span>COST</span>

                  <strong>
                    ${number(
                      reward.points_cost
                    )}
                  </strong>
                </div>

                <div>
                  <span>STOCK</span>

                  <strong>
                    ${
                      reward.stock ===
                      null
                        ? "Unlimited"
                        : number(
                            reward.stock
                          )
                    }
                  </strong>
                </div>

                <div>
                  <span>CLAIMED</span>

                  <strong>
                    ${number(
                      reward.redeemed_count
                    )}
                  </strong>
                </div>

                <div>
                  <span>CODES</span>

                  <strong>
                    ${number(
                      reward.available_codes
                    )}
                  </strong>
                </div>

              </div>


              <div
                style="
                  display:flex;
                  gap:8px;
                  flex-wrap:wrap;
                  margin-top:14px
                "
              >

                <button
                  class="secondary-button"
                  data-edit-reward="${reward.id}"
                  type="button"
                >
                  Edit
                </button>

                ${
                  ["voucher","promo"]
                    .includes(
                      reward.reward_type
                    )
                    ? `
                      <button
                        class="secondary-button"
                        data-codes-reward="${reward.id}"
                        type="button"
                      >
                        Upload Codes
                      </button>
                    `
                    : ""
                }

                <button
                  class="secondary-button"
                  data-delete-reward="${reward.id}"
                  type="button"
                >
                  Delete
                </button>

              </div>

            </article>
          `
        )
        .join("");


    $$("[data-edit-reward]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              const reward =
                state.rewards
                  .find(
                    item =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .editReward
                      )
                  );


              if (reward) {
                openRewardModal(
                  reward
                );
              }

            }
          )
      );


    $$("[data-codes-reward]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              const reward =
                state.rewards
                  .find(
                    item =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .codesReward
                      )
                  );


              if (reward) {
                openCodesModal(
                  reward
                );
              }

            }
          )
      );


    $$("[data-delete-reward]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            async () => {

              if (
                !confirm(
                  "Delete this reward?"
                )
              ) {
                return;
              }


              await api(
                `/api/admin/rewards/${
                  button.dataset
                    .deleteReward
                }`,
                {
                  method:
                    "DELETE"
                }
              );


              showToast(
                "Reward deleted."
              );


              await loadRewards();

            }
          )
      );

  }


  function openRewardModal(
    reward = null
  ) {

    const editing =
      Boolean(reward);


    openModal(
      "REWARD",
      editing
        ? "Edit Reward"
        : "Create Reward",
      `
        <form
          id="rewardForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Reward Name</span>

              <input
                id="rewardTitle"
                required
                value="${escapeAttribute(
                  reward?.title ||
                  ""
                )}"
              >
            </label>


            <label class="field wide">
              <span>Description</span>

              <textarea
                id="rewardDescription"
              >${escapeHtml(
                reward?.description ||
                ""
              )}</textarea>
            </label>


            <label class="field">

              <span>Reward Type</span>

              <select id="rewardType">

                ${selectOption(
                  "manual",
                  "Manual Reward",
                  reward?.reward_type
                )}

                ${selectOption(
                  "voucher",
                  "Voucher",
                  reward?.reward_type
                )}

                ${selectOption(
                  "promo",
                  "Promo Code",
                  reward?.reward_type
                )}

                ${selectOption(
                  "mystery",
                  "Mystery Reward",
                  reward?.reward_type
                )}

              </select>

            </label>


            <label class="field">
              <span>Points Cost</span>

              <input
                id="rewardCost"
                type="number"
                min="0"
                value="${reward?.points_cost || 0}"
              >
            </label>


            <label class="field">
              <span>Stock</span>

              <input
                id="rewardStock"
                type="number"
                min="0"
                value="${
                  reward?.stock ??
                  ""
                }"
                placeholder="Empty = unlimited"
              >
            </label>


            <label class="field">

              <span>Required Tier</span>

              <select id="rewardTier">

                ${selectOption(
                  "",
                  "Everyone",
                  reward?.required_tier ||
                  ""
                )}

                ${selectOption(
                  "Rookie",
                  "Rookie",
                  reward?.required_tier
                )}

                ${selectOption(
                  "Bronze",
                  "Bronze",
                  reward?.required_tier
                )}

                ${selectOption(
                  "Silver",
                  "Silver",
                  reward?.required_tier
                )}

                ${selectOption(
                  "Gold",
                  "Gold",
                  reward?.required_tier
                )}

                ${selectOption(
                  "Diamond",
                  "Diamond",
                  reward?.required_tier
                )}

              </select>

            </label>


            <label class="field">
              <span>Image URL</span>

              <input
                id="rewardImage"
                type="url"
                value="${escapeAttribute(
                  reward?.image_url ||
                  ""
                )}"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="rewardStatus">

                ${selectOption(
                  "draft",
                  "Draft",
                  reward?.status
                )}

                ${selectOption(
                  "active",
                  "Active",
                  reward?.status
                )}

                ${selectOption(
                  "inactive",
                  "Inactive",
                  reward?.status
                )}

              </select>

            </label>


            <label class="field">
              <span>Start</span>

              <input
                id="rewardStart"
                type="datetime-local"
                value="${toInputDate(
                  reward?.start_at
                )}"
              >
            </label>


            <label class="field">
              <span>End</span>

              <input
                id="rewardEnd"
                type="datetime-local"
                value="${toInputDate(
                  reward?.end_at
                )}"
              >
            </label>


            <label class="field">
              <span>Display Order</span>

              <input
                id="rewardSort"
                type="number"
                value="${reward?.sort_order || 0}"
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
              ${
                editing
                  ? "Save Changes"
                  : "Create Reward"
              }
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


          const payload = {

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

            required_tier:
              $("#rewardTier")
                .value ||
              null,

            image_url:
              $("#rewardImage")
                .value
                .trim(),

            start_at:
              toDatabaseDate(
                $("#rewardStart")
                  .value
              ),

            end_at:
              toDatabaseDate(
                $("#rewardEnd")
                  .value
              ),

            sort_order:
              Number(
                $("#rewardSort")
                  .value ||
                0
              ),

            status:
              $("#rewardStatus")
                .value

          };


          await api(
            editing
              ? `/api/admin/rewards/${reward.id}`
              : "/api/admin/rewards",
            {
              method:
                editing
                  ? "PATCH"
                  : "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );


          closeModal();


          showToast(
            editing
              ? "Reward updated."
              : "Reward created."
          );


          await loadRewards();

        }
      );


    bindModalClose();

  }


  function openCodesModal(
    reward
  ) {

    openModal(
      "VOUCHER INVENTORY",
      `Upload Codes · ${reward.title}`,
      `
        <form
          id="codesForm"
          class="modal-form"
        >

          <label class="field">

            <span>
              Batch Name
            </span>

            <input
              id="codesBatchName"
              placeholder="October Reward Codes"
            >

          </label>


          <label class="field">

            <span>
              Voucher Codes
            </span>

            <textarea
              id="codesList"
              required
              style="min-height:240px"
              placeholder="One code per line&#10;CODE001&#10;CODE002&#10;CODE003"
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
              Upload Codes
            </button>

          </div>

        </form>
      `
    );


    $("#codesForm")
      .addEventListener(
        "submit",
        async event => {

          event.preventDefault();


          const result =
            await api(
              `/api/admin/rewards/${reward.id}/codes`,
              {
                method:
                  "POST",

                body:
                  JSON.stringify({

                    batch_name:
                      $("#codesBatchName")
                        .value
                        .trim(),

                    codes:
                      $("#codesList")
                        .value

                  })
              }
            );


          closeModal();


          showToast(
            `${number(
              result.uploaded
            )} codes uploaded.`
          );


          await loadRewards();

        }
      );


    bindModalClose();

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

    const grid =
      $("#dropsGrid");


    const empty =
      $("#dropsEmpty");


    if (!state.drops.length) {

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
      state.drops
        .map(
          drop => `
            <article class="management-card">

              <div class="management-card-top">

                <div class="management-symbol">
                  ✦
                </div>

                <span
                  class="status-badge ${
                    escapeAttribute(
                      drop.status
                    )
                  }"
                >
                  ${escapeHtml(
                    drop.status
                  )}
                </span>

              </div>

              <h3>
                ${escapeHtml(
                  drop.title
                )}
              </h3>

              <p>
                ${escapeHtml(
                  drop.description ||
                  "Rico Club reward drop"
                )}
              </p>

              <div class="management-meta">

                <div>
                  <span>QUANTITY</span>

                  <strong>
                    ${number(
                      drop.total_quantity
                    )}
                  </strong>
                </div>

                <div>
                  <span>CLAIMED</span>

                  <strong>
                    ${number(
                      drop.claimed_quantity
                    )}
                  </strong>
                </div>

                <div>
                  <span>START</span>

                  <strong>
                    ${formatDateTime(
                      drop.start_at
                    )}
                  </strong>
                </div>

                <div>
                  <span>END</span>

                  <strong>
                    ${formatDateTime(
                      drop.end_at
                    )}
                  </strong>
                </div>

              </div>


              <div
                style="
                  display:flex;
                  gap:8px;
                  margin-top:14px
                "
              >

                <button
                  class="secondary-button"
                  data-edit-drop="${drop.id}"
                  type="button"
                >
                  Edit
                </button>

                <button
                  class="secondary-button"
                  data-delete-drop="${drop.id}"
                  type="button"
                >
                  Delete
                </button>

              </div>

            </article>
          `
        )
        .join("");


    $$("[data-edit-drop]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            () => {

              const drop =
                state.drops
                  .find(
                    item =>
                      String(
                        item.id
                      ) ===
                      String(
                        button.dataset
                          .editDrop
                      )
                  );


              if (drop) {
                openDropModal(
                  drop
                );
              }

            }
          )
      );


    $$("[data-delete-drop]")
      .forEach(
        button =>
          button.addEventListener(
            "click",
            async () => {

              if (
                !confirm(
                  "Delete this reward drop?"
                )
              ) {
                return;
              }


              await api(
                `/api/admin/drops/${
                  button.dataset
                    .deleteDrop
                }`,
                {
                  method:
                    "DELETE"
                }
              );


              showToast(
                "Reward drop deleted."
              );


              await loadDrops();

            }
          )
      );

  }


  function openDropModal(
    drop = null
  ) {

    const editing =
      Boolean(drop);


    openModal(
      "REWARD DROP",
      editing
        ? "Edit Drop"
        : "Create Drop",
      `
        <form
          id="dropForm"
          class="modal-form"
        >

          <div class="form-grid">

            <label class="field wide">
              <span>Drop Name</span>

              <input
                id="dropTitle"
                required
                value="${escapeAttribute(
                  drop?.title ||
                  ""
                )}"
              >
            </label>


            <label class="field wide">
              <span>Description</span>

              <textarea
                id="dropDescription"
              >${escapeHtml(
                drop?.description ||
                ""
              )}</textarea>
            </label>


            <label class="field">

              <span>Reward Type</span>

              <select id="dropRewardType">

                ${selectOption(
                  "points",
                  "Rico Points",
                  drop?.reward_type
                )}

                ${selectOption(
                  "voucher",
                  "Voucher",
                  drop?.reward_type
                )}

                ${selectOption(
                  "mystery",
                  "Mystery Reward",
                  drop?.reward_type
                )}

              </select>

            </label>


            <label class="field">
              <span>Reward Value</span>

              <input
                id="dropReward"
                type="number"
                min="0"
                value="${drop?.reward_value || 0}"
              >
            </label>


            <label class="field">
              <span>Quantity</span>

              <input
                id="dropQuantity"
                required
                type="number"
                min="1"
                value="${drop?.total_quantity || ""}"
              >
            </label>


            <label class="field">
              <span>Claim Limit Per Player</span>

              <input
                id="dropLimit"
                type="number"
                min="1"
                value="${drop?.claim_limit_per_user || 1}"
              >
            </label>


            <label class="field">

              <span>Required Tier</span>

              <select id="dropTier">

                ${selectOption(
                  "",
                  "Everyone",
                  drop?.required_tier ||
                  ""
                )}

                ${selectOption(
                  "Rookie",
                  "Rookie",
                  drop?.required_tier
                )}

                ${selectOption(
                  "Bronze",
                  "Bronze",
                  drop?.required_tier
                )}

                ${selectOption(
                  "Silver",
                  "Silver",
                  drop?.required_tier
                )}

                ${selectOption(
                  "Gold",
                  "Gold",
                  drop?.required_tier
                )}

                ${selectOption(
                  "Diamond",
                  "Diamond",
                  drop?.required_tier
                )}

              </select>

            </label>


            <label class="field">
              <span>Image URL</span>

              <input
                id="dropImage"
                type="url"
                value="${escapeAttribute(
                  drop?.image_url ||
                  ""
                )}"
              >
            </label>


            <label class="field">
              <span>Start</span>

              <input
                id="dropStart"
                required
                type="datetime-local"
                value="${toInputDate(
                  drop?.start_at
                )}"
              >
            </label>


            <label class="field">
              <span>End</span>

              <input
                id="dropEnd"
                required
                type="datetime-local"
                value="${toInputDate(
                  drop?.end_at
                )}"
              >
            </label>


            <label class="field">

              <span>Status</span>

              <select id="dropStatus">

                ${selectOption(
                  "draft",
                  "Draft",
                  drop?.status
                )}

                ${selectOption(
                  "scheduled",
                  "Scheduled",
                  drop?.status
                )}

                ${selectOption(
                  "active",
                  "Active",
                  drop?.status
                )}

                ${selectOption(
                  "ended",
                  "Ended",
                  drop?.status
                )}

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
              ${
                editing
                  ? "Save Changes"
                  : "Create Drop"
              }
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


          const payload = {

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

            required_tier:
              $("#dropTier")
                .value ||
              null,

            image_url:
              $("#dropImage")
                .value
                .trim(),

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

          };


          await api(
            editing
              ? `/api/admin/drops/${drop.id}`
              : "/api/admin/drops",
            {
              method:
                editing
                  ? "PATCH"
                  : "POST",

              body:
                JSON.stringify(
                  payload
                )
            }
          );


          closeModal();


          showToast(
            editing
              ? "Reward drop updated."
              : "Reward drop created."
          );


          await loadDrops();

        }
      );


    bindModalClose();

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
              data-player-id="${player.id}"
            >

              <td>
                #${index + 1}
              </td>

              <td>

                <div class="table-player">

                  <div class="table-avatar">
                    ${initial(player)}
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
                          ? `@${escapeHtml(
                              player.telegram_username
                            )}`
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
                row.dataset
                  .playerId
              )
          )
      );

  }


  /* ======================================================
     APPEARANCE / SETTINGS
  ======================================================= */

  async function loadSettings() {

    const data =
      await api(
        "/api/admin/settings"
      );


    state.settings =
      data.settings ||
      {};


    fillAppearance();

    fillSettings();

    updateAppearancePreview();

  }


  function fillAppearance() {

    const s =
      state.settings;


    setValue(
      "#settingAppName",
      s.app_name ||
      "Rico Club"
    );


    setValue(
      "#settingAnnouncement",
      s.announcement ||
      ""
    );


    setValue(
      "#settingLogoUrl",
      s.logo_url ||
      ""
    );


    setValue(
      "#settingHeroTitle",
      s.hero_title ||
      "Rico Club"
    );


    setValue(
      "#settingHeroSubtitle",
      s.hero_subtitle ||
      ""
    );


    setValue(
      "#settingHeroImageUrl",
      s.hero_image_url ||
      ""
    );


    const primary =
      s.primary_color ||
      "#FA59A9";


    const secondary =
      s.secondary_color ||
      "#64D6FA";


    const background =
      s.background_color ||
      "#0D0C1B";


    setValue(
      "#settingPrimaryColor",
      primary
    );


    setValue(
      "#settingPrimaryColorPicker",
      primary
    );


    setValue(
      "#settingSecondaryColor",
      secondary
    );


    setValue(
      "#settingSecondaryColorPicker",
      secondary
    );


    setValue(
      "#settingBackgroundColor",
      background
    );


    setValue(
      "#settingBackgroundColorPicker",
      background
    );


    setValue(
      "#settingShowCheckin",
      s.show_checkin ??
      "true"
    );


    setValue(
      "#settingShowMissions",
      s.show_missions ??
      "true"
    );


    setValue(
      "#settingShowRewards",
      s.show_rewards ??
      "true"
    );


    setValue(
      "#settingShowDrops",
      s.show_drops ??
      "true"
    );


    setValue(
      "#settingShowReferrals",
      s.show_referrals ??
      "true"
    );


    setValue(
      "#settingShowLeaderboard",
      s.show_leaderboard ??
      "true"
    );

  }


  function fillSettings() {

    const s =
      state.settings;


    setValue(
      "#settingDailyCheckin",
      s.daily_checkin_points ||
      "20"
    );


    setValue(
      "#settingStreak7",
      s.streak_bonus_7 ||
      "50"
    );


    setValue(
      "#settingStreak14",
      s.streak_bonus_14 ||
      "150"
    );


    setValue(
      "#settingStreak28",
      s.streak_bonus_28 ||
      "300"
    );


    setValue(
      "#settingStreak56",
      s.streak_bonus_56 ||
      "600"
    );


    setValue(
      "#settingStreak84",
      s.streak_bonus_84 ||
      "900"
    );


    setValue(
      "#settingStreak112",
      s.streak_bonus_112 ||
      "1200"
    );


    setValue(
      "#settingReferralPoints",
      s.referral_reward_points ||
      "100"
    );


    setValue(
      "#settingBotUsername",
      s.bot_username ||
      ""
    );


    setValue(
      "#settingChannelUrl",
      s.official_channel_url ||
      ""
    );


    setValue(
      "#settingTierRookie",
      s.tier_rookie ||
      "0"
    );


    setValue(
      "#settingTierBronze",
      s.tier_bronze ||
      "500"
    );


    setValue(
      "#settingTierSilver",
      s.tier_silver ||
      "1500"
    );


    setValue(
      "#settingTierGold",
      s.tier_gold ||
      "5000"
    );


    setValue(
      "#settingTierDiamond",
      s.tier_diamond ||
      "15000"
    );

  }


  async function saveAppearance() {

    const payload = {

      app_name:
        value(
          "#settingAppName"
        ),

      announcement:
        value(
          "#settingAnnouncement"
        ),

      logo_url:
        value(
          "#settingLogoUrl"
        ),

      hero_title:
        value(
          "#settingHeroTitle"
        ),

      hero_subtitle:
        value(
          "#settingHeroSubtitle"
        ),

      hero_image_url:
        value(
          "#settingHeroImageUrl"
        ),

      primary_color:
        value(
          "#settingPrimaryColor"
        ),

      secondary_color:
        value(
          "#settingSecondaryColor"
        ),

      background_color:
        value(
          "#settingBackgroundColor"
        ),

      show_checkin:
        value(
          "#settingShowCheckin"
        ),

      show_missions:
        value(
          "#settingShowMissions"
        ),

      show_rewards:
        value(
          "#settingShowRewards"
        ),

      show_drops:
        value(
          "#settingShowDrops"
        ),

      show_referrals:
        value(
          "#settingShowReferrals"
        ),

      show_leaderboard:
        value(
          "#settingShowLeaderboard"
        )

    };


    const data =
      await api(
        "/api/admin/settings",
        {
          method:
            "PUT",

          body:
            JSON.stringify(
              payload
            )
        }
      );


    state.settings =
      data.settings ||
      payload;


    updateAppearancePreview();


    showToast(
      "Mini App appearance saved."
    );

  }


  async function savePlatformSettings() {

    const payload = {

      daily_checkin_points:
        value(
          "#settingDailyCheckin"
        ),

      streak_bonus_7:
        value(
          "#settingStreak7"
        ),

      streak_bonus_14:
        value(
          "#settingStreak14"
        ),

      streak_bonus_28:
        value(
          "#settingStreak28"
        ),

      streak_bonus_56:
        value(
          "#settingStreak56"
        ),

      streak_bonus_84:
        value(
          "#settingStreak84"
        ),

      streak_bonus_112:
        value(
          "#settingStreak112"
        ),

      referral_reward_points:
        value(
          "#settingReferralPoints"
        ),

      bot_username:
        value(
          "#settingBotUsername"
        )
        .replace(
          /^@/,
          ""
        ),

      official_channel_url:
        value(
          "#settingChannelUrl"
        ),

      tier_rookie:
        value(
          "#settingTierRookie"
        ),

      tier_bronze:
        value(
          "#settingTierBronze"
        ),

      tier_silver:
        value(
          "#settingTierSilver"
        ),

      tier_gold:
        value(
          "#settingTierGold"
        ),

      tier_diamond:
        value(
          "#settingTierDiamond"
        )

    };


    validateTierSettings(
      payload
    );


    const data =
      await api(
        "/api/admin/settings",
        {
          method:
            "PUT",

          body:
            JSON.stringify(
              payload
            )
        }
      );


    state.settings =
      data.settings ||
      payload;


    showToast(
      "Platform settings saved."
    );

  }


  function validateTierSettings(
    payload
  ) {

    const values = [
      Number(
        payload.tier_rookie
      ),

      Number(
        payload.tier_bronze
      ),

      Number(
        payload.tier_silver
      ),

      Number(
        payload.tier_gold
      ),

      Number(
        payload.tier_diamond
      )
    ];


    for (
      let i = 1;
      i < values.length;
      i++
    ) {

      if (
        values[i] <=
        values[i - 1]
      ) {

        throw new Error(
          "Tier thresholds must increase from Rookie → Bronze → Silver → Gold → Diamond."
        );

      }

    }

  }


  function updateAppearancePreview() {

    const card =
      $("#appearancePreviewCard");


    if (!card) {
      return;
    }


    const primary =
      value(
        "#settingPrimaryColor"
      ) ||
      "#FA59A9";


    const secondary =
      value(
        "#settingSecondaryColor"
      ) ||
      "#64D6FA";


    const background =
      value(
        "#settingBackgroundColor"
      ) ||
      "#0D0C1B";


    card.style.background =
      background;


    const bar =
      card.querySelector(
        "div"
      );


    const button =
      card.querySelector(
        "button"
      );


    if (bar) {

      bar.style.background =
        `linear-gradient(135deg, ${primary}, ${secondary})`;

    }


    if (button) {

      button.style.background =
        `linear-gradient(135deg, ${primary}, ${secondary})`;

    }

  }


  /* ======================================================
     PLAYER ACTION MODALS
  ======================================================= */

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
              Send Message
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


  /* ======================================================
     MODALS
  ======================================================= */

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
        () =>
          openMissionModal()
      );


    $("#createRewardButton")
      .addEventListener(
        "click",
        () =>
          openRewardModal()
      );


    $("#createDropButton")
      .addEventListener(
        "click",
        () =>
          openDropModal()
      );


    $("#openPlayersFromMessages")
      .addEventListener(
        "click",
        () =>
          openSection(
            "players"
          )
      );


    $("#saveAppearanceButton")
      .addEventListener(
        "click",
        async () => {

          try {
            await saveAppearance();
          } catch (error) {
            showToast(
              error.message
            );
          }

        }
      );


    $("#saveSettingsButton")
      .addEventListener(
        "click",
        async () => {

          try {
            await savePlatformSettings();
          } catch (error) {
            showToast(
              error.message
            );
          }

        }
      );


    [
      [
        "#settingPrimaryColorPicker",
        "#settingPrimaryColor"
      ],
      [
        "#settingSecondaryColorPicker",
        "#settingSecondaryColor"
      ],
      [
        "#settingBackgroundColorPicker",
        "#settingBackgroundColor"
      ]
    ]
      .forEach(
        ([picker,text]) => {

          $(picker)
            ?.addEventListener(
              "input",
              () => {

                $(text).value =
                  $(picker).value
                    .toUpperCase();


                updateAppearancePreview();

              }
            );


          $(text)
            ?.addEventListener(
              "input",
              () => {

                const candidate =
                  $(text)
                    .value
                    .trim();


                if (
                  /^#[0-9a-fA-F]{6}$/
                    .test(
                      candidate
                    )
                ) {

                  $(picker).value =
                    candidate;


                  updateAppearancePreview();

                }

              }
            );

        }
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


  function toInputDate(
    value
  ) {

    if (!value) {
      return "";
    }


    return String(value)
      .replace(
        " ",
        "T"
      )
      .slice(
        0,
        16
      );

  }


  function selectOption(
    value,
    label,
    selected
  ) {

    return `
      <option
        value="${escapeAttribute(
          value
        )}"
        ${
          String(value) ===
          String(
            selected ??
            ""
          )
            ? "selected"
            : ""
        }
      >
        ${escapeHtml(
          label
        )}
      </option>
    `;

  }


  function value(
    selector
  ) {

    return $(
      selector
    )?.value
      ?.trim() ??
      "";

  }


  function setValue(
    selector,
    value
  ) {

    const element =
      $(selector);


    if (element) {
      element.value =
        value ??
        "";
    }

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
        2600
      );

  }

})();
